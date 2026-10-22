"use client";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { FaEye, FaLock } from "react-icons/fa";

// Shown by AccessGate: no access at all, or a read-only page.

export function NoAccess({ area, needManage }: { area: string; needManage: boolean }) {
  const { isDarkMode } = useSidebar();
  return (
    <div className={`mx-auto mt-16 max-w-md rounded-2xl border p-8 text-center shadow-sm ${isDarkMode ? "border-gray-700 bg-gray-800 text-gray-100" : "border-gray-200 bg-white text-gray-900"}`}>
      <span className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
        <FaLock size={20} />
      </span>
      <h1 className="mt-4 text-lg font-semibold">{needManage ? "You can only view this" : "No access"}</h1>
      <p className={`mt-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        {needManage ? `Your role can see ${area} but not change it.` : `Your role doesn't include ${area}.`} A super admin can change this in Team &amp; Roles.
      </p>
      <Link href="/" className="mt-6 inline-flex rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800">
        Back to dashboard
      </Link>
    </div>
  );
}

export function ViewOnlyNote({ area }: { area: string }) {
  const { isDarkMode } = useSidebar();
  return (
    <div
      role="note"
      className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${
        isDarkMode ? "border-blue-900 bg-blue-950/40 text-blue-200" : "border-blue-200 bg-blue-50 text-blue-800"
      }`}
    >
      <FaEye className="shrink-0" size={13} /> View only: your role can see {area} but not change anything here.
    </div>
  );
}
