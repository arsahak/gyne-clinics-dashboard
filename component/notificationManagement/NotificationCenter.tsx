"use client";
import {
  cancelAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementsPage,
  getAudience,
  type AnnouncementPageResponse,
  type AnnouncementPagination,
  type AnnouncementRecord,
  type AnnouncementStats,
  type AnnouncementStatus,
  type AudienceCounts,
  type AutoMessage,
  type NewAnnouncement,
} from "@/app/actions/notificationAction";
import { MoneyRowsSkeleton } from "@/component/financeManagement/FinanceSkeletons";
import SideDrawer from "@/component/shared/SideDrawer";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { actionBtn, DetailRows, FilterPills, formatDateTime, relativeDays, StatusPill, type Tone } from "@/component/shared/ui";
import { useSidebar } from "@/lib/SidebarContext";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FaBullhorn, FaCalendarAlt, FaCopy, FaEnvelopeOpen, FaEye, FaPaperPlane, FaRedo, FaTimes, FaTrashAlt, FaUsers } from "react-icons/fa";
import AnnouncementComposer, { AUDIENCE_LABEL, CHANNELS, EMPTY_DRAFT, linkLabel, REGION_NAMES, type ComposerDraft } from "./AnnouncementComposer";
import AutoMessageList from "./AutoMessageList";

const PAGE_SIZE = 8;

const STATUS: Record<AnnouncementStatus, Tone> = {
  sent: { label: "Sent", hint: "", dot: "bg-green-500", light: "bg-green-50 text-green-700 border-green-200", dark: "bg-green-900/40 text-green-200 border-green-800" },
  scheduled: { label: "Scheduled", hint: "", dot: "bg-blue-500", light: "bg-blue-50 text-blue-700 border-blue-200", dark: "bg-blue-900/40 text-blue-200 border-blue-800" },
  draft: { label: "Draft", hint: "", dot: "bg-amber-500", light: "bg-amber-50 text-amber-700 border-amber-200", dark: "bg-amber-900/40 text-amber-200 border-amber-800" },
  cancelled: { label: "Cancelled", hint: "", dot: "bg-gray-400", light: "bg-gray-100 text-gray-600 border-gray-200", dark: "bg-gray-700 text-gray-300 border-gray-600" },
};

const whenOf = (a: AnnouncementRecord) => a.sentAt ?? a.scheduledAt ?? a.createdAt;
const pct = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${Math.round(n * 100)}%`);

interface NotificationCenterProps {
  initial: AnnouncementPageResponse;
  audience: AudienceCounts | null;
  autoMessages: AutoMessage[];
  autoError?: string;
  smsPaused: boolean;
  now: string;
}

/** Announcements to patients and doctors, plus the messages the app sends by itself — all from the backend. */
const NotificationCenter = ({ initial, audience: initialAudience, autoMessages, autoError, smsPaused, now: serverNow }: NotificationCenterProps) => {
  const { isDarkMode } = useSidebar();
  const [items, setItems] = useState<AnnouncementRecord[]>(initial.data ?? []);
  const [pagination, setPagination] = useState<AnnouncementPagination>(initial.pagination ?? { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [stats, setStats] = useState<AnnouncementStats | undefined>(initial.stats);
  const [audience, setAudience] = useState(initialAudience);
  const [error, setError] = useState(initial.success ? "" : initial.error || "Failed to fetch announcements");
  const [now, setNow] = useState(serverNow);
  const [tab, setTab] = useState<"announcements" | "automatic">("announcements");
  const [filter, setFilter] = useState<AnnouncementStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ComposerDraft>(EMPTY_DRAFT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setSelectedId(null), []);
  const selected = items.find((a) => a._id === selectedId) ?? null;

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";

  /** Reads a page through the server action. `quiet` skips the skeleton. */
  const load = async (page: number, status = filter, quiet = false) => {
    setFilter(status);
    if (!quiet) setLoading(true);
    const response = await getAnnouncementsPage({ status, page, limit: PAGE_SIZE });
    setLoading(false);
    setNow(new Date().toISOString());
    if (!response.success) {
      setError(response.error || "Failed to fetch announcements");
      return;
    }
    setError("");
    setItems(response.data ?? []);
    if (response.pagination) setPagination(response.pagination);
    if (response.stats) setStats(response.stats);
  };

  const submit = async (input: NewAnnouncement) => {
    const result = await createAnnouncement(input);
    if (!result.success) {
      toast.error(result.error || "Failed to save");
      return false;
    }
    toast.success(result.message || "Saved");
    setDraft(EMPTY_DRAFT);
    await load(1, "all", true);
    const fresh = await getAudience();
    if (fresh.success && fresh.data) setAudience(fresh.data);
    return true;
  };

  const reuse = (a: AnnouncementRecord) => {
    setDraft({
      title: a.title,
      body: a.body,
      audience: a.audience,
      region: a.region ?? "",
      channels: a.channels,
      link: a.link ?? "",
      fromDraft: a.status === "draft" ? a._id : undefined,
    });
    setSelectedId(null);
    setTab("announcements");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(a.status === "draft" ? "Draft opened in the form" : "Copied into the form");
  };

  const run = async (a: AnnouncementRecord, action: () => Promise<{ success: boolean; message?: string; error?: string }>) => {
    setBusyId(a._id);
    const result = await action();
    if (result.success) {
      toast.success(result.message || "Done");
      await load(pagination.page, filter, true);
    } else toast.error(result.error || "Failed");
    setBusyId(null);
  };

  const statCards: StatCard[] = [
    { label: "Sent in 30 days", value: stats?.sent30d ?? 0, sub: "Announcements", icon: FaPaperPlane, tone: "blue" },
    { label: "People reached", value: (stats?.reach30d ?? 0).toLocaleString("en-GB"), sub: "Across those announcements", icon: FaUsers, tone: "teal" },
    { label: "Opened", value: pct(stats?.openRate30d), sub: "Of people who got one", icon: FaEnvelopeOpen, tone: "violet" },
    { label: "Scheduled", value: stats?.scheduled ?? 0, sub: `${stats?.drafts ?? 0} draft${stats?.drafts === 1 ? "" : "s"}`, icon: FaCalendarAlt, tone: "amber" },
  ];

  const tabBtn = (value: typeof tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
        tab === value ? (isDarkMode ? "border-white text-white" : "border-black text-black") : `border-transparent ${muted} hover:text-current`
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      <StatCards cards={statCards} isDarkMode={isDarkMode} />

      <div className={`mb-6 flex gap-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        {tabBtn("announcements", "Announcements")}
        {tabBtn("automatic", "Automatic messages")}
      </div>

      {tab === "automatic" ? (
        <AutoMessageList initialMessages={autoMessages} error={autoError} smsPaused={smsPaused} isDarkMode={isDarkMode} />
      ) : (
        <>
          <AnnouncementComposer draft={draft} onDraft={setDraft} counts={audience} smsPaused={smsPaused} isDarkMode={isDarkMode} onSubmit={submit} />

          {error && (
            <div
              role="alert"
              className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                isDarkMode ? "border-red-800 bg-red-900/30 text-red-200" : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {error}
              <button type="button" onClick={() => load(pagination.page)} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                <FaRedo size={10} /> Try again
              </button>
            </div>
          )}

          <div className={`mt-6 rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className={`flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h2 className="font-semibold">Sent and planned</h2>
              <FilterPills
                value={filter}
                onChange={(s) => load(1, s)}
                isDarkMode={isDarkMode}
                options={[
                  { value: "all", label: "All", count: stats?.total },
                  { value: "sent", label: "Sent", count: stats?.sent },
                  { value: "scheduled", label: "Scheduled", count: stats?.scheduled },
                  { value: "draft", label: "Drafts", count: stats?.drafts },
                  { value: "cancelled", label: "Cancelled", count: stats?.cancelled },
                ]}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" aria-busy={loading}>
                <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    {["Announcement", "To", "Sent by", "When", "Reach", "Opened", "Status"].map((h) => (
                      <th key={h} className={`px-5 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap ${h === "Reach" || h === "Opened" ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {loading ? (
                    <MoneyRowsSkeleton cols={8} rows={Math.min(PAGE_SIZE, Math.max(3, items.length))} />
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-14 text-center">
                        <FaBullhorn className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                        <p className="font-medium">{filter === "all" ? "No announcements yet" : "Nothing here"}</p>
                        <p className={`mt-1 text-sm ${muted}`}>Write one above to send or schedule it.</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((a) => {
                      const busy = busyId === a._id;
                      return (
                        <tr key={a._id} className={`transition-opacity ${busy ? "opacity-50" : ""} ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                          <td className="px-5 py-4">
                            <button type="button" onClick={() => setSelectedId(a._id)} className="text-left text-sm font-medium hover:underline">
                              {a.title}
                            </button>
                            <p className={`max-w-xs truncate text-xs ${muted}`}>{a.body || "No message yet"}</p>
                            <div className="mt-1 flex gap-1.5">
                              {a.channels.map((c) => {
                                const Icon = CHANNELS[c].icon;
                                return (
                                  <span key={c} title={CHANNELS[c].label} className={muted}>
                                    <Icon size={11} />
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm">
                            {AUDIENCE_LABEL[a.audience]}
                            {a.region && <div className={`text-xs ${muted}`}>{REGION_NAMES[a.region]}</div>}
                          </td>
                          <td className={`px-5 py-4 whitespace-nowrap text-sm ${muted}`}>{a.createdBy?.fullName ?? "Team"}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm">
                            {a.status === "draft" ? <span className={muted}>Not sent</span> : formatDateTime(whenOf(a))}
                            {a.status !== "draft" && <div className={`text-xs ${muted}`}>{relativeDays(whenOf(a), now)}</div>}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm tabular-nums">{a.status === "sent" ? a.reach.toLocaleString("en-GB") : <span className={muted}>—</span>}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm tabular-nums">{a.status === "sent" ? pct(a.openRate) : <span className={muted}>—</span>}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <StatusPill tone={STATUS[a.status]} isDarkMode={isDarkMode} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => reuse(a)} className={actionBtn("indigo", isDarkMode)} title={a.status === "draft" ? "Open draft" : "Send again (copy)"}>
                                <FaCopy size={12} />
                              </button>
                              {a.status === "scheduled" && (
                                <button type="button" disabled={busy} onClick={() => run(a, () => cancelAnnouncement(a._id))} className={actionBtn("amber", isDarkMode)} title="Cancel">
                                  <FaTimes size={12} />
                                </button>
                              )}
                              {(a.status === "draft" || a.status === "cancelled") && (
                                <button type="button" disabled={busy} onClick={() => run(a, () => deleteAnnouncement(a._id))} className={actionBtn("rose", isDarkMode)} title="Delete">
                                  <FaTrashAlt size={12} />
                                </button>
                              )}
                              <button type="button" onClick={() => setSelectedId(a._id)} className={actionBtn("blue", isDarkMode)} title="View">
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
              itemLabel="announcements"
              isDarkMode={isDarkMode}
              disabled={loading}
              onPageChange={(page) => load(page)}
            />
          </div>
        </>
      )}

      <SideDrawer
        open={Boolean(selected)}
        title={selected?.title ?? "Announcement"}
        subtitle={selected ? `${AUDIENCE_LABEL[selected.audience]}${selected.region ? ` · ${REGION_NAMES[selected.region]}` : ""}` : undefined}
        isDarkMode={isDarkMode}
        onClose={closeDrawer}
        footer={
          selected && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => reuse(selected)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800"
              >
                <FaCopy size={12} /> {selected.status === "draft" ? "Open in the form" : "Send again"}
              </button>
              {selected.status === "scheduled" && (
                <button
                  type="button"
                  onClick={() => run(selected, () => cancelAnnouncement(selected._id))}
                  className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  <FaTimes size={12} /> Cancel
                </button>
              )}
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <StatusPill tone={STATUS[selected.status]} isDarkMode={isDarkMode} />
            <section className={`rounded-xl border p-4 ${isDarkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`}>
              <p className="font-semibold">{selected.title}</p>
              <p className="mt-1 text-sm leading-6">{selected.body || <span className={muted}>No message yet</span>}</p>
              {selected.link && <p className="mt-2 text-xs font-medium text-pink-600">Opens {linkLabel(selected.link)} ›</p>}
            </section>
            {selected.status === "sent" && (
              <section>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Opened</span>
                  <span className="font-semibold">
                    {selected.opened.toLocaleString("en-GB")} of {selected.reach.toLocaleString("en-GB")}
                  </span>
                </div>
                <div className={`h-2.5 overflow-hidden rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <div className={`h-full rounded-full ${isDarkMode ? "bg-blue-500" : "bg-blue-600"}`} style={{ width: `${(selected.openRate ?? 0) * 100}%` }} />
                </div>
              </section>
            )}
            <section className={`rounded-xl border p-4 ${isDarkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`}>
              <DetailRows
                isDarkMode={isDarkMode}
                rows={[
                  ["To", `${AUDIENCE_LABEL[selected.audience]}${selected.region ? `, ${REGION_NAMES[selected.region]} only` : ""}`],
                  ["Sent as", selected.channels.map((c) => CHANNELS[c].label).join(", ")],
                  [selected.status === "scheduled" ? "Goes out" : "When", selected.status === "draft" ? "Not sent yet" : formatDateTime(whenOf(selected))],
                  ["Reach", selected.status === "sent" ? `${selected.reach.toLocaleString("en-GB")} people` : "—"],
                  ["Written by", selected.createdBy?.fullName ?? "Team"],
                ]}
              />
            </section>
            <p className={`text-xs ${muted}`}>Delivered in the app. Push isn&apos;t connected yet and SMS is paused, so those parts don&apos;t go out yet.</p>
          </div>
        )}
      </SideDrawer>
    </div>
  );
};

export default NotificationCenter;
