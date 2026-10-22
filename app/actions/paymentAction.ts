"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Payments: GET /api/v1/payments (admin, super admin) and recording refunds.

export type PaymentStatus = "clearing" | "cleared" | "refunded";
export type PaymentMethod = "card" | "local" | "wallet";

interface Person {
  _id: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
}

export interface PaymentRecord {
  _id: string;
  reference: string;
  mode: "instant" | "scheduled";
  concern: string;
  startsAt: string;
  status: "confirmed" | "completed" | "cancelled" | "refunded";
  createdAt: string;
  patient: Person | null;
  doctor: { _id: string; title?: string; specialization?: string; user: Person | null } | null;
  payment: {
    amount: number;
    currency: string;
    regionId: string;
    method: string;
    /** The Stripe payment id (pi_…) for Stripe payments. */
    reference: string;
    details?: string;
    paidAt?: string;
    /** Missing on payments made before Stripe. */
    provider?: "stripe" | "free";
  };
  /** `by` is missing when it was refunded straight in Stripe. */
  refund?: { at: string; reason: string; by?: { _id: string; fullName?: string } | null };
  /** This payment in the Stripe dashboard. */
  stripeUrl: string | null;
  paymentStatus: PaymentStatus;
  /** The commission rate this booking was made with (0.2 = 20%). */
  commissionRate: number;
  amountGBP: number;
  /** In the payment's own currency. */
  commission: number;
  doctorShare: number;
  clearsAt: string;
}

export interface PaymentStats {
  collectedGBP: number;
  commissionGBP: number;
  clearingGBP: number;
  clearedGBP: number;
  refundedGBP: number;
  monthCollectedGBP: number;
  paid: number;
  clearing: number;
  cleared: number;
  refunded: number;
  commissionRate: number;
}

export interface PaymentPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaymentPageResponse {
  success: boolean;
  data?: PaymentRecord[];
  pagination?: PaymentPagination;
  stats?: PaymentStats;
  doctors?: { _id: string; name: string }[];
  error?: string;
}

export interface PaymentQuery {
  status?: PaymentStatus | "all";
  doctorId?: string;
  method?: PaymentMethod | "";
  search?: string;
  page?: number;
  limit?: number;
}

function errorFor(status: number, body: { errors?: string[]; message?: string } | null, fallback: string) {
  if (status === 401) return "Your session has expired. Please sign out and sign in again.";
  if (status === 403) return body?.message || "Only admins can see payments, and only super admins can refund.";
  return body?.errors?.[0] || body?.message || fallback;
}

async function request(path: string, init: RequestInit, fallback: string) {
  const session = await auth();
  const token = session?.accessToken;
  try {
    const response = await fetch(`${API_URL}/api/v1/payments${path}`, {
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

export async function getPaymentsPage(query: PaymentQuery = {}): Promise<PaymentPageResponse> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), limit: String(query.limit ?? 10), status: query.status ?? "all" });
  if (query.doctorId) params.set("doctorId", query.doctorId);
  if (query.method) params.set("method", query.method);
  if (query.search?.trim()) params.set("search", query.search.trim());
  const result = await request(`?${params}`, { method: "GET" }, "Failed to fetch payments");
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: result.data.payments, pagination: result.data.pagination, stats: result.data.stats, doctors: result.data.doctors };
}

/** Refunds the patient through Stripe (older payments: records it). Super admin, only while clearing. */
export async function refundPayment(id: string, reason: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await request(`/${id}/refund`, { method: "PATCH", body: JSON.stringify({ reason }) }, "Failed to record the refund");
  return result.ok ? { success: true, message: result.message } : { success: false, error: result.error };
}
