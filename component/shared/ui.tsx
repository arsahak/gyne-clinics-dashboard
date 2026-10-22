"use client";
import { FaFlask, FaStar } from "react-icons/fa";

// Small pieces shared by the dashboard's list and detail pages.

/** Colours and wording for one status value. */
export type Tone = { label: string; hint: string; dot: string; light: string; dark: string };

export function StatusPill({ tone, isDarkMode }: { tone: Tone; isDarkMode: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${isDarkMode ? tone.dark : tone.light}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} /> {tone.label}
    </span>
  );
}

/** Says the numbers on the page are examples until payments go live. */
export function SampleDataNote({ isDarkMode, children }: { isDarkMode: boolean; children?: React.ReactNode }) {
  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        isDarkMode ? "border-indigo-800 bg-indigo-950/40 text-indigo-200" : "border-indigo-200 bg-indigo-50 text-indigo-800"
      }`}
    >
      <FaFlask className="mt-0.5 shrink-0" />
      <p>
        <span className="font-semibold">Sample data.</span>{" "}
        {children ?? "This page shows example numbers so you can see the design. Real payments will appear here once payments are connected."}
      </p>
    </div>
  );
}

// Fixed time zone so the server and the browser print the same text.
const TZ = "Europe/London";

export const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }) : "—";

export const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: TZ })
    : "—";

// Calendar day in London as a UTC midnight timestamp, so day differences are whole days.
const londonDay = (value: string) => {
  const [d, m, y] = new Date(value).toLocaleDateString("en-GB", { timeZone: TZ }).split("/").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** "tomorrow" / "in 3 days" / "2 days ago" by calendar day, from a fixed `now` passed by the server. */
export function relativeDays(value: string, now: string) {
  const days = Math.round((londonDay(value) - londonDay(now)) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

export const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** 1–5 stars, filled up to `rating` (rounded). */
export function Stars({ rating, size = 12, isDarkMode }: { rating: number; size?: number; isDarkMode: boolean }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar key={n} size={size} className={n <= full ? "text-amber-400" : isDarkMode ? "text-gray-600" : "text-gray-200"} />
      ))}
    </span>
  );
}

/** Small colourful square icon button used in table rows. */
export const ACTION_BTN = "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50";
export const ACTION_TONES = {
  blue: ["bg-blue-50 text-blue-600 hover:bg-blue-100", "bg-blue-900/60 text-blue-300 hover:bg-blue-900"],
  green: ["bg-green-50 text-green-600 hover:bg-green-100", "bg-green-900/60 text-green-300 hover:bg-green-900"],
  amber: ["bg-amber-50 text-amber-600 hover:bg-amber-100", "bg-amber-900/60 text-amber-300 hover:bg-amber-900"],
  rose: ["bg-rose-50 text-rose-600 hover:bg-rose-100", "bg-rose-900/60 text-rose-300 hover:bg-rose-900"],
  indigo: ["bg-indigo-50 text-indigo-600 hover:bg-indigo-100", "bg-indigo-900/60 text-indigo-300 hover:bg-indigo-900"],
  slate: ["bg-gray-100 text-gray-600 hover:bg-gray-200", "bg-gray-700 text-gray-300 hover:bg-gray-600"],
} as const;
export const actionBtn = (tone: keyof typeof ACTION_TONES, isDarkMode: boolean) => `${ACTION_BTN} ${ACTION_TONES[tone][isDarkMode ? 1 : 0]}`;

/** Pill-shaped filter button row (black when selected). */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  isDarkMode,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  isDarkMode: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === o.value
              ? "bg-black text-white ring-1 ring-white/20"
              : isDarkMode
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={`rounded-full px-1.5 text-[11px] ${value === o.value ? "bg-white/20" : isDarkMode ? "bg-gray-600" : "bg-white"}`}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Label / value rows inside a detail panel. */
export function DetailRows({ rows, isDarkMode }: { rows: [string, React.ReactNode][]; isDarkMode: boolean }) {
  return (
    <dl className="space-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className={isDarkMode ? "text-gray-400" : "text-gray-500"}>{label}</dt>
          <dd className="text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
