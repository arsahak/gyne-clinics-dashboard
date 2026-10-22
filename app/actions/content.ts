"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Learn-feed content against the Gyneclinics backend (/api/v1/content).
// Shown in the webapp's Learn page; formats and categories match the webapp.

/** The webapp's Learn categories (list in component/contentManagement/contentMeta.ts). */
export type ContentCategory = "Periods" | "Fertility" | "Pregnancy" | "Menopause" | "Pelvic Health" | "Wellness" | "Stories";

export interface Content {
  _id: string;
  /** URL name in the webapp: /patient/learn/<slug>. */
  slug: string;
  title: string;
  /** Cleaned HTML. Not included in list results. */
  body: string;
  /** Summary on feed cards and at the top of the article. */
  excerpt?: string;
  /** The summary is taken from the start of the body (not written by hand). */
  excerptEstimated?: boolean;
  /** guide = article. */
  format: "guide" | "blog" | "story" | "image";
  imageUrl?: string;
  category: ContentCategory;
  /** Byline shown to patients. */
  authorName?: string;
  authorRole?: string;
  readTimeMinutes?: number;
  /** Read time is estimated from the body (not set by hand). */
  readTimeEstimated?: boolean;
  visibility: "published" | "draft" | "hidden";
  sponsored?: boolean;
  sponsorName?: string;
  publishedAt?: string;
  author?: { _id: string; fullName?: string };
  updatedBy?: { _id: string; fullName?: string };
  createdAt?: string;
  updatedAt?: string;
}

/** Fields sent on create / update. `readTimeMinutes: null` = estimate it. */
export type ContentInput = Partial<
  Pick<
    Content,
    "title" | "body" | "format" | "imageUrl" | "category" | "visibility" | "sponsored" | "sponsorName" | "authorName" | "authorRole"
  >
> & {
  /** null = estimate it from the body. */
  readTimeMinutes?: number | null;
  /** Empty = take it from the start of the body. */
  excerpt?: string;
};

export interface ContentResponse {
  success: boolean;
  message?: string;
  data?: Content;
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
  sponsored?: number;
}

export interface ContentPageResponse {
  success: boolean;
  data?: Content[];
  pagination?: ContentPagination;
  stats?: ContentStats;
  categories?: string[];
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

/** Error text for a failed backend response. */
function errorFor(status: number, data: { errors?: string[]; message?: string } | null, fallback: string) {
  // The backend token lasts JWT_EXPIRES_IN; after that every call is 401.
  if (status === 401) return "Your session has expired. Please sign out and sign in again.";
  if (status === 403) return data?.message || "You don't have permission to manage content.";
  return data?.errors?.[0] || data?.message || fallback;
}

async function request<T>(path: string, init: RequestInit, fallback: string) {
  try {
    const response = await fetch(`${API_URL}/api/v1/content${path}`, {
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

/** Refreshes the cached content pages after a change. */
const refreshContentPages = () => revalidatePath("/content", "layout");

// ── Reads ───────────────────────────────────────────────────────────────────

/** One page of the staff list, with counts and the category list. */
export async function getContentsPage(
  options: {
    category?: string;
    status?: ContentStatusFilter;
    search?: string;
    sort?: ContentSort;
    page?: number;
    limit?: number;
  } = {},
): Promise<ContentPageResponse> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 10),
    sort: options.sort ?? "newest",
    status: options.status ?? "all",
  });
  if (options.category) params.set("category", options.category);
  if (options.search) params.set("search", options.search);

  const result = await request<{
    contents: Content[];
    pagination: ContentPagination;
    stats: ContentStats;
    categories: string[];
  }>(`?${params}`, { method: "GET" }, "Failed to fetch content");
  if (!result.ok) return { success: false, error: result.error };
  return {
    success: true,
    data: result.data.contents,
    pagination: result.data.pagination,
    stats: result.data.stats,
    categories: result.data.categories,
  };
}

export async function getContentById(id: string): Promise<ContentResponse> {
  const result = await request<Content>(`/${id}`, { method: "GET" }, "Failed to fetch content");
  return result.ok ? { success: true, data: result.data } : { success: false, error: result.error };
}

// ── Changes ─────────────────────────────────────────────────────────────────

export async function createContent(input: ContentInput): Promise<ContentResponse> {
  const result = await request<Content>("", { method: "POST", body: JSON.stringify(input) }, "Failed to create content");
  if (!result.ok) return { success: false, error: result.error };
  refreshContentPages();
  return { success: true, message: result.message, data: result.data };
}

/** Send only what changes. */
export async function updateContent(id: string, input: ContentInput): Promise<ContentResponse> {
  const result = await request<Content>(`/${id}`, { method: "PATCH", body: JSON.stringify(input) }, "Failed to update content");
  if (!result.ok) return { success: false, error: result.error };
  refreshContentPages();
  return { success: true, message: result.message, data: result.data };
}

export async function deleteContent(id: string): Promise<ContentResponse> {
  const result = await request<null>(`/${id}`, { method: "DELETE" }, "Failed to delete content");
  if (!result.ok) return { success: false, error: result.error };
  refreshContentPages();
  return { success: true, message: result.message };
}
