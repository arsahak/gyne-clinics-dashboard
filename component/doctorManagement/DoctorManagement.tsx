"use client";
import {
  approveDoctor,
  DoctorRecord,
  getDoctors,
  rejectDoctor,
  removeDoctorAccount,
  setFeaturedDoctor,
  suspendDoctor,
  unsuspendDoctor,
} from "@/app/actions/doctorManagement";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaBan, FaCheck, FaStar, FaTimes, FaTrash, FaUserMd } from "react-icons/fa";

const TABS = [
  { label: "Pending Verification", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

interface DoctorManagementProps {
  initialDoctors: DoctorRecord[];
  initialStatus: string;
}

const DoctorManagement = ({ initialDoctors, initialStatus }: DoctorManagementProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorRecord[]>(initialDoctors);
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: isDarkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800",
      approved: isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800",
      rejected: isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800",
    };
    return colors[status] || "";
  };

  const handleTabChange = async (status: string) => {
    setActiveStatus(status);
    setLoading(true);
    const response = await getDoctors(status);
    if (response.success && response.data) setDoctors(response.data as DoctorRecord[]);
    setLoading(false);
  };

  const refresh = () => handleTabChange(activeStatus);

  const handleApprove = async (id: string) => {
    const response = await approveDoctor(id);
    if (response.success) { toast.success("Doctor approved"); await refresh(); router.refresh(); }
    else toast.error(response.error || "Failed to approve doctor");
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Reason for rejecting this doctor (optional):") || undefined;
    const response = await rejectDoctor(id, reason);
    if (response.success) { toast.success("Doctor rejected"); await refresh(); router.refresh(); }
    else toast.error(response.error || "Failed to reject doctor");
  };

  const handleSuspend = async (id: string) => {
    const reason = window.prompt("Reason for suspending this doctor (optional):") || undefined;
    const response = await suspendDoctor(id, reason);
    if (response.success) { toast.success("Doctor suspended"); await refresh(); }
    else toast.error(response.error || "Failed to suspend doctor");
  };

  const handleUnsuspend = async (id: string) => {
    const response = await unsuspendDoctor(id);
    if (response.success) { toast.success("Suspension lifted"); await refresh(); }
    else toast.error(response.error || "Failed to unsuspend doctor");
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    const response = await setFeaturedDoctor(id, !featured);
    if (response.success) { toast.success(!featured ? "Marked as featured" : "Removed from featured"); await refresh(); }
    else toast.error(response.error || "Failed to update featured status");
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Permanently remove this doctor's profile? Their account will need to re-onboard.")) return;
    const response = await removeDoctorAccount(id);
    if (response.success) { toast.success("Doctor account removed"); setDoctors((prev) => prev.filter((d) => d._id !== id)); router.refresh(); }
    else toast.error(response.error || "Failed to remove doctor");
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Doctors</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Verify credentials, manage suspensions, and curate featured specialists
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
          <div className="p-6 text-center">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center">
            <FaUserMd className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
            <p className="text-gray-500">No doctors here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Specialization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Reg. Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {doctors.map((doc) => (
                  <tr key={doc._id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4">
                      <div className="font-medium flex items-center gap-2">
                        {doc.user.name || "Unnamed"}
                        {doc.featured && <FaStar className="text-yellow-500" title="Featured" />}
                        {doc.suspended && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-700"}`}>
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{doc.user.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{doc.specialization || "-"}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {doc.experienceYears !== undefined && doc.experienceYears !== null ? `${doc.experienceYears} yrs` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">{doc.registrationNumber || "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      {doc.reviewCount > 0 ? `${doc.avgRating.toFixed(1)} (${doc.reviewCount})` : "No reviews"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {doc.verificationDocuments && doc.verificationDocuments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {doc.verificationDocuments.map((url, i) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              Document {i + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>None submitted</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(doc.approvalStatus)}`}>
                        {doc.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {doc.approvalStatus === "pending" && (
                          <>
                            <button onClick={() => handleApprove(doc._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                              <FaCheck />
                            </button>
                            <button onClick={() => handleReject(doc._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Reject">
                              <FaTimes />
                            </button>
                          </>
                        )}
                        {doc.approvalStatus === "approved" && (
                          <>
                            <button
                              onClick={() => handleToggleFeatured(doc._id, doc.featured)}
                              className={`p-2 rounded-lg ${doc.featured ? "text-yellow-600 hover:bg-yellow-50" : "text-gray-400 hover:bg-gray-100"}`}
                              title={doc.featured ? "Unfeature" : "Feature"}
                            >
                              <FaStar />
                            </button>
                            {doc.suspended ? (
                              <button onClick={() => handleUnsuspend(doc._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Lift suspension">
                                <FaCheck />
                              </button>
                            ) : (
                              <button onClick={() => handleSuspend(doc._id)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Suspend">
                                <FaBan />
                              </button>
                            )}
                          </>
                        )}
                        <button onClick={() => handleRemove(doc._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Remove account">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorManagement;
