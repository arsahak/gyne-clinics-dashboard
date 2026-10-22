"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Fees & Commission: GET /api/v1/settings/fees (admin, super admin), PUT (super admin),
// and payout runs: GET /settings/fees/payouts, POST /settings/fees/payouts/run (super admin).

export type PayoutSchedule = "on_request" | "weekly";

export interface FeeOverride {
  doctor: { _id: string; name: string; specialization?: string };
  /** 0.15 = 15% */
  rate: number;
  note: string;
}

export type RegionId = "europe" | "north_america" | "middle_east" | "asia_pacific" | "latin_america" | "africa" | "south_asia";

export interface RegionPrice {
  id: RegionId;
  name: string;
  currency: "GBP" | "USD";
  /** Share of the doctor's UK fee, 0.25 = 25%. */
  multiplier: number;
  defaultMultiplier: number;
}

export interface PayoutLine {
  doctor: { _id: string; name: string };
  amountGBP: number;
  /** request: the doctor asked; balance: the weekly run pays their available balance. */
  source: "request" | "balance";
  withdrawalId?: string;
  /** Why it won't be sent, if it won't. */
  blocker: string | null;
}

export interface PayoutRunInfo {
  /** Next Friday 9:00 UK time, when the schedule is weekly. */
  nextRunAt: string | null;
  lastRun: { at: string; trigger: "schedule" | "manual"; sent: number; sentGBP: number; skipped: number; by: string | null } | null;
  preview: { lines: PayoutLine[]; totalGBP: number; readyGBP: number };
}

export interface FeeChange {
  at: string;
  by: string | null;
  changes: string[];
}

export interface FeeSettings {
  /** 0.2 = 20% */
  commissionRate: number;
  minWithdrawalGBP: number;
  payoutSchedule: PayoutSchedule;
  regions: RegionPrice[];
  gbpToUsd: number;
  payouts: PayoutRunInfo;
  history: FeeChange[];
  sessionHours: number;
  followUpDays: number;
  payoutMethods: { id: string; label: string; status: "in_use" | "later" }[];
  /** Stripe Connect: test or live keys, and how many approved doctors can be paid. */
  stripe?: { mode: "test" | "live"; doctorsReady: number; doctorsStarted: number; doctors: number };
  overrides: FeeOverride[];
  doctors: { _id: string; name: string; specialization?: string }[];
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SaveFees {
  commissionRate: number;
  minWithdrawalGBP: number;
  payoutSchedule: PayoutSchedule;
  regionMultipliers: Partial<Record<RegionId, number>>;
  overrides: { doctorId: string; rate: number; note?: string }[];
}

async function request(init: RequestInit, path = "") {
  const session = await auth();
  const token = session?.accessToken;
  try {
    const response = await fetch(`${API_URL}/api/v1/settings/fees${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error =
        response.status === 401
          ? "Your session has expired. Please sign out and sign in again."
          : response.status === 403
            ? body?.message || "Only a super admin can do this."
            : body?.errors?.[0] || body?.message || "Something went wrong";
      return { ok: false as const, error };
    }
    return { ok: true as const, data: body?.data, message: body?.message as string | undefined };
  } catch {
    return { ok: false as const, error: "Can't reach the server. Please try again." };
  }
}

export async function getFeeSettings(): Promise<{ success: boolean; data?: FeeSettings; error?: string }> {
  const r = await request({ method: "GET" });
  return r.ok ? { success: true, data: r.data } : { success: false, error: r.error };
}

export async function saveFeeSettings(input: SaveFees): Promise<{ success: boolean; message?: string; changes?: string[]; error?: string }> {
  const r = await request({ method: "PUT", body: JSON.stringify(input) });
  return r.ok ? { success: true, message: r.message, changes: r.data?.changes ?? [] } : { success: false, error: r.error };
}

/** Next weekly run, the last run, and who would be paid now. */
export async function getPayoutRun(): Promise<{ success: boolean; data?: PayoutRunInfo; error?: string }> {
  const r = await request({ method: "GET" }, "/payouts");
  return r.ok ? { success: true, data: r.data } : { success: false, error: r.error };
}

export interface PayoutRunResult {
  sent: { doctor: string; amountGBP: number; transfer: string }[];
  skipped: { doctor: string; amountGBP: number; reason: string }[];
  sentGBP: number;
}

/** Pays everyone who can be paid now, with Stripe (super admin). */
export async function runPayoutsNow(): Promise<{ success: boolean; message?: string; result?: PayoutRunResult; data?: PayoutRunInfo; error?: string }> {
  const r = await request({ method: "POST" }, "/payouts/run");
  if (!r.ok) return { success: false, error: r.error };
  const { result, ...info } = r.data as PayoutRunInfo & { result: PayoutRunResult };
  return { success: true, message: r.message, result, data: info };
}
