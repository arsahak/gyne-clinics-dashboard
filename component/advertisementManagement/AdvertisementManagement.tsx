"use client";
import {
  AdPagination,
  AdSort,
  AdStats,
  AdStatusFilter,
  AdvertisementRecord,
  deleteAdvertisement,
  getAdvertisementsPage,
  toggleAdvertisementActive,
} from "@/app/actions/advertisementManagement";
import StatCards, { StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { AD_PLACEMENT_LABELS, AD_PLACEMENTS, AdPlacement } from "@/lib/adPlacements";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaAd,
  FaBullhorn,
  FaEdit,
  FaEye,
  FaMousePointer,
  FaPause,
  FaPlay,
  FaPlus,
  FaSearch,
  FaTrashAlt,
} from "react-icons/fa";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: AdStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

const SORT_OPTIONS: { value: AdSort; label: string }[] = [
  { value: "priority", label: "Sort: Priority" },
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest" },
  { value: "impressions", label: "Sort: Most viewed" },
  { value: "clicks", label: "Sort: Most clicked" },
];

const TOOLBAR_SELECT =
  "px-3 py-2.5 rounded-lg border text-sm sm:min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500";

const ACTION_BTN =
  "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors";

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const ctr = (clicks: number, impressions: number) =>
  impressions > 0 ? `${((clicks / impressions) * 100).toFixed(1)}%` : "—";

interface AdvertisementManagementProps {
  initialAds: AdvertisementRecord[];
  initialPagination?: AdPagination;
  initialStats?: AdStats;
}

const AdvertisementManagement = ({
  initialAds,
  initialPagination,
  initialStats,
}: AdvertisementManagementProps) => {
  const { isDarkMode } = useSidebar();
  const [ads, setAds] = useState<AdvertisementRecord[]>(initialAds);
  const [pagination, setPagination] = useState<AdPagination>(
    initialPagination || { total: initialAds.length, page: 1, limit: PAGE_SIZE, pages: 1 },
  );
  const [stats, setStats] = useState<AdStats | undefined>(initialStats);
  const [placement, setPlacement] = useState<AdPlacement | "all">("all");
  const [status, setStatus] = useState<AdStatusFilter>("all");
  const [sort, setSort] = useState<AdSort>("priority");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  // Reference time for the Ended/Scheduled labels, taken once on page load.
  const [now] = useState(() => Date.now());

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const chip = (light: string, dark: string) => (isDarkMode ? dark : light);

  const fetchPage = async (
    page: number,
    overrides: {
      placement?: AdPlacement | "all";
      status?: AdStatusFilter;
      search?: string;
      sort?: AdSort;
    } = {},
  ): Promise<void> => {
    const query = { placement, status, search, sort, ...overrides };
    setLoading(true);
    const response = await getAdvertisementsPage({
      placement: query.placement,
      status: query.status,
      search: query.search || undefined,
      sort: query.sort,
      page,
      limit: PAGE_SIZE,
    });
    if (response.success && response.data) {
      // Deleting or pausing the last ad on the final filtered page empties it — step back.
      if (response.data.length === 0 && page > 1) {
        setLoading(false);
        return fetchPage(page - 1, overrides);
      }
      setAds(response.data);
      if (response.pagination) setPagination(response.pagination);
      if (response.stats) setStats(response.stats);
    } else {
      toast.error(response.error || "Failed to load advertisements");
    }
    setLoading(false);
  };

  const refresh = () => fetchPage(pagination.page);

  const handlePlacementChange = (value: AdPlacement | "all") => {
    setPlacement(value);
    fetchPage(1, { placement: value });
  };

  const handleStatusChange = (value: AdStatusFilter) => {
    setStatus(value);
    fetchPage(1, { status: value });
  };

  const handleSortChange = (value: AdSort) => {
    setSort(value);
    fetchPage(1, { sort: value });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPage(1);
  };

  const handleToggleActive = async (ad: AdvertisementRecord) => {
    const response = await toggleAdvertisementActive(ad._id, !ad.active);
    if (response.success) {
      toast.success(ad.active ? "Advertisement paused" : "Advertisement activated");
      await refresh();
    } else toast.error(response.error || "Failed to update advertisement");
  };

  const handleDelete = async (ad: AdvertisementRecord) => {
    if (!confirm(`Permanently delete "${ad.title}"?`)) return;
    const response = await deleteAdvertisement(ad._id);
    if (response.success) {
      toast.success("Advertisement deleted");
      await refresh();
    } else toast.error(response.error || "Failed to delete advertisement");
  };

  const scheduleCell = (ad: AdvertisementRecord) => {
    if (!ad.startDate && !ad.endDate) return <span className={muted}>Always on</span>;
    const ended = ad.endDate && new Date(ad.endDate).getTime() < now;
    const upcoming = ad.startDate && new Date(ad.startDate).getTime() > now;
    return (
      <>
        <div>
          {formatDate(ad.startDate)} – {formatDate(ad.endDate)}
        </div>
        {(ended || upcoming) && (
          <div className={`text-xs ${ended ? chip("text-red-600", "text-red-400") : chip("text-blue-600", "text-blue-400")}`}>
            {ended ? "Ended" : "Scheduled"}
          </div>
        )}
      </>
    );
  };

  const statCards: StatCard[] = [
    {
      label: "Total Ads",
      value: stats?.total ?? pagination.total,
      sub: "All advertisements",
      icon: FaBullhorn,
      tone: "blue",
    },
    {
      label: "Active",
      value: stats?.active ?? ads.filter((a) => a.active).length,
      sub: "Currently running",
      icon: FaPlay,
      tone: "fuchsia",
    },
    {
      label: "Impressions",
      value: (stats?.impressions ?? 0).toLocaleString("en-US"),
      sub: "Total ad views",
      icon: FaEye,
      tone: "amber",
    },
    {
      label: "Clicks",
      value: (stats?.clicks ?? 0).toLocaleString("en-US"),
      sub: `${ctr(stats?.clicks ?? 0, stats?.impressions ?? 0)} click-through rate`,
      icon: FaMousePointer,
      tone: "teal",
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
              placeholder="Search title or advertiser"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </form>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <select
              value={placement}
              onChange={(e) => handlePlacementChange(e.target.value as AdPlacement | "all")}
              className={selectClass}
            >
              <option value="all">All placements</option>
              {AD_PLACEMENTS.map((p) => (
                <option key={p} value={p}>
                  {AD_PLACEMENT_LABELS[p]}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as AdStatusFilter)}
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
              onChange={(e) => handleSortChange(e.target.value as AdSort)}
              className={selectClass}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Link
              href="/advertisements/add-advertisement"
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? "bg-white text-gray-900 hover:bg-gray-200"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              <FaPlus size={11} /> Add Advertisement
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading advertisements...</div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Ad", "Placement", "Priority", "Performance", "Schedule", "Status"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {ads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FaAd
                        className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}
                      />
                      <p className="text-gray-500">No advertisements found</p>
                    </td>
                  </tr>
                )}
                {ads.map((ad) => (
                  <tr key={ad._id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {ad.imageUrl ? (
                          <Image
                            src={ad.imageUrl}
                            alt={ad.title}
                            width={56}
                            height={40}
                            className="w-14 h-10 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-14 h-10 rounded-lg flex items-center justify-center shrink-0 ${chip("bg-blue-50 text-blue-600", "bg-blue-900/60 text-blue-300")}`}
                          >
                            <FaAd size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium max-w-xs truncate">{ad.title}</div>
                          {ad.advertiserName && (
                            <div className={`text-xs ${muted}`}>{ad.advertiserName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${chip("bg-gray-100 text-gray-700", "bg-gray-700 text-gray-300")}`}
                      >
                        {AD_PLACEMENT_LABELS[ad.placement]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{ad.priority}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1" title="Impressions">
                          <FaEye className="text-gray-400" size={12} />
                          {ad.impressions.toLocaleString("en-US")}
                        </span>
                        <span className="flex items-center gap-1" title="Clicks">
                          <FaMousePointer className="text-gray-400" size={11} />
                          {ad.clicks.toLocaleString("en-US")}
                        </span>
                      </div>
                      <div className={`text-xs mt-0.5 ${muted}`}>
                        CTR {ctr(ad.clicks, ad.impressions)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{scheduleCell(ad)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          ad.active
                            ? chip("bg-green-100 text-green-800", "bg-green-900 text-green-300")
                            : chip("bg-gray-100 text-gray-600", "bg-gray-700 text-gray-300")
                        }`}
                      >
                        {ad.active ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/advertisements/edit-advertisement/${ad._id}`}
                          className={`${ACTION_BTN} ${chip("bg-blue-50 text-blue-600 hover:bg-blue-100", "bg-blue-900/60 text-blue-300 hover:bg-blue-900")}`}
                          title="Edit"
                        >
                          <FaEdit size={13} />
                        </Link>
                        {ad.active ? (
                          <button
                            onClick={() => handleToggleActive(ad)}
                            className={`${ACTION_BTN} ${chip("bg-amber-50 text-amber-600 hover:bg-amber-100", "bg-amber-900/60 text-amber-300 hover:bg-amber-900")}`}
                            title="Pause"
                          >
                            <FaPause size={11} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(ad)}
                            className={`${ACTION_BTN} ${chip("bg-emerald-50 text-emerald-600 hover:bg-emerald-100", "bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900")}`}
                            title="Activate"
                          >
                            <FaPlay size={11} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(ad)}
                          className={`${ACTION_BTN} ${chip("bg-gray-100 text-gray-500 hover:bg-rose-100 hover:text-rose-600", "bg-gray-700 text-gray-400 hover:bg-rose-900 hover:text-rose-300")}`}
                          title="Delete"
                        >
                          <FaTrashAlt size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <TablePagination
          page={pagination.page}
          pages={pagination.pages}
          limit={pagination.limit}
          total={pagination.total}
          itemLabel="ads"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => fetchPage(page)}
        />
      </div>
    </div>
  );
};

export default AdvertisementManagement;
