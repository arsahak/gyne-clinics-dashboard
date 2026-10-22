"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Read only: GET /api/v1/consultations (staff).

export type ConsultationStage = "upcoming" | "live" | "follow_up" | "completed" | "cancelled" | "refunded";
export type ConsultationStageFilter = "all" | ConsultationStage;
export type ConsultationMode = "instant" | "scheduled";
export type ConsultationSort = "newest" | "oldest" | "starts_soon" | "starts_latest";

export interface ConsultationRecord {
  _id: string;
  reference: string;
  mode: ConsultationMode;
  concern: string;
  startsAt: string;
  sessionEndsAt: string;
  followUpEndsAt: string;
  timezone: string;
  status: "confirmed" | "completed" | "cancelled" | "refunded";
  stage: ConsultationStage;
  createdAt: string;
  patient: { _id: string; fullName?: string; phone?: string; avatar?: string } | null;
  doctor: { _id: string; title?: string; specialization?: string; feeGBP?: number; user: { _id: string; fullName?: string; avatar?: string } | null } | null;
  payment: { amount: number; currency: string; regionId: string; method: string; reference: string; details?: string; paidAt?: string };
  confirmationSms?: { status: "sent" | "failed" | "skipped"; at: string };
}

export interface ConsultationStats {
  total: number;
  upcoming: number;
  live: number;
  follow_up: number;
  completed: number;
  cancelled: number;
  refunded: number;
}

export interface ConsultationPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ConsultationPageResponse {
  success: boolean;
  data?: ConsultationRecord[];
  pagination?: ConsultationPagination;
  stats?: ConsultationStats;
  doctors?: { _id: string; name: string }[];
  error?: string;
}

export interface ConsultationQuery {
  stage?: ConsultationStageFilter;
  mode?: ConsultationMode | "";
  doctorId?: string;
  search?: string;
  sort?: ConsultationSort;
  page?: number;
  limit?: number;
}

export async function getConsultationsPage(query: ConsultationQuery = {}): Promise<ConsultationPageResponse> {
  const session = await auth();
  const token = session?.accessToken;
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 10),
    stage: query.stage ?? "all",
    sort: query.sort ?? "newest",
  });
  if (query.mode) params.set("mode", query.mode);
  if (query.doctorId) params.set("doctorId", query.doctorId);
  if (query.search?.trim()) params.set("search", query.search.trim());

  try {
    const response = await fetch(`${API_URL}/api/v1/consultations?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error =
        response.status === 401
          ? "Your session has expired. Please sign out and sign in again."
          : response.status === 403
            ? body?.message || "You don't have permission to see consultations."
            : body?.errors?.[0] || body?.message || "Failed to fetch consultations";
      return { success: false, error };
    }
    return {
      success: true,
      data: body.data.consultations,
      pagination: body.data.pagination,
      stats: body.data.stats,
      doctors: body.data.doctors,
    };
  } catch {
    return { success: false, error: "Can't reach the server. Please try again." };
  }
}
