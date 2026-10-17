"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Content {
  _id: string;
  title: string;
  body: string;
  format: "text" | "image" | "blog";
  imageUrl?: string;
  category: string;
  readTimeMinutes?: number;
  visibility: "published" | "draft" | "hidden";
  author: string;
  sponsored?: boolean;
  sponsorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentResponse {
  success: boolean;
  message?: string;
  data?: Content | Content[];
  error?: string;
}

export type ContentStatusFilter = "all" | "published" | "draft" | "hidden" | "sponsored";
export type ContentSort = "newest" | "oldest" | "title_asc" | "title_desc";

export interface ContentPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ContentStats {
  total: number;
  published: number;
  draft: number;
  hidden: number;
}

export interface ContentPageResponse {
  success: boolean;
  data?: Content[];
  pagination?: ContentPagination;
  stats?: ContentStats;
  categories?: string[];
  error?: string;
}

export interface ModerationLog {
  _id: string;
  moderator: { _id: string; name?: string };
  targetType: "content" | "story";
  targetId: string;
  action: "create" | "edit" | "hide" | "unhide" | "delete" | "approve" | "reject";
  reason?: string;
  createdAt: string;
}

export interface ModerationLogResponse {
  success: boolean;
  data?: ModerationLog[];
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

// Paginated admin table: search, category/status filters, sort, plus global stats and category list.
export async function getContentsPage(options: {
  category?: string;
  status?: ContentStatusFilter;
  search?: string;
  sort?: ContentSort;
  page?: number;
  limit?: number;
} = {}): Promise<ContentPageResponse> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      all: "true",
      page: String(options.page ?? 1),
      limit: String(options.limit ?? 10),
      sort: options.sort ?? "newest",
      status: options.status ?? "all",
    });
    if (options.category) params.set("category", options.category);
    if (options.search) params.set("search", options.search);

    const response = await fetch(`${API_URL}/api/content?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const data = await parseResponse(response);
    if (!response.ok) return { success: false, error: data.message || "Failed to fetch content" };
    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
      stats: data.stats,
      categories: data.categories,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred while fetching content",
    };
  }
}

// Get all content (admin sees every visibility state; pass category to filter)
export async function getContents(category?: string): Promise<ContentResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({ all: "true" });
    if (category) params.set("category", category);

    const response = await fetch(`${API_URL}/api/content?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to fetch content" };
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    console.error("Get contents error:", error);
    return { success: false, error: error.message || "An error occurred while fetching content" };
  }
}

export async function getContentById(id: string): Promise<ContentResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/content/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to fetch content" };
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    console.error("Get content by ID error:", error);
    return { success: false, error: error.message || "An error occurred while fetching content" };
  }
}

export async function createContent(payload: Partial<Content>): Promise<ContentResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/content`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to create content" };
    }

    return { success: true, message: data.message || "Content created successfully", data: data.data };
  } catch (error: any) {
    console.error("Create content error:", error);
    return { success: false, error: error.message || "An error occurred while creating content" };
  }
}

export async function updateContent(id: string, payload: Partial<Content>): Promise<ContentResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/content/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to update content" };
    }

    return { success: true, message: data.message || "Content updated successfully", data: data.data };
  } catch (error: any) {
    console.error("Update content error:", error);
    return { success: false, error: error.message || "An error occurred while updating content" };
  }
}

export async function hideContent(id: string, reason?: string): Promise<ContentResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/content/${id}/hide`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ reason }),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to hide content" };
    }

    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    console.error("Hide content error:", error);
    return { success: false, error: error.message || "An error occurred while hiding content" };
  }
}

export async function unhideContent(id: string): Promise<ContentResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/content/${id}/unhide`, {
      method: "PATCH",
      headers,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to restore content" };
    }

    return { success: true, message: data.message, data: data.data };
  } catch (error: any) {
    console.error("Unhide content error:", error);
    return { success: false, error: error.message || "An error occurred while restoring content" };
  }
}

export async function deleteContent(id: string): Promise<ContentResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/content/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to delete content" };
    }

    return { success: true, message: data.message || "Content deleted successfully" };
  } catch (error: any) {
    console.error("Delete content error:", error);
    return { success: false, error: error.message || "An error occurred while deleting content" };
  }
}

export async function getModerationLogs(): Promise<ModerationLogResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/content/moderation-logs`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to fetch moderation logs" };
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    console.error("Get moderation logs error:", error);
    return { success: false, error: error.message || "An error occurred while fetching moderation logs" };
  }
}
