"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ReportRecord {
  _id: string;
  reporter: { _id: string; name?: string; phone?: string; role?: string };
  reportedUser: { _id: string; name?: string; phone?: string; role?: string };
  reporterRole: "patient" | "doctor";
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  resolution?: string;
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

// status: "pending" | "resolved" | "dismissed" | "all"
export async function getReports(status: string = "pending"): Promise<ApiEnvelope<ReportRecord[]>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/reports?status=${status}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch reports" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching reports" };
  }
}

export async function resolveReport(
  id: string,
  status: "resolved" | "dismissed",
  resolution?: string
): Promise<ApiEnvelope<ReportRecord>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/reports/${id}/resolve`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status, resolution }),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to process report" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while processing the report" };
  }
}
