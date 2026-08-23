"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// G4: metadata only — this type intentionally has no message content field.
export interface ChatMetadataRecord {
  _id: string;
  patient: { _id: string; name?: string; phone?: string };
  doctor: { _id: string; name?: string; phone?: string };
  lastMessageAt?: string;
  createdAt: string;
  messageCount: number;
  flaggedCount: number;
  reported: boolean;
}

export interface ChatMonitoringResponse {
  success: boolean;
  data?: ChatMetadataRecord[];
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

export async function getChatsMetadata(): Promise<ChatMonitoringResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/chats/admin/metadata`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch chat metadata" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching chat metadata" };
  }
}
