"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface DoctorAlertRecord {
  _id: string;
  doctor: { _id: string; name?: string; phone?: string };
  type: "profile_updated" | "availability_updated";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface DoctorAlertsResponse {
  success: boolean;
  data?: DoctorAlertRecord[];
  unreadCount?: number;
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

export async function getDoctorAlerts(): Promise<DoctorAlertsResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/doctor-alerts`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch doctor alerts" };
    return { success: true, data: data.data, unreadCount: data.unreadCount };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching doctor alerts" };
  }
}

export async function markDoctorAlertRead(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/doctor-alerts/${id}/read`, {
      method: "PATCH",
      headers,
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to update alert" };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred" };
  }
}

export async function markAllDoctorAlertsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/doctor-alerts/read-all`, {
      method: "PATCH",
      headers,
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to update alerts" };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred" };
  }
}
