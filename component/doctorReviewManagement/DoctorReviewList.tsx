"use client";
import {
  deleteReview,
  getReviewsPage,
  setReviewStatus,
  type ReviewDoctorSummary,
  type ReviewPageResponse,
  type ReviewPagination,
  type ReviewRecord,
  type ReviewStats,
  type ReviewStatus,
  type ReviewStatusFilter,
} from "@/app/actions/reviewAction";
import SideDrawer from "@/component/shared/SideDrawer";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { actionBtn, DetailRows, FilterPills, formatDate, formatDateTime, initials, Stars, StatusPill, type Tone } from "@/component/shared/ui";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FaCheck, FaComments, FaEye, FaEyeSlash, FaHourglassHalf, FaRedo, FaSearch, FaStar, FaTrashAlt } from "react-icons/fa";
import { ReviewRowsSkeleton } from "./ReviewSkeletons";

const PAGE_SIZE = 10;
const TOOLBAR_SELECT = "px-3 py-2.5 rounded-lg border text-sm sm:min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500";

const STATUS: Record<ReviewStatus, Tone> = {
  published: { label: "Published", hint: "Shows on the doctor's profile and counts in their rating.", dot: "bg-green-500", light: "bg-green-50 text-green-700 border-green-200", dark: "bg-green-900/40 text-green-200 border-green-800" },
  held: { label: "Held for check", hint: "Not on the profile until someone on the team checks it.", dot: "bg-amber-500", light: "bg-amber-50 text-amber-700 border-amber-200", dark: "bg-amber-900/40 text-amber-200 border-amber-800" },
  hidden: { label: "Hidden", hint: "Taken down by the team. The doctor's rating ignores it.", dot: "bg-gray-400", light: "bg-gray-100 text-gray-600 border-gray-200", dark: "bg-gray-700 text-gray-300 border-gray-600" },
};

const HOLD_REASON: Record<string, string> = {
  low_rating: "1 or 2 stars: check it's about the consultation and fair",
  language: "Rude language",
};

const doctorName = (r: ReviewRecord) => r.doctor?.user?.fullName || "Doctor removed";
const patientName = (r: ReviewRecord) => r.patient?.fullName || r.patient?.phone || "Patient removed";

type Query = { status: ReviewStatusFilter; doctorId: string; rating: number; search: string };

/** Patients' reviews of doctors, from the backend: check held ones, hide unfair ones, see each doctor's rating. */
const DoctorReviewList = ({ initial }: { initial: ReviewPageResponse }) => {
  const { isDarkMode } = useSidebar();
  const [items, setItems] = useState<ReviewRecord[]>(initial.data ?? []);
  const [pagination, setPagination] = useState<ReviewPagination>(initial.pagination ?? { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [stats, setStats] = useState<ReviewStats | undefined>(initial.stats);
  const [doctors, setDoctors] = useState<ReviewDoctorSummary[]>(initial.doctors ?? []);
  const [error, setError] = useState(initial.success ? "" : initial.error || "Failed to fetch reviews");
  const [query, setQuery] = useState<Query>({ status: "all", doctorId: "", rating: 0, search: "" });
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setSelectedId(null), []);
  const selected = items.find((r) => r._id === selectedId) ?? null;

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-2xl border p-5 shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const selectClass = `${TOOLBAR_SELECT} ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`;

  /** Reads a page through the server action, then shows it. `quiet` skips the skeleton (after an action). */
  const load = async (page: number, changes: Partial<Query> = {}, quiet = false) => {
    const next = { ...query, ...changes };
    setQuery(next);
    if (!quiet) setLoading(true);
    const response = await getReviewsPage({ ...next, page, limit: PAGE_SIZE });
    setLoading(false);
    if (!response.success) {
      setError(response.error || "Failed to fetch reviews");
      return;
    }
    setError("");
    setItems(response.data ?? []);
    if (response.pagination) setPagination(response.pagination);
    if (response.stats) setStats(response.stats);
    if (response.doctors) setDoctors(response.doctors);
  };

  const changeStatus = async (r: ReviewRecord, status: ReviewStatus, reason?: string) => {
    setBusyId(r._id);
    const result = await setReviewStatus(r._id, status, reason);
    if (result.success) {
      toast.success(result.message || "Updated");
      // Stay on this page unless it emptied out.
      await load(items.length === 1 && pagination.page > 1 && query.status !== "all" ? pagination.page - 1 : pagination.page, {}, true);
    } else toast.error(result.error || "Failed to update the review");
    setBusyId(null);
  };

  const remove = async (r: ReviewRecord) => {
    setBusyId(r._id);
    const result = await deleteReview(r._id);
    if (result.success) {
      toast.success("Review deleted");
      setSelectedId(null);
      await load(items.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page, {}, true);
    } else toast.error(result.error || "Failed to delete the review");
    setBusyId(null);
  };

  const byRating = [5, 4, 3, 2, 1].map((n) => ({ n, count: stats?.byRating?.[String(n)] ?? 0 }));
  const maxCount = Math.max(1, ...byRating.map((c) => c.count));

  const statCards: StatCard[] = [
    { label: "Average rating", value: stats?.published ? `${stats.average.toFixed(1)} ★` : "—", sub: `From ${stats?.published ?? 0} published reviews`, icon: FaStar, tone: "amber" },
    { label: "Held for check", value: stats?.held ?? 0, sub: "Waiting for the team", icon: FaHourglassHalf, tone: "orange" },
    { label: "Published", value: stats?.published ?? 0, sub: "On doctors' profiles", icon: FaComments, tone: "green" },
    { label: "Hidden", value: stats?.hidden ?? 0, sub: "Taken down", icon: FaEyeSlash, tone: "slate" },
  ];

  const filtering = query.status !== "all" || query.doctorId || query.rating || query.search;

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      <StatCards cards={statCards} isDarkMode={isDarkMode} />

      {error && (
        <div
          role="alert"
          className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            isDarkMode ? "border-red-800 bg-red-900/30 text-red-200" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {error}
          <button type="button" onClick={() => load(pagination.page)} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
            <FaRedo size={10} /> Try again
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="font-semibold">Rating breakdown</h2>
          <p className={`mb-4 text-sm ${muted}`}>Published reviews only. Click a row to filter.</p>
          <ul className="space-y-2.5">
            {byRating.map(({ n, count }) => (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => load(1, { rating: query.rating === n ? 0 : n })}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-1 text-sm transition-colors ${
                    query.rating === n ? (isDarkMode ? "bg-gray-700" : "bg-gray-100") : isDarkMode ? "hover:bg-gray-700/60" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="flex w-10 items-center gap-1 font-medium">
                    {n} <FaStar className="text-amber-400" size={11} />
                  </span>
                  <span className={`h-2.5 flex-1 overflow-hidden rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </span>
                  <span className={`w-8 text-right tabular-nums ${muted}`}>{count}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="font-semibold">Doctors by rating</h2>
          <p className={`mb-4 text-sm ${muted}`}>What patients see on each profile. Click to filter.</p>
          {doctors.length === 0 ? (
            <p className={`py-6 text-center text-sm ${muted}`}>No doctor has a review yet.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {doctors.map((d) => (
                <li key={d._id}>
                  <button
                    type="button"
                    onClick={() => load(1, { doctorId: query.doctorId === d._id ? "" : d._id })}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${
                      query.doctorId === d._id ? (isDarkMode ? "bg-gray-700" : "bg-gray-100") : isDarkMode ? "hover:bg-gray-700/60" : "hover:bg-gray-50"
                    }`}
                  >
                    {d.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.avatar} alt="" className={`h-8 w-8 shrink-0 rounded-full object-cover ring-1 ${isDarkMode ? "ring-gray-600" : "ring-gray-200"}`} />
                    ) : (
                      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                        {initials(d.name)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{d.name}</span>
                      <span className={`block text-xs ${muted}`}>
                        {d.published} published{d.total > d.published ? ` · ${d.total - d.published} not shown` : ""}
                      </span>
                    </span>
                    <Stars rating={d.average} isDarkMode={isDarkMode} />
                    <span className="w-8 text-right text-sm font-semibold tabular-nums">{d.published ? d.average.toFixed(1) : "—"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className={`flex flex-col gap-3 border-b p-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <FilterPills
            value={query.status}
            onChange={(status) => load(1, { status })}
            isDarkMode={isDarkMode}
            options={[
              { value: "all", label: "All", count: stats?.total },
              { value: "held", label: "Held for check", count: stats?.held },
              { value: "published", label: "Published", count: stats?.published },
              { value: "hidden", label: "Hidden", count: stats?.hidden },
            ]}
          />
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                load(1, { search: searchText });
              }}
              className="relative w-full xl:w-[340px]"
            >
              <button type="submit" aria-label="Search" className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <FaSearch size={13} />
              </button>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search review, patient or doctor"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
                  isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </form>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={query.doctorId} onChange={(e) => load(1, { doctorId: e.target.value })} className={selectClass} aria-label="Doctor">
                <option value="">All doctors</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select value={query.rating} onChange={(e) => load(1, { rating: Number(e.target.value) })} className={selectClass} aria-label="Stars">
                <option value={0}>All ratings</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" aria-busy={loading}>
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                {["Review", "Doctor", "Patient", "Date", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <ReviewRowsSkeleton rows={Math.min(PAGE_SIZE, Math.max(3, items.length))} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <FaStar className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <p className="font-medium">{query.status === "held" ? "Nothing waiting for a check" : filtering ? "No reviews match" : "No reviews yet"}</p>
                    <p className={`mt-1 text-sm ${muted}`}>Patients review a doctor from the doctor&apos;s profile, after a consultation with them.</p>
                  </td>
                </tr>
              ) : (
                items.map((r) => {
                  const busy = busyId === r._id;
                  return (
                    <tr
                      key={r._id}
                      className={`transition-opacity ${busy ? "opacity-50" : ""} ${r.status === "held" ? (isDarkMode ? "bg-amber-900/10" : "bg-amber-50/40") : ""} ${
                        isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <Stars rating={r.rating} isDarkMode={isDarkMode} />
                        <button type="button" onClick={() => setSelectedId(r._id)} className="mt-1 block max-w-md text-left text-sm hover:underline">
                          <span className="line-clamp-2">{r.text}</span>
                        </button>
                        {r.status === "held" && r.holdReason && <p className={`mt-1 text-xs ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}>{HOLD_REASON[r.holdReason]}</p>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        {doctorName(r)}
                        {r.doctor?.specialization && <div className={`text-xs ${muted}`}>{r.doctor.specialization}</div>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        <span className="font-medium">{patientName(r)}</span>
                        {r.consultation && <div className={`font-mono text-xs ${muted}`}>{r.consultation.reference}</div>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">{formatDate(r.createdAt)}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusPill tone={STATUS[r.status]} isDarkMode={isDarkMode} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status !== "published" && (
                            <button type="button" disabled={busy} onClick={() => changeStatus(r, "published")} className={actionBtn("green", isDarkMode)} title="Publish">
                              <FaCheck size={12} />
                            </button>
                          )}
                          {r.status !== "hidden" && (
                            <button type="button" disabled={busy} onClick={() => changeStatus(r, "hidden")} className={actionBtn("amber", isDarkMode)} title="Hide">
                              <FaEyeSlash size={13} />
                            </button>
                          )}
                          <button type="button" onClick={() => setSelectedId(r._id)} className={actionBtn("blue", isDarkMode)} title="View review">
                            <FaEye size={14} />
                          </button>
                          <button type="button" disabled={busy} onClick={() => remove(r)} className={actionBtn("rose", isDarkMode)} title="Delete">
                            <FaTrashAlt size={12} />
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
          itemLabel="reviews"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => load(page)}
        />
      </div>

      <ReviewDrawer review={selected} busy={busyId === selected?._id} isDarkMode={isDarkMode} onClose={closeDrawer} onStatus={changeStatus} onDelete={remove} />
    </div>
  );
};

interface ReviewDrawerProps {
  review: ReviewRecord | null;
  busy: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onStatus: (r: ReviewRecord, next: ReviewStatus, reason?: string) => Promise<void>;
  onDelete: (r: ReviewRecord) => Promise<void>;
}

function ReviewDrawer({ review: r, busy, isDarkMode, onClose, onStatus, onDelete }: ReviewDrawerProps) {
  const [reason, setReason] = useState("");
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const box = `rounded-xl border p-4 ${isDarkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`;

  return (
    <SideDrawer
      open={Boolean(r)}
      title={r ? `Review for ${doctorName(r)}` : "Review"}
      subtitle={r ? `${patientName(r)} · ${formatDateTime(r.createdAt)}` : undefined}
      isDarkMode={isDarkMode}
      onClose={onClose}
      footer={
        r && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(r)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <FaTrashAlt size={12} /> Delete review
          </button>
        )
      }
    >
      {r && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <StatusPill tone={STATUS[r.status]} isDarkMode={isDarkMode} />
            <span className={`text-right text-xs ${muted}`}>{STATUS[r.status].hint}</span>
          </div>

          <section className={box}>
            <Stars rating={r.rating} size={16} isDarkMode={isDarkMode} />
            <p className="mt-3 whitespace-pre-line text-[15px] leading-7">&ldquo;{r.text}&rdquo;</p>
            <p className={`mt-2 text-xs ${muted}`}>Patients see it as written by &ldquo;Verified patient&rdquo;.</p>
          </section>

          {r.status === "held" && r.holdReason && (
            <p className={`rounded-xl border p-3 text-sm ${isDarkMode ? "border-amber-800 bg-amber-900/30 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              <span className="font-medium">Why it was held:</span> {HOLD_REASON[r.holdReason]}
            </p>
          )}
          {r.status === "hidden" && r.hiddenReason && (
            <p className={box}>
              <span className="font-medium">Hidden because:</span> {r.hiddenReason}
            </p>
          )}

          <section className={box}>
            <DetailRows
              isDarkMode={isDarkMode}
              rows={[
                ["Doctor", r.doctor ? <Link key="d" href={`/doctors/${r.doctor._id}`} className="text-blue-600 hover:underline">{doctorName(r)}</Link> : doctorName(r)],
                ["Patient", r.patient ? <Link key="p" href={`/patient/${r.patient._id}`} className="text-blue-600 hover:underline">{patientName(r)}</Link> : patientName(r)],
                ["Consultation", r.consultation ? <span key="c" className="font-mono">{r.consultation.reference}</span> : "—"],
                ["Written", formatDateTime(r.createdAt)],
                ["Checked", r.reviewedAt ? `${formatDateTime(r.reviewedAt)}${r.reviewedBy?.fullName ? ` · ${r.reviewedBy.fullName}` : ""}` : "Not yet"],
              ]}
            />
          </section>

          <section className="space-y-3">
            {r.status !== "published" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus(r, "published")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <FaCheck size={12} /> Publish on the profile
              </button>
            )}
            {r.status !== "hidden" && (
              <div className={`rounded-lg border p-3 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <label htmlFor="hide-reason" className={`mb-1.5 block text-xs font-medium ${muted}`}>
                  Reason for hiding (only the team sees it)
                </label>
                <input
                  id="hide-reason"
                  value={reason}
                  maxLength={300}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Not about the consultation"
                  className={`mb-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-300 bg-white"
                  }`}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await onStatus(r, "hidden", reason.trim() || undefined);
                    setReason("");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800 disabled:opacity-50"
                >
                  <FaEyeSlash size={13} /> Hide review
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </SideDrawer>
  );
}

export default DoctorReviewList;
