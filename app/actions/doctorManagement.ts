"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface DoctorRecord {
  _id: string;
  user: { _id: string; name?: string; phone?: string };
  qualifications?: string[];
  specialization?: string;
  experienceYears?: number;
  registrationNumber?: string;
  verificationDocuments?: string[];
  consultationFee?: number;
  hospitalName?: string;
  hospitalAddress?: string;
  languages?: string[];
  consultationTypes?: ("online" | "in_person")[];
  avgRating: number;
  reviewCount: number;
  featured: boolean;
  suspended: boolean;
  suspensionReason?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt?: string;
}

export interface DoctorResponse {
  success: boolean;
  message?: string;
  data?: DoctorRecord | DoctorRecord[];
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

// status: "pending" | "approved" | "rejected" | "all"
export async function getDoctors(status: string = "all"): Promise<DoctorResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/doctors/admin/list?status=${status}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch doctors" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching doctors" };
  }
}

async function patchDoctor(id: string, path: string, body?: Record<string, unknown>): Promise<DoctorResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/doctors/${id}${path}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body || {}),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Action failed" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred" };
  }
}

export async function approveDoctor(id: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/approve");
}
export async function rejectDoctor(id: string, rejectionReason?: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/reject", { rejectionReason });
}
export async function suspendDoctor(id: string, reason?: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/suspend", { reason });
}
export async function unsuspendDoctor(id: string): Promise<DoctorResponse> {
  return patchDoctor(id, "/unsuspend");
}
export async function setFeaturedDoctor(id: string, featured: boolean): Promise<DoctorResponse> {
  return patchDoctor(id, "/feature", { featured });
}

export async function removeDoctorAccount(id: string): Promise<DoctorResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/doctors/${id}`, { method: "DELETE", headers });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to remove doctor" };
    return { success: true, message: data.message || "Doctor account removed" };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while removing the doctor" };
  }
}
