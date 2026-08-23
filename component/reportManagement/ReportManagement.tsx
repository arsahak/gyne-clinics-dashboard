"use client";
import { getReports, ReportRecord, resolveReport } from "@/app/actions/reportManagement";
import { useSidebar } from "@/lib/SidebarContext";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaCheck, FaFlag, FaTimes } from "react-icons/fa";

const TABS = [
  { label: "Pending", value: "pending" },
  { label: "Resolved", value: "resolved" },
  { label: "Dismissed", value: "dismissed" },
  { label: "All", value: "all" },
];

interface ReportManagementProps {
  initialReports: ReportRecord[];
  initialStatus: string;
}

const ReportManagement = ({ initialReports, initialStatus }: ReportManagementProps) => {
  const { isDarkMode } = useSidebar();
  const [reports, setReports] = useState<ReportRecord[]>(initialReports);
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleTabChange = async (status: string) => {
    setActiveStatus(status);
    setLoading(true);
    const response = await getReports(status);
    if (response.success && response.data) setReports(response.data);
    setLoading(false);
  };

  const handleResolve = async (id: string, status: "resolved" | "dismissed") => {
    const resolution = window.prompt(`Resolution notes (${status}):`) || undefined;
    const response = await resolveReport(id, status, resolution);
    if (response.success) { toast.success("Report processed"); await handleTabChange(activeStatus); }
    else toast.error(response.error || "Failed to process report");
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Reports submitted by patients and doctors about each other
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              activeStatus === tab.value
                ? "bg-blue-600 border-blue-600 text-white"
                : isDarkMode
                ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        {loading ? (
          <div className="p-6 text-center">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <FaFlag className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
            <p className="text-gray-500">No reports here</p>
          </div>
        ) : (
          <div className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {reports.map((report) => (
              <div key={report._id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold">
                      {report.reporter?.name || "Unknown"} ({report.reporterRole})
                    </span>
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>reported</span>
                    <span className="font-semibold">{report.reportedUser?.name || "Unknown"}</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{report.reason}</p>
                  {report.resolution && (
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Resolution: {report.resolution}
                    </p>
                  )}
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                {report.status === "pending" ? (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleResolve(report._id, "resolved")} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Mark resolved">
                      <FaCheck />
                    </button>
                    <button onClick={() => handleResolve(report._id, "dismissed")} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Dismiss">
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    report.status === "resolved"
                      ? isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"
                      : isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                  }`}>
                    {report.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportManagement;
