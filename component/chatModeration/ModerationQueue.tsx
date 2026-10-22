"use client";
import {
  getFlagsPage,
  setFlagStatus,
  type FlagDecision,
  type FlagKind,
  type FlagPageResponse,
  type FlagPagination,
  type FlagRecord,
  type FlagStats,
  type FlagStatus,
} from "@/app/actions/moderationAction";
import { FlagCardsSkeleton } from "@/component/chatMonitoring/ChatSkeletons";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { FilterPills, formatDateTime, initials, relativeDays, StatusPill, type Tone } from "@/component/shared/ui";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import type { IconType } from "react-icons";
import {
  FaAmbulance,
  FaAt,
  FaBan,
  FaCheck,
  FaCommentDots,
  FaExclamationTriangle,
  FaHashtag,
  FaLink,
  FaPhoneAlt,
  FaRedo,
  FaShieldAlt,
  FaUserSlash,
} from "react-icons/fa";

const PAGE_SIZE = 8;
const TOOLBAR_SELECT = "px-3 py-2.5 rounded-lg border text-sm sm:min-w-44 focus:outline-none focus:ring-2 focus:ring-blue-500";

const KIND: Record<FlagKind, { label: string; rule: string; icon: IconType; light: string; dark: string }> = {
  phone: { label: "Phone number", rule: "Blocked. Never reaches the other person.", icon: FaPhoneAlt, light: "bg-sky-100 text-sky-700", dark: "bg-sky-900/60 text-sky-300" },
  email: { label: "Email address", rule: "Blocked. Never reaches the other person.", icon: FaAt, light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-900/60 text-indigo-300" },
  link: { label: "Link or website", rule: "Blocked. Never reaches the other person.", icon: FaLink, light: "bg-violet-100 text-violet-700", dark: "bg-violet-900/60 text-violet-300" },
  social: { label: "Social or WhatsApp", rule: "Blocked. Never reaches the other person.", icon: FaHashtag, light: "bg-fuchsia-100 text-fuchsia-700", dark: "bg-fuchsia-900/60 text-fuchsia-300" },
  abuse: { label: "Abusive language", rule: "Delivered, then flagged for the team.", icon: FaExclamationTriangle, light: "bg-orange-100 text-orange-700", dark: "bg-orange-900/60 text-orange-300" },
  urgent_health: { label: "Urgent health words", rule: "Delivered, and flagged so the team can check the doctor is on it.", icon: FaAmbulance, light: "bg-red-100 text-red-700", dark: "bg-red-900/60 text-red-300" },
};

const STATUS: Record<FlagStatus, Tone> = {
  new: { label: "New", hint: "", dot: "bg-amber-500", light: "bg-amber-50 text-amber-700 border-amber-200", dark: "bg-amber-900/40 text-amber-200 border-amber-800" },
  allowed: { label: "False alarm", hint: "", dot: "bg-gray-400", light: "bg-gray-100 text-gray-600 border-gray-200", dark: "bg-gray-700 text-gray-300 border-gray-600" },
  warned: { label: "Warned", hint: "", dot: "bg-orange-500", light: "bg-orange-50 text-orange-700 border-orange-200", dark: "bg-orange-900/40 text-orange-200 border-orange-800" },
  suspended: { label: "Suspended", hint: "", dot: "bg-red-500", light: "bg-red-50 text-red-700 border-red-200", dark: "bg-red-900/40 text-red-200 border-red-800" },
  escalated: { label: "Sent to clinical lead", hint: "", dot: "bg-blue-500", light: "bg-blue-50 text-blue-700 border-blue-200", dark: "bg-blue-900/40 text-blue-200 border-blue-800" },
};

const nameOf = (p: FlagRecord["sender"]) => p?.fullName || p?.phone || "Account deleted";

/** What the chat safety filter caught, from the backend: check each one, then allow, warn or suspend. */
const ModerationQueue = ({ initial, now: serverNow }: { initial: FlagPageResponse; now: string }) => {
  const { isDarkMode } = useSidebar();
  const [items, setItems] = useState<FlagRecord[]>(initial.data ?? []);
  const [pagination, setPagination] = useState<FlagPagination>(initial.pagination ?? { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [stats, setStats] = useState<FlagStats | undefined>(initial.stats);
  const [error, setError] = useState(initial.success ? "" : initial.error || "Failed to fetch flagged messages");
  const [now, setNow] = useState(serverNow);
  const [query, setQuery] = useState<{ status: FlagStatus | "all"; kind: FlagKind | "" }>({ status: "new", kind: "" });
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-2xl border p-5 shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const selectClass = `${TOOLBAR_SELECT} ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`;

  /** Reads a page through the server action. `quiet` skips the skeleton (after a decision). */
  const load = async (page: number, changes: Partial<typeof query> = {}, quiet = false) => {
    const next = { ...query, ...changes };
    setQuery(next);
    if (!quiet) setLoading(true);
    const response = await getFlagsPage({ ...next, page, limit: PAGE_SIZE });
    setLoading(false);
    setNow(new Date().toISOString());
    if (!response.success) {
      setError(response.error || "Failed to fetch flagged messages");
      return;
    }
    setError("");
    setItems(response.data ?? []);
    if (response.pagination) setPagination(response.pagination);
    if (response.stats) setStats(response.stats);
  };

  const decide = async (f: FlagRecord, status: FlagDecision) => {
    setBusyId(f._id);
    const result = await setFlagStatus(f._id, status);
    if (result.success) {
      toast.success(status === "suspended" ? `${nameOf(f.sender)} suspended` : result.message || "Updated");
      // Stay on this page unless it emptied out.
      await load(items.length === 1 && pagination.page > 1 && query.status !== "all" ? pagination.page - 1 : pagination.page, {}, true);
    } else toast.error(result.error || "Failed to update");
    setBusyId(null);
  };

  const last30 = stats?.last30Days;
  const kindCounts = (Object.keys(KIND) as FlagKind[]).map((k) => ({ kind: k, count: last30?.[k] ?? 0 }));
  const maxKind = Math.max(1, ...kindCounts.map((k) => k.count));

  const statCards: StatCard[] = [
    { label: "To check", value: stats?.new ?? 0, sub: `${stats?.newUrgent ?? 0} urgent health`, icon: FaShieldAlt, tone: "amber" },
    { label: "Blocked messages", value: last30?.blocked ?? 0, sub: "Contact details stopped, last 30 days", icon: FaBan, tone: "indigo" },
    { label: "Urgent health alerts", value: last30?.urgent_health ?? 0, sub: "Last 30 days", icon: FaAmbulance, tone: "red" },
    { label: "Accounts warned", value: (stats?.warned ?? 0) + (stats?.suspended ?? 0), sub: `${stats?.suspended ?? 0} suspended`, icon: FaUserSlash, tone: "slate" },
  ];

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      <StatCards cards={statCards} isDarkMode={isDarkMode} />

      {error && (
        <div
          role="alert"
          className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            isDarkMode ? "border-red-800 bg-red-900/30 text-red-200" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {error}
          <button type="button" onClick={() => load(pagination.page)} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
            <FaRedo size={10} /> Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className={`${card} h-fit xl:sticky xl:top-20`}>
          <h2 className="font-semibold">What the filter catches</h2>
          <p className={`mb-4 text-sm ${muted}`}>Patients and doctors must keep talking inside GyneClinics. Last 30 days. Click to filter.</p>
          <ul className="space-y-3">
            {kindCounts.map(({ kind: k, count }) => {
              const meta = KIND[k];
              return (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => load(1, { kind: query.kind === k ? "" : k })}
                    className={`flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors ${
                      query.kind === k ? (isDarkMode ? "bg-gray-700" : "bg-gray-100") : isDarkMode ? "hover:bg-gray-700/60" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isDarkMode ? meta.dark : meta.light}`}>
                      <meta.icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 text-sm font-medium">
                        {meta.label} <span className="tabular-nums">{count}</span>
                      </span>
                      <span className={`mt-1 block h-1.5 overflow-hidden rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                        <span className={`block h-full rounded-full ${isDarkMode ? "bg-gray-300" : "bg-gray-800"}`} style={{ width: `${(count / maxKind) * 100}%` }} />
                      </span>
                      <span className={`mt-1 block text-xs ${muted}`}>{meta.rule}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="xl:col-span-2">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterPills
              value={query.status}
              onChange={(status) => load(1, { status })}
              isDarkMode={isDarkMode}
              options={[
                { value: "new", label: "To check", count: stats?.new },
                { value: "warned", label: "Warned", count: stats?.warned },
                { value: "suspended", label: "Suspended", count: stats?.suspended },
                { value: "escalated", label: "Clinical lead", count: stats?.escalated },
                { value: "allowed", label: "False alarm", count: stats?.allowed },
                { value: "all", label: "All", count: stats?.total },
              ]}
            />
            <select value={query.kind} onChange={(e) => load(1, { kind: e.target.value as FlagKind | "" })} className={selectClass} aria-label="Type">
              <option value="">Everything caught</option>
              {(Object.keys(KIND) as FlagKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND[k].label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <FlagCardsSkeleton cards={Math.min(PAGE_SIZE, Math.max(2, items.length))} />
          ) : items.length === 0 ? (
            <div className={`${card} py-14 text-center`}>
              <FaShieldAlt className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
              <p className="font-medium">{query.status === "new" ? "Nothing to check" : "Nothing here"}</p>
              <p className={`mt-1 text-sm ${muted}`}>New catches from the chat filter show up here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((f) => (
                <FlagCard key={f._id} f={f} now={now} busy={busyId === f._id} isDarkMode={isDarkMode} onDecide={decide} />
              ))}
            </ul>
          )}
          {pagination.total > 0 && (
            <div className={`mt-3 overflow-hidden rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <TablePagination
                page={pagination.page}
                pages={pagination.pages}
                limit={pagination.limit}
                total={pagination.total}
                itemLabel="messages"
                isDarkMode={isDarkMode}
                disabled={loading}
                onPageChange={(page) => load(page)}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/** One caught message, with the matched words highlighted, the chat before it, and the actions. */
function FlagCard({ f, now, busy, isDarkMode, onDecide }: { f: FlagRecord; now: string; busy: boolean; isDarkMode: boolean; onDecide: (f: FlagRecord, s: FlagDecision) => void }) {
  const meta = KIND[f.kind];
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const i = f.text.toLowerCase().indexOf(f.match.toLowerCase());
  const [before, match, after] = i >= 0 ? [f.text.slice(0, i), f.text.slice(i, i + f.match.length), f.text.slice(i + f.match.length)] : [f.text, "", ""];
  const urgent = f.kind === "urgent_health";
  const btn = "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50";
  const plain = isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200";
  const recipientRole = f.senderRole === "patient" ? "doctor" : "patient";

  return (
    <li
      className={`rounded-2xl border p-4 shadow-sm transition-opacity ${busy ? "opacity-50" : ""} ${
        urgent && f.status === "new" ? (isDarkMode ? "border-red-800 bg-red-950/30" : "border-red-200 bg-red-50/60") : isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${isDarkMode ? meta.dark : meta.light}`}>
          <meta.icon size={10} /> {meta.label}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
          {f.outcome === "blocked" ? "Blocked, not delivered" : "Delivered, flagged"}
        </span>
        <StatusPill tone={STATUS[f.status]} isDarkMode={isDarkMode} />
        <span className={`ml-auto text-xs ${muted}`}>
          {formatDateTime(f.createdAt)} · {relativeDays(f.createdAt, now)}
        </span>
      </div>

      {f.context.length > 0 && (
        <div className={`mt-3 space-y-1 border-l-2 pl-3 text-xs ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${muted}`}>
          {f.context.map((m) => (
            <p key={m._id} className="truncate">
              <span className="font-medium capitalize">{m.senderRole}:</span> {m.text}
            </p>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-3">
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
          {initials(nameOf(f.sender))}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            {f.sender && f.senderRole === "patient" ? (
              <Link href={`/patient/${f.sender._id}`} className="font-medium hover:underline">
                {nameOf(f.sender)}
              </Link>
            ) : (
              <span className="font-medium">{nameOf(f.sender)}</span>
            )}{" "}
            <span className={`capitalize ${muted}`}>({f.senderRole})</span>
            <span className={muted}>
              {" "}
              to {nameOf(f.recipient)} ({recipientRole})
            </span>
            {f.previousFlags > 0 && !urgent && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${isDarkMode ? "bg-red-900/60 text-red-200" : "bg-red-100 text-red-700"}`}>
                Caught {f.previousFlags} time{f.previousFlags === 1 ? "" : "s"} before
              </span>
            )}
            {f.sender && f.sender.isActive === false && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}>Account suspended</span>
            )}
          </p>
          <p className={`mt-1.5 whitespace-pre-wrap rounded-2xl rounded-tl-sm px-3 py-2 text-sm ${isDarkMode ? "bg-gray-900/60" : "bg-gray-50"}`}>
            {before}
            {match && <mark className={`rounded px-0.5 ${isDarkMode ? "bg-amber-500/40 text-amber-100" : "bg-amber-200 text-amber-900"}`}>{match}</mark>}
            {after}
          </p>
          <p className={`mt-1 text-xs ${muted}`}>
            {meta.rule}
            {f.handledBy && ` · ${STATUS[f.status].label} by ${f.handledBy.fullName ?? "the team"}${f.handledAt ? `, ${formatDateTime(f.handledAt)}` : ""}`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 sm:pl-12">
        {f.status === "new" &&
          (urgent ? (
            <>
              <button type="button" disabled={busy} onClick={() => onDecide(f, "escalated")} className={`${btn} bg-red-600 text-white hover:bg-red-700`}>
                <FaAmbulance size={11} /> Send to clinical lead
              </button>
              <button type="button" disabled={busy} onClick={() => onDecide(f, "allowed")} className={`${btn} ${plain}`}>
                <FaCheck size={10} /> Doctor is handling it
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={busy} onClick={() => onDecide(f, "allowed")} className={`${btn} ${plain}`}>
                <FaCheck size={10} /> False alarm
              </button>
              <button type="button" disabled={busy} onClick={() => onDecide(f, "warned")} className={`${btn} bg-amber-500 text-white hover:bg-amber-600`}>
                <FaExclamationTriangle size={10} /> Mark as warned
              </button>
              <button
                type="button"
                disabled={busy || f.sender?.isActive === false}
                onClick={() => onDecide(f, "suspended")}
                className={`${btn} bg-red-600 text-white hover:bg-red-700`}
                title="Blocks their account: they can't sign in until someone unsuspends them"
              >
                <FaUserSlash size={11} /> Suspend {f.senderRole}
              </button>
            </>
          ))}
        <Link href={`/chat-monitoring?chat=${f.chat}`} className={`${btn} bg-black text-white ring-1 ring-white/20 hover:bg-gray-800`}>
          <FaCommentDots size={11} /> Open chat
        </Link>
      </div>
    </li>
  );
}

export default ModerationQueue;
