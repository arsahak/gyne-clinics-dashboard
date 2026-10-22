"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Chat Moderation: GET /api/v1/moderation/flags and PATCH /moderation/flags/:id.

export type FlagKind = "phone" | "email" | "link" | "social" | "abuse" | "urgent_health";
export type FlagStatus = "new" | "allowed" | "warned" | "suspended" | "escalated";
export type FlagDecision = Exclude<FlagStatus, "new">;

interface Person {
  _id: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

export interface FlagRecord {
  _id: string;
  chat: string;
  kind: FlagKind;
  outcome: "blocked" | "delivered";
  sender: Person | null;
  senderRole: "patient" | "doctor";
  recipient: Person | null;
  text: string;
  match: string;
  status: FlagStatus;
  handledBy: { _id: string; fullName?: string } | null;
  handledAt?: string;
  createdAt: string;
  previousFlags: number;
  context: { _id: string; senderRole: "patient" | "doctor"; text: string; createdAt: string }[];
}

export interface FlagStats {
  new: number;
  newUrgent: number;
  warned: number;
  suspended: number;
  escalated: number;
  allowed: number;
  total: number;
  last30Days: Record<FlagKind | "blocked", number>;
}

export interface FlagPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FlagPageResponse {
  success: boolean;
  data?: FlagRecord[];
  pagination?: FlagPagination;
  stats?: FlagStats;
  error?: string;
}

function errorFor(status: number, body: { errors?: string[]; message?: string } | null, fallback: string) {
  if (status === 401) return "Your session has expired. Please sign out and sign in again.";
  if (status === 403) return body?.message || "You don't have permission to moderate chats.";
  return body?.errors?.[0] || body?.message || fallback;
}

async function request(path: string, init: RequestInit, fallback: string) {
  const session = await auth();
  const token = session?.accessToken;
  try {
    const response = await fetch(`${API_URL}/api/v1/moderation${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false as const, error: errorFor(response.status, body, fallback) };
    return { ok: true as const, data: body?.data, message: body?.message as string | undefined };
  } catch {
    return { ok: false as const, error: "Can't reach the server. Please try again." };
  }
}

export async function getFlagsPage(query: { status?: FlagStatus | "all"; kind?: FlagKind | ""; page?: number; limit?: number } = {}): Promise<FlagPageResponse> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), limit: String(query.limit ?? 8), status: query.status ?? "new" });
  if (query.kind) params.set("kind", query.kind);
  const result = await request(`/flags?${params}`, { method: "GET" }, "Failed to fetch flagged messages");
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: result.data.flags, pagination: result.data.pagination, stats: result.data.stats };
}

/** allowed (false alarm), warned, suspended (blocks the sender) or escalated. */
export async function setFlagStatus(id: string, status: FlagDecision): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await request(`/flags/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, "Failed to update");
  return result.ok ? { success: true, message: result.message } : { success: false, error: result.error };
}
