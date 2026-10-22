"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Reports: GET /api/v1/reports (staff) plus take / close.

export type ReportStatus = "open" | "in_review" | "resolved" | "dismissed";
export type ReportStatusFilter = "todo" | "all" | ReportStatus;
export type ReportPriority = "urgent" | "high" | "normal";
export type ReportReason = "medical_concern" | "off_platform" | "no_reply" | "behaviour" | "payment" | "fake_profile" | "other";
export type ReportAction = "warned" | "suspended" | "refunded" | "content_removed" | "no_action";

interface Person {
  _id: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  role?: string;
}

export interface ReportRecord {
  _id: string;
  reporter: Person | null;
  reporterRole: "patient" | "doctor";
  against: Person | null;
  againstRole: "patient" | "doctor";
  /** Doctor profile id, when a doctor was reported. */
  againstDoctor?: string;
  consultation: { _id: string; reference: string; startsAt: string } | null;
  reason: ReportReason;
  details: string;
  priority: ReportPriority;
  status: ReportStatus;
  assignee: { _id: string; fullName?: string } | null;
  resolution?: { action: ReportAction; note: string; by: { _id: string; fullName?: string } | null; at: string };
  createdAt: string;
}

export interface ReportStats {
  total: number;
  open: number;
  in_review: number;
  resolved: number;
  dismissed: number;
  urgentOpen: number;
  /** Average hours from report to answer; null until one is closed. */
  avgHoursToClose: number | null;
}

export interface ReportPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ReportPageResponse {
  success: boolean;
  data?: ReportRecord[];
  pagination?: ReportPagination;
  stats?: ReportStats;
  error?: string;
}

export interface ReportQuery {
  status?: ReportStatusFilter;
  priority?: ReportPriority | "";
  reason?: ReportReason | "";
  search?: string;
  page?: number;
  limit?: number;
}

function errorFor(status: number, body: { errors?: string[]; message?: string } | null, fallback: string) {
  if (status === 401) return "Your session has expired. Please sign out and sign in again.";
  if (status === 403) return body?.message || "You don't have permission to handle reports.";
  return body?.errors?.[0] || body?.message || fallback;
}

async function request(path: string, init: RequestInit, fallback: string) {
  const session = await auth();
  const token = session?.accessToken;
  try {
    const response = await fetch(`${API_URL}/api/v1/reports${path}`, {
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

export async function getReportsPage(query: ReportQuery = {}): Promise<ReportPageResponse> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), limit: String(query.limit ?? 10), status: query.status ?? "todo" });
  if (query.priority) params.set("priority", query.priority);
  if (query.reason) params.set("reason", query.reason);
  if (query.search?.trim()) params.set("search", query.search.trim());

  const result = await request(`?${params}`, { method: "GET" }, "Failed to fetch reports");
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: result.data.reports, pagination: result.data.pagination, stats: result.data.stats };
}

/** "I'll handle it". */
export async function takeReport(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await request(`/${id}/take`, { method: "PATCH" }, "Failed to take the report");
  return result.ok ? { success: true, message: result.message } : { success: false, error: result.error };
}

/** Resolve (what you did + note for the reporter) or dismiss. */
export async function closeReport(
  id: string,
  outcome: "resolved" | "dismissed",
  action?: Exclude<ReportAction, "no_action">,
  note?: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await request(
    `/${id}/close`,
    { method: "PATCH", body: JSON.stringify({ outcome, ...(outcome === "resolved" && { action }), ...(note && { note }) }) },
    "Failed to close the report",
  );
  return result.ok ? { success: true, message: result.message } : { success: false, error: result.error };
}
