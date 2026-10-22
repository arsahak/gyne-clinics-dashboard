"use client";
import {
  getPaymentsPage,
  refundPayment,
  type PaymentMethod,
  type PaymentPageResponse,
  type PaymentPagination,
  type PaymentRecord,
  type PaymentStats,
  type PaymentStatus,
} from "@/app/actions/paymentAction";
import SideDrawer from "@/component/shared/SideDrawer";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import TablePagination from "@/component/shared/TablePagination";
import { actionBtn, DetailRows, FilterPills, formatDate, formatDateTime, relativeDays, StatusPill } from "@/component/shared/ui";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FaExternalLinkAlt, FaEye, FaHourglassHalf, FaPercent, FaPoundSign, FaReceipt, FaRedo, FaSearch, FaUndo } from "react-icons/fa";
import { PAYMENT_STATUS } from "./financeMeta";
import { MoneyRowsSkeleton } from "./FinanceSkeletons";

const PAGE_SIZE = 10;
const TOOLBAR_SELECT = "px-3 py-2.5 rounded-lg border text-sm sm:min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500";

const METHOD_LABEL: Record<string, string> = { card: "Card", wallet: "Apple Pay / Google Pay", local: "Other method" };
const REGION_NAMES: Record<string, string> = {
  europe: "Europe & UK",
  north_america: "North America",
  middle_east: "Middle East",
  asia_pacific: "East Asia & Pacific",
  latin_america: "Latin America",
  africa: "Africa",
  south_asia: "South Asia",
};

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === "GBP" ? "en-GB" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
const gbp = (n: number) => money(n, "GBP");
const nameOf = (p: { fullName?: string; phone?: string } | null | undefined, fallback: string) => p?.fullName || p?.phone || fallback;

type Query = { status: PaymentStatus | "all"; doctorId: string; method: PaymentMethod | ""; search: string };

/** Real payments (paid consultations): the patient's money, our 20%, and when the doctor's share clears. */
const PaymentList = ({ initial, now: serverNow, canRefund }: { initial: PaymentPageResponse; now: string; canRefund: boolean }) => {
  const { isDarkMode } = useSidebar();
  const [items, setItems] = useState<PaymentRecord[]>(initial.data ?? []);
  const [pagination, setPagination] = useState<PaymentPagination>(initial.pagination ?? { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [stats, setStats] = useState<PaymentStats | undefined>(initial.stats);
  const [doctors, setDoctors] = useState(initial.doctors ?? []);
  const [error, setError] = useState(initial.success ? "" : initial.error || "Failed to fetch payments");
  const [now, setNow] = useState(serverNow);
  const [query, setQuery] = useState<Query>({ status: "all", doctorId: "", method: "", search: "" });
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setSelectedId(null), []);
  const selected = items.find((p) => p._id === selectedId) ?? null;

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const selectClass = `${TOOLBAR_SELECT} ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`;
  const rate = Math.round((stats?.commissionRate ?? 0.2) * 100);

  /** Reads a page through the server action. `quiet` skips the skeleton (after a refund). */
  const load = async (page: number, changes: Partial<Query> = {}, quiet = false) => {
    const next = { ...query, ...changes };
    setQuery(next);
    if (!quiet) setLoading(true);
    const response = await getPaymentsPage({ ...next, page, limit: PAGE_SIZE });
    setLoading(false);
    setNow(new Date().toISOString());
    if (!response.success) {
      setError(response.error || "Failed to fetch payments");
      return;
    }
    setError("");
    setItems(response.data ?? []);
    if (response.pagination) setPagination(response.pagination);
    if (response.stats) setStats(response.stats);
    if (response.doctors) setDoctors(response.doctors);
  };

  const statCards: StatCard[] = [
    { label: "Collected", value: gbp(stats?.collectedGBP ?? 0), sub: `${stats?.paid ?? 0} paid · ${gbp(stats?.monthCollectedGBP ?? 0)} this month`, icon: FaPoundSign, tone: "blue" },
    { label: `Commission (${rate}%)`, value: gbp(stats?.commissionGBP ?? 0), sub: "Kept by GyneClinics", icon: FaPercent, tone: "violet" },
    { label: "Clearing", value: gbp(stats?.clearingGBP ?? 0), sub: `Doctors' share in ${stats?.clearing ?? 0} follow-up${stats?.clearing === 1 ? "" : "s"}`, icon: FaHourglassHalf, tone: "amber" },
    { label: "Refunded", value: gbp(stats?.refundedGBP ?? 0), sub: `${stats?.refunded ?? 0} payment${stats?.refunded === 1 ? "" : "s"} returned`, icon: FaUndo, tone: "slate" },
  ];

  const filtering = query.status !== "all" || query.doctorId || query.method || query.search;

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      <StatCards cards={statCards} isDarkMode={isDarkMode} />
      <p className={`-mt-3 mb-4 text-xs ${muted}`}>Totals are in pounds. Payments in dollars are converted at the app&apos;s fixed rate (£1 = $1.30).</p>

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
          <FilterPills
            value={query.status}
            onChange={(status) => load(1, { status })}
            isDarkMode={isDarkMode}
            options={[
              { value: "all", label: "All", count: (stats?.paid ?? 0) + (stats?.refunded ?? 0) },
              { value: "clearing", label: "Clearing", count: stats?.clearing },
              { value: "cleared", label: "Cleared", count: stats?.cleared },
              { value: "refunded", label: "Refunded", count: stats?.refunded },
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
                placeholder="Search booking, payment ref, patient or doctor"
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
              <select value={query.method} onChange={(e) => load(1, { method: e.target.value as PaymentMethod | "" })} className={selectClass} aria-label="Payment method">
                <option value="">All methods</option>
                {Object.entries(METHOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
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
                {["Booking", "Patient", "Doctor", "Paid", "Amount", "Commission", "Doctor gets", "Clears", "Status"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap ${["Amount", "Commission", "Doctor gets"].includes(h) ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <MoneyRowsSkeleton cols={10} rows={Math.min(PAGE_SIZE, Math.max(3, items.length))} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-14 text-center">
                    <FaReceipt className={`mx-auto mb-3 text-4xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <p className="font-medium">{filtering ? "No payments match" : "No payments yet"}</p>
                    <p className={`mt-1 text-sm ${muted}`}>{filtering ? "Try a different status, doctor or search." : "Paid bookings show up here."}</p>
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const cur = p.payment.currency;
                  const refunded = p.paymentStatus === "refunded";
                  return (
                    <tr key={p._id} className={isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button type="button" onClick={() => setSelectedId(p._id)} className="font-mono text-sm font-medium hover:underline">
                          {p.reference}
                        </button>
                        <div className={`font-mono text-xs ${muted}`}>{p.payment.reference}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{nameOf(p.patient, "Patient removed")}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{nameOf(p.doctor?.user, "Doctor removed")}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {formatDateTime(p.payment.paidAt ?? p.createdAt)}
                        <div className={`text-xs ${muted}`}>{METHOD_LABEL[p.payment.method] ?? p.payment.method}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium tabular-nums">
                        {money(p.payment.amount, cur)}
                        {cur !== "GBP" && <div className={`text-xs font-normal ${muted}`}>≈ {gbp(p.amountGBP)}</div>}
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-right text-sm tabular-nums ${muted}`}>{refunded ? "—" : money(p.commission, cur)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm tabular-nums">{refunded ? "—" : money(p.doctorShare, cur)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {refunded ? (
                          <span className={muted}>—</span>
                        ) : (
                          <>
                            {formatDate(p.clearsAt)}
                            <div className={`text-xs ${p.paymentStatus === "clearing" ? (isDarkMode ? "text-amber-300" : "text-amber-600") : muted}`}>{relativeDays(p.clearsAt, now)}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusPill tone={PAYMENT_STATUS[p.paymentStatus]} isDarkMode={isDarkMode} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <button type="button" onClick={() => setSelectedId(p._id)} className={actionBtn("blue", isDarkMode)} title="View payment">
                          <FaEye size={14} />
                        </button>
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
          itemLabel="payments"
          isDarkMode={isDarkMode}
          disabled={loading}
          onPageChange={(page) => load(page)}
        />
      </div>

      <PaymentDrawer
        payment={selected}
        now={now}
        rate={rate}
        canRefund={canRefund}
        isDarkMode={isDarkMode}
        onClose={closeDrawer}
        onRefunded={() => load(pagination.page, {}, true)}
      />
    </div>
  );
};

interface PaymentDrawerProps {
  payment: PaymentRecord | null;
  now: string;
  rate: number;
  canRefund: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onRefunded: () => Promise<void>;
}

/** One payment: the money split, the clearance timeline, and recording a refund. */
function PaymentDrawer({ payment: p, now, rate, canRefund, isDarkMode, onClose, onRefunded }: PaymentDrawerProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const box = `rounded-xl border p-4 ${isDarkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`;

  const refund = async () => {
    if (!p) return;
    if (reason.trim().length < 3) {
      toast.error("Say why it was refunded");
      return;
    }
    setBusy(true);
    const result = await refundPayment(p._id, reason.trim());
    if (result.success) {
      toast.success(result.message || "Refund recorded");
      setReason("");
      await onRefunded();
    } else toast.error(result.error || "Failed to record the refund");
    setBusy(false);
  };

  const sessionEnds = p && new Date(new Date(p.startsAt).getTime() + 24 * 3_600_000).toISOString();
  const steps = p
    ? p.paymentStatus === "refunded"
      ? [
          { label: "Patient paid", at: p.payment.paidAt ?? p.createdAt, done: true },
          { label: p.refund ? `Refunded: ${p.refund.reason}` : "Refunded or cancelled", at: p.refund?.at, done: true },
        ]
      : [
          { label: "Patient paid", at: p.payment.paidAt ?? p.createdAt, done: true },
          { label: "24h chat with the doctor ends", at: sessionEnds!, done: sessionEnds! <= now },
          { label: "Free follow-up ends · doctor's share clears", at: p.clearsAt, done: p.clearsAt <= now },
        ]
    : [];

  return (
    <SideDrawer open={Boolean(p)} title={p?.reference ?? "Payment"} subtitle={p ? `Payment ref ${p.payment.reference}` : undefined} isDarkMode={isDarkMode} onClose={onClose}>
      {p && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <StatusPill tone={PAYMENT_STATUS[p.paymentStatus]} isDarkMode={isDarkMode} />
            <span className={`text-right text-xs ${muted}`}>{PAYMENT_STATUS[p.paymentStatus].hint}</span>
          </div>

          <section className={box}>
            <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${muted}`}>Money split</h3>
            <DetailRows
              isDarkMode={isDarkMode}
              rows={[
                ["Patient paid", `${money(p.payment.amount, p.payment.currency)}${p.payment.currency !== "GBP" ? ` (≈ ${gbp(p.amountGBP)})` : ""}`],
                [`GyneClinics commission (${Math.round((p.commissionRate ?? rate / 100) * 100)}%)`, p.paymentStatus === "refunded" ? "—" : `−${money(p.commission, p.payment.currency)}`],
                ["Doctor gets", p.paymentStatus === "refunded" ? "—" : money(p.doctorShare, p.payment.currency)],
              ]}
            />
          </section>

          <section>
            <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${muted}`}>Clearance</h3>
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={s.label} className="relative flex gap-3">
                  {i < steps.length - 1 && <span className={`absolute left-[9px] top-6 h-full w-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />}
                  <span
                    className={`relative z-10 mt-0.5 h-5 w-5 shrink-0 rounded-full ${s.done ? "bg-green-500" : isDarkMode ? "border-2 border-gray-600 bg-gray-800" : "border-2 border-gray-300 bg-white"}`}
                  />
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    {s.at && (
                      <p className={`text-xs ${muted}`}>
                        {formatDateTime(s.at)}
                        {!s.done ? ` · ${relativeDays(s.at, now)}` : ""}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={box}>
            <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${muted}`}>Details</h3>
            <DetailRows
              isDarkMode={isDarkMode}
              rows={[
                ["Patient", p.patient ? <Link key="p" href={`/patient/${p.patient._id}`} className="text-blue-600 hover:underline">{nameOf(p.patient, "Patient")}</Link> : "Patient removed"],
                ["Doctor", p.doctor ? <Link key="d" href={`/doctors/${p.doctor._id}`} className="text-blue-600 hover:underline">{nameOf(p.doctor.user, "Doctor")}</Link> : "Doctor removed"],
                ["Method", [METHOD_LABEL[p.payment.method] ?? p.payment.method, p.payment.details].filter(Boolean).join(" · ")],
                ["Region", REGION_NAMES[p.payment.regionId] ?? p.payment.regionId],
                ["Paid", formatDateTime(p.payment.paidAt ?? p.createdAt)],
                ...(p.stripeUrl
                  ? ([
                      [
                        "Stripe",
                        <a key="s" href={p.stripeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                          Open in Stripe <FaExternalLinkAlt size={10} />
                        </a>,
                      ],
                    ] as [string, React.ReactNode][])
                  : []),
                ...(p.refund ? ([["Refunded by", `${p.refund.by?.fullName ?? "Stripe dashboard"} · ${formatDateTime(p.refund.at)}`]] as [string, string][]) : []),
              ]}
            />
          </section>

          {p.paymentStatus === "clearing" &&
            (canRefund ? (
              <section className={`space-y-2 rounded-xl border p-4 ${isDarkMode ? "border-red-900 bg-red-950/20" : "border-red-200 bg-red-50/60"}`}>
                <p className="text-sm font-medium">Refund the patient</p>
                <p className={`text-xs ${muted}`}>
                  {p.payment.provider === "stripe"
                    ? "Stripe sends the full amount back to the card the patient paid with. It comes out of the doctor's earnings. Only possible until it clears."
                    : "This payment was made before Stripe: send the money back yourself first. This records it and takes it out of the doctor's earnings. Only possible until it clears."}
                </p>
                <input
                  value={reason}
                  maxLength={300}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why, e.g. Doctor didn't reply within 12 hours"
                  aria-label="Refund reason"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-300 bg-white"
                  }`}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={refund}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <FaUndo size={12} /> {p.payment.provider === "stripe" ? `Refund ${money(p.payment.amount, p.payment.currency)} with Stripe` : "Record refund"}
                </button>
              </section>
            ) : (
              <p className={`text-xs ${muted}`}>Your role can view payments but not refund them.</p>
            ))}
        </div>
      )}
    </SideDrawer>
  );
}

export default PaymentList;
