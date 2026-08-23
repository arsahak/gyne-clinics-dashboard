"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface NotificationRecord {
  _id: string;
  title: string;
  body: string;
  audience: "all" | "patients" | "doctors";
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const token = session?.accessToken;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      throw new Error(`Invalid JSON response from server (Status ${response.status})`);
    }
  }
  const text = await response.text();
  console.error(`Non-JSON response from ${response.url}:`, text.substring(0, 200));
  throw new Error(`Server returned non-JSON response (Status ${response.status})`);
}

export async function getNotifications(): Promise<ApiEnvelope<NotificationRecord[]>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/notifications/admin/list`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch notifications" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching notifications" };
  }
}

export async function sendNotification(
  title: string,
  body: string,
  audience: "all" | "patients" | "doctors"
): Promise<ApiEnvelope<NotificationRecord>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/notifications`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title, body, audience }),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to send notification" };
    return { success: true, message: data.message || "Notification sent successfully", data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while sending the notification" };
  }
}
