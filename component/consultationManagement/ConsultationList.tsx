"use client";
import {
  getConsultationsPage,
  type ConsultationMode,
  type ConsultationPageResponse,
  type ConsultationPagination,
  type ConsultationQuery,
  type ConsultationRecord,
  type ConsultationSort,
  type ConsultationStage,
  type ConsultationStageFilter,
  type ConsultationStats,
} from "@/app/actions/consultationAction";
import SideDrawer from "@/component/shared/SideDrawer";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { actionBtn, DetailRows, FilterPills, formatDateTime, initials, relativeDays, StatusPill, type Tone } from "@/component/shared/ui";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useCallback, useState } from "react";
import { FaBolt, FaCalendarAlt, FaCalendarCheck, FaComments, FaEye, FaHourglassHalf, FaReceipt, FaRedo, FaSearch, FaSms } from "react-icons/fa";
import { ConsultationRowsSkeleton } from "./ConsultationSkeletons";

const PAGE_SIZE = 10;
const COMMISSION_RATE = 0.2;
const TOOLBAR_SELECT = "px-3 py-2.5 rounded-lg border text-sm sm:min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500";

const STAGE: Record<ConsultationStage, Tone> = {
  upcoming: { label: "Upcoming", hint: "Booked for a later time.", dot: "bg-sky-500", light: "bg-sky-50 text-sky-700 border-sky-200", dark: "bg-sky-900/40 text-sky-200 border-sky-800" },
  live: { label: "In consultation", hint: "Inside the 24h chat with the doctor.", dot: "bg-green-500", light: "bg-green-50 text-green-700 border-green-200", dark: "bg-green-900/40 text-green-200 border-green-800" },
  follow_up: { label: "Follow-up", hint: "In the free 7-day follow-up.", dot: "bg-amber-500", light: "bg-amber-50 text-amber-700 border-amber-200", dark: "bg-amber-900/40 text-amber-200 border-amber-800" },
  completed: { label: "Completed", hint: "Finished. The doctor's share has cleared.", dot: "bg-gray-400", light: "bg-gray-100 text-gray-600 border-gray-200", dark: "bg-gray-700 text-gray-300 border-gray-600" },
  refunded: { label: "Refunded", hint: "The patient got their money back.", dot: "bg-red-500", light: "bg-red-50 text-red-700 border-red-200", dark: "bg-red-900/40 text-red-200 border-red-800" },
  cancelled: { label: "Cancelled", hint: "Cancelled before it started.", dot: "bg-slate-400", light: "bg-slate-100 text-slate-600 border-slate-200", dark: "bg-slate-700 text-slate-300 border-slate-600" },
};

const SORT_OPTIONS: { value: ConsultationSort; label: string }[] = [
  { value: "newest", label: "Sort: Newest booking" },
  { value: "oldest", label: "Sort: Oldest booking" },
  { value: "starts_soon", label: "Sort: Starts soonest" },
  { value: "starts_latest", label: "Sort: Starts latest" },
];

const REGION_NAMES: Record<string, string> = {
  europe: "Europe & UK",
  north_america: "North America",
  middle_east: "Middle East",
  asia_pacific: "East Asia & Pacific",
  latin_america: "Latin America",
  africa: "Africa",
  south_asia: "South Asia",
};

const METHOD_NAMES: Record<string, string> = { card: "Card", local: "Local payment", wallet: "Apple Pay / Google Pay" };

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === "GBP" ? "en-GB" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

const doctorName = (c: ConsultationRecord) => c.doctor?.user?.fullName || "Doctor removed";
const patientName = (c: ConsultationRecord) => c.patient?.fullName || c.patient?.phone || "Patient removed";

interface ConsultationListProps {
  initial: ConsultationPageResponse;
  now: string;
}

/** Every booking from the backend: who, with which doctor, where it is now, what was paid. */
const ConsultationList = ({ initial, now: serverNow }: ConsultationListProps) => {
  const { isDarkMode } = useSidebar();
  const [items, setItems] = useState<ConsultationRecord[]>(initial.data ?? []);
  const [pagination, setPagination] = useState<ConsultationPagination>(initial.pagination ?? { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [stats, setStats] = useState<ConsultationStats | undefined>(initial.stats);
  const [doctors, setDoctors] = useState(initial.doctors ?? []);
  const [error, setError] = useState(initial.success ? "" : initial.error || "Failed to fetch consultations");
  const [now, setNow] = useState(serverNow);
  const [query, setQuery] = useState<Required<Pick<ConsultationQuery, "stage" | "mode" | "doctorId" | "search" | "sort">>>({
    stage: "all",
    mode: "",
    doctorId: "",
    search: "",
    sort: "newest",
  });
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ConsultationRecord | null>(null);
  const closeDrawer = useCallback(() => setSelected(null), []);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const selectClass = `${TOOLBAR_SELECT} ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`;

  /** Reads a page through the server action, then shows it. */
  const load = async (page: number, changes: Partial<typeof query> = {}) => {
    const next = { ...query, ...changes };
    setQuery(next);
    setLoading(true);
    const response = await getConsultationsPage({ ...next, page, limit: PAGE_SIZE });
    setLoading(false);
    setNow(new Date().toISOString());
    if (!response.success) {
      setError(response.error || "Failed to fetch consultations");
      return;
    }
    setError("");
    setItems(response.data ?? []);
    if (response.pagination) setPagination(response.pagination);
    if (response.stats) setStats(response.stats);
    if (response.doctors) setDoctors(response.doctors);
  };

  const statCards: StatCard[] = [
    { label: "Upcoming", value: stats?.upcoming ?? 0, sub: "Booked for later", icon: FaCalendarAlt, tone: "sky" },
    { label: "In consultation", value: stats?.live ?? 0, sub: "Inside the 24h chat", icon: FaComments, tone: "green" },
    { label: "In follow-up", value: stats?.follow_up ?? 0, sub: "Free 7-day follow-up", icon: FaHourglassHalf, tone: "amber" },
    {
      label: "Completed",
      value: stats?.completed ?? 0,
      sub: `${stats?.refunded ?? 0} refunded · ${stats?.cancelled ?? 0} cancelled`,
      icon: FaCalendarCheck,
      tone: "slate",
    },
  ];

  const stageOptions: { value: ConsultationStageFilter; label: string; count?: number }[] = [
    { value: "all", label: "All", count: stats?.total },
    { value: "upcoming", label: "Upcoming", count: stats?.upcoming },
    { value: "live", label: "In consultation", count: stats?.live },
    { value: "follow_up", label: "Follow-up", count: stats?.follow_up },
    { value: "completed", label: "Completed", count: stats?.completed },
    { value: "refunded", label: "Refunded", count: stats?.refunded },
    { value: "cancelled", label: "Cancelled", count: stats?.cancelled },
  ];

  const filtering = query.stage !== "all" || query.mode || query.doctorId || query.search;

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

      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className={`flex flex-col gap-3 border-b p-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <FilterPills value={query.stage} onChange={(stage) => load(1, { stage })} isDarkMode={isDarkMode} options={stageOptions} />
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
                placeholder="Search booking, concern, patient or doctor"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
                  isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </form>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <select value={query.mode} onChange={(e) => load(1, { mode: e.target.value as ConsultationMode | "" })} className={selectClass} aria-label="Type">
                <option value="">Instant and scheduled</option>
                <option value="instant">Instant</option>
                <option value="scheduled">Scheduled</option>
              </select>
              <select value={query.doctorId} onChange={(e) => load(1, { doctorId: e.target.value })} className={selectClass} aria-label="Doctor">
                <option value="">All doctors</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select value={query.sort} onChange={(e) => load(1, { sort: e.target.value as ConsultationSort })} className={selectClass} aria-label="Sort">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
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
                {["Booking", "Patient", "Doctor", "Starts", "Paid", "Stage"].map((h) => (
                  <th key={h} className={`px-5 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap ${h === "Paid" ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <ConsultationRowsSkeleton rows={Math.min(PAGE_SIZE, Math.max(3, items.length))} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <FaCalendarCheck className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <p className="font-medium">{filtering ? "No consultations match" : "No consultations yet"}</p>
                    <p className={`mt-1 text-sm ${muted}`}>{filtering ? "Try a different stage, doctor or search." : "Bookings show up here as soon as a patient pays."}</p>
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c._id} className={isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => setSelected(c)} className="font-mono text-sm font-medium hover:underline">
                        {c.reference}
                      </button>
                      <div className={`max-w-60 truncate text-xs ${muted}`}>{c.concern}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {c.patient?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.patient.avatar} alt="" className={`h-8 w-8 rounded-full object-cover ring-1 ${isDarkMode ? "ring-gray-600" : "ring-gray-200"}`} />
                        ) : (
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                            {initials(patientName(c))}
                          </span>
                        )}
                        <div>
                          <div className="text-sm font-medium">{patientName(c)}</div>
                          {c.patient?.phone && <div className={`text-xs ${muted}`}>{c.patient.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      {doctorName(c)}
                      {c.doctor?.specialization && <div className={`text-xs ${muted}`}>{c.doctor.specialization}</div>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className="flex items-center gap-1.5">
                        {c.mode === "instant" ? <FaBolt className="text-amber-500" size={11} title="Instant" /> : <FaCalendarAlt className="text-sky-500" size={11} title="Scheduled" />}
                        {formatDateTime(c.startsAt)}
                      </span>
                      <div className={`text-xs ${muted}`}>{relativeDays(c.startsAt, now)}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium tabular-nums">
                      {money(c.payment.amount, c.payment.currency)}
                      <div className={`text-xs font-normal ${muted}`}>{METHOD_NAMES[c.payment.method] ?? c.payment.method}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusPill tone={STAGE[c.stage]} isDarkMode={isDarkMode} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button type="button" onClick={() => setSelected(c)} className={actionBtn("blue", isDarkMode)} title="View consultation">
                        <FaEye size={14} />
                      </button>
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
          itemLabel="consultations"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => load(page)}
        />
      </div>

      <SideDrawer
        open={Boolean(selected)}
        title={selected?.reference ?? "Consultation"}
        subtitle={selected ? `${selected.mode === "instant" ? "Instant" : "Scheduled"} consultation · booked ${formatDateTime(selected.createdAt)}` : undefined}
        isDarkMode={isDarkMode}
        onClose={closeDrawer}
      >
        {selected && <ConsultationDetails c={selected} now={now} isDarkMode={isDarkMode} />}
      </SideDrawer>
    </div>
  );
};

function ConsultationDetails({ c, now, isDarkMode }: { c: ConsultationRecord; now: string; isDarkMode: boolean }) {
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const box = `rounded-xl border p-4 ${isDarkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`;
  const commission = Math.round(c.payment.amount * COMMISSION_RATE * 100) / 100;
  const person = (name: string, sub: string | undefined, href: string | null, avatar?: string) => (
    <div className="flex items-center gap-3">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className={`h-9 w-9 rounded-full object-cover ring-1 ${isDarkMode ? "ring-gray-600" : "ring-gray-200"}`} />
      ) : (
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
          {initials(name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {sub && <p className={`truncate text-xs ${muted}`}>{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="text-xs font-medium text-blue-600 hover:underline">
          Profile
        </Link>
      )}
    </div>
  );

  // Timeline: start → chat ends → follow-up ends.
  const steps =
    c.stage === "refunded" || c.stage === "cancelled"
      ? []
      : [
          { label: c.mode === "instant" ? "Chat opened" : "Starts", at: c.startsAt },
          { label: "24h chat ends", at: c.sessionEndsAt },
          { label: "Free follow-up ends", at: c.followUpEndsAt },
        ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <StatusPill tone={STAGE[c.stage]} isDarkMode={isDarkMode} />
        <span className={`text-right text-xs ${muted}`}>{STAGE[c.stage].hint}</span>
      </div>

      <section className={`${box} space-y-3`}>
        {person(patientName(c), c.patient?.phone ? `Patient · ${c.patient.phone}` : "Patient", c.patient ? `/patient/${c.patient._id}` : null, c.patient?.avatar)}
        {person(doctorName(c), [c.doctor?.title, c.doctor?.specialization].filter(Boolean).join(" · ") || "Doctor", c.doctor ? `/doctors/${c.doctor._id}` : null, c.doctor?.user?.avatar)}
      </section>

      <section>
        <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${muted}`}>Concern</h3>
        <p className="whitespace-pre-line text-sm leading-6">{c.concern}</p>
      </section>

      {steps.length > 0 && (
        <section>
          <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${muted}`}>Timeline</h3>
          <ol className="space-y-3">
            {steps.map((s, i) => {
              const done = s.at <= now;
              return (
                <li key={s.label} className="relative flex gap-3">
                  {i < steps.length - 1 && <span className={`absolute left-[9px] top-6 h-full w-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />}
                  <span
                    className={`relative z-10 mt-0.5 h-5 w-5 shrink-0 rounded-full ${
                      done ? "bg-green-500" : isDarkMode ? "border-2 border-gray-600 bg-gray-800" : "border-2 border-gray-300 bg-white"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className={`text-xs ${muted}`}>
                      {formatDateTime(s.at)} · {relativeDays(s.at, now)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className={`mt-2 text-xs ${muted}`}>Patient&apos;s time zone: {c.timezone}</p>
        </section>
      )}

      <section className={box}>
        <h3 className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${muted}`}>
          <FaReceipt /> Payment
        </h3>
        <DetailRows
          isDarkMode={isDarkMode}
          rows={[
            ["Paid", money(c.payment.amount, c.payment.currency)],
            ["Method", [METHOD_NAMES[c.payment.method] ?? c.payment.method, c.payment.details].filter(Boolean).join(" · ")],
            ["Region", REGION_NAMES[c.payment.regionId] ?? c.payment.regionId],
            ["Payment ref", <span key="ref" className="font-mono text-xs">{c.payment.reference}</span>],
            ["Paid at", c.payment.paidAt ? formatDateTime(c.payment.paidAt) : formatDateTime(c.createdAt)],
            [`Our commission (${COMMISSION_RATE * 100}%)`, money(commission, c.payment.currency)],
            ["Doctor gets", money(Math.round((c.payment.amount - commission) * 100) / 100, c.payment.currency)],
          ]}
        />
      </section>

      {c.confirmationSms && (
        <p className={`flex items-center gap-2 text-xs ${muted}`}>
          <FaSms />
          Confirmation text {c.confirmationSms.status === "sent" ? "sent" : c.confirmationSms.status === "failed" ? "failed" : "not sent"} · {formatDateTime(c.confirmationSms.at)}
        </p>
      )}
    </div>
  );
}

export default ConsultationList;
