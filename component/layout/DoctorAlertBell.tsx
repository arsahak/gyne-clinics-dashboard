"use client";

import {
  DoctorAlertRecord,
  getDoctorAlerts,
  markAllDoctorAlertsRead,
  markDoctorAlertRead,
} from "@/app/actions/doctorAlerts";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoMdNotifications } from "react-icons/io";

const TYPE_LABEL: Record<DoctorAlertRecord["type"], string> = {
  profile_updated: "Profile updated",
  availability_updated: "Availability & pricing updated",
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function DoctorAlertBell() {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<DoctorAlertRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    setLoading(true);
    const res = await getDoctorAlerts();
    setLoading(false);
    if (res.success) {
      setAlerts(res.data ?? []);
      setUnreadCount(res.unreadCount ?? 0);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const openAlert = async (alert: DoctorAlertRecord) => {
    if (!alert.read) {
      setAlerts((prev) => prev.map((a) => (a._id === alert._id ? { ...a, read: true } : a)));
      setUnreadCount((c) => Math.max(0, c - 1));
      void markDoctorAlertRead(alert._id);
    }
    setOpen(false);
    if (alert.doctor?._id) router.push(`/doctors/${alert.doctor._id}`);
  };

  const markAllRead = async () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);
    await markAllDoctorAlertsRead();
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
        title="Doctor update alerts"
      >
        <IoMdNotifications className={`w-5 h-5 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-96 max-w-[90vw] max-h-[70vh] overflow-y-auto rounded-lg shadow-lg border z-50 ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <div className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div>
              <p className="font-semibold text-sm">Doctor Updates</p>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Profile & pricing changes by approved doctors</p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {loading && alerts.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Loading…</div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No doctor updates yet</div>
          ) : (
            <div className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {alerts.map((alert) => (
                <button
                  key={alert._id}
                  onClick={() => openAlert(alert)}
                  className={`w-full text-left px-4 py-3 flex gap-2 transition-colors ${
                    !alert.read ? (isDarkMode ? "bg-blue-950/40" : "bg-blue-50") : ""
                  } ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                >
                  {!alert.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  <div className={alert.read ? "ml-4" : ""}>
                    <p className="text-sm font-medium">
                      Dr. {alert.doctor?.name || "Unknown"} — {TYPE_LABEL[alert.type]}
                    </p>
                    <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{formatTime(alert.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
