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
