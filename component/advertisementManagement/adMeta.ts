import type { AdSlot, AdTone, AdvertisementRecord } from "@/app/actions/advertisementAction";

// Labels and colours shared by the ad pages. Slots and tones match the
// webapp's AdBanner (webapp/lib/ads.ts, component/shared/ad-banner.tsx).

export const AD_SLOTS: { value: AdSlot; label: string; where: string }[] = [
  { value: "home", label: "Patient home", where: "Home page, beside the next consultation" },
  { value: "learn-feed", label: "Learn feed", where: "Between articles in Learn" },
  { value: "article-end", label: "End of articles", where: "Under each Learn article" },
  { value: "doctors-feed", label: "Find a specialist", where: "Between doctors in Get help" },
  { value: "doctor-dashboard", label: "Doctor dashboard", where: "The doctor's home page" },
];

export const SLOT_LABEL = Object.fromEntries(AD_SLOTS.map((s) => [s.value, s.label])) as Record<AdSlot, string>;

/** The webapp's colours for each banner tone. */
export const AD_TONES: Record<AdTone, { label: string; color: string; soft: string }> = {
  primary: { label: "Teal", color: "#2b7d85", soft: "#e6f4f3" },
  secondary: { label: "Plum", color: "#765885", soft: "#f4eef7" },
  accent: { label: "Rose", color: "#cc619d", soft: "#fbeef5" },
  gold: { label: "Gold", color: "#af8d53", soft: "#f7f1e6" },
};

export type AdStatus = "live" | "scheduled" | "paused" | "ended";

/** Whether patients can see it right now. */
export function adStatus(ad: Pick<AdvertisementRecord, "active" | "startDate" | "endDate">, now = new Date()): AdStatus {
  if (!ad.active) return "paused";
  const day = now.toISOString().slice(0, 10);
  if (ad.endDate && ad.endDate.slice(0, 10) < day) return "ended";
  if (ad.startDate && ad.startDate.slice(0, 10) > day) return "scheduled";
  return "live";
}

export const STATUS_META: Record<AdStatus, { label: string; light: string; dark: string; dot: string }> = {
  live: { label: "Live", light: "bg-green-50 text-green-800 border-green-200", dark: "bg-green-900/50 text-green-300 border-green-800", dot: "bg-green-500" },
  scheduled: { label: "Scheduled", light: "bg-blue-50 text-blue-800 border-blue-200", dark: "bg-blue-900/50 text-blue-300 border-blue-800", dot: "bg-blue-500" },
  paused: { label: "Paused", light: "bg-gray-100 text-gray-700 border-gray-300", dark: "bg-gray-700 text-gray-200 border-gray-600", dot: "bg-gray-400" },
  ended: { label: "Ended", light: "bg-rose-50 text-rose-700 border-rose-200", dark: "bg-rose-900/50 text-rose-300 border-rose-800", dot: "bg-rose-500" },
};

/** Clicks per impression, e.g. "2.4%". */
export const ctr = (ad: Pick<AdvertisementRecord, "impressions" | "clicks">) =>
  ad.impressions > 0 ? `${((ad.clicks / ad.impressions) * 100).toFixed(1)}%` : "—";

export const formatDay = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

/** "1 Nov – 30 Nov 2026", "From 1 Nov 2026", "Until …" or "Always on". */
export function scheduleLabel(ad: Pick<AdvertisementRecord, "startDate" | "endDate">) {
  if (ad.startDate && ad.endDate) return `${formatDay(ad.startDate)} – ${formatDay(ad.endDate)}`;
  if (ad.startDate) return `From ${formatDay(ad.startDate)}`;
  if (ad.endDate) return `Until ${formatDay(ad.endDate)}`;
  return "Always on";
}
