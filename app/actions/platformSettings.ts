"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface PlatformSettingsResponse {
  success: boolean;
  message?: string;
  data?: { videoRecordingEnabled: boolean };
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

export async function getPlatformSettings(): Promise<PlatformSettingsResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/settings/platform`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch platform settings" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching platform settings" };
  }
}

export async function updatePlatformSettings(
  updateData: { videoRecordingEnabled: boolean }
): Promise<PlatformSettingsResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/settings/platform`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to update platform settings" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while updating platform settings" };
  }
}
