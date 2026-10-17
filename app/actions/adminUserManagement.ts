"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type UserRole = "customer" | "admin" | "staff" | "patient" | "doctor";

export interface UserRecord {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  suspended: boolean;
  suspensionReason?: string;
  createdAt?: string;
}

export type PregnancyStatus = "not_pregnant" | "pregnant" | "postpartum" | "trying_to_conceive";

export interface PatientProfile {
  _id: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  menstrualHistory?: {
    lastPeriodDate?: string;
    cycleLengthDays?: number;
    periodLengthDays?: number;
  };
  pregnancyStatus?: PregnancyStatus;
  profileCompleted: boolean;
  remindersEnabled: boolean;
}

export interface PatientRecord extends UserRecord {
  avatar?: string;
  profile: PatientProfile | null;
}

export type PatientSort = "newest" | "oldest" | "name_asc" | "name_desc";

export interface PatientPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PatientStats {
  total: number;
  active: number;
  blocked: number;
  pregnant: number;
}

export interface PatientListResponse {
  success: boolean;
  data?: PatientRecord[];
  pagination?: PatientPagination;
  stats?: PatientStats;
  error?: string;
}

export interface UserManagementResponse {
  success: boolean;
  message?: string;
  data?: UserRecord | UserRecord[];
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

export async function getUsers(role?: UserRole | "all", search?: string): Promise<UserManagementResponse> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (role && role !== "all") params.set("role", role);
    if (search) params.set("search", search);

    const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch users" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching users" };
  }
}

export async function getPatients(
  status: "all" | "active" | "suspended" = "all",
  search?: string,
  page: number = 1,
  limit: number = 10,
  sort: PatientSort = "newest",
): Promise<PatientListResponse> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
    if (status !== "all") params.set("suspended", String(status === "suspended"));
    if (search) params.set("search", search);

    const response = await fetch(`${API_URL}/api/admin/users/patients?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch patients" };
    return { success: true, data: data.data, pagination: data.pagination, stats: data.stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred while fetching patients",
    };
  }
}

export async function suspendUser(id: string, reason?: string): Promise<UserManagementResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/users/${id}/suspend`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ reason }),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to suspend user" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while suspending the user" };
  }
}

export async function unsuspendUser(id: string): Promise<UserManagementResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/users/${id}/unsuspend`, { method: "PATCH", headers });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to unsuspend user" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while unsuspending the user" };
  }
}

export async function verifyUserAccount(id: string): Promise<UserManagementResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/admin/users/${id}/verify`, { method: "PATCH", headers });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to verify user" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while verifying the user" };
  }
}
