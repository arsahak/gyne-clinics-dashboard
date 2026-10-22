"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Doctor reviews: GET /api/v1/reviews (staff) plus publish / hide / delete.

export type ReviewStatus = "published" | "held" | "hidden";
export type ReviewStatusFilter = "all" | ReviewStatus;

export interface ReviewRecord {
  _id: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  holdReason?: "low_rating" | "language";
  hiddenReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: { _id: string; fullName?: string } | null;
  patient: { _id: string; fullName?: string; phone?: string; avatar?: string } | null;
  doctor: { _id: string; title?: string; specialization?: string; rating?: number; reviewCount?: number; user: { fullName?: string; avatar?: string } | null } | null;
  consultation: { _id: string; reference: string; startsAt: string } | null;
}

export interface ReviewStats {
  total: number;
  published: number;
  held: number;
  hidden: number;
  /** Average of published reviews. */
  average: number;
  /** Published reviews per star, "5" … "1". */
  byRating: Record<string, number>;
}

export interface ReviewDoctorSummary {
  _id: string;
  name: string;
  avatar?: string;
  average: number;
  published: number;
  total: number;
}

export interface ReviewPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ReviewPageResponse {
  success: boolean;
  data?: ReviewRecord[];
  pagination?: ReviewPagination;
  stats?: ReviewStats;
  doctors?: ReviewDoctorSummary[];
  error?: string;
}

export interface ReviewQuery {
  status?: ReviewStatusFilter;
  doctorId?: string;
  rating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

function errorFor(status: number, body: { errors?: string[]; message?: string } | null, fallback: string) {
  if (status === 401) return "Your session has expired. Please sign out and sign in again.";
  if (status === 403) return body?.message || "You don't have permission to manage reviews.";
  return body?.errors?.[0] || body?.message || fallback;
}

async function request(path: string, init: RequestInit, fallback: string) {
  const session = await auth();
  const token = session?.accessToken;
  try {
    const response = await fetch(`${API_URL}/api/v1/reviews${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false as const, error: errorFor(response.status, body, fallback) };
    return { ok: true as const, data: body?.data, message: body?.message as string | undefined };
  } catch {
    return { ok: false as const, error: "Can't reach the server. Please try again." };
  }
}

export async function getReviewsPage(query: ReviewQuery = {}): Promise<ReviewPageResponse> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), limit: String(query.limit ?? 10), status: query.status ?? "all" });
  if (query.doctorId) params.set("doctorId", query.doctorId);
  if (query.rating) params.set("rating", String(query.rating));
  if (query.search?.trim()) params.set("search", query.search.trim());

  const result = await request(`?${params}`, { method: "GET" }, "Failed to fetch reviews");
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: result.data.reviews, pagination: result.data.pagination, stats: result.data.stats, doctors: result.data.doctors };
}

export async function setReviewStatus(id: string, status: ReviewStatus, reason?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await request(`/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, ...(reason && { reason }) }) }, "Failed to update the review");
  return result.ok ? { success: true, message: result.message } : { success: false, error: result.error };
}

export async function deleteReview(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await request(`/${id}`, { method: "DELETE" }, "Failed to delete the review");
  return result.ok ? { success: true, message: result.message } : { success: false, error: result.error };
}
