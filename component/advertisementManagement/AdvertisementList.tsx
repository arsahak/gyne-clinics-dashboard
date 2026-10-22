"use client";
import {
  type AdPagination,
  type AdSlot,
  type AdSort,
  type AdStats,
  type AdStatusFilter,
  type AdvertisementRecord,
  deleteAdvertisement,
  getAdvertisementsPage,
  updateAdvertisement,
} from "@/app/actions/advertisementAction";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaBullhorn, FaChartLine, FaEdit, FaEye, FaMousePointer, FaPlay, FaPlus, FaSearch, FaTrashAlt } from "react-icons/fa";
import { AD_SLOTS, AD_TONES, adStatus, ctr, scheduleLabel, SLOT_LABEL, STATUS_META } from "./adMeta";
import { AdvertisementRowsSkeleton } from "./AdvertisementSkeletons";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: AdStatusFilter; label: string }[] = [
  { value: "all", label: "All ads" },
  { value: "live", label: "Live now" },
  { value: "scheduled", label: "Scheduled" },
  { value: "paused", label: "Paused" },
  { value: "ended", label: "Ended" },
];

const SORT_OPTIONS: { value: AdSort; label: string }[] = [
  { value: "priority", label: "Sort: Priority" },
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest" },
  { value: "impressions", label: "Sort: Most seen" },
  { value: "clicks", label: "Sort: Most clicked" },
];

const TOOLBAR_SELECT = "px-3 py-2.5 rounded-lg border text-sm sm:min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500";
const ACTION_BTN = "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50";

const compact = (n: number) => new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(n);

interface AdvertisementListProps {
  initialAds: AdvertisementRecord[];
  initialPagination?: AdPagination;
  initialStats?: AdStats;
}

/** Ads in the webapp: list, filters, on/off switch, view / edit / delete. */
const AdvertisementList = ({ initialAds, initialPagination, initialStats }: AdvertisementListProps) => {
  const { isDarkMode } = useSidebar();
  const [ads, setAds] = useState<AdvertisementRecord[]>(initialAds);
  const [pagination, setPagination] = useState<AdPagination>(
    initialPagination || { total: initialAds.length, page: 1, limit: PAGE_SIZE, pages: 1 },
  );
  const [stats, setStats] = useState<AdStats | undefined>(initialStats);
  const [placement, setPlacement] = useState<AdSlot | "all">("all");
  const [status, setStatus] = useState<AdStatusFilter>("all");
  const [sort, setSort] = useState<AdSort>("priority");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const theme = isDarkMode ? "dark" : "light";
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const chip = (light: string, dark: string) => (isDarkMode ? dark : light);

  const fetchPage = async (
    page: number,
    overrides: { placement?: AdSlot | "all"; status?: AdStatusFilter; search?: string; sort?: AdSort } = {},
  ): Promise<void> => {
    const query = { placement, status, search, sort, ...overrides };
    setLoading(true);
    const response = await getAdvertisementsPage({ ...query, search: query.search || undefined, page, limit: PAGE_SIZE });
    if (response.success && response.data) {
      if (response.data.length === 0 && page > 1) {
        setLoading(false);
        return fetchPage(page - 1, overrides);
      }
      setAds(response.data);
      if (response.pagination) setPagination(response.pagination);
      if (response.stats) setStats(response.stats);
    } else {
      toast.error(response.error || "Failed to load ads");
    }
    setLoading(false);
  };

  const handleActive = async (ad: AdvertisementRecord) => {
    setBusyId(ad._id);
    const response = await updateAdvertisement(ad._id, { active: !ad.active });
    setBusyId(null);
    if (response.success) {
      toast.success(ad.active ? "Ad paused" : "Ad switched on");
      await fetchPage(pagination.page);
    } else toast.error(response.error || "Failed to update the ad");
  };

  const handleDelete = async (ad: AdvertisementRecord) => {
    setBusyId(ad._id);
    const response = await deleteAdvertisement(ad._id);
    setBusyId(null);
    if (response.success) {
      toast.success("Ad deleted");
      await fetchPage(pagination.page);
    } else toast.error(response.error || "Failed to delete the ad");
  };

  const totalImpressions = stats?.impressions ?? ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = stats?.clicks ?? ads.reduce((sum, ad) => sum + ad.clicks, 0);

  const statCards: StatCard[] = [
    { label: "Total Ads", value: stats?.total ?? pagination.total, sub: "All campaigns", icon: FaBullhorn, tone: "indigo" },
    {
      label: "Live Now",
      value: stats?.live ?? ads.filter((ad) => adStatus(ad) === "live").length,
      sub: "Showing to patients",
      icon: FaPlay,
      tone: "lime",
    },
    { label: "Impressions", value: compact(totalImpressions), sub: "Times shown", icon: FaChartLine, tone: "sky" },
    {
      label: "Clicks",
      value: compact(totalClicks),
      sub: `Click rate ${ctr({ impressions: totalImpressions, clicks: totalClicks })}`,
      icon: FaMousePointer,
      tone: "amber",
    },
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
              placeholder="Search headline or advertiser"
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
              onChange={(e) => {
                const value = e.target.value as AdSlot | "all";
                setPlacement(value);
                fetchPage(1, { placement: value });
              }}
              className={selectClass}
              aria-label="Placement"
            >
              <option value="all">All placements</option>
              {AD_SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => {
                const value = e.target.value as AdStatusFilter;
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
                const value = e.target.value as AdSort;
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
              href="/advertisements/add"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors whitespace-nowrap"
            >
              <FaPlus size={12} /> Add Ad
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" aria-busy={loading}>
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                {["Ad", "Shows in", "Schedule", "Status", "Performance"].map((heading) => (
                  <th key={heading} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                    {heading}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <AdvertisementRowsSkeleton />
              ) : ads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <FaBullhorn className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <p className="font-medium">No ads yet</p>
                    <p className={`mt-1 text-sm ${muted}`}>Ads you add show as labelled banners in the app.</p>
                    <Link
                      href="/advertisements/add"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800"
                    >
                      <FaPlus size={12} /> Add Ad
                    </Link>
                  </td>
                </tr>
              ) : (
                ads.map((ad) => {
                  const state = adStatus(ad);
                  const meta = STATUS_META[state];
                  const tone = AD_TONES[ad.tone] ?? AD_TONES.primary;
                  const busy = busyId === ad._id;
                  return (
                    <tr key={ad._id} className={`transition-opacity ${busy ? "opacity-50" : ""} ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                      {/* Ad */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {ad.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ad.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                              style={{ background: tone.color }}
                            >
                              <FaBullhorn size={14} />
                            </span>
                          )}
                          <div className="min-w-0">
                            <Link href={`/advertisements/${ad._id}`} className="block max-w-xs truncate font-medium hover:underline">
                              {ad.headline}
                            </Link>
                            <div className={`text-xs ${muted}`}>
                              {ad.advertiser}
                              {ad.priceGBP ? ` · £${ad.priceGBP.toFixed(2)}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Placements */}
                      <td className="px-6 py-4">
                        <div className="flex max-w-56 flex-wrap gap-1">
                          {ad.placements.slice(0, 2).map((slot) => (
                            <span key={slot} className={`rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${chip("bg-blue-50 text-blue-700", "bg-blue-900/50 text-blue-200")}`}>
                              {SLOT_LABEL[slot] ?? slot}
                            </span>
                          ))}
                          {ad.placements.length > 2 && (
                            <span
                              title={ad.placements.slice(2).map((slot) => SLOT_LABEL[slot] ?? slot).join(", ")}
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${chip("bg-gray-100 text-gray-600", "bg-gray-700 text-gray-300")}`}
                            >
                              +{ad.placements.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${ad.startDate || ad.endDate ? "" : muted}`}>{scheduleLabel(ad)}</td>

                      {/* Status + on/off */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={ad.active}
                            aria-label={`${ad.active ? "Pause" : "Switch on"} ${ad.headline}`}
                            disabled={busy}
                            onClick={() => handleActive(ad)}
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-wait ${
                              ad.active ? "bg-emerald-600" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${ad.active ? "translate-x-4" : "translate-x-0.5"}`} />
                          </button>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta[theme]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                          </span>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="tabular-nums">
                          {compact(ad.impressions)} <span className={muted}>seen</span> · {compact(ad.clicks)} <span className={muted}>clicks</span>
                        </div>
                        <div className={`text-xs ${muted}`}>Click rate {ctr(ad)}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/advertisements/${ad._id}`}
                            className={`${ACTION_BTN} ${chip("bg-blue-50 text-blue-600 hover:bg-blue-100", "bg-blue-900/60 text-blue-300 hover:bg-blue-900")}`}
                            title="View ad"
                          >
                            <FaEye size={14} />
                          </Link>
                          <Link
                            href={`/advertisements/edit/${ad._id}`}
                            className={`${ACTION_BTN} ${chip("bg-amber-50 text-amber-600 hover:bg-amber-100", "bg-amber-900/60 text-amber-300 hover:bg-amber-900")}`}
                            title="Edit ad"
                          >
                            <FaEdit size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(ad)}
                            disabled={busy}
                            className={`${ACTION_BTN} ${chip("bg-rose-50 text-rose-600 hover:bg-rose-100", "bg-rose-900/60 text-rose-300 hover:bg-rose-900")}`}
                            title="Delete ad"
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
          itemLabel="ads"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => fetchPage(page)}
        />
      </div>
    </div>
  );
};

export default AdvertisementList;
