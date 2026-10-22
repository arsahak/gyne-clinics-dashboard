"use client";

import {
  getRealtimeTicket,
  getStaffNotifications,
  readAllNotifications,
  setNotificationRead,
  type StaffEvent,
  type StaffNotification,
} from "@/app/actions/staffNotificationAction";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBalanceScale,
  FaBookOpen,
  FaCalendarCheck,
  FaCheck,
  FaCheckDouble,
  FaEnvelope,
  FaEnvelopeOpen,
  FaFlag,
  FaHandHoldingUsd,
  FaStar,
  FaStethoscope,
  FaUndo,
  FaUserEdit,
  FaUserPlus,
} from "react-icons/fa";
import { IoMdNotifications } from "react-icons/io";
import { io, type Socket } from "socket.io-client";

// The topbar bell: live notifications for things the team may need to act on
// (new patients and doctors, bookings, refunds, withdrawals, reports, flagged
// chats, stories, held reviews). Each person has their own read / unread.
// Live over socket.io; when the socket can't connect it checks every 30 seconds.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const POLL_MS = 30_000;

const TYPE_STYLE: Record<StaffEvent, { icon: typeof FaUserPlus; light: string; dark: string }> = {
  patient_signup: { icon: FaUserPlus, light: "bg-rose-100 text-rose-600", dark: "bg-rose-900/50 text-rose-300" },
  doctor_signup: { icon: FaStethoscope, light: "bg-amber-100 text-amber-600", dark: "bg-amber-900/50 text-amber-300" },
  doctor_update: { icon: FaUserEdit, light: "bg-sky-100 text-sky-600", dark: "bg-sky-900/50 text-sky-300" },
  consultation_booked: { icon: FaCalendarCheck, light: "bg-teal-100 text-teal-600", dark: "bg-teal-900/50 text-teal-300" },
  payment_refunded: { icon: FaUndo, light: "bg-gray-100 text-gray-600", dark: "bg-gray-700 text-gray-300" },
  withdrawal_requested: { icon: FaHandHoldingUsd, light: "bg-green-100 text-green-600", dark: "bg-green-900/50 text-green-300" },
  report_created: { icon: FaFlag, light: "bg-red-100 text-red-600", dark: "bg-red-900/50 text-red-300" },
  chat_flagged: { icon: FaBalanceScale, light: "bg-orange-100 text-orange-600", dark: "bg-orange-900/50 text-orange-300" },
  story_submitted: { icon: FaBookOpen, light: "bg-purple-100 text-purple-600", dark: "bg-purple-900/50 text-purple-300" },
  review_held: { icon: FaStar, light: "bg-yellow-100 text-yellow-600", dark: "bg-yellow-900/50 text-yellow-300" },
};

/** "just now", "5 min ago", "3 h ago", "2 d ago", then the date. */
function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function NotificationBell() {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [items, setItems] = useState<StaffNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const wrapRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  /** First page of the current tab (also used by the 30-second fallback). */
  const loadFirst = useCallback(async (which: "all" | "unread") => {
    const result = await getStaffNotifications({ filter: which, page: 1 });
    setLoading(false);
    setNow(Date.now());
    if (!result.success || !result.data) return;
    setItems(result.data.notifications);
    setUnread(result.data.unread);
    setHasMore(result.data.pagination.hasMore);
    setPage(1);
  }, []);

  // Load, then go live. Fall back to checking every 30 seconds while the socket is down.
  useEffect(() => {
    const first = setTimeout(() => void loadFirst("all"), 0);
    let socket: Socket | null = null;
    try {
      socket = io(API_URL, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        reconnectionDelayMax: 30_000,
        // A fresh ticket every time it (re)connects.
        auth: (cb) => {
          getRealtimeTicket().then((ticket) => cb({ ticket: ticket ?? "" }), () => cb({ ticket: "" }));
        },
      });
      socket.on("connect", () => setLive(true));
      socket.on("disconnect", () => setLive(false));
      socket.on("connect_error", () => setLive(false));
      socket.on("staff:notification", (payload: { notification: StaffNotification; unread: number }) => {
        const n = payload.notification;
        setUnread(payload.unread);
        setNow(Date.now());
        setItems((list) => (list.some((x) => x._id === n._id) ? list : [n, ...list]));
        // Pages that show live numbers (the dashboard home) refresh on this.
        window.dispatchEvent(new CustomEvent("gc:staff-notification", { detail: n }));
        const style = TYPE_STYLE[n.type];
        toast.custom(
          (t) => (
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                void setNotificationRead(n._id, true);
                if (n.link) router.push(n.link);
              }}
              // mt-14: below the topbar, so it never covers the bell.
              className={`mt-14 flex w-[360px] max-w-[90vw] items-start gap-3 rounded-xl border p-3 text-left shadow-lg transition-all ${t.visible ? "opacity-100" : "opacity-0"} ${
                n.priority === "urgent" ? "border-red-300 bg-red-50 text-red-900" : "border-gray-200 bg-white text-gray-900"
              }`}
            >
              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.light}`}>
                <style.icon size={14} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{n.title}</span>
                <span className="block line-clamp-2 text-xs text-gray-600">{n.body}</span>
              </span>
            </button>
          ),
          { position: "top-right", duration: n.priority === "urgent" ? 12_000 : 6_000 },
        );
      });
      socket.on("staff:unread", (payload: { unread: number }) => setUnread(payload.unread));
    } catch {
      // No socket: the 30-second check below keeps the bell up to date.
      socket = null;
    }
    const poll = setInterval(() => {
      if (!socket?.connected) void loadFirst(tabRef.current);
    }, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(poll);
      clearInterval(tick);
      socket?.disconnect();
    };
  }, [loadFirst, router]);

  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (open && wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const switchTab = (which: "all" | "unread") => {
    setTab(which);
    setLoading(true);
    void loadFirst(which);
  };

  const loadMore = async () => {
    const next = page + 1;
    const result = await getStaffNotifications({ filter: tab, page: next });
    if (!result.success || !result.data) return;
    const more = result.data.notifications;
    setItems((list) => [...list, ...more.filter((n) => !list.some((x) => x._id === n._id))]);
    setHasMore(result.data.pagination.hasMore);
    setPage(next);
  };

  /** Read or unread, right away on screen; the server confirms the count. */
  const toggleRead = async (n: StaffNotification, read: boolean) => {
    setItems((list) =>
      tab === "unread" && read ? list.filter((x) => x._id !== n._id) : list.map((x) => (x._id === n._id ? { ...x, readAt: read ? new Date().toISOString() : undefined } : x)),
    );
    setUnread((u) => Math.max(0, u + (read ? (n.readAt ? 0 : -1) : n.readAt ? 1 : 0)));
    const result = await setNotificationRead(n._id, read);
    if (result.success && result.data) setUnread(result.data.unread);
    else toast.error(result.error || "Couldn't update");
  };

  const openItem = (n: StaffNotification) => {
    if (!n.readAt) void toggleRead(n, true);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    setItems((list) => (tab === "unread" ? [] : list.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() }))));
    setUnread(0);
    const result = await readAllNotifications();
    if (!result.success) toast.error(result.error || "Couldn't update");
  };

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const border = isDarkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        title="Notifications"
        className={`relative rounded-lg p-2 transition-colors ${open ? (isDarkMode ? "bg-gray-800" : "bg-gray-100") : isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
      >
        <IoMdNotifications className={`h-5 w-5 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" data-testid="unread-badge">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={`absolute right-0 z-50 mt-2 flex max-h-[75vh] w-[400px] max-w-[92vw] flex-col overflow-hidden rounded-xl border shadow-xl ${isDarkMode ? "border-gray-700 bg-gray-800 text-gray-100" : "border-gray-200 bg-white text-gray-900"}`}
        >
          <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${border}`}>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                Notifications
                {unread > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread} new</span>}
              </p>
              <p className={`flex items-center gap-1.5 text-[11px] ${muted}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-green-500" : "bg-gray-400"}`} />
                {live ? "Live" : "Checking every 30 seconds"}
              </p>
            </div>
            <button
              type="button"
              onClick={markAll}
              disabled={unread === 0}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-40 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            >
              <FaCheckDouble size={11} /> Mark all as read
            </button>
          </div>

          <div className={`flex gap-1 border-b px-3 py-2 ${border}`} role="tablist">
            {(["all", "unread"] as const).map((which) => (
              <button
                key={which}
                type="button"
                role="tab"
                aria-selected={tab === which}
                onClick={() => switchTab(which)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tab === which ? (isDarkMode ? "bg-white text-gray-900" : "bg-black text-white") : `${muted} ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`
                }`}
              >
                {which === "all" ? "All" : `Unread${unread ? ` (${unread})` : ""}`}
              </button>
            ))}
          </div>

          <ul className={`flex-1 divide-y overflow-y-auto ${isDarkMode ? "divide-gray-700" : "divide-gray-100"}`} aria-busy={loading}>
            {loading && items.length === 0 ? (
              Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="flex gap-3 px-4 py-3">
                  <span className={`h-9 w-9 animate-pulse rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <span className="flex-1 space-y-2">
                    <span className={`block h-3 w-40 animate-pulse rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <span className={`block h-3 w-56 animate-pulse rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  </span>
                </li>
              ))
            ) : items.length === 0 ? (
              <li className="px-4 py-10 text-center">
                <FaCheck className={`mx-auto mb-2 ${muted}`} />
                <p className="text-sm font-medium">{tab === "unread" ? "You're all caught up" : "No notifications yet"}</p>
                <p className={`text-xs ${muted}`}>New patients, bookings, reports and more show up here as they happen.</p>
              </li>
            ) : (
              items.map((n) => {
                const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.report_created;
                const isUnread = !n.readAt;
                return (
                  <li
                    key={n._id}
                    className={`group relative flex gap-3 px-4 py-3 transition-colors ${
                      isUnread ? (isDarkMode ? "bg-blue-950/30" : "bg-blue-50/60") : ""
                    } ${isDarkMode ? "hover:bg-gray-700/60" : "hover:bg-gray-50"}`}
                  >
                    {isUnread && <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-500" aria-label="Unread" />}
                    <button type="button" onClick={() => openItem(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? style.dark : style.light}`}>
                        <style.icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={`truncate text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>{n.title}</span>
                          {n.priority === "urgent" && <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Urgent</span>}
                        </span>
                        <span className={`block line-clamp-2 text-xs ${muted}`}>{n.body}</span>
                        <span className={`mt-0.5 block text-[11px] ${muted}`}>{ago(n.createdAt, now)}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRead(n, isUnread)}
                      title={isUnread ? "Mark as read" : "Mark as unread"}
                      aria-label={isUnread ? `Mark "${n.title}" as read` : `Mark "${n.title}" as unread`}
                      className={`h-7 w-7 shrink-0 self-center rounded-md opacity-60 transition hover:opacity-100 ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
                    >
                      {isUnread ? <FaEnvelopeOpen size={12} className="mx-auto" /> : <FaEnvelope size={12} className="mx-auto" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {hasMore && (
            <button type="button" onClick={loadMore} className={`border-t py-2.5 text-xs font-medium ${border} ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
              Load older
            </button>
          )}
        </div>
      )}
    </div>
  );
}
