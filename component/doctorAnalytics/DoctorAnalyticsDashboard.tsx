"use client";
import { DoctorAnalytics } from "@/app/actions/doctorAnalytics";
import { useSidebar } from "@/lib/SidebarContext";
import { FaComments, FaExclamationTriangle, FaStar, FaStethoscope, FaUserInjured } from "react-icons/fa";

interface DoctorAnalyticsDashboardProps {
  analytics: DoctorAnalytics | null;
}

const DoctorAnalyticsDashboard = ({ analytics }: DoctorAnalyticsDashboardProps) => {
  const { isDarkMode } = useSidebar();
  const cardClass = `p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;

  if (!analytics) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
        <p>Couldn't load analytics.</p>
      </div>
    );
  }

  const stats = [
    { label: "Total Patients", value: analytics.totalPatients, icon: FaUserInjured, color: "text-blue-500" },
    { label: "Verified Doctors", value: analytics.totalDoctors, icon: FaStethoscope, color: "text-green-500" },
    { label: "Pending Approvals", value: analytics.pendingDoctorApprovals, icon: FaExclamationTriangle, color: "text-yellow-500" },
    { label: "Total Consultations", value: analytics.totalChats, icon: FaComments, color: "text-purple-500" },
    { label: "Messages Exchanged", value: analytics.totalMessages, icon: FaComments, color: "text-indigo-500" },
    { label: "Reviews Submitted", value: analytics.totalReviews, icon: FaStar, color: "text-amber-500" },
    { label: "Pending Reports", value: analytics.pendingReports, icon: FaExclamationTriangle, color: "text-red-500" },
    { label: "Avg. Doctor Rating", value: analytics.avgRatingAcrossDoctors.toFixed(1), icon: FaStar, color: "text-amber-500" },
  ];

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Doctor Discovery Analytics</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Doctor performance, chat activity, and patient engagement
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={cardClass}>
              <Icon className={`text-2xl mb-3 ${stat.color}`} />
              <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {stat.label}
              </p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className={cardClass}>
        <h2 className="text-xl font-semibold mb-4">Top Rated Doctors</h2>
        {!analytics.topRatedDoctors.length ? (
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>No rated doctors yet.</p>
        ) : (
          <div className="space-y-3">
            {analytics.topRatedDoctors.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between">
                <span className="font-medium">{doc.user?.name || "Unknown"}</span>
                <span className="flex items-center gap-1 text-amber-500 font-semibold">
                  <FaStar /> {doc.avgRating.toFixed(1)} ({doc.reviewCount})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAnalyticsDashboard;
