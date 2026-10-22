"use client";
import {
  closeReport,
  getReportsPage,
  takeReport,
  type ReportAction,
  type ReportPageResponse,
  type ReportPagination,
  type ReportPriority,
  type ReportReason,
  type ReportRecord,
  type ReportStats,
  type ReportStatus,
  type ReportStatusFilter,
} from "@/app/actions/reportAction";
import SideDrawer from "@/component/shared/SideDrawer";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { actionBtn, DetailRows, FilterPills, formatDateTime, relativeDays, StatusPill, type Tone } from "@/component/shared/ui";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowRight, FaCheck, FaCheckCircle, FaClock, FaEye, FaFlag, FaHandPaper, FaRedo, FaSearch, FaTimes } from "react-icons/fa";
import { ReportRowsSkeleton } from "./ReportSkeletons";

const PAGE_SIZE = 10;
const TOOLBAR_SELECT = "px-3 py-2.5 rounded-lg border text-sm sm:min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500";

const STATUS: Record<ReportStatus, Tone> = {
  open: { label: "Open", hint: "Nobody has picked it up yet.", dot: "bg-red-500", light: "bg-red-50 text-red-700 border-red-200", dark: "bg-red-900/40 text-red-200 border-red-800" },
  in_review: { label: "In review", hint: "Someone on the team is looking into it.", dot: "bg-blue-500", light: "bg-blue-50 text-blue-700 border-blue-200", dark: "bg-blue-900/40 text-blue-200 border-blue-800" },
  resolved: { label: "Resolved", hint: "Action taken. The reporter can see the note.", dot: "bg-green-500", light: "bg-green-50 text-green-700 border-green-200", dark: "bg-green-900/40 text-green-200 border-green-800" },
  dismissed: { label: "Dismissed", hint: "Checked. Nothing against the rules.", dot: "bg-gray-400", light: "bg-gray-100 text-gray-600 border-gray-200", dark: "bg-gray-700 text-gray-300 border-gray-600" },
};

const PRIORITY: Record<ReportPriority, Tone> = {
  urgent: { label: "Urgent", hint: "Patient safety. Look at it within 1 hour.", dot: "bg-white", light: "bg-red-600 text-white border-red-600", dark: "bg-red-600 text-white border-red-600" },
  high: { label: "High", hint: "Within the same day.", dot: "bg-orange-500", light: "bg-orange-50 text-orange-700 border-orange-200", dark: "bg-orange-900/40 text-orange-200 border-orange-800" },
  normal: { label: "Normal", hint: "Within 2 working days.", dot: "bg-gray-400", light: "bg-gray-100 text-gray-600 border-gray-200", dark: "bg-gray-700 text-gray-300 border-gray-600" },
};

const REASON_LABEL: Record<ReportReason, string> = {
  medical_concern: "Unsafe medical advice",
  off_platform: "Taking patients off GyneClinics",
  no_reply: "Didn't reply",
  behaviour: "Rude or abusive behaviour",
  payment: "Payment problem",
  fake_profile: "Fake or wrong doctor details",
  other: "Something else",
};

const ACTION_LABEL: Record<ReportAction, string> = {
  warned: "Warned the user",
  suspended: "Suspended the account",
  refunded: "Refunded the patient",
  content_removed: "Removed or edited the content",
  no_action: "No action needed",
};

const nameOf = (p: ReportRecord["reporter"]) => p?.fullName || p?.phone || "Account deleted";
const isTodo = (r: ReportRecord) => r.status === "open" || r.status === "in_review";

type Query = { status: ReportStatusFilter; priority: ReportPriority | ""; reason: ReportReason | ""; search: string };

/** Reports from patients and doctors, from the backend: pick one up, act, close with a note. */
const ReportList = ({ initial, now: serverNow }: { initial: ReportPageResponse; now: string }) => {
  const { isDarkMode } = useSidebar();
  const [items, setItems] = useState<ReportRecord[]>(initial.data ?? []);
  const [pagination, setPagination] = useState<ReportPagination>(initial.pagination ?? { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [stats, setStats] = useState<ReportStats | undefined>(initial.stats);
  const [error, setError] = useState(initial.success ? "" : initial.error || "Failed to fetch reports");
  const [now, setNow] = useState(serverNow);
  const [query, setQuery] = useState<Query>({ status: "todo", priority: "", reason: "", search: "" });
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setSelectedId(null), []);
  const [selectedCache, setSelectedCache] = useState<ReportRecord | null>(null);
  // Keep showing a report in the drawer even after it leaves the current filter (e.g. closed from "To do").
  const selected = items.find((r) => r._id === selectedId) ?? (selectedCache?._id === selectedId ? selectedCache : null);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const selectClass = `${TOOLBAR_SELECT} ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`;

  /** Reads a page through the server action, then shows it. `quiet` skips the skeleton (after an action). */
  const load = async (page: number, changes: Partial<Query> = {}, quiet = false) => {
    const next = { ...query, ...changes };
    setQuery(next);
    if (!quiet) setLoading(true);
    const response = await getReportsPage({ ...next, page, limit: PAGE_SIZE });
    setLoading(false);
    setNow(new Date().toISOString());
    if (!response.success) {
      setError(response.error || "Failed to fetch reports");
      return null;
    }
    setError("");
    setItems(response.data ?? []);
    if (response.pagination) setPagination(response.pagination);
    if (response.stats) setStats(response.stats);
    return response.data ?? [];
  };

  /** After an action: refresh the list quietly and keep the drawer on the updated report. */
  const afterChange = async (updated: ReportRecord) => {
    const list = await load(pagination.page, {}, true);
    const fresh = list?.find((r) => r._id === updated._id);
    setSelectedCache(fresh ?? updated);
  };

  const take = async (r: ReportRecord) => {
    setBusyId(r._id);
    const result = await takeReport(r._id);
    if (result.success) {
      toast.success(result.message || "You're now handling this report");
      await afterChange({ ...r, status: "in_review", assignee: r.assignee ?? { _id: "", fullName: "You" } });
    } else toast.error(result.error || "Failed to take the report");
    setBusyId(null);
  };

  const close = async (r: ReportRecord, outcome: "resolved" | "dismissed", action?: Exclude<ReportAction, "no_action">, note?: string) => {
    setBusyId(r._id);
    const result = await closeReport(r._id, outcome, action, note);
    if (result.success) {
      toast.success(result.message || "Report closed");
      // If the closed report leaves the current list, the drawer still shows what was done.
      await afterChange({
        ...r,
        status: outcome,
        resolution: {
          action: outcome === "dismissed" ? "no_action" : action!,
          note: note || "We checked and found nothing against our rules.",
          by: { _id: "", fullName: "You" },
          at: new Date().toISOString(),
        },
      });
    } else toast.error(result.error || "Failed to close the report");
    setBusyId(null);
    return result.success;
  };

  const statCards: StatCard[] = [
    { label: "Open", value: stats?.open ?? 0, sub: `${stats?.urgentOpen ?? 0} urgent still to do`, icon: FaFlag, tone: "red" },
    { label: "In review", value: stats?.in_review ?? 0, sub: "Being looked into", icon: FaHandPaper, tone: "blue" },
    { label: "Closed", value: (stats?.resolved ?? 0) + (stats?.dismissed ?? 0), sub: `${stats?.dismissed ?? 0} dismissed`, icon: FaCheckCircle, tone: "green" },
    {
      label: "Time to close",
      value: stats?.avgHoursToClose === null || stats?.avgHoursToClose === undefined ? "—" : `${stats.avgHoursToClose}h`,
      sub: "Average, from report to answer",
      icon: FaClock,
      tone: "violet",
    },
  ];

  const filtering = query.status !== "todo" || query.priority || query.reason || query.search;

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

      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className={`flex flex-col gap-3 border-b p-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <FilterPills
            value={query.status}
            onChange={(status) => load(1, { status })}
            isDarkMode={isDarkMode}
            options={[
              { value: "todo", label: "To do", count: (stats?.open ?? 0) + (stats?.in_review ?? 0) },
              { value: "open", label: "Open", count: stats?.open },
              { value: "in_review", label: "In review", count: stats?.in_review },
              { value: "resolved", label: "Resolved", count: stats?.resolved },
              { value: "dismissed", label: "Dismissed", count: stats?.dismissed },
              { value: "all", label: "All", count: stats?.total },
            ]}
          />
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                load(1, { search: searchText });
              }}
              className="relative w-full xl:w-[340px]"
            >
              <button type="submit" aria-label="Search" className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <FaSearch size={13} />
              </button>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search details, person or booking"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
                  isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </form>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={query.priority} onChange={(e) => load(1, { priority: e.target.value as ReportPriority | "" })} className={selectClass} aria-label="Priority">
                <option value="">All priorities</option>
                {(Object.keys(PRIORITY) as ReportPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY[p].label}
                  </option>
                ))}
              </select>
              <select value={query.reason} onChange={(e) => load(1, { reason: e.target.value as ReportReason | "" })} className={selectClass} aria-label="Reason">
                <option value="">All reasons</option>
                {(Object.keys(REASON_LABEL) as ReportReason[]).map((r) => (
                  <option key={r} value={r}>
                    {REASON_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" aria-busy={loading}>
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                {["Report", "Priority", "From → About", "Opened", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <ReportRowsSkeleton rows={Math.min(PAGE_SIZE, Math.max(3, items.length))} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <FaFlag className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <p className="font-medium">{!filtering ? "All reports are handled" : "No reports match"}</p>
                    <p className={`mt-1 text-sm ${muted}`}>Patients report a doctor from the doctor&apos;s profile in the app.</p>
                  </td>
                </tr>
              ) : (
                items.map((r) => {
                  const busy = busyId === r._id;
                  return (
                    <tr
                      key={r._id}
                      className={`transition-opacity ${busy ? "opacity-50" : ""} ${r.priority === "urgent" && isTodo(r) ? (isDarkMode ? "bg-red-900/10" : "bg-red-50/50") : ""} ${
                        isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => setSelectedId(r._id)} className="text-left text-sm font-medium hover:underline">
                          {REASON_LABEL[r.reason]}
                        </button>
                        <p className={`max-w-[280px] truncate text-xs ${muted}`}>{r.details}</p>
                        {r.consultation && <p className={`font-mono text-[11px] ${muted}`}>{r.consultation.reference}</p>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusPill tone={PRIORITY[r.priority]} isDarkMode={isDarkMode} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1.5">
                          {nameOf(r.reporter)} <FaArrowRight size={9} className={muted} /> <span className="font-medium">{nameOf(r.against)}</span>
                        </div>
                        <div className={`text-xs capitalize ${muted}`}>
                          {r.reporterRole} → {r.againstRole}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        {formatDateTime(r.createdAt)}
                        <div className={`text-xs ${muted}`}>{relativeDays(r.createdAt, now)}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusPill tone={STATUS[r.status]} isDarkMode={isDarkMode} />
                        <div className={`mt-1 text-xs ${muted}`}>{r.assignee?.fullName ?? "Nobody yet"}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === "open" && (
                            <button type="button" disabled={busy} onClick={() => take(r)} className={actionBtn("indigo", isDarkMode)} title="I'll handle it">
                              <FaHandPaper size={12} />
                            </button>
                          )}
                          <button type="button" onClick={() => setSelectedId(r._id)} className={actionBtn("blue", isDarkMode)} title="Open report">
                            <FaEye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={pagination.page}
          pages={pagination.pages}
          limit={pagination.limit}
          total={pagination.total}
          itemLabel="reports"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => load(page)}
        />
      </div>

      <ReportDrawer report={selected} busy={busyId === selected?._id} now={now} isDarkMode={isDarkMode} onClose={closeDrawer} onTake={take} onFinish={close} />
    </div>
  );
};

interface ReportDrawerProps {
  report: ReportRecord | null;
  busy: boolean;
  now: string;
  isDarkMode: boolean;
  onClose: () => void;
  onTake: (r: ReportRecord) => Promise<void>;
  onFinish: (r: ReportRecord, outcome: "resolved" | "dismissed", action?: Exclude<ReportAction, "no_action">, note?: string) => Promise<boolean>;
}

function ReportDrawer({ report: r, busy, now, isDarkMode, onClose, onTake, onFinish }: ReportDrawerProps) {
  const [action, setAction] = useState<Exclude<ReportAction, "no_action">>("warned");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const box = `rounded-xl border p-4 ${isDarkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`;
  const input = `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-300 bg-white"
  }`;
  const personLink = (p: ReportRecord["reporter"], role: "patient" | "doctor", doctorProfile?: string) => {
    const href = role === "doctor" ? (doctorProfile ? `/doctors/${doctorProfile}` : null) : p ? `/patient/${p._id}` : null;
    const label = (
      <>
        {nameOf(p)} <span className={`capitalize ${muted}`}>({role})</span>
      </>
    );
    return href ? (
      <Link href={href} className="text-blue-600 hover:underline">
        {label}
      </Link>
    ) : (
      label
    );
  };

  const resolve = async (outcome: "resolved" | "dismissed") => {
    if (!r) return;
    setTried(true);
    if (outcome === "resolved" && !note.trim()) return;
    const ok = await onFinish(r, outcome, outcome === "resolved" ? action : undefined, note.trim() || undefined);
    if (ok) {
      setNote("");
      setTried(false);
    }
  };

  return (
    <SideDrawer open={Boolean(r)} title={r ? REASON_LABEL[r.reason] : "Report"} subtitle={r ? `Reported ${formatDateTime(r.createdAt)}` : undefined} isDarkMode={isDarkMode} onClose={onClose}>
      {r && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={PRIORITY[r.priority]} isDarkMode={isDarkMode} />
            <StatusPill tone={STATUS[r.status]} isDarkMode={isDarkMode} />
            <span className={`text-xs ${muted}`}>{isTodo(r) ? PRIORITY[r.priority].hint : STATUS[r.status].hint}</span>
          </div>

          <section>
            <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${muted}`}>What they said</h3>
            <p className="whitespace-pre-line text-[15px] leading-7">{r.details}</p>
          </section>

          <section className={box}>
            <DetailRows
              isDarkMode={isDarkMode}
              rows={[
                ["Reported by", personLink(r.reporter, r.reporterRole)],
                ["About", personLink(r.against, r.againstRole, r.againstDoctor)],
                ["Consultation", r.consultation ? <span key="c" className="font-mono">{r.consultation.reference}</span> : "None found"],
                ["Opened", `${formatDateTime(r.createdAt)} · ${relativeDays(r.createdAt, now)}`],
                ["Handled by", r.assignee?.fullName ?? "Nobody yet"],
              ]}
            />
          </section>

          {r.resolution ? (
            <section className={`rounded-xl border p-4 text-sm ${isDarkMode ? "border-green-800 bg-green-900/20" : "border-green-200 bg-green-50"}`}>
              <p className="font-medium">{ACTION_LABEL[r.resolution.action]}</p>
              <p className="mt-1 whitespace-pre-line">{r.resolution.note}</p>
              <p className={`mt-2 text-xs ${muted}`}>
                {r.resolution.by?.fullName ?? "Team"} · {formatDateTime(r.resolution.at)}
              </p>
            </section>
          ) : (
            <section className="space-y-3">
              {r.status === "open" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onTake(r)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800 disabled:opacity-50"
                >
                  <FaHandPaper size={12} /> I&apos;ll handle it
                </button>
              )}
              <div className={`space-y-2 rounded-lg border p-3 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <label htmlFor="report-action" className={`block text-xs font-medium ${muted}`}>
                  What did you do?
                </label>
                <select id="report-action" value={action} onChange={(e) => setAction(e.target.value as Exclude<ReportAction, "no_action">)} className={input}>
                  {(Object.keys(ACTION_LABEL) as ReportAction[])
                    .filter((a): a is Exclude<ReportAction, "no_action"> => a !== "no_action")
                    .map((a) => (
                      <option key={a} value={a}>
                        {ACTION_LABEL[a]}
                      </option>
                    ))}
                </select>
                <textarea
                  rows={3}
                  value={note}
                  maxLength={1000}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note for the reporter, e.g. We refunded you in full and spoke to the doctor."
                  className={`${input} resize-y`}
                  aria-label="Note"
                />
                {tried && !note.trim() && <p className="text-xs text-red-500">Write what you did, so the reporter can be told</p>}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => resolve("resolved")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <FaCheck size={12} /> Resolve
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => resolve("dismissed")}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
                  isDarkMode ? "border-gray-700 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FaTimes size={12} /> Dismiss: nothing against the rules
              </button>
            </section>
          )}
        </div>
      )}
    </SideDrawer>
  );
}

export default ReportList;
