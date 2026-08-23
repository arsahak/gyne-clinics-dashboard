"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface DoctorReviewRecord {
  _id: string;
  doctor: { _id: string; name?: string };
  patient: { _id: string; name?: string };
  rating: number;
  comment: string;
  wasRedacted: boolean;
  status: "visible" | "hidden";
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

// status: "visible" | "hidden" | "all"
export async function getDoctorReviews(status: string = "all"): Promise<ApiEnvelope<DoctorReviewRecord[]>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/doctor-reviews/admin/list?status=${status}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch reviews" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching reviews" };
  }
}

async function patchReview(id: string, action: "hide" | "unhide"): Promise<ApiEnvelope<DoctorReviewRecord>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/doctor-reviews/${id}/${action}`, {
      method: "PATCH",
      headers,
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Action failed" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred" };
  }
}

export async function hideDoctorReview(id: string): Promise<ApiEnvelope<DoctorReviewRecord>> {
  return patchReview(id, "hide");
}
export async function unhideDoctorReview(id: string): Promise<ApiEnvelope<DoctorReviewRecord>> {
  return patchReview(id, "unhide");
}

export async function deleteDoctorReview(id: string): Promise<ApiEnvelope<null>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/doctor-reviews/${id}`, { method: "DELETE", headers });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to delete review" };
    return { success: true, message: data.message || "Review deleted" };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while deleting the review" };
  }
}
