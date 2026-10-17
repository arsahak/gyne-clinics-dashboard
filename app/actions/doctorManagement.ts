"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface AvailabilitySlot {
  dayOfWeek: number; // 0 = Sunday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

export interface RegionalPrice {
  region: string;
  fee: number;
}

export interface DoctorRecord {
  _id: string;
  user: { _id: string; name?: string; phone?: string; email?: string; avatar?: string };
  qualifications?: string[];
  specialization?: string;
  experienceYears?: number;
  registrationNumber?: string;
  verificationDocuments?: string[];
  consultationFee?: number;
  regionalPricing?: RegionalPrice[];
  availability?: AvailabilitySlot[];
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

export type DoctorStatusFilter = "all" | "pending" | "approved" | "rejected" | "suspended" | "featured";
export type DoctorSort = "newest" | "oldest" | "rating" | "experience";

export interface DoctorPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DoctorStats {
  total: number;
  pending: number;
  approved: number;
  suspended: number;
}

export interface DoctorPageResponse {
  success: boolean;
  data?: DoctorRecord[];
  pagination?: DoctorPagination;
  stats?: DoctorStats;
  error?: string;
}

export interface DoctorResponse {
  success: boolean;
  message?: string;
  data?: DoctorRecord | DoctorRecord[];
  error?: string;
}

export interface AppointmentRecord {
  _id: string;
  patient?: { _id: string; name?: string; phone?: string };
  doctor?: { _id: string; name?: string; phone?: string };
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "completed" | "cancelled";
  reason?: string;
  createdAt: string;
}

export interface AppointmentsResponse {
  success: boolean;
  data?: AppointmentRecord[];
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

export async function getDoctorAppointments(): Promise<AppointmentsResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/doctors/admin/appointments`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch appointments" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching appointments" };
  }
}

// status: "pending" | "approved" | "rejected" | "all"
export async function getDoctorsPage(
  status: DoctorStatusFilter = "all",
  search?: string,
  page: number = 1,
  limit: number = 10,
  sort: DoctorSort = "newest",
): Promise<DoctorPageResponse> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      status,
      page: String(page),
      limit: String(limit),
      sort,
    });
    if (search) params.set("search", search);

    const response = await fetch(`${API_URL}/api/doctors/admin/list?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch doctors" };
    return { success: true, data: data.data, pagination: data.pagination, stats: data.stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred while fetching doctors",
    };
  }
}

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
