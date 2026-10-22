"use client";
import {
  type DoctorListStatus,
  type DoctorPagination,
  type DoctorRecord,
  type DoctorSort,
  type DoctorStats,
  type DoctorStatusFilter,
  getDoctorsPage,
  removeDoctorAccount,
  setDoctorStatus,
  setFeaturedDoctor,
} from "@/app/actions/doctorAction";
import StatCards, { StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaBan,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaEye,
  FaPlus,
  FaSearch,
  FaStar,
  FaTrashAlt,
  FaUserMd,
} from "react-icons/fa";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: DoctorStatusFilter; label: string }[] = [
  { value: "all", label: "All doctors" },
  { value: "pending", label: "Awaiting verification" },
  { value: "updates", label: "Profile updates to review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Blocked" },
  { value: "featured", label: "Featured" },
];

const SORT_OPTIONS: { value: DoctorSort; label: string }[] = [
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest" },
  { value: "name_asc", label: "Sort: Name A–Z" },
  { value: "name_desc", label: "Sort: Name Z–A" },
  { value: "rating", label: "Sort: Top rated" },
  { value: "experience", label: "Sort: Most experienced" },
];

const COLUMNS = ["Doctor", "Specialty", "Registration", "Fee", "Status"];

// The row's status dropdown: a verification status, or blocked.
const ROW_STATUSES: { value: DoctorListStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "blocked", label: "Blocked" },
];

const ROW_STATUS_DONE: Record<DoctorListStatus, string> = {
  pending: "moved to pending",
  approved: "approved",
  rejected: "rejected",
  blocked: "blocked",
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

interface DoctorListProps {
  initialDoctors: DoctorRecord[];
  initialPagination?: DoctorPagination;
  initialStats?: DoctorStats;
  /** Set when the first load on the server failed. */
  initialError?: string;
}

const DoctorList = ({ initialDoctors, initialPagination, initialStats, initialError }: DoctorListProps) => {
  const { isDarkMode } = useSidebar();
  const [doctors, setDoctors] = useState<DoctorRecord[]>(initialDoctors);
  const [pagination, setPagination] = useState<DoctorPagination>(
    initialPagination || { total: initialDoctors.length, page: 1, limit: PAGE_SIZE, pages: 1 },
  );
  const [stats, setStats] = useState<DoctorStats | undefined>(initialStats);
  const [status, setStatus] = useState<DoctorStatusFilter>("all");
  const [sort, setSort] = useState<DoctorSort>("newest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  // Row whose status change is being saved.
  const [savingId, setSavingId] = useState<string | null>(null);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const chip = (light: string, dark: string) => (isDarkMode ? dark : light);

  const fetchPage = async (
    page: number,
    overrides: { status?: DoctorStatusFilter; search?: string; sort?: DoctorSort } = {},
  ): Promise<void> => {
    const query = { status, search, sort, ...overrides };
    setLoading(true);
    const response = await getDoctorsPage(query.status, query.search || undefined, page, PAGE_SIZE, query.sort);
    if (response.success && response.data) {
      // An action can empty the last page (e.g. approving the final pending doctor) — step back.
      if (response.data.length === 0 && page > 1) {
        setLoading(false);
        return fetchPage(page - 1, overrides);
      }
      setError(null);
      setDoctors(response.data);
      if (response.pagination) setPagination(response.pagination);
      if (response.stats) setStats(response.stats);
    } else {
      setError(response.error || "Failed to load doctors");
      toast.error(response.error || "Failed to load doctors");
    }
    setLoading(false);
  };

  const refresh = () => fetchPage(pagination.page);

  const handleStatusFilter = (value: DoctorStatusFilter) => {
    setStatus(value);
    fetchPage(1, { status: value });
  };

  const handleSortChange = (value: DoctorSort) => {
    setSort(value);
    fetchPage(1, { sort: value });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPage(1);
  };

  const doctorName = (doc: DoctorRecord) => doc.user?.name || doc.user?.phone || "this doctor";

  /** Runs an action, shows the result and reloads the current page. */
  const run = async (action: Promise<{ success: boolean; error?: string }>, done: string, failed: string) => {
    const response = await action;
    if (response.success) {
      toast.success(done);
      await refresh();
    } else toast.error(response.error || failed);
  };

  const handleStatusChange = async (doc: DoctorRecord, value: DoctorListStatus) => {
    setSavingId(doc._id);
    await run(setDoctorStatus(doc, value), `${doctorName(doc)} ${ROW_STATUS_DONE[value]}`, "Failed to update status");
    setSavingId(null);
  };

  const handleToggleFeatured = (doc: DoctorRecord) =>
    run(
      setFeaturedDoctor(doc._id, !doc.featured),
      doc.featured ? "Removed from featured" : "Marked as featured",
      "Failed to update featured status",
    );

  const handleRemove = (doc: DoctorRecord) =>
    run(removeDoctorAccount(doc._id), `${doctorName(doc)} deleted`, "Failed to delete doctor");

  const rowStatus = (doc: DoctorRecord): DoctorListStatus => (doc.suspended ? "blocked" : doc.approvalStatus);

  const STATUS_COLORS: Record<DoctorListStatus, string> = {
    pending: chip("bg-amber-50 text-amber-800 border-amber-200", "bg-amber-900/50 text-amber-300 border-amber-800"),
    approved: chip("bg-green-50 text-green-800 border-green-200", "bg-green-900/50 text-green-300 border-green-800"),
    rejected: chip("bg-rose-50 text-rose-700 border-rose-200", "bg-rose-900/50 text-rose-300 border-rose-800"),
    blocked: chip("bg-gray-100 text-gray-700 border-gray-300", "bg-gray-700 text-gray-200 border-gray-600"),
  };

  const statusSelect = (doc: DoctorRecord) => {
    const current = rowStatus(doc);
    return (
      <select
        value={current}
        disabled={savingId === doc._id}
        onChange={(e) => handleStatusChange(doc, e.target.value as DoctorListStatus)}
        aria-label={`Status of ${doctorName(doc)}`}
        title={
          current === "blocked"
            ? doc.suspensionReason || "Blocked"
            : current === "rejected"
              ? doc.rejectionReason || "Rejected"
              : undefined
        }
        className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-wait disabled:opacity-60 ${STATUS_COLORS[current]}`}
      >
        {ROW_STATUSES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };

  const statCards: StatCard[] = [
    {
      label: "Total Doctors",
      value: stats?.total ?? pagination.total,
      sub: stats ? `${stats.featured} featured` : "Doctor profiles",
      icon: FaUserMd,
      tone: "sky",
    },
    {
      label: "Awaiting Verification",
      value: stats?.pending ?? doctors.filter((d) => d.approvalStatus === "pending").length,
      sub: "Need an admin review",
      icon: FaClock,
      tone: "amber",
    },
    {
      label: "Approved",
      value: stats?.approved ?? doctors.filter((d) => d.approvalStatus === "approved").length,
      sub: stats
        ? `${stats.updates ? `${stats.updates} profile update${stats.updates === 1 ? "" : "s"} to review` : "Visible to patients"} · ${stats.rejected} rejected`
        : "Visible to patients",
      icon: FaCheckCircle,
      tone: "emerald",
    },
    {
      label: "Blocked",
      value: stats?.suspended ?? doctors.filter((d) => d.suspended).length,
      sub: "Can't sign in",
      icon: FaBan,
      tone: "orange",
    },
  ];

  const selectClass = `${TOOLBAR_SELECT} ${
    isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"
  }`;

  const bone = `animate-pulse rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`;

  return (
    <div className={isDarkMode ? "text-gray-100" : "text-gray-900"}>
      <StatCards cards={statCards} isDarkMode={isDarkMode} />

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
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              aria-label="Search"
            >
              <FaSearch size={13} />
            </button>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, specialty, city or reg. no."
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
              onChange={(e) => handleStatusFilter(e.target.value as DoctorStatusFilter)}
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
              onChange={(e) => handleSortChange(e.target.value as DoctorSort)}
              className={selectClass}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <Link
              href="/doctors/add"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors whitespace-nowrap"
            >
              <FaPlus size={12} /> Add Doctor
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" aria-busy={loading}>
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                {COLUMNS.map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                Array.from({ length: PAGE_SIZE }, (_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 shrink-0 rounded-full ${bone}`} />
                        <div className="space-y-2">
                          <div className={`h-3.5 w-32 ${bone}`} />
                          <div className={`h-3 w-24 ${bone}`} />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: COLUMNS.length - 1 }, (_, c) => (
                      <td key={c} className="px-5 py-4">
                        <div className={`h-3.5 w-20 ${bone}`} />
                      </td>
                    ))}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {Array.from({ length: 3 }, (_, b) => (
                          <div key={b} className={`h-8 w-8 rounded-lg ${bone}`} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-6 py-12 text-center">
                    <FaBan className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-red-400" : "text-red-300"}`} />
                    <p className={isDarkMode ? "text-red-300" : "text-red-600"}>{error}</p>
                    <button onClick={refresh} className="mt-3 text-sm text-blue-600 hover:underline">
                      Try again
                    </button>
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-6 py-12 text-center">
                    <FaUserMd className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <p className="text-gray-500">No doctors found</p>
                  </td>
                </tr>
              ) : (
                doctors.map((doc, index) => (
                  <tr
                    key={doc._id}
                    className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} ${
                      doc.approvalStatus === "pending" ? "border-l-4 border-l-amber-400" : ""
                    }`}
                  >
                    {/* Doctor */}
                    <td className="px-5 py-4">
                      <div className="flex items-center">
                        {doc.user?.avatar ? (
                          <Image
                            src={doc.user.avatar}
                            alt={doc.user.name || "Doctor"}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-cover mr-3 shrink-0"
                          />
                        ) : (
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-bold mr-3 shrink-0 ${
                              AVATAR_COLORS[index % AVATAR_COLORS.length]
                            }`}
                          >
                            {(doc.user?.name || doc.user?.phone || "?").replace(/^Dr\.?\s*/i, "").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium flex items-center gap-1.5 whitespace-nowrap">
                            {doc.user?.name || "Unnamed"}
                            {doc.featured && <FaStar className="text-amber-400" size={12} title="Featured" />}
                            {doc.pendingUpdate && (
                              <span
                                title="Profile update waiting for review"
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  isDarkMode ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                Update
                              </span>
                            )}
                          </div>
                          <div className={`text-xs whitespace-nowrap ${muted}`}>
                            {[doc.title, doc.user?.phone].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="px-5 py-4 text-sm">
                      <div className="whitespace-nowrap">{doc.specialization || "—"}</div>
                      <div className={`text-xs whitespace-nowrap ${muted}`}>
                        {[doc.hospitalName, doc.city].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>

                    {/* Registration */}
                    <td className="px-5 py-4 text-sm">
                      <div className="font-mono text-xs whitespace-nowrap">{doc.registrationNumber || "—"}</div>
                      <div className={`text-xs whitespace-nowrap ${muted}`}>{doc.registrationBody || ""}</div>
                    </td>

                    {/* Fee */}
                    <td className="px-5 py-4 text-sm whitespace-nowrap">
                      {doc.consultationFee == null ? (
                        "—"
                      ) : doc.consultationFee === 0 ? (
                        <span className={chip("text-emerald-700", "text-emerald-300")}>Free</span>
                      ) : (
                        <>
                          £{doc.consultationFee}
                          <span className={`ml-1 text-xs ${muted}`}>UK base</span>
                        </>
                      )}
                    </td>

                    <td className="px-5 py-4">{statusSelect(doc)}</td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/doctors/${doc._id}`}
                          className={`${ACTION_BTN} ${chip("bg-blue-50 text-blue-600 hover:bg-blue-100", "bg-blue-900/60 text-blue-300 hover:bg-blue-900")}`}
                          title="View doctor"
                        >
                          <FaEye size={14} />
                        </Link>
                        <Link
                          href={`/doctors/edit/${doc._id}`}
                          className={`${ACTION_BTN} ${chip("bg-amber-50 text-amber-600 hover:bg-amber-100", "bg-amber-900/60 text-amber-300 hover:bg-amber-900")}`}
                          title="Edit doctor"
                        >
                          <FaEdit size={13} />
                        </Link>

                        {doc.approvalStatus === "approved" && (
                          <button
                            onClick={() => handleToggleFeatured(doc)}
                            className={`${ACTION_BTN} ${
                              doc.featured
                                ? chip("bg-amber-100 text-amber-500 hover:bg-amber-200", "bg-amber-900 text-amber-300 hover:bg-amber-800")
                                : chip(
                                    "bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-500",
                                    "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-amber-300",
                                  )
                            }`}
                            title={doc.featured ? "Remove from featured" : "Mark as featured"}
                          >
                            <FaStar size={13} />
                          </button>
                        )}

                        <button
                          onClick={() => handleRemove(doc)}
                          className={`${ACTION_BTN} ${chip("bg-gray-100 text-gray-500 hover:bg-rose-100 hover:text-rose-600", "bg-gray-700 text-gray-400 hover:bg-rose-900 hover:text-rose-300")}`}
                          title="Delete account"
                        >
                          <FaTrashAlt size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={pagination.page}
          pages={pagination.pages}
          limit={pagination.limit}
          total={pagination.total}
          itemLabel="doctors"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => fetchPage(page)}
        />
      </div>
    </div>
  );
};

export default DoctorList;
