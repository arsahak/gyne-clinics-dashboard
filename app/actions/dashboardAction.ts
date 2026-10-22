"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// The dashboard home: GET /api/v1/dashboard/overview. Each part is null when
// the signed-in role can't see that area (Team & Roles). Money is in GBP.

export interface DayRevenue {
  date: string;
  revenueGBP: number;
  commissionGBP: number;
  consultations: number;
}

export interface RecentPayment {
  _id: string;
  reference: string;
  patient: string;
  doctor: string;
  amount: number;
  currency: string;
  amountGBP: number;
  method: string;
  details?: string;
  paidAt: string;
  status: "clearing" | "cleared" | "refunded";
}

export interface Overview {
  now: string;
  payments: {
    commissionRate: number;
    month: { revenueGBP: number; commissionGBP: number; paid: number; bookings: number; effectiveRate: number };
    lastMonth: { revenueGBP: number; commissionGBP: number; paid: number; bookings: number };
    daily: DayRevenue[];
    recent: RecentPayment[];
  } | null;
  payouts: {
    clearingGBP: number;
    availableGBP: number;
    requestedGBP: number;
    paidOutGBP: number;
    openRequests: { count: number; sumGBP: number };
    topDoctors: { _id: string; name: string; specialization: string; consultations: number; lifetimeGBP: number }[];
  } | null;
  patients: { total: number; active: number; newThisMonth: number } | null;
  doctors: { approved: number; pending: number; updates: number } | null;
  stories: { pending: number } | null;
  reports: { open: number; urgent: number } | null;
  flags: { open: number; urgent: number } | null;
  reviews: { held: number } | null;
  consultations: { live: number; upcoming: number } | null;
}

export async function getOverview(): Promise<{ success: boolean; data?: Overview; error?: string }> {
  const session = await auth();
  const token = session?.accessToken;
  try {
    const response = await fetch(`${API_URL}/api/v1/dashboard/overview`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { success: false, error: response.status === 401 ? "Your session has expired. Please sign out and sign in again." : body?.message || "Couldn't load the dashboard" };
    }
    return { success: true, data: body.data };
  } catch {
    return { success: false, error: "Can't reach the server. Please try again." };
  }
}
