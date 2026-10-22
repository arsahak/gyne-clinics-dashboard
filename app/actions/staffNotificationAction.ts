"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// The topbar bell: /api/v1/staff-notifications (your own, with read state)
// and a short ticket for the live socket.

export type StaffEvent =
  | "patient_signup"
  | "doctor_signup"
  | "doctor_update"
  | "consultation_booked"
  | "payment_refunded"
  | "withdrawal_requested"
  | "report_created"
  | "chat_flagged"
  | "story_submitted"
  | "review_held";

export interface StaffNotification {
  _id: string;
  type: StaffEvent;
  title: string;
  body: string;
  link?: string;
  priority: "normal" | "urgent";
  readAt?: string;
  createdAt: string;
}

export interface NotificationPage {
  notifications: StaffNotification[];
  unread: number;
  pagination: { total: number; page: number; limit: number; pages: number; hasMore: boolean };
}

type Result<T> = { success: boolean; data?: T; message?: string; error?: string };

async function request<T>(path: string, init: RequestInit): Promise<Result<T>> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return { success: false, error: "Not signed in" };
  try {
    const response = await fetch(`${API_URL}/api/v1/staff-notifications${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { success: false, error: body?.message || "Something went wrong" };
    return { success: true, data: body?.data as T, message: body?.message };
  } catch {
    return { success: false, error: "Can't reach the server" };
  }
}

export async function getStaffNotifications(query: { filter?: "all" | "unread"; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams({ filter: query.filter ?? "all", page: String(query.page ?? 1), limit: String(query.limit ?? 15) });
  return request<NotificationPage>(`?${params}`, { method: "GET" });
}

export async function setNotificationRead(id: string, read: boolean) {
  return request<{ notification: StaffNotification; unread: number }>(`/${id}`, { method: "PATCH", body: JSON.stringify({ read }) });
}

export async function readAllNotifications() {
  return request<{ unread: number }>("/read-all", { method: "PATCH" });
}

/** A 15-minute ticket to connect to the live socket (never the login token). */
export async function getRealtimeTicket(): Promise<string | null> {
  const result = await request<{ ticket: string }>("/ticket", { method: "POST" });
  return result.data?.ticket ?? null;
}
