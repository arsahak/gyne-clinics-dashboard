"use client";
import {
  approveStory,
  deleteStory,
  getStoriesPage,
  hideStory,
  rejectStory,
  Story,
  StoryPagination,
  StorySort,
  StoryStats,
  StoryStatusFilter,
  unhideStory,
} from "@/app/actions/story";
import StatCards, { StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBookOpen,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaTimes,
  FaTimesCircle,
  FaTrashAlt,
  FaUndo,
} from "react-icons/fa";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: StoryStatusFilter; label: string }[] = [
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "hidden", label: "Hidden" },
  { value: "all", label: "All stories" },
];

const SORT_OPTIONS: { value: StorySort; label: string }[] = [
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest" },
  { value: "title_asc", label: "Sort: Title A–Z" },
  { value: "title_desc", label: "Sort: Title Z–A" },
];

const STATUS_LABELS: Record<Story["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const TOOLBAR_SELECT =
  "px-3 py-2.5 rounded-lg border text-sm sm:min-w-44 focus:outline-none focus:ring-2 focus:ring-blue-500";

const ACTION_BTN =
  "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-indigo-100 text-indigo-600",
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-600",
  "bg-orange-100 text-orange-600",
];

const getAuthor = (author: Story["author"]) =>
  typeof author === "object" ? author : undefined;

const authorName = (author: Story["author"]) => {
  const a = getAuthor(author);
  return a?.name || a?.phone || "Unknown patient";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface StoryManagementProps {
  initialStories: Story[];
  initialPagination?: StoryPagination;
  initialStats?: StoryStats;
}

const StoryManagement = ({
  initialStories,
  initialPagination,
  initialStats,
}: StoryManagementProps) => {
  const { isDarkMode } = useSidebar();
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [pagination, setPagination] = useState<StoryPagination>(
    initialPagination || { total: initialStories.length, page: 1, limit: PAGE_SIZE, pages: 1 },
  );
  const [stats, setStats] = useState<StoryStats | undefined>(initialStats);
  const [status, setStatus] = useState<StoryStatusFilter>("pending");
  const [sort, setSort] = useState<StorySort>("newest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = stories.find((s) => s._id === viewingId) || null;

  useEffect(() => {
    if (!viewingId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewingId]);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const chip = (light: string, dark: string) => (isDarkMode ? dark : light);

  const fetchPage = async (
    page: number,
    overrides: { status?: StoryStatusFilter; search?: string; sort?: StorySort } = {},
  ): Promise<void> => {
    const query = { status, search, sort, ...overrides };
    setLoading(true);
    const response = await getStoriesPage({
      status: query.status,
      search: query.search || undefined,
      sort: query.sort,
      page,
      limit: PAGE_SIZE,
    });
    if (response.success && response.data) {
      // Moderating the last story on the final page (e.g. approving it out of "Pending") empties it — step back.
      if (response.data.length === 0 && page > 1) {
        setLoading(false);
        return fetchPage(page - 1, overrides);
      }
      setStories(response.data);
      if (response.pagination) setPagination(response.pagination);
      if (response.stats) setStats(response.stats);
    } else {
      toast.error(response.error || "Failed to load stories");
    }
    setLoading(false);
  };

  const refresh = () => fetchPage(pagination.page);

  const handleStatusChange = (value: StoryStatusFilter) => {
    setStatus(value);
    fetchPage(1, { status: value });
  };

  const handleSortChange = (value: StorySort) => {
    setSort(value);
    fetchPage(1, { sort: value });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPage(1);
  };

  const handleApprove = async (story: Story) => {
    const response = await approveStory(story._id);
    if (response.success) {
      toast.success("Story approved and published");
      await refresh();
    } else toast.error(response.error || "Failed to approve story");
  };

  const handleReject = async (story: Story) => {
    const input = window.prompt(`Reason for rejecting "${story.title}" (optional):`);
    if (input === null) return;
    const response = await rejectStory(story._id, input.trim() || undefined);
    if (response.success) {
      toast.success("Story rejected");
      await refresh();
    } else toast.error(response.error || "Failed to reject story");
  };

  const handleHide = async (story: Story) => {
    const input = window.prompt(`Reason for hiding "${story.title}" (optional):`);
    if (input === null) return;
    const response = await hideStory(story._id, input.trim() || undefined);
    if (response.success) {
      toast.success("Story hidden");
      await refresh();
    } else toast.error(response.error || "Failed to hide story");
  };

  const handleUnhide = async (story: Story) => {
    const response = await unhideStory(story._id);
    if (response.success) {
      toast.success("Story restored");
      await refresh();
    } else toast.error(response.error || "Failed to restore story");
  };

  const handleDelete = async (story: Story) => {
    if (!confirm(`Permanently delete "${story.title}"?`)) return;
    const response = await deleteStory(story._id);
    if (response.success) {
      toast.success("Story deleted");
      setViewingId(null);
      await refresh();
    } else toast.error(response.error || "Failed to delete story");
  };

  const statusBadge = (story: Story) => {
    const colors: Record<Story["status"], string> = {
      pending: chip("bg-amber-100 text-amber-800", "bg-amber-900 text-amber-300"),
      approved: chip("bg-green-100 text-green-800", "bg-green-900 text-green-300"),
      rejected: chip("bg-red-100 text-red-800", "bg-red-900 text-red-300"),
    };
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${colors[story.status]}`}>
          {STATUS_LABELS[story.status]}
        </span>
        {story.visibility === "hidden" && (
          <span
            className={`px-2 py-1 text-xs rounded-full ${chip("bg-gray-100 text-gray-600", "bg-gray-700 text-gray-300")}`}
          >
            Hidden
          </span>
        )}
      </div>
    );
  };

  const renderActions = (story: Story, withLabels = false) => {
    const btn = withLabels
      ? "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
      : ACTION_BTN;
    return (
      <>
        {story.status === "pending" && (
          <>
            <button
              onClick={() => handleApprove(story)}
              className={`${btn} ${chip("bg-emerald-50 text-emerald-600 hover:bg-emerald-100", "bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900")}`}
              title="Approve"
            >
              <FaCheck size={13} />
              {withLabels && "Approve"}
            </button>
            <button
              onClick={() => handleReject(story)}
              className={`${btn} ${chip("bg-rose-50 text-rose-600 hover:bg-rose-100", "bg-rose-900/60 text-rose-300 hover:bg-rose-900")}`}
              title="Reject"
            >
              <FaTimes size={13} />
              {withLabels && "Reject"}
            </button>
          </>
        )}
        {story.status === "approved" &&
          (story.visibility === "hidden" ? (
            <button
              onClick={() => handleUnhide(story)}
              className={`${btn} ${chip("bg-emerald-50 text-emerald-600 hover:bg-emerald-100", "bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900")}`}
              title="Restore"
            >
              <FaUndo size={12} />
              {withLabels && "Restore"}
            </button>
          ) : (
            <button
              onClick={() => handleHide(story)}
              className={`${btn} ${chip("bg-amber-50 text-amber-600 hover:bg-amber-100", "bg-amber-900/60 text-amber-300 hover:bg-amber-900")}`}
              title="Hide"
            >
              <FaEyeSlash size={13} />
              {withLabels && "Hide"}
            </button>
          ))}
        <button
          onClick={() => handleDelete(story)}
          className={`${btn} ${chip("bg-gray-100 text-gray-500 hover:bg-rose-100 hover:text-rose-600", "bg-gray-700 text-gray-400 hover:bg-rose-900 hover:text-rose-300")}`}
          title="Delete"
        >
          <FaTrashAlt size={12} />
          {withLabels && "Delete"}
        </button>
      </>
    );
  };

  const statCards: StatCard[] = [
    {
      label: "Total Stories",
      value: stats?.total ?? pagination.total,
      sub: "Submitted by patients",
      icon: FaBookOpen,
      tone: "purple",
    },
    {
      label: "Pending Review",
      value: stats?.pending ?? stories.filter((s) => s.status === "pending").length,
      sub: "Waiting for moderation",
      icon: FaClock,
      tone: "cyan",
    },
    {
      label: "Approved",
      value: stats?.approved ?? stories.filter((s) => s.status === "approved").length,
      sub: "Published to patients",
      icon: FaCheckCircle,
      tone: "green",
    },
    {
      label: "Rejected",
      value: stats?.rejected ?? stories.filter((s) => s.status === "rejected").length,
      sub: "Not published",
      icon: FaTimesCircle,
      tone: "red",
    },
  ];

  const selectClass = `${TOOLBAR_SELECT} ${
    isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"
  }`;

  return (
    <div className={isDarkMode ? "text-gray-100" : "text-gray-900"}>
      {/* Stat Cards */}
      <StatCards cards={statCards} isDarkMode={isDarkMode} />

      {/* Table */}
      <div
        className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        {/* Toolbar: search + filter + sort */}
        <div
          className={`p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-[350px]">
            <button
              type="submit"
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
              aria-label="Search"
            >
              <FaSearch size={13} />
            </button>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or author"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </form>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as StoryStatusFilter)}
              className={selectClass}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as StorySort)}
              className={selectClass}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading stories...</div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Story", "Author", "Status", "Submitted"].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {stories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FaBookOpen
                        className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}
                      />
                      <p className="text-gray-500">No stories found</p>
                    </td>
                  </tr>
                )}
                {stories.map((story, index) => {
                  const author = getAuthor(story.author);
                  return (
                    <tr
                      key={story._id}
                      className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                    >
                      <td className="px-6 py-4 max-w-md">
                        <div className="font-medium truncate">{story.title}</div>
                        <div className={`text-xs truncate ${muted}`}>{story.body}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center whitespace-nowrap">
                          {author?.avatar ? (
                            <Image
                              src={author.avatar}
                              alt={authorName(story.author)}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover mr-2.5 shrink-0"
                            />
                          ) : (
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold mr-2.5 shrink-0 ${
                                AVATAR_COLORS[index % AVATAR_COLORS.length]
                              }`}
                            >
                              {authorName(story.author).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium">{authorName(story.author)}</div>
                            {author?.name && author.phone && (
                              <div className={`text-xs ${muted}`}>{author.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{statusBadge(story)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(story.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingId(story._id)}
                            className={`${ACTION_BTN} ${chip("bg-blue-50 text-blue-600 hover:bg-blue-100", "bg-blue-900/60 text-blue-300 hover:bg-blue-900")}`}
                            title="Read story"
                          >
                            <FaEye size={14} />
                          </button>
                          {renderActions(story)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <TablePagination
          page={pagination.page}
          pages={pagination.pages}
          limit={pagination.limit}
          total={pagination.total}
          itemLabel="stories"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => fetchPage(page)}
        />
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-xl ${
              isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
            }`}
          >
            <div
              className={`flex items-start gap-4 p-5 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">{viewing.title}</h2>
                <p className={`text-sm mt-1 ${muted}`}>
                  By {authorName(viewing.author)} · {formatDate(viewing.createdAt)}
                </p>
                <div className="mt-2">{statusBadge(viewing)}</div>
              </div>
              <button
                onClick={() => setViewingId(null)}
                className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {viewing.status === "rejected" && viewing.rejectionReason && (
                <div
                  className={`mb-4 p-3 rounded-lg text-sm ${isDarkMode ? "bg-red-950/40 text-red-300" : "bg-red-50 text-red-700"}`}
                >
                  Rejection reason: {viewing.rejectionReason}
                </div>
              )}
              <p className={`text-sm leading-relaxed whitespace-pre-line ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {viewing.body}
              </p>
            </div>

            <div
              className={`flex flex-wrap justify-end gap-2 p-5 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              {renderActions(viewing, true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryManagement;
