"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Payouts: GET /api/v1/payouts, /payouts/balances (admin, super admin)
// and the super admin steps: send it with Stripe, or reject.

export type WithdrawalStatus = "requested" | "processing" | "paid" | "rejected";

/**
 * A doctor's Stripe payout account. not_connected: never started; incomplete:
 * Stripe's form isn't finished; review: Stripe needs more or is checking; ready: can be paid.
 */
export interface StripeStatus {
  status: "not_connected" | "incomplete" | "review" | "ready";
  /** "Barclays •••• 6789" or "Visa debit •••• 4242". */
  destination: string | null;
  requirementsDue: number;
  disabledReason?: string | null;
}

export interface WithdrawalRecord {
  _id: string;
  amountGBP: number;
  status: WithdrawalStatus;
  /** Where it goes (or went), e.g. "Barclays •••• 6789". */
  destination: string;
  /** The doctor's Stripe account now. */
  stripe: StripeStatus;
  stripeTransferId?: string;
  stripeTransferUrl: string | null;
  /** Requests from before Stripe only. */
  bank?: { accountName: string; bankName: string; accountNumber: string; sortCode?: string; iban?: string; swift?: string; country: string };
  doctor: { _id: string; title?: string; specialization?: string; user: { fullName?: string; avatar?: string; phone?: string } | null } | null;
  createdAt: string;
  processingAt?: string;
  paidAt?: string;
  transferRef?: string;
  rejectionReason?: string;
  handledBy: { _id: string; fullName?: string } | null;
}

export interface WithdrawalStats {
  /** Waiting to be sent. */
  requested: { count: number; sumGBP: number };
  paid: { count: number; sumGBP: number };
  rejected: { count: number; sumGBP: number };
  /** Cleared money doctors haven't asked for yet. */
  availableGBP: number;
  /** Our Stripe balance that can be sent now; null if Stripe couldn't be reached. */
  stripeAvailableGBP: number | null;
  minWithdrawalGBP: number;
}

export interface BalanceRow {
  doctor: { _id: string; name: string; avatar?: string; specialization?: string };
  stripe: StripeStatus;
  clearingGBP: number;
  clearedGBP: number;
  requestedGBP: number;
  paidOutGBP: number;
  availableGBP: number;
  lifetimeGBP: number;
  consultations: number;
}

export interface WithdrawalPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface WithdrawalPageResponse {
  success: boolean;
  data?: WithdrawalRecord[];
  pagination?: WithdrawalPagination;
  stats?: WithdrawalStats;
  error?: string;
}

type Result = { success: boolean; message?: string; error?: string };

function errorFor(status: number, body: { errors?: string[]; message?: string } | null, fallback: string) {
  if (status === 401) return "Your session has expired. Please sign out and sign in again.";
  if (status === 403) return body?.message || "Only admins can see payouts, and only super admins can send them.";
  return body?.errors?.[0] || body?.message || fallback;
}

async function request(path: string, init: RequestInit, fallback: string) {
  const session = await auth();
  const token = session?.accessToken;
  try {
    const response = await fetch(`${API_URL}/api/v1/payouts${path}`, {
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

export async function getWithdrawalsPage(query: { status?: WithdrawalStatus | "todo" | "all"; search?: string; page?: number; limit?: number } = {}): Promise<WithdrawalPageResponse> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), limit: String(query.limit ?? 10), status: query.status ?? "todo" });
  if (query.search?.trim()) params.set("search", query.search.trim());
  const result = await request(`?${params}`, { method: "GET" }, "Failed to fetch withdrawals");
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: result.data.withdrawals, pagination: result.data.pagination, stats: result.data.stats };
}

export async function getBalances(): Promise<{ success: boolean; data?: BalanceRow[]; error?: string }> {
  const result = await request("/balances", { method: "GET" }, "Failed to fetch balances");
  return result.ok ? { success: true, data: result.data } : { success: false, error: result.error };
}

/** Sends the withdrawal: a Stripe transfer to the doctor's Stripe account. */
export async function sendWithStripe(id: string): Promise<Result> {
  const r = await request(`/${id}/send`, { method: "PATCH" }, "Stripe couldn't send this");
  return r.ok ? { success: true, message: r.message } : { success: false, error: r.error };
}

export async function rejectWithdrawal(id: string, reason: string): Promise<Result> {
  const r = await request(`/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }, "Failed to update");
  return r.ok ? { success: true, message: r.message } : { success: false, error: r.error };
}
