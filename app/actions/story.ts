"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Story {
  _id: string;
  title: string;
  body: string;
  author: { _id: string; name?: string; phone?: string; avatar?: string } | string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  visibility: "visible" | "hidden";
  reviewedBy?: { _id: string; name?: string } | string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StoryStatusFilter = "all" | "pending" | "approved" | "rejected" | "hidden";
export type StorySort = "newest" | "oldest" | "title_asc" | "title_desc";

export interface StoryPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface StoryStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface StoryPageResponse {
  success: boolean;
  data?: Story[];
  pagination?: StoryPagination;
  stats?: StoryStats;
  error?: string;
}

export interface StoryResponse {
  success: boolean;
  message?: string;
  data?: Story | Story[];
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
    } catch (e) {
      console.error(`JSON Parse Error for ${response.url}.`);
      throw new Error(`Invalid JSON response from server (Status ${response.status})`);
    }
  } else {
    const text = await response.text();
    console.error(`Non-JSON response from ${response.url}:`, text.substring(0, 200));
    throw new Error(`Server returned non-JSON response (Status ${response.status})`);
  }
}

export async function getStoriesPage(options: {
  status?: StoryStatusFilter;
  search?: string;
  sort?: StorySort;
  page?: number;
  limit?: number;
} = {}): Promise<StoryPageResponse> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      status: options.status ?? "pending",
      page: String(options.page ?? 1),
      limit: String(options.limit ?? 10),
      sort: options.sort ?? "newest",
    });
    if (options.search) params.set("search", options.search);

    const response = await fetch(`${API_URL}/api/stories?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch stories" };
    return { success: true, data: data.data, pagination: data.pagination, stats: data.stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred while fetching stories",
    };
  }
}

// status: "pending" | "approved" | "rejected" | "all" (defaults to "pending" on the backend)
export async function getStories(status: string = "pending"): Promise<StoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/stories?status=${status}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to fetch stories" };
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    console.error("Get stories error:", error);
    return { success: false, error: error.message || "An error occurred while fetching stories" };
  }
}

export async function approveStory(id: string): Promise<StoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/stories/${id}/approve`, {
      method: "PATCH",
      headers,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to approve story" };
    }

    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    console.error("Approve story error:", error);
    return { success: false, error: error.message || "An error occurred while approving the story" };
  }
}

export async function rejectStory(id: string, rejectionReason?: string): Promise<StoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/stories/${id}/reject`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ rejectionReason }),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to reject story" };
    }

    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    console.error("Reject story error:", error);
    return { success: false, error: error.message || "An error occurred while rejecting the story" };
  }
}

export async function hideStory(id: string, reason?: string): Promise<StoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/stories/${id}/hide`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ reason }),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to hide story" };
    }

    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    console.error("Hide story error:", error);
    return { success: false, error: error.message || "An error occurred while hiding the story" };
  }
}

export async function unhideStory(id: string): Promise<StoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/stories/${id}/unhide`, {
      method: "PATCH",
      headers,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to restore story" };
    }

    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    console.error("Unhide story error:", error);
    return { success: false, error: error.message || "An error occurred while restoring the story" };
  }
}

export async function deleteStory(id: string): Promise<StoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/stories/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to delete story" };
    }

    return { success: true, message: data.message || "Story deleted successfully" };
  } catch (error: any) {
    console.error("Delete story error:", error);
    return { success: false, error: error.message || "An error occurred while deleting the story" };
  }
}
