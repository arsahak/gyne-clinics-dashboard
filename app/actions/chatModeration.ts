"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ReportedChat {
  _id: string;
  reporter: { _id: string; name?: string; phone?: string };
  reportedUser: { _id: string; name?: string; phone?: string };
  chat?: { _id: string } | null;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
}

export interface ChatMessageRecord {
  _id: string;
  senderRole: "patient" | "doctor";
  text: string;
  wasRedacted: boolean;
  redactedTypes: string[];
  flaggedForModeration: boolean;
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

export async function getReportedChats(): Promise<ApiEnvelope<ReportedChat[]>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/chats/admin/reported`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch reported chats" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching reported chats" };
  }
}

export async function getChatMessagesForAdmin(chatId: string): Promise<ApiEnvelope<ChatMessageRecord[]>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/chats/admin/${chatId}/messages`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch messages" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching messages" };
  }
}
