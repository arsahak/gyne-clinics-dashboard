"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Notifications: /api/v1/announcements and /api/v1/notifications/auto (admin, super admin).

export type Audience = "all" | "patients" | "doctors";
export type Channel = "in_app" | "push" | "sms";
export type AnnouncementStatus = "draft" | "scheduled" | "sent" | "cancelled";
export type RegionId = "europe" | "north_america" | "middle_east" | "asia_pacific" | "latin_america" | "africa" | "south_asia";
export type LinkTarget = "home" | "doctors" | "learn" | "share_story" | "cycle" | "consultations" | "messages" | "earnings";

export interface AnnouncementRecord {
  _id: string;
  title: string;
  body: string;
  audience: Audience;
  region?: RegionId;
  channels: Channel[];
  link?: LinkTarget;
  status: AnnouncementStatus;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  reach: number;
  opened: number;
  openRate: number | null;
  createdBy: { _id: string; fullName?: string } | null;
}

export interface AnnouncementStats {
  sent30d: number;
  reach30d: number;
  openRate30d: number | null;
  sent: number;
  scheduled: number;
  drafts: number;
  cancelled: number;
  total: number;
}

export interface AnnouncementPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AnnouncementPageResponse {
  success: boolean;
  data?: AnnouncementRecord[];
  pagination?: AnnouncementPagination;
  stats?: AnnouncementStats;
  error?: string;
}

export interface AudienceCounts {
  patients: number;
  doctors: number;
  regions: { patients: Record<RegionId, number>; doctors: Record<RegionId, number> };
}

export interface AutoMessage {
  key: string;
  name: string;
  trigger: string;
  to: "patient" | "doctor" | "both";
  channels: Channel[];
  template: string;
  state: "live" | "planned";
  locked?: boolean;
  enabled: boolean;
  /** In-app notifications made this week (null for SMS-only messages). */
  sent7d: number | null;
}

export interface NewAnnouncement {
  action: "send" | "schedule" | "draft";
  title: string;
  body: string;
  audience: Audience;
  region?: RegionId;
  channels: Channel[];
  link?: LinkTarget;
  scheduledAt?: string;
  fromDraft?: string;
}

type Result = { success: boolean; message?: string; error?: string };

function errorFor(status: number, body: { errors?: string[]; message?: string } | null, fallback: string) {
  if (status === 401) return "Your session has expired. Please sign out and sign in again.";
  if (status === 403) return body?.message || "Only admins can send notifications.";
  return body?.errors?.[0] || body?.message || fallback;
}

async function request(path: string, init: RequestInit, fallback: string) {
  const session = await auth();
  const token = session?.accessToken;
  try {
    const response = await fetch(`${API_URL}/api/v1${path}`, {
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

export async function getAnnouncementsPage(query: { status?: AnnouncementStatus | "all"; page?: number; limit?: number } = {}): Promise<AnnouncementPageResponse> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), limit: String(query.limit ?? 8), status: query.status ?? "all" });
  const r = await request(`/announcements?${params}`, { method: "GET" }, "Failed to fetch announcements");
  if (!r.ok) return { success: false, error: r.error };
  return { success: true, data: r.data.announcements, pagination: r.data.pagination, stats: r.data.stats };
}

export async function getAudience(): Promise<{ success: boolean; data?: AudienceCounts; error?: string }> {
  const r = await request("/announcements/audience", { method: "GET" }, "Failed to count the audience");
  return r.ok ? { success: true, data: r.data } : { success: false, error: r.error };
}

export async function createAnnouncement(input: NewAnnouncement): Promise<Result & { data?: AnnouncementRecord }> {
  const r = await request("/announcements", { method: "POST", body: JSON.stringify(input) }, "Failed to save the announcement");
  return r.ok ? { success: true, message: r.message, data: r.data } : { success: false, error: r.error };
}

export async function cancelAnnouncement(id: string): Promise<Result> {
  const r = await request(`/announcements/${id}/cancel`, { method: "POST" }, "Failed to cancel");
  return r.ok ? { success: true, message: r.message } : { success: false, error: r.error };
}

export async function deleteAnnouncement(id: string): Promise<Result> {
  const r = await request(`/announcements/${id}`, { method: "DELETE" }, "Failed to delete");
  return r.ok ? { success: true, message: r.message } : { success: false, error: r.error };
}

export async function getAutoMessages(): Promise<{ success: boolean; data?: AutoMessage[]; error?: string }> {
  const r = await request("/notifications/auto", { method: "GET" }, "Failed to fetch automatic messages");
  return r.ok ? { success: true, data: r.data } : { success: false, error: r.error };
}

export async function setAutoMessage(key: string, enabled: boolean): Promise<Result> {
  const r = await request(`/notifications/auto/${key}`, { method: "PATCH", body: JSON.stringify({ enabled }) }, "Failed to update");
  return r.ok ? { success: true, message: r.message } : { success: false, error: r.error };
}
