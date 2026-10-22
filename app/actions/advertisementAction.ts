"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Ads shown in the webapp (/api/v1/advertisements). Fields match the webapp's
// ad banner: advertiser, headline, one line of text, a button, optional price.

/** Where an ad can show in the webapp (its AdBanner slots). */
export type AdSlot = "home" | "learn-feed" | "article-end" | "doctors-feed" | "doctor-dashboard";
/** Banner colour in the webapp. */
export type AdTone = "primary" | "secondary" | "accent" | "gold";

export interface AdvertisementRecord {
  _id: string;
  advertiser: string;
  headline: string;
  /** One line under the headline. */
  body: string;
  /** Button text, e.g. "Shop now". */
  cta: string;
  linkUrl: string;
  /** Base price in GBP; the app converts it per region. */
  priceGBP?: number;
  tone: AdTone;
  /** Optional small image beside the text. */
  imageUrl?: string;
  placements: AdSlot[];
  /** Higher shows first when several ads share a placement. */
  priority: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AdvertisementInput = Partial<
  Pick<
    AdvertisementRecord,
    "advertiser" | "headline" | "body" | "cta" | "linkUrl" | "tone" | "imageUrl" | "placements" | "priority" | "active"
  >
> & {
  /** null = no price. */
  priceGBP?: number | null;
  /** yyyy-MM-dd, or null to clear. */
  startDate?: string | null;
  endDate?: string | null;
};

export type AdStatusFilter = "all" | "live" | "scheduled" | "paused" | "ended";
export type AdSort = "priority" | "newest" | "oldest" | "impressions" | "clicks";

export interface AdPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdStats {
  total: number;
  live: number;
  impressions: number;
  clicks: number;
}

export interface AdPageResponse {
  success: boolean;
  data?: AdvertisementRecord[];
  pagination?: AdPagination;
  stats?: AdStats;
  error?: string;
}

export interface AdvertisementResponse {
  success: boolean;
  message?: string;
  data?: AdvertisementRecord;
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
  if (status === 403) return data?.message || "You don't have permission to manage ads.";
  if (status === 404 && !data?.message) return "The ads service isn't available yet.";
  return data?.errors?.[0] || data?.message || fallback;
}

async function request<T>(path: string, init: RequestInit, fallback: string) {
  try {
    const response = await fetch(`${API_URL}/api/v1/advertisements${path}`, {
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

const refreshAdPages = () => revalidatePath("/advertisements", "layout");

// ── Reads ───────────────────────────────────────────────────────────────────

export async function getAdvertisementsPage(
  options: {
    placement?: AdSlot | "all";
    status?: AdStatusFilter;
    search?: string;
    sort?: AdSort;
    page?: number;
    limit?: number;
  } = {},
): Promise<AdPageResponse> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 10),
    sort: options.sort ?? "priority",
    status: options.status ?? "all",
  });
  if (options.placement && options.placement !== "all") params.set("placement", options.placement);
  if (options.search) params.set("search", options.search);

  const result = await request<{ ads: AdvertisementRecord[]; pagination: AdPagination; stats: AdStats }>(
    `?${params}`,
    { method: "GET" },
    "Failed to fetch ads",
  );
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: result.data.ads, pagination: result.data.pagination, stats: result.data.stats };
}

export async function getAdvertisementById(id: string): Promise<AdvertisementResponse> {
  const result = await request<AdvertisementRecord>(`/${id}`, { method: "GET" }, "Failed to fetch the ad");
  return result.ok ? { success: true, data: result.data } : { success: false, error: result.error };
}

// ── Changes ─────────────────────────────────────────────────────────────────

export async function createAdvertisement(input: AdvertisementInput): Promise<AdvertisementResponse> {
  const result = await request<AdvertisementRecord>("", { method: "POST", body: JSON.stringify(input) }, "Failed to create the ad");
  if (!result.ok) return { success: false, error: result.error };
  refreshAdPages();
  return { success: true, message: result.message, data: result.data };
}

/** Send only what changes. */
export async function updateAdvertisement(id: string, input: AdvertisementInput): Promise<AdvertisementResponse> {
  const result = await request<AdvertisementRecord>(`/${id}`, { method: "PATCH", body: JSON.stringify(input) }, "Failed to update the ad");
  if (!result.ok) return { success: false, error: result.error };
  refreshAdPages();
  return { success: true, message: result.message, data: result.data };
}

export async function deleteAdvertisement(id: string): Promise<AdvertisementResponse> {
  const result = await request<null>(`/${id}`, { method: "DELETE" }, "Failed to delete the ad");
  if (!result.ok) return { success: false, error: result.error };
  refreshAdPages();
  return { success: true, message: result.message };
}
