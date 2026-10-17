"use client";
import {
  approveDoctor,
  DoctorPagination,
  DoctorRecord,
  DoctorSort,
  DoctorStats,
  DoctorStatusFilter,
  getDoctorsPage,
  rejectDoctor,
  removeDoctorAccount,
  setFeaturedDoctor,
  suspendDoctor,
  unsuspendDoctor,
} from "@/app/actions/doctorManagement";
import StatCards, { StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaBan,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaSearch,
  FaStar,
  FaTimes,
  FaTrashAlt,
  FaUnlock,
  FaUserMd,
} from "react-icons/fa";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: DoctorStatusFilter; label: string }[] = [
  { value: "all", label: "All doctors" },
  { value: "pending", label: "Pending verification" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Blocked" },
  { value: "featured", label: "Featured" },
];

const SORT_OPTIONS: { value: DoctorSort; label: string }[] = [
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest" },
  { value: "rating", label: "Sort: Top rated" },
  { value: "experience", label: "Sort: Most experienced" },
];

const APPROVAL_LABELS: Record<DoctorRecord["approvalStatus"], string> = {
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

interface DoctorManagementProps {
  initialDoctors: DoctorRecord[];
  initialPagination?: DoctorPagination;
  initialStats?: DoctorStats;
}

const DoctorManagement = ({
  initialDoctors,
  initialPagination,
  initialStats,
}: DoctorManagementProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorRecord[]>(initialDoctors);
  const [pagination, setPagination] = useState<DoctorPagination>(
    initialPagination || { total: initialDoctors.length, page: 1, limit: PAGE_SIZE, pages: 1 },
  );
  const [stats, setStats] = useState<DoctorStats | undefined>(initialStats);
  const [status, setStatus] = useState<DoctorStatusFilter>("all");
  const [sort, setSort] = useState<DoctorSort>("newest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const chip = (light: string, dark: string) => (isDarkMode ? dark : light);

  const fetchPage = async (
    page: number,
    overrides: { status?: DoctorStatusFilter; search?: string; sort?: DoctorSort } = {},
  ): Promise<void> => {
    const query = { status, search, sort, ...overrides };
    setLoading(true);
    const response = await getDoctorsPage(
      query.status,
      query.search || undefined,
      page,
      PAGE_SIZE,
      query.sort,
    );
    if (response.success && response.data) {
      // An action can empty the last page (e.g. approving the final pending doctor) — step back.
      if (response.data.length === 0 && page > 1) {
        setLoading(false);
        return fetchPage(page - 1, overrides);
      }
      setDoctors(response.data);
      if (response.pagination) setPagination(response.pagination);
      if (response.stats) setStats(response.stats);
    } else {
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

  const handleApprove = async (doc: DoctorRecord) => {
    const response = await approveDoctor(doc._id);
    if (response.success) {
      toast.success("Doctor approved");
      await refresh();
    } else toast.error(response.error || "Failed to approve doctor");
  };

  const handleReject = async (doc: DoctorRecord) => {
    const input = window.prompt(`Reason for rejecting ${doctorName(doc)} (optional):`);
    if (input === null) return;
    const response = await rejectDoctor(doc._id, input.trim() || undefined);
    if (response.success) {
      toast.success("Doctor rejected");
      await refresh();
    } else toast.error(response.error || "Failed to reject doctor");
  };

  const handleBlock = async (doc: DoctorRecord) => {
    const input = window.prompt(`Reason for blocking ${doctorName(doc)}:`);
    if (input === null) return;
    const response = await suspendDoctor(doc._id, input.trim() || undefined);
    if (response.success) {
      toast.success("Doctor blocked");
      await refresh();
    } else toast.error(response.error || "Failed to block doctor");
  };

  const handleUnblock = async (doc: DoctorRecord) => {
    if (!confirm(`Unblock ${doctorName(doc)}?`)) return;
    const response = await unsuspendDoctor(doc._id);
    if (response.success) {
      toast.success("Doctor unblocked");
      await refresh();
    } else toast.error(response.error || "Failed to unblock doctor");
  };

  const handleToggleFeatured = async (doc: DoctorRecord) => {
    const response = await setFeaturedDoctor(doc._id, !doc.featured);
    if (response.success) {
      toast.success(doc.featured ? "Removed from featured" : "Marked as featured");
      await refresh();
    } else toast.error(response.error || "Failed to update featured status");
  };

  const handleRemove = async (doc: DoctorRecord) => {
    if (
      !confirm(
        `Permanently remove ${doctorName(doc)}'s doctor profile? Their account will need to re-onboard.`,
      )
    )
      return;
    const response = await removeDoctorAccount(doc._id);
    if (response.success) {
      toast.success("Doctor account removed");
      await refresh();
    } else toast.error(response.error || "Failed to remove doctor");
  };

  const getApprovalBadge = (value: DoctorRecord["approvalStatus"]) => {
    const colors: Record<DoctorRecord["approvalStatus"], string> = {
      pending: chip("bg-amber-100 text-amber-800", "bg-amber-900 text-amber-300"),
      approved: chip("bg-green-100 text-green-800", "bg-green-900 text-green-300"),
      rejected: chip("bg-gray-100 text-gray-600", "bg-gray-700 text-gray-300"),
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${colors[value]}`}>
        {APPROVAL_LABELS[value]}
      </span>
    );
  };

  const statCards: StatCard[] = [
    {
      label: "Total Doctors",
      value: stats?.total ?? pagination.total,
      sub: "Registered doctor profiles",
      icon: FaUserMd,
      tone: "sky",
    },
    {
      label: "Pending",
      value: stats?.pending ?? doctors.filter((d) => d.approvalStatus === "pending").length,
      sub: "Awaiting verification",
      icon: FaClock,
      tone: "amber",
    },
    {
      label: "Approved",
      value: stats?.approved ?? doctors.filter((d) => d.approvalStatus === "approved").length,
      sub: "Visible to patients",
      icon: FaCheckCircle,
      tone: "emerald",
    },
    {
      label: "Blocked",
      value: stats?.suspended ?? doctors.filter((d) => d.suspended).length,
      sub: "Account access blocked",
      icon: FaBan,
      tone: "orange",
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
              placeholder="Search name, phone, specialty or reg. no."
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
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading doctors...</div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Doctor", "Specialization", "Experience", "Fee", "Rating", "Status"].map(
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
                {doctors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FaUserMd
                        className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}
                      />
                      <p className="text-gray-500">No doctors found</p>
                    </td>
                  </tr>
                )}
                {doctors.map((doc, index) => (
                  <tr key={doc._id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4">
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
                            {(doc.user?.name || doc.user?.phone || "?")
                              .replace(/^Dr\.?\s*/i, "")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-1.5 whitespace-nowrap">
                            {doc.user?.name || "Unnamed"}
                            {doc.featured && (
                              <FaStar className="text-amber-400" size={12} title="Featured" />
                            )}
                          </div>
                          <div className={`text-xs ${muted}`}>{doc.user?.phone || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>{doc.specialization || "—"}</div>
                      {doc.hospitalName && (
                        <div className={`text-xs ${muted}`}>{doc.hospitalName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {doc.experienceYears != null ? `${doc.experienceYears} yrs` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {doc.consultationFee ? `£${doc.consultationFee}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {doc.reviewCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <FaStar className="text-amber-400" size={12} />
                          {doc.avgRating.toFixed(1)}
                          <span className={muted}>({doc.reviewCount})</span>
                        </span>
                      ) : (
                        <span className={muted}>No reviews</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getApprovalBadge(doc.approvalStatus)}
                        {doc.suspended && (
                          <span
                            title={doc.suspensionReason}
                            className={`px-2 py-1 text-xs rounded-full ${chip("bg-red-100 text-red-800", "bg-red-900 text-red-300")}`}
                          >
                            Blocked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/doctors/${doc._id}`)}
                          className={`${ACTION_BTN} ${chip("bg-blue-50 text-blue-600 hover:bg-blue-100", "bg-blue-900/60 text-blue-300 hover:bg-blue-900")}`}
                          title="View pricing, availability, appointments & payments"
                        >
                          <FaEye size={14} />
                        </button>

                        {doc.approvalStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(doc)}
                              className={`${ACTION_BTN} ${chip("bg-emerald-50 text-emerald-600 hover:bg-emerald-100", "bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900")}`}
                              title="Approve"
                            >
                              <FaCheck size={13} />
                            </button>
                            <button
                              onClick={() => handleReject(doc)}
                              className={`${ACTION_BTN} ${chip("bg-rose-50 text-rose-600 hover:bg-rose-100", "bg-rose-900/60 text-rose-300 hover:bg-rose-900")}`}
                              title="Reject"
                            >
                              <FaTimes size={13} />
                            </button>
                          </>
                        )}

                        {doc.approvalStatus === "approved" && (
                          <>
                            <button
                              onClick={() => handleToggleFeatured(doc)}
                              className={`${ACTION_BTN} ${
                                doc.featured
                                  ? chip("bg-amber-100 text-amber-500 hover:bg-amber-200", "bg-amber-900 text-amber-300 hover:bg-amber-800")
                                  : chip("bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-500", "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-amber-300")
                              }`}
                              title={doc.featured ? "Remove from featured" : "Mark as featured"}
                            >
                              <FaStar size={13} />
                            </button>
                            {doc.suspended ? (
                              <button
                                onClick={() => handleUnblock(doc)}
                                className={`${ACTION_BTN} ${chip("bg-emerald-50 text-emerald-600 hover:bg-emerald-100", "bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900")}`}
                                title="Unblock"
                              >
                                <FaUnlock size={13} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlock(doc)}
                                className={`${ACTION_BTN} ${chip("bg-rose-50 text-rose-600 hover:bg-rose-100", "bg-rose-900/60 text-rose-300 hover:bg-rose-900")}`}
                                title="Block"
                              >
                                <FaBan size={13} />
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => handleRemove(doc)}
                          className={`${ACTION_BTN} ${chip("bg-gray-100 text-gray-500 hover:bg-rose-100 hover:text-rose-600", "bg-gray-700 text-gray-400 hover:bg-rose-900 hover:text-rose-300")}`}
                          title="Remove account"
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
          itemLabel="doctors"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => fetchPage(page)}
        />
      </div>
    </div>
  );
};

export default DoctorManagement;
