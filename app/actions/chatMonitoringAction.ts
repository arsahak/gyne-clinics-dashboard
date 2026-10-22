"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Chat Monitoring, read only: GET /api/v1/chats and /chats/:id/staff.

export type ChatType = "free" | "consultation" | "follow_up";
export type ChatWaiting = "doctor" | "patient";

interface Person {
  _id: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
}

export interface ChatRecord {
  _id: string;
  type: ChatType;
  patient: Person | null;
  doctor: { _id: string; title?: string; specialization?: string; user: Person | null } | null;
  firstMessageAt?: string;
  firstReplyAt?: string;
  lastMessageAt?: string;
  lastMessageText?: string;
  lastSenderRole?: "patient" | "doctor";
  messageCount: number;
  flaggedCount: number;
}

export interface ChatMessageRecord {
  _id: string;
  senderRole: "patient" | "doctor";
  text: string;
  flags: ("abuse" | "urgent_health")[];
  createdAt: string;
}

export interface ChatStats {
  open: number;
  waitingDoctor: number;
  waitingOverHour: number;
  flagged: number;
  medianFirstReplyMinutes: number | null;
}

export interface ChatPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ChatPageResponse {
  success: boolean;
  data?: ChatRecord[];
  pagination?: ChatPagination;
  stats?: ChatStats;
  doctors?: { _id: string; name: string }[];
  error?: string;
}

export interface ChatDetailResponse {
  success: boolean;
  data?: { chat: ChatRecord; messages: ChatMessageRecord[]; type: ChatType; consultation: { reference: string; startsAt: string; status: string } | null };
  error?: string;
}

export interface ChatQuery {
  type?: ChatType | "";
  waiting?: ChatWaiting | "";
  doctorId?: string;
  flagged?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

async function request(path: string, fallback: string) {
  const session = await auth();
  const token = session?.accessToken;
  try {
    const response = await fetch(`${API_URL}/api/v1/chats${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error =
        response.status === 401
          ? "Your session has expired. Please sign out and sign in again."
          : response.status === 403
            ? body?.message || "You don't have permission to read chats."
            : body?.errors?.[0] || body?.message || fallback;
      return { ok: false as const, error };
    }
    return { ok: true as const, data: body?.data };
  } catch {
    return { ok: false as const, error: "Can't reach the server. Please try again." };
  }
}

export async function getChatsPage(query: ChatQuery = {}): Promise<ChatPageResponse> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), limit: String(query.limit ?? 20) });
  if (query.type) params.set("type", query.type);
  if (query.waiting) params.set("waiting", query.waiting);
  if (query.doctorId) params.set("doctorId", query.doctorId);
  if (query.flagged) params.set("flagged", "true");
  if (query.search?.trim()) params.set("search", query.search.trim());
  const result = await request(`?${params}`, "Failed to fetch chats");
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: result.data.chats, pagination: result.data.pagination, stats: result.data.stats, doctors: result.data.doctors };
}

/** One chat with all its messages (read only). */
export async function getChatForStaff(id: string): Promise<ChatDetailResponse> {
  if (!/^[a-f\d]{24}$/i.test(id)) return { success: false, error: "Chat not found" };
  const result = await request(`/${id}/staff`, "Failed to load the chat");
  return result.ok ? { success: true, data: result.data } : { success: false, error: result.error };
}
