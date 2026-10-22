"use client";
import type { PaymentMethod, PaymentStatus, WithdrawalStatus } from "@/lib/sample/finance";
import type { Tone } from "@/component/shared/ui";

// Shared look for the Money pages (payments, payouts, fees).

export const PAYMENT_STATUS: Record<PaymentStatus, Tone> = {
  clearing: {
    label: "Clearing",
    hint: "Paid. The doctor's share clears when the 7-day follow-up ends.",
    dot: "bg-amber-500",
    light: "bg-amber-50 text-amber-700 border-amber-200",
    dark: "bg-amber-900/40 text-amber-200 border-amber-800",
  },
  cleared: {
    label: "Cleared",
    hint: "The doctor can withdraw their share.",
    dot: "bg-green-500",
    light: "bg-green-50 text-green-700 border-green-200",
    dark: "bg-green-900/40 text-green-200 border-green-800",
  },
  refunded: {
    label: "Refunded",
    hint: "Money went back to the patient. No commission, nothing for the doctor.",
    dot: "bg-gray-400",
    light: "bg-gray-100 text-gray-600 border-gray-200",
    dark: "bg-gray-700 text-gray-300 border-gray-600",
  },
};

export const WITHDRAWAL_STATUS: Record<WithdrawalStatus, Tone> = {
  requested: {
    label: "Requested",
    hint: "The doctor asked for this. Check it and send it with Stripe.",
    dot: "bg-amber-500",
    light: "bg-amber-50 text-amber-700 border-amber-200",
    dark: "bg-amber-900/40 text-amber-200 border-amber-800",
  },
  processing: {
    label: "Sending",
    hint: "An older bank transfer that was started.",
    dot: "bg-blue-500",
    light: "bg-blue-50 text-blue-700 border-blue-200",
    dark: "bg-blue-900/40 text-blue-200 border-blue-800",
  },
  paid: {
    label: "Sent",
    hint: "Sent to the doctor's Stripe account. Stripe pays it into their bank or card.",
    dot: "bg-green-500",
    light: "bg-green-50 text-green-700 border-green-200",
    dark: "bg-green-900/40 text-green-200 border-green-800",
  },
  rejected: {
    label: "Rejected",
    hint: "Not paid. The amount went back to the doctor's balance.",
    dot: "bg-red-500",
    light: "bg-red-50 text-red-700 border-red-200",
    dark: "bg-red-900/40 text-red-200 border-red-800",
  },
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  card: "Card",
  local: "Local wallet",
  wallet: "Wallet",
};

export { formatDate, formatDateTime, initials, relativeDays, SampleDataNote, StatusPill } from "@/component/shared/ui";
