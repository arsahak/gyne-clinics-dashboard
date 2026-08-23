"use client";
import {
  approveStory,
  deleteStory,
  getStories,
  hideStory,
  rejectStory,
  Story,
  unhideStory,
} from "@/app/actions/story";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaBookOpen, FaCheck, FaEye, FaEyeSlash, FaTimes, FaTrash } from "react-icons/fa";

const TABS = [
  { label: "Pending Review", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

interface StoryManagementProps {
  initialStories: Story[];
  initialStatus: string;
}

const authorName = (author: Story["author"]) =>
  typeof author === "object" ? author.name || author.phone || "Unknown patient" : "Unknown patient";

const StoryManagement = ({ initialStories, initialStatus }: StoryManagementProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    const response = await getStories(status);
    if (response.success && response.data) {
      setStories(response.data as Story[]);
    }
    setLoading(false);
  };

  const refreshCurrentTab = () => handleTabChange(activeStatus);

  const handleApprove = async (id: string) => {
    const response = await approveStory(id);
    if (response.success) {
      toast.success("Story approved and published");
      await refreshCurrentTab();
      router.refresh();
    } else {
      toast.error(response.error || "Failed to approve story");
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Reason for rejecting this story (optional):") || undefined;
    const response = await rejectStory(id, reason);
    if (response.success) {
      toast.success("Story rejected");
      await refreshCurrentTab();
      router.refresh();
    } else {
      toast.error(response.error || "Failed to reject story");
    }
  };

  const handleHide = async (id: string) => {
    const reason = window.prompt("Reason for hiding this story (optional):") || undefined;
    const response = await hideStory(id, reason);
    if (response.success) {
      toast.success("Story hidden");
      await refreshCurrentTab();
    } else {
      toast.error(response.error || "Failed to hide story");
    }
  };

  const handleUnhide = async (id: string) => {
    const response = await unhideStory(id);
    if (response.success) {
      toast.success("Story restored");
      await refreshCurrentTab();
    } else {
      toast.error(response.error || "Failed to restore story");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this story?")) {
      const response = await deleteStory(id);
      if (response.success) {
        toast.success("Story deleted");
        setStories((prev) => prev.filter((s) => s._id !== id));
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete story");
      }
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stories</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Review patient-submitted stories before they're published
        </p>
      </div>

      {/* Status tabs */}
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
          <div className="p-6 text-center">Loading stories...</div>
        ) : stories.length === 0 ? (
          <div className="p-12 text-center">
            <FaBookOpen className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
            <p className="text-gray-500">No stories here</p>
          </div>
        ) : (
          <div className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {stories.map((story) => {
              const expanded = expandedId === story._id;
              return (
                <div key={story._id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{story.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getStatusColor(story.status)}`}>
                          {story.status}
                        </span>
                      </div>
                      <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        By {authorName(story.author)}
                        {story.createdAt && ` · ${new Date(story.createdAt).toLocaleDateString()}`}
                      </p>
                      <p
                        className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"} ${expanded ? "" : "line-clamp-2"}`}
                      >
                        {story.body}
                      </p>
                      {story.body.length > 140 && (
                        <button
                          onClick={() => setExpandedId(expanded ? null : story._id)}
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          {expanded ? "Show less" : "Read more"}
                        </button>
                      )}
                      {story.status === "rejected" && story.rejectionReason && (
                        <p className={`text-xs mt-2 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                          Rejection reason: {story.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {story.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(story._id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FaCheck /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(story._id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <FaTimes /> Reject
                          </button>
                        </>
                      )}
                      {story.status === "approved" && (
                        <>
                          {story.visibility === "hidden" ? (
                            <button
                              onClick={() => handleUnhide(story._id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-green-600 border border-green-600 text-sm rounded-lg hover:bg-green-50 transition-colors"
                            >
                              <FaEye /> Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => handleHide(story._id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-yellow-600 border border-yellow-600 text-sm rounded-lg hover:bg-yellow-50 transition-colors"
                            >
                              <FaEyeSlash /> Hide
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(story._id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-600 border border-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryManagement;
