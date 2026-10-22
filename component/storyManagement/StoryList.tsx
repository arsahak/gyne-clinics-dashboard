"use client";
import {
  deleteStory,
  getStoriesPage,
  setStoryStatus,
  type Story,
  type StoryPagination,
  type StorySort,
  type StoryStats,
  type StoryStatus,
  type StoryStatusFilter,
  type StoryTopic,
} from "@/app/actions/storyAction";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaBookOpen, FaCheckCircle, FaClock, FaCommentDots, FaEdit, FaEye, FaSearch, FaTimesCircle, FaTrashAlt, FaUserSecret } from "react-icons/fa";
import { bylineFor, formatDay, STATUS_META, STATUS_ORDER, STORY_COVER, STORY_TOPICS } from "./storyMeta";
import { StoryRowsSkeleton } from "./StorySkeletons";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: StoryStatusFilter; label: string }[] = [
  { value: "all", label: "All stories" },
  { value: "pending", label: "Waiting for review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "hidden", label: "Hidden" },
];

const SORT_OPTIONS: { value: StorySort; label: string }[] = [
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest first" },
  { value: "title_asc", label: "Sort: Title A–Z" },
  { value: "title_desc", label: "Sort: Title Z–A" },
];

const TOOLBAR_SELECT = "px-3 py-2.5 rounded-lg border text-sm sm:min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500";
const ACTION_BTN = "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50";

const excerpt = (text: string) => (text.length > 90 ? `${text.slice(0, 90).replace(/\s+\S*$/, "")}…` : text);

interface StoryListProps {
  initialStories: Story[];
  initialPagination?: StoryPagination;
  initialStats?: StoryStats;
  /** The status the list opens on. */
  initialStatus?: StoryStatusFilter;
}

/** Community stories: review queue, filters, status dropdown, review / edit / delete. */
const StoryList = ({ initialStories, initialPagination, initialStats, initialStatus = "all" }: StoryListProps) => {
  const { isDarkMode } = useSidebar();
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [pagination, setPagination] = useState<StoryPagination>(
    initialPagination || { total: initialStories.length, page: 1, limit: PAGE_SIZE, pages: 1 },
  );
  const [stats, setStats] = useState<StoryStats | undefined>(initialStats);
  const [status, setStatus] = useState<StoryStatusFilter>(initialStatus);
  const [topic, setTopic] = useState<StoryTopic | "">("");
  const [sort, setSort] = useState<StorySort>("newest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const theme = isDarkMode ? "dark" : "light";
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const chip = (light: string, dark: string) => (isDarkMode ? dark : light);

  const fetchPage = async (
    page: number,
    overrides: { status?: StoryStatusFilter; topic?: StoryTopic | ""; search?: string; sort?: StorySort } = {},
  ): Promise<void> => {
    const query = { status, topic, search, sort, ...overrides };
    setLoading(true);
    const response = await getStoriesPage({
      status: query.status,
      topic: query.topic || undefined,
      search: query.search || undefined,
      sort: query.sort,
      page,
      limit: PAGE_SIZE,
    });
    if (response.success && response.data) {
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

  const handleStatus = async (story: Story, next: StoryStatus) => {
    setBusyId(story._id);
    const response = await setStoryStatus(story._id, next);
    setBusyId(null);
    if (response.success) {
      toast.success(`“${story.title}”: ${STATUS_META[next].label.toLowerCase()}`);
      await fetchPage(pagination.page);
    } else toast.error(response.error || "Failed to update the story");
  };

  const handleDelete = async (story: Story) => {
    setBusyId(story._id);
    const response = await deleteStory(story._id);
    setBusyId(null);
    if (response.success) {
      toast.success("Story deleted");
      await fetchPage(pagination.page);
    } else toast.error(response.error || "Failed to delete the story");
  };

  const statCards: StatCard[] = [
    {
      label: "Waiting for Review",
      value: stats?.pending ?? stories.filter((s) => s.status === "pending").length,
      sub: "Sent by patients",
      icon: FaClock,
      tone: "amber",
    },
    {
      label: "Approved",
      value: stats?.approved ?? stories.filter((s) => s.status === "approved").length,
      sub: "In Learn → Stories",
      icon: FaCheckCircle,
      tone: "lime",
    },
    {
      label: "Rejected",
      value: stats?.rejected ?? stories.filter((s) => s.status === "rejected").length,
      sub: "The patient sees why",
      icon: FaTimesCircle,
      tone: "rose",
    },
    { label: "All Stories", value: stats?.total ?? pagination.total, sub: `${stats?.hidden ?? 0} hidden`, icon: FaBookOpen, tone: "indigo" },
  ];

  const selectClass = `${TOOLBAR_SELECT} ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`;

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      <StatCards cards={statCards} isDarkMode={isDarkMode} />

      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        {/* Toolbar */}
        <div
          className={`p-4 flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchPage(1);
            }}
            className="relative w-full xl:w-[350px]"
          >
            <button
              type="submit"
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              aria-label="Search"
            >
              <FaSearch size={13} />
            </button>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, story or patient"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </form>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) => {
                const value = e.target.value as StoryStatusFilter;
                setStatus(value);
                fetchPage(1, { status: value });
              }}
              className={selectClass}
              aria-label="Status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={topic}
              onChange={(e) => {
                const value = e.target.value as StoryTopic | "";
                setTopic(value);
                fetchPage(1, { topic: value });
              }}
              className={selectClass}
              aria-label="Topic"
            >
              <option value="">All topics</option>
              {STORY_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => {
                const value = e.target.value as StorySort;
                setSort(value);
                fetchPage(1, { sort: value });
              }}
              className={selectClass}
              aria-label="Sort"
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
          <table className="w-full" aria-busy={loading}>
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                {["Story", "Shared by", "Topic", "Sent", "Status"].map((heading) => (
                  <th key={heading} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                    {heading}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <StoryRowsSkeleton />
              ) : stories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <FaCommentDots className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <p className="font-medium">{status === "pending" ? "Nothing waiting for review" : "No stories here"}</p>
                    <p className={`mt-1 text-sm ${muted}`}>Patients share stories from the app&apos;s Learn page. New ones land here.</p>
                  </td>
                </tr>
              ) : (
                stories.map((story) => {
                  const meta = STATUS_META[story.status];
                  const busy = busyId === story._id;
                  return (
                    <tr
                      key={story._id}
                      className={`transition-opacity ${busy ? "opacity-50" : ""} ${
                        story.status === "pending" ? chip("bg-amber-50/40", "bg-amber-900/10") : ""
                      } ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}
                    >
                      {/* Story */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {story.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={story.imageUrl} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span
                              className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg text-white/90"
                              style={{ background: `linear-gradient(135deg, ${STORY_COVER.from}, ${STORY_COVER.to})` }}
                            >
                              <FaCommentDots size={14} />
                            </span>
                          )}
                          <div className="min-w-0">
                            <Link href={`/stories/${story._id}`} className="block max-w-xs truncate font-medium hover:underline">
                              {story.title}
                            </Link>
                            <div className={`max-w-xs truncate text-xs ${muted}`}>{excerpt(story.body)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Shared by */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1.5 font-medium">
                          {story.anonymous && <FaUserSecret className={muted} title="Published anonymously" />}
                          {bylineFor(story)}
                        </div>
                        <div className={`text-xs ${muted}`}>{story.patient?.fullName || story.patient?.phone || "—"}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${chip("bg-purple-50 text-purple-700", "bg-purple-900/50 text-purple-200")}`}>
                          {story.topic}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDay(story.createdAt)}</td>

                      {/* Status: change it right here */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={story.status}
                          disabled={busy}
                          onChange={(e) => handleStatus(story, e.target.value as StoryStatus)}
                          aria-label={`Status of ${story.title}`}
                          title={story.status === "rejected" ? story.rejectionReason || "Rejected" : meta.hint}
                          className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-wait ${meta[theme]}`}
                        >
                          {STATUS_ORDER.map((value) => (
                            <option key={value} value={value}>
                              {STATUS_META[value].label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/stories/${story._id}`}
                            className={`${ACTION_BTN} ${chip("bg-blue-50 text-blue-600 hover:bg-blue-100", "bg-blue-900/60 text-blue-300 hover:bg-blue-900")}`}
                            title={story.status === "pending" ? "Review story" : "View story"}
                          >
                            <FaEye size={14} />
                          </Link>
                          <Link
                            href={`/stories/edit/${story._id}`}
                            className={`${ACTION_BTN} ${chip("bg-amber-50 text-amber-600 hover:bg-amber-100", "bg-amber-900/60 text-amber-300 hover:bg-amber-900")}`}
                            title="Edit story"
                          >
                            <FaEdit size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(story)}
                            disabled={busy}
                            className={`${ACTION_BTN} ${chip("bg-rose-50 text-rose-600 hover:bg-rose-100", "bg-rose-900/60 text-rose-300 hover:bg-rose-900")}`}
                            title="Delete story"
                          >
                            <FaTrashAlt size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
    </div>
  );
};

export default StoryList;
