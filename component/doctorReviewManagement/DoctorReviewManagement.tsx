"use client";
import {
  deleteDoctorReview,
  DoctorReviewRecord,
  getDoctorReviews,
  hideDoctorReview,
  unhideDoctorReview,
} from "@/app/actions/doctorReviewManagement";
import { useSidebar } from "@/lib/SidebarContext";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash, FaStar, FaTrash } from "react-icons/fa";

const TABS = [
  { label: "All", value: "all" },
  { label: "Visible", value: "visible" },
  { label: "Hidden", value: "hidden" },
];

interface DoctorReviewManagementProps {
  initialReviews: DoctorReviewRecord[];
  initialStatus: string;
}

const DoctorReviewManagement = ({ initialReviews, initialStatus }: DoctorReviewManagementProps) => {
  const { isDarkMode } = useSidebar();
  const [reviews, setReviews] = useState<DoctorReviewRecord[]>(initialReviews);
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleTabChange = async (status: string) => {
    setActiveStatus(status);
    setLoading(true);
    const response = await getDoctorReviews(status);
    if (response.success && response.data) setReviews(response.data);
    setLoading(false);
  };

  const handleHide = async (id: string) => {
    const response = await hideDoctorReview(id);
    if (response.success) { toast.success("Review hidden"); await handleTabChange(activeStatus); }
    else toast.error(response.error || "Failed to hide review");
  };

  const handleUnhide = async (id: string) => {
    const response = await unhideDoctorReview(id);
    if (response.success) { toast.success("Review restored"); await handleTabChange(activeStatus); }
    else toast.error(response.error || "Failed to restore review");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this review?")) return;
    const response = await deleteDoctorReview(id);
    if (response.success) { toast.success("Review deleted"); setReviews((prev) => prev.filter((r) => r._id !== id)); }
    else toast.error(response.error || "Failed to delete review");
  };

  return (
    <div className={`${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Doctor Reviews</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Moderate patient ratings and reviews of doctors
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
          <div className="p-6 text-center">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center">
            <FaStar className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
            <p className="text-gray-500">No reviews here</p>
          </div>
        ) : (
          <div className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {reviews.map((review) => (
              <div key={review._id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">{review.patient?.name || "Patient"}</span>
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>→</span>
                      <span className="font-semibold">{review.doctor?.name || "Doctor"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        review.status === "visible"
                          ? isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"
                          : isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"
                      }`}>
                        {review.status}
                      </span>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} className={i < review.rating ? "text-yellow-500" : (isDarkMode ? "text-gray-600" : "text-gray-300")} />
                      ))}
                    </div>
                    <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{review.comment}</p>
                    {review.wasRedacted && <p className="text-xs mt-1 text-yellow-600">🔒 Contact info was redacted</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {review.status === "visible" ? (
                      <button onClick={() => handleHide(review._id)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Hide">
                        <FaEyeSlash />
                      </button>
                    ) : (
                      <button onClick={() => handleUnhide(review._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Restore">
                        <FaEye />
                      </button>
                    )}
                    <button onClick={() => handleDelete(review._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorReviewManagement;
