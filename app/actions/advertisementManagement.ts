"use server";

import { auth } from "@/auth";
import { AdPlacement } from "@/lib/adPlacements";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface AdvertisementRecord {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  placement: AdPlacement;
  advertiserName?: string;
  priority: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdvertisementResponse {
  success: boolean;
  message?: string;
  data?: AdvertisementRecord | AdvertisementRecord[];
  error?: string;
}

export interface AdvertisementInput {
  title: string;
  imageUrl: string;
  linkUrl?: string;
  placement: AdPlacement;
  advertiserName?: string;
  priority?: number;
  active?: boolean;
  startDate?: string;
  endDate?: string;
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

export async function getAdvertisements(placement?: AdPlacement | "all"): Promise<AdvertisementResponse> {
  try {
    const headers = await getAuthHeaders();
    const params = placement && placement !== "all" ? `?placement=${placement}` : "";
    const response = await fetch(`${API_URL}/api/advertisements/admin/list${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch advertisements" };
    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while fetching advertisements" };
  }
}

export async function createAdvertisement(payload: AdvertisementInput): Promise<AdvertisementResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/advertisements`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to create advertisement" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while creating the advertisement" };
  }
}

export async function updateAdvertisement(
  id: string,
  payload: Partial<AdvertisementInput>
): Promise<AdvertisementResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/advertisements/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to update advertisement" };
    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while updating the advertisement" };
  }
}

export async function toggleAdvertisementActive(id: string, active: boolean): Promise<AdvertisementResponse> {
  return updateAdvertisement(id, { active });
}

export async function deleteAdvertisement(id: string): Promise<AdvertisementResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/advertisements/${id}`, { method: "DELETE", headers });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to delete advertisement" };
    return { success: true, message: data.message || "Advertisement deleted" };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while deleting the advertisement" };
  }
}
