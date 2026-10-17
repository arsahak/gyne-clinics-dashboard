"use client";
import {
  Content,
  ContentPagination,
  ContentSort,
  ContentStats,
  ContentStatusFilter,
  deleteContent,
  getContentsPage,
  hideContent,
  unhideContent,
} from "@/app/actions/content";
import StatCards, { StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaFileAlt,
  FaImage,
  FaNewspaper,
  FaPen,
  FaPlus,
  FaSearch,
  FaTrashAlt,
} from "react-icons/fa";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: ContentStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "hidden", label: "Hidden" },
  { value: "sponsored", label: "Sponsored" },
];

const SORT_OPTIONS: { value: ContentSort; label: string }[] = [
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest" },
  { value: "title_asc", label: "Sort: Title A–Z" },
  { value: "title_desc", label: "Sort: Title Z–A" },
];

const VISIBILITY_LABELS: Record<Content["visibility"], string> = {
  published: "Published",
  draft: "Draft",
  hidden: "Hidden",
};

const FORMAT_ICONS: Record<Content["format"], typeof FaFileAlt> = {
  text: FaFileAlt,
  image: FaImage,
  blog: FaNewspaper,
};

const TOOLBAR_SELECT =
  "px-3 py-2.5 rounded-lg border text-sm sm:min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500";

const ACTION_BTN =
  "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors";

interface ContentManagementProps {
  initialContents: Content[];
  initialPagination?: ContentPagination;
  initialStats?: ContentStats;
  initialCategories: string[];
}

const ContentManagement = ({
  initialContents,
  initialPagination,
  initialStats,
  initialCategories,
}: ContentManagementProps) => {
  const { isDarkMode } = useSidebar();
  const [contents, setContents] = useState<Content[]>(initialContents);
  const [pagination, setPagination] = useState<ContentPagination>(
    initialPagination || { total: initialContents.length, page: 1, limit: PAGE_SIZE, pages: 1 },
  );
  const [stats, setStats] = useState<ContentStats | undefined>(initialStats);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ContentStatusFilter>("all");
  const [sort, setSort] = useState<ContentSort>("newest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const chip = (light: string, dark: string) => (isDarkMode ? dark : light);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchPage = async (
    page: number,
    overrides: {
      category?: string;
      status?: ContentStatusFilter;
      search?: string;
      sort?: ContentSort;
    } = {},
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
      // Deleting the last item on the final page leaves it empty — step back a page.
      if (response.data.length === 0 && page > 1) {
        setLoading(false);
        return fetchPage(page - 1, overrides);
      }
      setContents(response.data);
      if (response.pagination) setPagination(response.pagination);
      if (response.stats) setStats(response.stats);
      if (response.categories) setCategories(response.categories);
    } else {
      toast.error(response.error || "Failed to load content");
    }
    setLoading(false);
  };

  const refresh = () => fetchPage(pagination.page);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    fetchPage(1, { category: value });
  };

  const handleStatusChange = (value: ContentStatusFilter) => {
    setStatus(value);
    fetchPage(1, { status: value });
  };

  const handleSortChange = (value: ContentSort) => {
    setSort(value);
    fetchPage(1, { sort: value });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPage(1);
  };

  const handleHide = async (content: Content) => {
    const input = window.prompt(`Reason for hiding "${content.title}" (optional):`);
    if (input === null) return;
    const response = await hideContent(content._id, input.trim() || undefined);
    if (response.success) {
      toast.success("Content hidden");
      await refresh();
    } else toast.error(response.error || "Failed to hide content");
  };

  const handleUnhide = async (content: Content) => {
    const response = await unhideContent(content._id);
    if (response.success) {
      toast.success("Content restored");
      await refresh();
    } else toast.error(response.error || "Failed to restore content");
  };

  const handleDelete = async (content: Content) => {
    if (!confirm(`Permanently delete "${content.title}"?`)) return;
    const response = await deleteContent(content._id);
    if (response.success) {
      toast.success("Content deleted");
      await refresh();
    } else toast.error(response.error || "Failed to delete content");
  };

  const getVisibilityBadge = (value: Content["visibility"]) => {
    const colors: Record<Content["visibility"], string> = {
      published: chip("bg-green-100 text-green-800", "bg-green-900 text-green-300"),
      draft: chip("bg-amber-100 text-amber-800", "bg-amber-900 text-amber-300"),
      hidden: chip("bg-red-100 text-red-800", "bg-red-900 text-red-300"),
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${colors[value]}`}>
        {VISIBILITY_LABELS[value]}
      </span>
    );
  };

  const statCards: StatCard[] = [
    {
      label: "Total Content",
      value: stats?.total ?? pagination.total,
      sub: "All content items",
      icon: FaFileAlt,
      tone: "indigo",
    },
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
      sub: "Removed by moderation",
      icon: FaEyeSlash,
      tone: "slate",
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
        {/* Toolbar: search + filters + sort + add */}
        <div
          className={`p-4 flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <form onSubmit={handleSearchSubmit} className="relative w-full xl:w-[350px]">
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
              placeholder="Search title, category or sponsor"
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
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={selectClass}
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as ContentStatusFilter)}
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
              onChange={(e) => handleSortChange(e.target.value as ContentSort)}
              className={selectClass}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Link
              href="/content/add-content"
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? "bg-white text-gray-900 hover:bg-gray-200"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              <FaPlus size={11} /> Add Content
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading content...</div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Content", "Category", "Format", "Visibility", "Created"].map((heading) => (
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
                {contents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FaFileAlt
                        className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}
                      />
                      <p className="text-gray-500">No content found</p>
                    </td>
                  </tr>
                )}
                {contents.map((content) => {
                  const FormatIcon = FORMAT_ICONS[content.format] || FaFileAlt;
                  return (
                    <tr
                      key={content._id}
                      className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {content.imageUrl ? (
                            <Image
                              src={content.imageUrl}
                              alt={content.title}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-cover mr-3 shrink-0"
                            />
                          ) : (
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center mr-3 shrink-0 ${chip("bg-blue-50 text-blue-600", "bg-blue-900/60 text-blue-300")}`}
                            >
                              <FormatIcon size={15} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium max-w-xs truncate">{content.title}</span>
                              {content.sponsored && (
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${chip("bg-purple-100 text-purple-700", "bg-purple-900 text-purple-300")}`}
                                >
                                  SPONSORED
                                </span>
                              )}
                            </div>
                            <div className={`text-xs ${muted}`}>
                              {content.sponsored && content.sponsorName
                                ? `by ${content.sponsorName}`
                                : content.readTimeMinutes
                                  ? `${content.readTimeMinutes} min read`
                                  : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{content.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full capitalize ${chip("bg-gray-100 text-gray-700", "bg-gray-700 text-gray-300")}`}
                        >
                          <FormatIcon size={10} />
                          {content.format}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVisibilityBadge(content.visibility)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(content.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/content/edit-content/${content._id}`}
                            className={`${ACTION_BTN} ${chip("bg-blue-50 text-blue-600 hover:bg-blue-100", "bg-blue-900/60 text-blue-300 hover:bg-blue-900")}`}
                            title="Edit"
                          >
                            <FaEdit size={13} />
                          </Link>
                          {content.visibility === "hidden" ? (
                            <button
                              onClick={() => handleUnhide(content)}
                              className={`${ACTION_BTN} ${chip("bg-emerald-50 text-emerald-600 hover:bg-emerald-100", "bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900")}`}
                              title="Restore"
                            >
                              <FaEye size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleHide(content)}
                              className={`${ACTION_BTN} ${chip("bg-amber-50 text-amber-600 hover:bg-amber-100", "bg-amber-900/60 text-amber-300 hover:bg-amber-900")}`}
                              title="Hide"
                            >
                              <FaEyeSlash size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(content)}
                            className={`${ACTION_BTN} ${chip("bg-gray-100 text-gray-500 hover:bg-rose-100 hover:text-rose-600", "bg-gray-700 text-gray-400 hover:bg-rose-900 hover:text-rose-300")}`}
                            title="Delete"
                          >
                            <FaTrashAlt size={12} />
                          </button>
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
          itemLabel="items"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => fetchPage(page)}
        />
      </div>
    </div>
  );
};

export default ContentManagement;
