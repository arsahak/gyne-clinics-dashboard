"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface SubUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  userType?: string;
  avatar?: string;
  permissions?: string[];
  isVerified?: boolean;
  createdAt?: string;
}

export interface SubUserResponse {
  success: boolean;
  message?: string;
  data?: SubUser | SubUser[];
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

export async function getSubUsers(): Promise<SubUserResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/sub-users`, {
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

export async function createSubUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  userType?: string;
  avatar?: string;
  permissions?: string[];
}): Promise<SubUserResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/sub-users`, {
      method: "POST",
      headers,
      body: JSON.stringify(userData),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to create user" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while creating the user" };
  }
}

export async function updateSubUser(
  id: string,
  updateData: { name?: string; email?: string; password?: string; role?: string; userType?: string; avatar?: string }
): Promise<SubUserResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/sub-users/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to update user" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while updating the user" };
  }
}

export async function deleteSubUser(id: string): Promise<SubUserResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/sub-users/${id}`, { method: "DELETE", headers });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to delete user" };
    return { success: true, message: data.message || "User deleted successfully" };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while deleting the user" };
  }
}

export async function updateUserPermissions(id: string, permissions: string[]): Promise<SubUserResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/users/sub-users/${id}/permissions`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ permissions }),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to update permissions" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while updating permissions" };
  }
}
