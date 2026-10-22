"use client";
import {
  type Content,
  type ContentPagination,
  type ContentSort,
  type ContentStats,
  type ContentStatusFilter,
  deleteContent,
  getContentsPage,
  updateContent,
} from "@/app/actions/content";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaCheckCircle, FaEdit, FaEye, FaEyeSlash, FaFileAlt, FaPen, FaPlus, FaSearch, FaTrashAlt } from "react-icons/fa";
import { CATEGORY_COVER, CONTENT_CATEGORIES, FORMAT_META } from "./contentMeta";
import { ContentRowsSkeleton } from "./ContentSkeletons";

type Visibility = Content["visibility"];

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: ContentStatusFilter; label: string }[] = [
  { value: "all", label: "All content" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "hidden", label: "Hidden" },
  { value: "sponsored", label: "Sponsored" },
];

const SORT_OPTIONS: { value: ContentSort; label: string }[] = [
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest" },
  { value: "title_asc", label: "Sort: Title A–Z" },
  { value: "title_desc", label: "Sort: Title Z–A" },
];

export const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "hidden", label: "Hidden" },
];

/** Dropdown colours per visibility, light / dark. */
export const VISIBILITY_COLORS: Record<Visibility, [string, string]> = {
  published: ["bg-green-50 text-green-800 border-green-200", "bg-green-900/50 text-green-300 border-green-800"],
  draft: ["bg-amber-50 text-amber-800 border-amber-200", "bg-amber-900/50 text-amber-300 border-amber-800"],
  hidden: ["bg-gray-100 text-gray-700 border-gray-300", "bg-gray-700 text-gray-200 border-gray-600"],
};

const TOOLBAR_SELECT = "px-3 py-2.5 rounded-lg border text-sm sm:min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500";
const ACTION_BTN = "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

interface ContentListProps {
  initialContents: Content[];
  initialPagination?: ContentPagination;
  initialStats?: ContentStats;
}

/** Learn-feed content: list, filters, visibility dropdown, view / edit / delete. */
const ContentList = ({ initialContents, initialPagination, initialStats }: ContentListProps) => {
  const { isDarkMode } = useSidebar();
  const [contents, setContents] = useState<Content[]>(initialContents);
  const [pagination, setPagination] = useState<ContentPagination>(
    initialPagination || { total: initialContents.length, page: 1, limit: PAGE_SIZE, pages: 1 },
  );
  const [stats, setStats] = useState<ContentStats | undefined>(initialStats);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ContentStatusFilter>("all");
  const [sort, setSort] = useState<ContentSort>("newest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  /** Row being saved (visibility change or delete). */
  const [busyId, setBusyId] = useState<string | null>(null);

  const theme = isDarkMode ? 1 : 0;
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const chip = (light: string, dark: string) => (isDarkMode ? dark : light);

  const fetchPage = async (
    page: number,
    overrides: { category?: string; status?: ContentStatusFilter; search?: string; sort?: ContentSort } = {},
  ): Promise<void> => {
    const query = { category, status, search, sort, ...overrides };
    setLoading(true);
    const response = await getContentsPage({
      category: query.category || undefined,
      status: query.status,
      search: query.search || undefined,
      sort: query.sort,
      page,
      limit: PAGE_SIZE,
    });
    if (response.success && response.data) {
      // Deleting the last item on the last page leaves it empty: step back a page.
      if (response.data.length === 0 && page > 1) {
        setLoading(false);
        return fetchPage(page - 1, overrides);
      }
      setContents(response.data);
      if (response.pagination) setPagination(response.pagination);
      if (response.stats) setStats(response.stats);
    } else {
      toast.error(response.error || "Failed to load content");
    }
    setLoading(false);
  };

  const handleVisibility = async (content: Content, visibility: Visibility) => {
    setBusyId(content._id);
    const response = await updateContent(content._id, { visibility });
    setBusyId(null);
    if (response.success) {
      toast.success(`“${content.title}” is now ${visibility}`);
      await fetchPage(pagination.page);
    } else toast.error(response.error || "Failed to change visibility");
  };

  const handleDelete = async (content: Content) => {
    setBusyId(content._id);
    const response = await deleteContent(content._id);
    setBusyId(null);
    if (response.success) {
      toast.success("Content deleted");
      await fetchPage(pagination.page);
    } else toast.error(response.error || "Failed to delete content");
  };

  const statCards: StatCard[] = [
    { label: "Total Content", value: stats?.total ?? pagination.total, sub: "In the app's Learn page", icon: FaFileAlt, tone: "indigo" },
    {
      label: "Published",
      value: stats?.published ?? contents.filter((c) => c.visibility === "published").length,
      sub: "Visible to patients",
      icon: FaCheckCircle,
      tone: "lime",
    },
    {
      label: "Drafts",
      value: stats?.draft ?? contents.filter((c) => c.visibility === "draft").length,
      sub: "Not published yet",
      icon: FaPen,
      tone: "yellow",
    },
    {
      label: "Hidden",
      value: stats?.hidden ?? contents.filter((c) => c.visibility === "hidden").length,
      sub: "Taken down for now",
      icon: FaEyeSlash,
      tone: "slate",
    },
  ];

  const selectClass = `${TOOLBAR_SELECT} ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`;

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      <StatCards cards={statCards} isDarkMode={isDarkMode} />

      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        {/* Toolbar: search + filters + sort + add */}
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
              placeholder="Search title, author or sponsor"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </form>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                fetchPage(1, { category: e.target.value });
              }}
              className={selectClass}
              aria-label="Category"
            >
              <option value="">All categories</option>
              {CONTENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => {
                const value = e.target.value as ContentStatusFilter;
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
              value={sort}
              onChange={(e) => {
                const value = e.target.value as ContentSort;
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
            <Link
              href="/content/add"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors whitespace-nowrap"
            >
              <FaPlus size={12} /> Add Content
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" aria-busy={loading}>
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                {["Content", "Category", "Format", "Visibility", "Updated"].map((heading) => (
                  <th key={heading} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                    {heading}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <ContentRowsSkeleton />
              ) : contents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <FaFileAlt className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <p className="font-medium">No content yet</p>
                    <p className={`mt-1 text-sm ${muted}`}>Articles, blogs and stories you add show in the app&apos;s Learn page.</p>
                    <Link
                      href="/content/add"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800"
                    >
                      <FaPlus size={12} /> Add Content
                    </Link>
                  </td>
                </tr>
              ) : (
                contents.map((content) => {
                  const format = FORMAT_META[content.format] ?? FORMAT_META.guide;
                  const cover = CATEGORY_COVER[content.category] ?? CATEGORY_COVER.Wellness;
                  const busy = busyId === content._id;
                  return (
                    <tr key={content._id} className={`transition-opacity ${busy ? "opacity-50" : ""} ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                      {/* Content */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {content.imageUrl ? (
                            <Image
                              src={content.imageUrl}
                              alt=""
                              width={56}
                              height={40}
                              className="h-10 w-14 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg text-white/90"
                              style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
                            >
                              <format.icon size={14} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link href={`/content/${content._id}`} className="max-w-xs truncate font-medium hover:underline">
                                {content.title}
                              </Link>
                              {content.sponsored && (
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip("bg-purple-100 text-purple-700", "bg-purple-900 text-purple-300")}`}>
                                  Sponsored
                                </span>
                              )}
                            </div>
                            <div className={`text-xs ${muted}`}>
                              {[
                                content.authorName,
                                content.readTimeMinutes ? `${content.readTimeMinutes} min read` : null,
                                content.sponsored && content.sponsorName ? `sponsored by ${content.sponsorName}` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${chip("bg-blue-50 text-blue-700", "bg-blue-900/50 text-blue-200")}`}>
                          {content.category || "—"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${chip("bg-gray-100 text-gray-700", "bg-gray-700 text-gray-300")}`}>
                          <format.icon size={10} /> {format.label}
                        </span>
                      </td>

                      {/* Visibility: change it right here */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={content.visibility}
                          disabled={busy}
                          onChange={(e) => handleVisibility(content, e.target.value as Visibility)}
                          aria-label={`Visibility of ${content.title}`}
                          className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-wait ${VISIBILITY_COLORS[content.visibility][theme]}`}
                        >
                          {VISIBILITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(content.updatedAt || content.createdAt)}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/content/${content._id}`}
                            className={`${ACTION_BTN} ${chip("bg-blue-50 text-blue-600 hover:bg-blue-100", "bg-blue-900/60 text-blue-300 hover:bg-blue-900")}`}
                            title="View content"
                          >
                            <FaEye size={14} />
                          </Link>
                          <Link
                            href={`/content/edit/${content._id}`}
                            className={`${ACTION_BTN} ${chip("bg-amber-50 text-amber-600 hover:bg-amber-100", "bg-amber-900/60 text-amber-300 hover:bg-amber-900")}`}
                            title="Edit content"
                          >
                            <FaEdit size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(content)}
                            disabled={busy}
                            className={`${ACTION_BTN} ${chip("bg-rose-50 text-rose-600 hover:bg-rose-100", "bg-rose-900/60 text-rose-300 hover:bg-rose-900")}`}
                            title="Delete content"
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
          itemLabel="items"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => fetchPage(page)}
        />
      </div>
    </div>
  );
};

export default ContentList;
