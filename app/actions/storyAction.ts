"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Community stories sent by patients from the webapp's "Share story" page
// (/api/v1/stories). Approved stories show in the Learn page under Stories.

/** The webapp's Learn topics. */
export type StoryTopic = "Periods" | "Fertility" | "Pregnancy" | "Menopause" | "Pelvic Health" | "Wellness" | "Stories";

/** pending = waiting for review; hidden = was approved, taken down. */
export type StoryStatus = "pending" | "approved" | "rejected" | "hidden";

export interface Story {
  _id: string;
  title: string;
  /** Plain text, as the patient wrote it (paragraphs split by blank lines). */
  body: string;
  topic: StoryTopic;
  /** Published without the patient's name. */
  anonymous: boolean;
  /** Name shown when not anonymous. */
  authorName?: string;
  imageUrl?: string;
  status: StoryStatus;
  /** Why it was rejected; the patient sees this. */
  rejectionReason?: string;
  /** Who sent it (staff only). */
  patient?: { _id: string; fullName?: string; phone?: string };
  reviewedBy?: { _id: string; fullName?: string };
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StoryInput = Partial<Pick<Story, "title" | "body" | "topic" | "anonymous" | "authorName" | "imageUrl">>;

export type StoryStatusFilter = "all" | StoryStatus;
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
  hidden: number;
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
  data?: Story;
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

function errorFor(status: number, data: { errors?: string[]; message?: string } | null, fallback: string) {
  // The backend token lasts JWT_EXPIRES_IN; after that every call is 401.
  if (status === 401) return "Your session has expired. Please sign out and sign in again.";
  if (status === 403) return data?.message || "You don't have permission to review stories.";
  return data?.errors?.[0] || data?.message || fallback;
}

async function request<T>(path: string, init: RequestInit, fallback: string) {
  try {
    const response = await fetch(`${API_URL}/api/v1/stories${path}`, {
      ...init,
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) return { ok: false as const, error: errorFor(response.status, data, fallback) };
    return { ok: true as const, data: data?.data as T, message: data?.message as string | undefined };
  } catch {
    return { ok: false as const, error: "Can't reach the server. Please try again." };
  }
}

const refreshStoryPages = () => revalidatePath("/stories", "layout");

// ── Reads ───────────────────────────────────────────────────────────────────

export async function getStoriesPage(
  options: {
    status?: StoryStatusFilter;
    topic?: StoryTopic;
    search?: string;
    sort?: StorySort;
    page?: number;
    limit?: number;
  } = {},
): Promise<StoryPageResponse> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 10),
    sort: options.sort ?? "newest",
    status: options.status ?? "all",
  });
  if (options.topic) params.set("topic", options.topic);
  if (options.search) params.set("search", options.search);

  const result = await request<{ stories: Story[]; pagination: StoryPagination; stats: StoryStats }>(
    `?${params}`,
    { method: "GET" },
    "Failed to fetch stories",
  );
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: result.data.stories, pagination: result.data.pagination, stats: result.data.stats };
}

export async function getStoryById(id: string): Promise<StoryResponse> {
  const result = await request<Story>(`/${id}`, { method: "GET" }, "Failed to fetch the story");
  return result.ok ? { success: true, data: result.data } : { success: false, error: result.error };
}

// ── Review and changes ──────────────────────────────────────────────────────

/** Approve, reject (with an optional reason the patient sees), hide or send back to pending. */
export async function setStoryStatus(id: string, status: StoryStatus, reason?: string): Promise<StoryResponse> {
  const result = await request<Story>(
    `/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status, reason }) },
    "Failed to update the story",
  );
  if (!result.ok) return { success: false, error: result.error };
  refreshStoryPages();
  return { success: true, message: result.message, data: result.data };
}

/** Staff corrections (typos, topic, photo). Send only what changes. */
export async function updateStory(id: string, input: StoryInput): Promise<StoryResponse> {
  const result = await request<Story>(`/${id}`, { method: "PATCH", body: JSON.stringify(input) }, "Failed to update the story");
  if (!result.ok) return { success: false, error: result.error };
  refreshStoryPages();
  return { success: true, message: result.message, data: result.data };
}

export async function deleteStory(id: string): Promise<StoryResponse> {
  const result = await request<null>(`/${id}`, { method: "DELETE" }, "Failed to delete the story");
  if (!result.ok) return { success: false, error: result.error };
  refreshStoryPages();
  return { success: true, message: result.message };
}
