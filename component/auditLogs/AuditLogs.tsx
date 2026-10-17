"use client";
import { AuditLogRecord } from "@/app/actions/auditLogs";
import { useSidebar } from "@/lib/SidebarContext";
import { useMemo, useState } from "react";
import { FaClipboardList, FaLock } from "react-icons/fa";

interface AuditLogsProps {
  logs: AuditLogRecord[];
}

const ACTION_LABELS: Record<string, string> = {
  user_suspend: "Suspended user",
  user_unsuspend: "Unsuspended user",
  user_verify: "Verified user",
  doctor_approve: "Approved doctor",
  doctor_reject: "Rejected doctor",
  doctor_suspend: "Suspended doctor",
  doctor_unsuspend: "Unsuspended doctor",
  create: "Created",
  edit: "Edited",
  hide: "Hid",
  unhide: "Restored",
  delete: "Deleted",
  approve: "Approved",
  reject: "Rejected",
};

const TARGET_TYPES = ["all", "user", "doctor", "content", "story", "chat", "report", "advertisement", "notification"];

const AuditLogs = ({ logs }: AuditLogsProps) => {
  const { isDarkMode } = useSidebar();
  const [targetFilter, setTargetFilter] = useState("all");

  const filtered = useMemo(
    () => (targetFilter === "all" ? logs : logs.filter((l) => l.targetType === targetFilter)),
    [logs, targetFilter]
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className={`${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          A read-only, append-only record of every admin action for compliance
        </p>
      </div>

      <div className={`mb-6 flex items-start gap-3 p-4 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-100 border-gray-200 text-gray-700"}`}>
        <FaLock className="mt-0.5 flex-shrink-0" />
        <p className="text-sm">
          These entries cannot be edited or deleted through the admin panel — there is no API route to modify them,
          only to create new ones as actions happen.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TARGET_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setTargetFilter(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium border capitalize transition-colors ${
              targetFilter === type
                ? "bg-blue-600 border-blue-600 text-white"
                : isDarkMode
                ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FaClipboardList className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
              <p className="text-gray-500">No log entries</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">When</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {filtered.map((log) => (
                  <tr key={log._id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{log.admin?.name || "—"}</div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{log.admin?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{ACTION_LABELS[log.action] || log.action}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="capitalize">{log.targetType}</span>
                      {log.targetLabel && <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}> — {log.targetLabel}</span>}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs truncate">{log.reason || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
