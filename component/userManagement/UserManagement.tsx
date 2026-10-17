"use client";
import {
  getPatients,
  PatientPagination,
  PatientRecord,
  PatientSort,
  PatientStats,
  PregnancyStatus,
  suspendUser,
  unsuspendUser,
} from "@/app/actions/adminUserManagement";
import StatCards, { StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBaby,
  FaBan,
  FaCheckCircle,
  FaEye,
  FaSearch,
  FaTimes,
  FaUnlock,
  FaUsers,
} from "react-icons/fa";

type StatusFilter = "all" | "active" | "suspended";

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: PatientSort; label: string }[] = [
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest" },
  { value: "name_asc", label: "Sort: Name A–Z" },
  { value: "name_desc", label: "Sort: Name Z–A" },
];

interface UserManagementProps {
  initialPatients: PatientRecord[];
  initialPagination?: PatientPagination;
  initialStats?: PatientStats;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All patients" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Blocked" },
];

const PREGNANCY_LABELS: Record<PregnancyStatus, string> = {
  not_pregnant: "Not pregnant",
  pregnant: "Pregnant",
  postpartum: "Postpartum",
  trying_to_conceive: "Trying to conceive",
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

const UserManagement = ({
  initialPatients,
  initialPagination,
  initialStats,
}: UserManagementProps) => {
  const { isDarkMode } = useSidebar();
  const [patients, setPatients] = useState<PatientRecord[]>(initialPatients);
  const [pagination, setPagination] = useState<PatientPagination>(
    initialPagination || { total: initialPatients.length, page: 1, limit: PAGE_SIZE, pages: 1 },
  );
  const [stats, setStats] = useState<PatientStats | undefined>(initialStats);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<PatientSort>("newest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = patients.find((p) => p._id === viewingId) || null;

  useEffect(() => {
    if (!viewingId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewingId]);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPregnancyBadge = (value?: PregnancyStatus) => {
    const colors: Record<PregnancyStatus, string> = {
      pregnant: isDarkMode ? "bg-pink-900 text-pink-300" : "bg-pink-100 text-pink-700",
      postpartum: isDarkMode ? "bg-purple-900 text-purple-300" : "bg-purple-100 text-purple-700",
      trying_to_conceive: isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-700",
      not_pregnant: isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600",
    };
    if (!value) return <span className={`text-sm ${muted}`}>—</span>;
    return (
      <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${colors[value]}`}>
        {PREGNANCY_LABELS[value]}
      </span>
    );
  };

  const fetchPage = async (
    page: number,
    overrides: { status?: StatusFilter; search?: string; sort?: PatientSort } = {},
  ): Promise<void> => {
    const query = { status, search, sort, ...overrides };
    setLoading(true);
    const response = await getPatients(
      query.status,
      query.search || undefined,
      page,
      PAGE_SIZE,
      query.sort,
    );
    if (response.success && response.data) {
      // Blocking the last row on the final page can leave it empty — step back a page.
      if (response.data.length === 0 && page > 1) {
        setLoading(false);
        return fetchPage(page - 1, overrides);
      }
      setPatients(response.data);
      if (response.pagination) setPagination(response.pagination);
      if (response.stats) setStats(response.stats);
    } else {
      toast.error(response.error || "Failed to load patients");
    }
    setLoading(false);
  };

  const handleStatusFilter = (value: StatusFilter) => {
    setStatus(value);
    fetchPage(1, { status: value });
  };

  const handleSortChange = (value: PatientSort) => {
    setSort(value);
    fetchPage(1, { sort: value });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPage(1);
  };

  const handleBlock = async (patient: PatientRecord) => {
    const input = window.prompt(
      `Reason for blocking ${patient.name || patient.email || patient.phone}:`,
    );
    if (input === null) return;
    const reason = input.trim() || undefined;
    const response = await suspendUser(patient._id, reason);
    if (response.success) {
      toast.success("Patient blocked");
      await fetchPage(pagination.page);
    } else {
      toast.error(response.error || "Failed to block patient");
    }
  };

  const handleUnblock = async (patient: PatientRecord) => {
    if (!confirm(`Unblock ${patient.name || patient.email || patient.phone}?`)) return;
    const response = await unsuspendUser(patient._id);
    if (response.success) {
      toast.success("Patient unblocked");
      await fetchPage(pagination.page);
    } else {
      toast.error(response.error || "Failed to unblock patient");
    }
  };

  const statCards: StatCard[] = [
    {
      label: "Total Patients",
      value: stats?.total ?? pagination.total,
      sub: "Registered patient accounts",
      icon: FaUsers,
      tone: "violet",
    },
    {
      label: "Active",
      value: stats?.active ?? patients.filter((p) => !p.suspended).length,
      sub: "Can access their account",
      icon: FaCheckCircle,
      tone: "teal",
    },
    {
      label: "Blocked",
      value: stats?.blocked ?? patients.filter((p) => p.suspended).length,
      sub: "Account access blocked",
      icon: FaBan,
      tone: "rose",
    },
    {
      label: "Pregnant",
      value: stats?.pregnant ?? patients.filter((p) => p.profile?.pregnancyStatus === "pregnant").length,
      sub: "Currently expecting",
      icon: FaBaby,
      tone: "pink",
    },
  ];

  return (
    <div
      className={`${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}
    >
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
              placeholder="Search name, email, or phone"
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
              onChange={(e) => handleStatusFilter(e.target.value as StatusFilter)}
              className={`${TOOLBAR_SELECT} ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as PatientSort)}
              className={`${TOOLBAR_SELECT} ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
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
            <div className="p-6 text-center">Loading patients...</div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Patient", "Age", "Height / Weight", "Cycle", "Pregnancy", "Status", "Joined"].map(
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
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <FaUsers
                        className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}
                      />
                      <p className="text-gray-500">No patients found</p>
                    </td>
                  </tr>
                )}
                {patients.map((patient, index) => {
                  const profile = patient.profile;
                  const cycle = profile?.menstrualHistory;
                  return (
                    <tr
                      key={patient._id}
                      className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {patient.avatar ? (
                            <Image
                              src={patient.avatar}
                              alt={patient.name || "Patient"}
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
                              {(patient.name || patient.email || patient.phone || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {patient.name || "—"}
                              {!patient.isVerified && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? "bg-amber-900 text-amber-300" : "bg-amber-100 text-amber-700"}`}
                                >
                                  Unverified
                                </span>
                              )}
                            </div>
                            <div className={`text-xs ${muted}`}>
                              {patient.phone || patient.email || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {profile?.age ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {profile?.heightCm || profile?.weightKg ? (
                          <>
                            {profile?.heightCm ? `${profile.heightCm} cm` : "—"}
                            <span className={muted}> · </span>
                            {profile?.weightKg ? `${profile.weightKg} kg` : "—"}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {cycle?.cycleLengthDays ? (
                          <>
                            <div>{cycle.cycleLengthDays}-day cycle</div>
                            <div className={`text-xs ${muted}`}>
                              {cycle.periodLengthDays ? `${cycle.periodLengthDays}-day period` : ""}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4">{getPregnancyBadge(profile?.pregnancyStatus)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.suspended ? (
                          <span
                            title={patient.suspensionReason}
                            className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"}`}
                          >
                            Blocked
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"}`}
                          >
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(patient.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingId(patient._id)}
                            className={`${ACTION_BTN} ${isDarkMode ? "bg-blue-900/60 text-blue-300 hover:bg-blue-900" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                            title="View patient"
                          >
                            <FaEye size={14} />
                          </button>
                          {patient.suspended ? (
                            <button
                              onClick={() => handleUnblock(patient)}
                              className={`${ACTION_BTN} ${isDarkMode ? "bg-emerald-900/60 text-emerald-300 hover:bg-emerald-900" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                              title="Unblock"
                            >
                              <FaUnlock size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(patient)}
                              className={`${ACTION_BTN} ${isDarkMode ? "bg-rose-900/60 text-rose-300 hover:bg-rose-900" : "bg-rose-50 text-rose-600 hover:bg-rose-100"}`}
                              title="Block"
                            >
                              <FaBan size={14} />
                            </button>
                          )}
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
          itemLabel="patients"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => fetchPage(page)}
        />
      </div>

      {viewing && (
        <PatientViewModal
          patient={viewing}
          isDarkMode={isDarkMode}
          onClose={() => setViewingId(null)}
          onBlock={() => handleBlock(viewing)}
          onUnblock={() => handleUnblock(viewing)}
          pregnancyBadge={getPregnancyBadge(viewing.profile?.pregnancyStatus)}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

interface PatientViewModalProps {
  patient: PatientRecord;
  isDarkMode: boolean;
  onClose: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  pregnancyBadge: React.ReactNode;
  formatDate: (date?: string) => string;
}

const PatientViewModal = ({
  patient,
  isDarkMode,
  onClose,
  onBlock,
  onUnblock,
  pregnancyBadge,
  formatDate,
}: PatientViewModalProps) => {
  const profile = patient.profile;
  const cycle = profile?.menstrualHistory;
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const bmi =
    profile?.heightCm && profile?.weightKg
      ? (profile.weightKg / (profile.heightCm / 100) ** 2).toFixed(1)
      : null;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Phone", value: patient.phone || "—" },
    { label: "Email", value: patient.email || "—" },
    { label: "Age", value: profile?.age ?? "—" },
    { label: "Height", value: profile?.heightCm ? `${profile.heightCm} cm` : "—" },
    { label: "Weight", value: profile?.weightKg ? `${profile.weightKg} kg` : "—" },
    { label: "BMI", value: bmi ?? "—" },
    { label: "Pregnancy", value: pregnancyBadge },
    { label: "Last period", value: cycle?.lastPeriodDate ? formatDate(cycle.lastPeriodDate) : "—" },
    { label: "Cycle length", value: cycle?.cycleLengthDays ? `${cycle.cycleLengthDays} days` : "—" },
    { label: "Period length", value: cycle?.periodLengthDays ? `${cycle.periodLengthDays} days` : "—" },
    { label: "Reminders", value: profile ? (profile.remindersEnabled ? "On" : "Off") : "—" },
    { label: "Profile", value: profile?.profileCompleted ? "Completed" : "Incomplete" },
    { label: "Verified", value: patient.isVerified ? "Yes" : "No" },
    { label: "Joined", value: formatDate(patient.createdAt) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl ${
          isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
        }`}
      >
        <div
          className={`flex items-center gap-4 p-5 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          {patient.avatar ? (
            <Image
              src={patient.avatar}
              alt={patient.name || "Patient"}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold bg-blue-100 text-blue-600 shrink-0">
              {(patient.name || patient.email || patient.phone || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{patient.name || "—"}</h2>
            {patient.suspended ? (
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"}`}
              >
                Blocked
              </span>
            ) : (
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"}`}
              >
                Active
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {patient.suspended && patient.suspensionReason && (
          <div
            className={`mx-5 mt-4 p-3 rounded-lg text-sm ${isDarkMode ? "bg-red-950/40 text-red-300" : "bg-red-50 text-red-700"}`}
          >
            Block reason: {patient.suspensionReason}
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className={`text-xs ${muted}`}>{row.label}</dt>
              <dd className="text-sm font-medium mt-0.5 break-words">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div
          className={`flex justify-end gap-2 p-5 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border text-sm ${isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"}`}
          >
            Close
          </button>
          {patient.suspended ? (
            <button
              onClick={onUnblock}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-green-600 hover:bg-green-700"
            >
              <FaUnlock size={12} /> Unblock
            </button>
          ) : (
            <button
              onClick={onBlock}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700"
            >
              <FaBan size={12} /> Block
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
