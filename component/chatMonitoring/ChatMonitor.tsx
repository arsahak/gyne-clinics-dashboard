"use client";
import {
  getChatForStaff,
  getChatsPage,
  type ChatDetailResponse,
  type ChatPageResponse,
  type ChatPagination,
  type ChatRecord,
  type ChatStats,
  type ChatType,
  type ChatWaiting,
} from "@/app/actions/chatMonitoringAction";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import { FilterPills, formatDateTime, initials, StatusPill, type Tone } from "@/component/shared/ui";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useState } from "react";
import { FaChevronLeft, FaChevronRight, FaClock, FaComments, FaExclamationTriangle, FaFlag, FaHourglassHalf, FaLock, FaRedo, FaReply, FaSearch } from "react-icons/fa";
import { ChatListRowsSkeleton, TranscriptSkeleton } from "./ChatSkeletons";

const PAGE_SIZE = 20;
const TOOLBAR_SELECT = "px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const TYPE: Record<ChatType, Tone> = {
  free: { label: "Free message", hint: "The doctor takes free messages.", dot: "bg-sky-500", light: "bg-sky-50 text-sky-700 border-sky-200", dark: "bg-sky-900/40 text-sky-200 border-sky-800" },
  consultation: { label: "Consultation", hint: "Inside the paid 24h chat.", dot: "bg-violet-500", light: "bg-violet-50 text-violet-700 border-violet-200", dark: "bg-violet-900/40 text-violet-200 border-violet-800" },
  follow_up: { label: "Follow-up", hint: "In the free 7 days after a consultation.", dot: "bg-amber-500", light: "bg-amber-50 text-amber-700 border-amber-200", dark: "bg-amber-900/40 text-amber-200 border-amber-800" },
};

const FLAG_LABEL = { abuse: "Abusive language", urgent_health: "Urgent health" } as const;

const minutesText = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`);
const timeOnly = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
const patientName = (c: ChatRecord) => c.patient?.fullName || c.patient?.phone || "Account deleted";
const doctorName = (c: ChatRecord) => c.doctor?.user?.fullName || "Doctor removed";

type Query = { type: ChatType | ""; waiting: ChatWaiting | ""; doctorId: string; flagged: boolean; search: string };

interface ChatMonitorProps {
  initial: ChatPageResponse;
  /** Opened straight away (from ?chat=, e.g. Chat Moderation's "Open chat"). */
  initialChat?: ChatDetailResponse;
  initialChatId?: string;
  now: string;
}

/** Read-only view of real patient–doctor chats, for quality and safety checks. */
const ChatMonitor = ({ initial, initialChat, initialChatId, now: serverNow }: ChatMonitorProps) => {
  const { isDarkMode } = useSidebar();
  const [items, setItems] = useState<ChatRecord[]>(initial.data ?? []);
  const [pagination, setPagination] = useState<ChatPagination>(initial.pagination ?? { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [stats, setStats] = useState<ChatStats | undefined>(initial.stats);
  const [doctors, setDoctors] = useState(initial.doctors ?? []);
  const [error, setError] = useState(initial.success ? "" : initial.error || "Failed to fetch chats");
  const [now, setNow] = useState(serverNow);
  const [query, setQuery] = useState<Query>({ type: "", waiting: "", doctorId: "", flagged: false, search: "" });
  const [searchText, setSearchText] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialChat?.success ? initialChatId ?? null : null);
  const [detail, setDetail] = useState<ChatDetailResponse["data"] | null>(initialChat?.success ? initialChat.data ?? null : null);
  const [detailError, setDetailError] = useState(initialChat && !initialChat.success ? initialChat.error ?? "" : "");
  const [loadingDetail, setLoadingDetail] = useState(false);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const border = isDarkMode ? "border-gray-700" : "border-gray-200";
  const selectClass = `${TOOLBAR_SELECT} ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`;
  const nowMs = new Date(now).getTime();

  /** Reads a page of chats through the server action, then shows it. */
  const load = async (page: number, changes: Partial<Query> = {}) => {
    const next = { ...query, ...changes };
    setQuery(next);
    setLoadingList(true);
    const response = await getChatsPage({ ...next, page, limit: PAGE_SIZE });
    setLoadingList(false);
    setNow(new Date().toISOString());
    if (!response.success) {
      setError(response.error || "Failed to fetch chats");
      return;
    }
    setError("");
    setItems(response.data ?? []);
    if (response.pagination) setPagination(response.pagination);
    if (response.stats) setStats(response.stats);
    if (response.doctors) setDoctors(response.doctors);
  };

  /** Opens one chat (read through the server action). */
  const open = async (id: string) => {
    setSelectedId(id);
    setLoadingDetail(true);
    setDetailError("");
    const response = await getChatForStaff(id);
    setLoadingDetail(false);
    if (response.success && response.data) setDetail(response.data);
    else {
      setDetail(null);
      setDetailError(response.error || "Failed to load the chat");
    }
  };

  const statCards: StatCard[] = [
    { label: "Chats", value: stats?.open ?? 0, sub: "With at least one message", icon: FaComments, tone: "blue" },
    {
      label: "Waiting for a doctor",
      value: stats?.waitingDoctor ?? 0,
      sub: `${stats?.waitingOverHour ?? 0} waiting over 1 hour`,
      icon: FaHourglassHalf,
      tone: stats?.waitingOverHour ? "amber" : "green",
    },
    {
      label: "First reply",
      value: stats?.medianFirstReplyMinutes === null || stats?.medianFirstReplyMinutes === undefined ? "—" : minutesText(stats.medianFirstReplyMinutes),
      sub: "Median time doctors take",
      icon: FaReply,
      tone: "violet",
    },
    { label: "Flagged chats", value: stats?.flagged ?? 0, sub: "The safety filter caught something", icon: FaFlag, tone: "rose" },
  ];

  const chat = detail?.chat;
  const filtering = query.type || query.waiting || query.doctorId || query.flagged || query.search;

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

      <div className={`flex h-[calc(100vh-180px)] min-h-[560px] overflow-hidden rounded-2xl border shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        {/* Left: chats */}
        <aside className={`flex w-full max-w-sm shrink-0 flex-col border-r ${border}`}>
          <div className={`space-y-2 border-b p-3 ${border}`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                load(1, { search: searchText });
              }}
              className="relative"
            >
              <button type="submit" aria-label="Search" className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <FaSearch size={12} />
              </button>
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search patient, doctor or message"
                className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500" : "border-gray-300 bg-white placeholder-gray-400"
                }`}
              />
            </form>
            <FilterPills
              value={query.type}
              onChange={(type) => load(1, { type })}
              isDarkMode={isDarkMode}
              options={[
                { value: "", label: "All" },
                { value: "consultation", label: "Paid" },
                { value: "follow_up", label: "Follow-up" },
                { value: "free", label: "Free" },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <select value={query.waiting} onChange={(e) => load(1, { waiting: e.target.value as ChatWaiting | "" })} className={selectClass} aria-label="Waiting for">
                <option value="">Anyone&apos;s turn</option>
                <option value="doctor">Waiting for doctor</option>
                <option value="patient">Waiting for patient</option>
              </select>
              <select value={query.doctorId} onChange={(e) => load(1, { doctorId: e.target.value })} className={selectClass} aria-label="Doctor">
                <option value="">All doctors</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <label className={`flex cursor-pointer items-center gap-2 text-xs ${muted}`}>
              <input type="checkbox" checked={query.flagged} onChange={(e) => load(1, { flagged: e.target.checked })} className="h-3.5 w-3.5 accent-black" />
              Only chats the safety filter flagged
            </label>
          </div>

          <ul className="flex-1 overflow-y-auto" aria-busy={loadingList}>
            {loadingList ? (
              <ChatListRowsSkeleton />
            ) : items.length === 0 ? (
              <li className={`px-6 py-12 text-center text-sm ${muted}`}>
                <FaComments className={`mx-auto mb-2 text-3xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                {filtering ? "No chats match." : "No chats yet. They show up when a patient writes to a doctor."}
              </li>
            ) : (
              items.map((c) => {
                const waitMin = c.lastSenderRole === "patient" && c.lastMessageAt ? Math.round((nowMs - new Date(c.lastMessageAt).getTime()) / 60_000) : 0;
                return (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => open(c._id)}
                      className={`flex w-full gap-3 border-b px-4 py-3 text-left ${border} ${
                        selectedId === c._id ? (isDarkMode ? "bg-gray-700" : "bg-blue-50") : isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"}`}>
                        {initials(patientName(c))}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {patientName(c)} <span className={`font-normal ${muted}`}>· {doctorName(c)}</span>
                          </span>
                          {c.lastMessageAt && <span className={`shrink-0 text-[10px] ${muted}`}>{formatDateTime(c.lastMessageAt)}</span>}
                        </span>
                        <span className={`block truncate text-xs ${muted}`}>
                          {c.lastSenderRole === "doctor" ? "Doctor: " : ""}
                          {c.lastMessageText}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${TYPE[c.type].dot}`} />
                          <span className={`text-[11px] ${muted}`}>{TYPE[c.type].label}</span>
                          {c.flaggedCount > 0 && <FaFlag size={9} className="text-red-500" title={`${c.flaggedCount} flagged`} />}
                          {waitMin > 0 && <span className={`ml-auto text-[11px] font-medium ${waitMin > 60 ? "text-amber-600" : muted}`}>waiting {minutesText(waitMin)}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {pagination.total > 0 && (
            <div className={`flex items-center justify-between border-t px-4 py-2 text-xs ${border} ${muted}`}>
              <span>
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={pagination.page <= 1 || loadingList}
                  onClick={() => load(pagination.page - 1)}
                  className={`rounded-md p-1.5 disabled:opacity-30 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <FaChevronLeft size={10} />
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={pagination.page >= pagination.pages || loadingList}
                  onClick={() => load(pagination.page + 1)}
                  className={`rounded-md p-1.5 disabled:opacity-30 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <FaChevronRight size={10} />
                </button>
              </span>
            </div>
          )}
        </aside>

        {/* Right: the conversation */}
        <section className="hidden min-w-0 flex-1 flex-col md:flex">
          {!selectedId ? (
            <div className={`flex flex-1 items-center justify-center text-sm ${muted}`}>Choose a chat on the left to read it.</div>
          ) : loadingDetail ? (
            <TranscriptSkeleton />
          ) : detailError || !chat || !detail ? (
            <div className={`flex flex-1 items-center justify-center text-sm ${muted}`}>{detailError || "Chat not found"}</div>
          ) : (
            <>
              <header className={`flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4 ${border}`}>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {chat.patient ? (
                      <Link href={`/patient/${chat.patient._id}`} className="hover:underline">
                        {patientName(chat)}
                      </Link>
                    ) : (
                      patientName(chat)
                    )}{" "}
                    <span className={muted}>with</span>{" "}
                    {chat.doctor ? (
                      <Link href={`/doctors/${chat.doctor._id}`} className="hover:underline">
                        {doctorName(chat)}
                      </Link>
                    ) : (
                      doctorName(chat)
                    )}
                  </p>
                  <p className={`text-xs ${muted}`}>
                    {chat.messageCount} message{chat.messageCount === 1 ? "" : "s"}
                    {chat.firstMessageAt && ` · started ${formatDateTime(chat.firstMessageAt)}`}
                    {detail.consultation && (
                      <>
                        {" "}
                        · latest booking <span className="font-mono">{detail.consultation.reference}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={TYPE[detail.type]} isDarkMode={isDarkMode} />
                  {chat.lastSenderRole && (
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs ${isDarkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}>
                      {chat.lastSenderRole === "patient" ? "Waiting for doctor" : "Waiting for patient"}
                    </span>
                  )}
                  {chat.firstMessageAt && chat.firstReplyAt && (
                    <span className={`flex items-center gap-1 text-xs ${muted}`}>
                      <FaClock size={10} /> first reply {minutesText(Math.round((new Date(chat.firstReplyAt).getTime() - new Date(chat.firstMessageAt).getTime()) / 60_000))}
                    </span>
                  )}
                </div>
              </header>

              {chat.flaggedCount > 0 && (
                <Link
                  href="/chat-moderation"
                  className={`flex items-center gap-2 border-b px-6 py-2 text-xs ${border} ${isDarkMode ? "bg-red-950/40 text-red-200" : "bg-red-50 text-red-700"}`}
                >
                  <FaExclamationTriangle size={11} /> The safety filter caught {chat.flaggedCount} message{chat.flaggedCount === 1 ? "" : "s"} here. See Chat Moderation.
                </Link>
              )}

              <div className={`flex-1 space-y-3 overflow-y-auto px-6 py-5 ${isDarkMode ? "bg-gray-900/40" : "bg-gray-50"}`}>
                {detail.messages.length === 0 && <p className={`text-center text-sm ${muted}`}>No messages yet.</p>}
                {detail.messages.map((msg) => (
                  <div key={msg._id} className={`flex ${msg.senderRole === "doctor" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.senderRole === "doctor"
                          ? "rounded-br-sm bg-black text-white"
                          : isDarkMode
                            ? "rounded-bl-sm bg-gray-700 text-gray-100"
                            : "rounded-bl-sm bg-white text-gray-900 shadow-sm"
                      } ${msg.flags.length ? "ring-2 ring-red-400" : ""}`}
                    >
                      <p className="mb-0.5 text-[11px] font-medium opacity-70">{msg.senderRole === "doctor" ? doctorName(chat) : patientName(chat)}</p>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <p className="mt-1 flex items-center justify-end gap-2 text-[10px] opacity-60">
                        {msg.flags.map((f) => (
                          <span key={f} className="rounded bg-red-500 px-1 font-semibold text-white opacity-100">
                            {FLAG_LABEL[f]}
                          </span>
                        ))}
                        {formatDateTime(msg.createdAt).replace(/,.*/, "")}, {timeOnly(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <footer className={`flex items-center gap-2 border-t px-6 py-3 text-xs ${border} ${muted}`}>
                <FaLock size={10} /> Read only. Admins can&apos;t send messages here. Messages with contact details were blocked and aren&apos;t shown.
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatMonitor;
