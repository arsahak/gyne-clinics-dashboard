"use client";
import { getOverview, type Overview } from "@/app/actions/dashboardAction";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  FaArrowRight,
  FaBalanceScale,
  FaCalendarCheck,
  FaChevronRight,
  FaCommentDots,
  FaFlag,
  FaHandHoldingUsd,
  FaPercent,
  FaPoundSign,
  FaRedo,
  FaStar,
  FaUserCheck,
  FaUserEdit,
  FaUsers,
} from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate, formatDateTime, initials, PAYMENT_STATUS, StatusPill } from "../financeManagement/financeMeta";

// Validated single-series bar colour (light / dark surface).
const BAR = { light: "#2563eb", dark: "#3b82f6" };
const METHOD: Record<string, string> = { card: "Card", wallet: "Apple / Google Pay", local: "Other method", free: "Free" };

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const money = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === "GBP" ? "en-GB" : "en-US", { style: "currency", currency, minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);
const count = (n?: number) => (n === undefined ? "—" : n.toLocaleString("en-GB"));
const pct = (rate: number) => `${Math.round(rate * 1000) / 10}%`;

/** "+12% vs last month", or nothing when last month had none. */
function change(now: number, before: number) {
  if (!before) return "";
  const diff = Math.round(((now - before) / before) * 100);
  return `${diff >= 0 ? "+" : ""}${diff}% vs last month`;
}

const greeting = (now: string) => {
  const hour = Number(new Date(now).toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/London" }));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

/** Admin home, all live: this month's money, what needs a decision, and recent activity. Parts the role can't see aren't shown. */
const DashboardOverview = ({ initial, error: initialError, name }: { initial: Overview | null; error?: string; name?: string }) => {
  const { isDarkMode } = useSidebar();
  const [data, setData] = useState(initial);
  const [error, setError] = useState(initialError ?? "");
  const [loading, setLoading] = useState(false);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-2xl border p-5 shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const divider = isDarkMode ? "divide-gray-700 border-gray-700" : "divide-gray-100 border-gray-100";

  const reload = async () => {
    setLoading(true);
    const result = await getOverview();
    setLoading(false);
    if (result.success && result.data) {
      setData(result.data);
      setError("");
    } else setError(result.error || "Couldn't load the dashboard");
  };

  // A new notification (new patient, booking, report…) means the numbers changed: reload quietly, at most every 3 seconds.
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onNotification = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        void reloadRef.current();
      }, 3000);
    };
    window.addEventListener("gc:staff-notification", onNotification);
    return () => {
      window.removeEventListener("gc:staff-notification", onNotification);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const now = data?.now ?? new Date().toISOString();
  const { payments, payouts, patients, doctors, stories, reports, flags, reviews, consultations } = data ?? ({} as Partial<Overview>);

  const stats: StatCard[] = [
    ...(payments
      ? [
          { label: "Revenue this month", value: gbp(payments.month.revenueGBP), sub: change(payments.month.revenueGBP, payments.lastMonth.revenueGBP) || "What patients paid", icon: FaPoundSign, tone: "blue" as const },
          {
            label: `Our commission (${pct(payments.month.effectiveRate)})`,
            value: gbp(payments.month.commissionGBP),
            sub: `Doctors get ${gbp(Math.round((payments.month.revenueGBP - payments.month.commissionGBP) * 100) / 100)}`,
            icon: FaPercent,
            tone: "violet" as const,
          },
          {
            label: "Consultations this month",
            value: count(payments.month.bookings),
            sub: `${payments.month.paid} paid${change(payments.month.bookings, payments.lastMonth.bookings) ? ` · ${change(payments.month.bookings, payments.lastMonth.bookings)}` : ""}`,
            icon: FaCalendarCheck,
            tone: "teal" as const,
          },
        ]
      : []),
    ...(patients
      ? [{ label: "Patients", value: count(patients.total), sub: `${count(patients.active)} active · ${count(patients.newThisMonth)} new this month`, icon: FaUsers, tone: "rose" as const }]
      : []),
  ];

  const attention = [
    doctors && { label: "Doctors to verify", hint: "New sign-ups waiting for checks", value: doctors.pending, href: "/doctors", icon: FaUserCheck, tone: "text-amber-600 bg-amber-100", toneDark: "text-amber-300 bg-amber-900/50" },
    doctors && { label: "Doctor profile updates", hint: "Changes waiting for approval", value: doctors.updates, href: "/doctors", icon: FaUserEdit, tone: "text-sky-600 bg-sky-100", toneDark: "text-sky-300 bg-sky-900/50" },
    payouts && {
      label: "Withdrawal requests",
      hint: payouts.openRequests.count ? `${gbp(payouts.openRequests.sumGBP)} to send with Stripe` : "Nothing to send",
      value: payouts.openRequests.count,
      href: "/payouts",
      icon: FaHandHoldingUsd,
      tone: "text-green-600 bg-green-100",
      toneDark: "text-green-300 bg-green-900/50",
    },
    reports && { label: "Open reports", hint: reports.urgent ? `${reports.urgent} urgent` : "Patients or doctors flagged something", value: reports.open, href: "/reports", icon: FaFlag, tone: "text-red-600 bg-red-100", toneDark: "text-red-300 bg-red-900/50" },
    flags && { label: "Flagged chat messages", hint: flags.urgent ? `${flags.urgent} urgent health` : "Waiting for a moderator", value: flags.open, href: "/chat-moderation", icon: FaBalanceScale, tone: "text-orange-600 bg-orange-100", toneDark: "text-orange-300 bg-orange-900/50" },
    stories && { label: "Stories to review", hint: "Community stories sent by patients", value: stories.pending, href: "/stories", icon: FaCommentDots, tone: "text-purple-600 bg-purple-100", toneDark: "text-purple-300 bg-purple-900/50" },
    reviews && { label: "Reviews on hold", hint: "Low ratings or language to check", value: reviews.held, href: "/doctor-reviews", icon: FaStar, tone: "text-yellow-600 bg-yellow-100", toneDark: "text-yellow-300 bg-yellow-900/50" },
  ].filter((x): x is NonNullable<typeof x> => Boolean(x));

  const moneyFlow = payouts
    ? [
        { label: "Clearing", hint: "Waiting for the 7-day follow-up to end", value: payouts.clearingGBP, dot: "bg-amber-500" },
        { label: "Available to doctors", hint: "Cleared, doctors can withdraw", value: payouts.availableGBP, dot: "bg-green-500" },
        { label: "Requested", hint: "Doctors asked to withdraw", value: payouts.requestedGBP, dot: "bg-blue-500" },
        { label: "Paid out", hint: "Sent to doctors with Stripe", value: payouts.paidOutGBP, dot: "bg-gray-400" },
      ]
    : [];

  const axisTick = { fill: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: 11 };
  const total30 = payments ? payments.daily.reduce((s, d) => s + d.revenueGBP, 0) : 0;
  const commission30 = payments ? payments.daily.reduce((s, d) => s + d.commissionGBP, 0) : 0;

  return (
    <div className={`transition-opacity ${loading ? "opacity-60" : ""} ${isDarkMode ? "text-gray-100" : "text-gray-900"}`} aria-busy={loading}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {greeting(now)}
            {name ? `, ${name.split(" ")[0]}` : ""}
          </h1>
          <p className={`mt-1 text-sm ${muted}`}>
            {new Date(now).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" })} · Here is
            what is happening on GyneClinics.
          </p>
        </div>
        <button type="button" onClick={reload} disabled={loading} className={`flex items-center gap-1.5 self-start text-xs sm:self-end ${muted} hover:text-current disabled:opacity-50`}>
          <FaRedo size={10} className={loading ? "animate-spin" : ""} /> {consultations ? `${consultations.live} live chat${consultations.live === 1 ? "" : "s"} · ${consultations.upcoming} upcoming · ` : ""}Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            isDarkMode ? "border-red-800 bg-red-900/30 text-red-200" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {error}
          <button type="button" onClick={reload} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
            <FaRedo size={10} /> Try again
          </button>
        </div>
      )}

      {stats.length > 0 && <StatCards cards={stats} isDarkMode={isDarkMode} />}

      {/* Where the money is */}
      {payouts && (
        <section className={`${card} mb-6`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Where doctors&apos; money is</h2>
            <Link href="/payouts" className={`flex items-center gap-1 text-sm font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"} hover:underline`}>
              Payouts <FaArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {moneyFlow.map((step, i) => (
              <div key={step.label} className="relative">
                <p className={`flex items-center gap-2 text-sm ${muted}`}>
                  <span className={`h-2 w-2 rounded-full ${step.dot}`} /> {step.label}
                </p>
                <p className="mt-1 text-2xl font-bold">{gbp(step.value)}</p>
                <p className={`text-xs ${muted}`}>{step.hint}</p>
                {i < moneyFlow.length - 1 && <FaChevronRight className={`absolute right-2 top-1/2 hidden -translate-y-1/2 lg:block ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Needs attention */}
        {attention.length > 0 && (
          <section className={`${card} ${payments ? "" : "xl:col-span-3"}`}>
            <h2 className="mb-1 font-semibold">Needs attention</h2>
            <p className={`mb-4 text-sm ${muted}`}>Things waiting for a decision from the team.</p>
            <ul className="space-y-2">
              {attention.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${isDarkMode ? "hover:bg-gray-700/60" : "hover:bg-gray-50"}`}>
                    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDarkMode ? item.toneDark : item.tone}`}>
                      <item.icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className={`block truncate text-xs ${muted}`}>{item.hint}</span>
                    </span>
                    <span
                      className={`min-w-8 rounded-full px-2.5 py-1 text-center text-sm font-semibold ${
                        item.value ? (isDarkMode ? "bg-white text-gray-900" : "bg-black text-white") : isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {count(item.value)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Revenue chart */}
        {payments && (
          <section className={`${card} flex flex-col ${attention.length ? "xl:col-span-2" : "xl:col-span-3"}`}>
            <h2 className="mb-1 font-semibold">Revenue, last 30 days</h2>
            <p className={`mb-4 text-sm ${muted}`}>
              What patients paid each day (UK time). {gbp(Math.round(total30 * 100) / 100)} in total, of which {gbp(Math.round(commission30 * 100) / 100)} is our commission. Refunds
              aren&apos;t counted.
            </p>
            {/* Fills the card's height (it lines up with "Needs attention"), at least 18rem. */}
            <div className="h-72 xl:h-auto xl:min-h-72 xl:flex-1">
              {total30 === 0 ? (
                <p className={`flex h-full items-center justify-center rounded-xl border border-dashed text-sm ${muted} ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  No payments in the last 30 days.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payments.daily} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barCategoryGap="28%">
                    <CartesianGrid vertical={false} stroke={isDarkMode ? "#374151" : "#f0f1f3"} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={{ stroke: isDarkMode ? "#4b5563" : "#e5e7eb" }}
                      tick={axisTick}
                      interval={4}
                      tickFormatter={(v: string) => new Date(`${v}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" })}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={axisTick} tickFormatter={(v: number) => `£${v}`} width={52} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                      content={({ active, payload }) => {
                        const day = active && payload?.[0]?.payload;
                        if (!day) return null;
                        return (
                          <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-200 bg-white text-gray-900"}`}>
                            <p className="mb-1 font-semibold">{formatDate(`${day.date}T12:00:00Z`)}</p>
                            <p>Revenue: {gbp(day.revenueGBP)}</p>
                            <p className={muted}>Commission: {gbp(day.commissionGBP)}</p>
                            <p className={muted}>
                              {day.consultations} payment{day.consultations === 1 ? "" : "s"}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="revenueGBP" fill={isDarkMode ? BAR.dark : BAR.light} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent payments */}
        {payments && (
          <section className={`${card} ${payouts ? "xl:col-span-2" : "xl:col-span-3"}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Recent payments</h2>
              <Link href="/payments" className={`flex items-center gap-1 text-sm font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"} hover:underline`}>
                All payments <FaArrowRight size={11} />
              </Link>
            </div>
            {payments.recent.length === 0 ? (
              <p className={`py-8 text-center text-sm ${muted}`}>No payments yet.</p>
            ) : (
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className={`text-left text-xs uppercase tracking-wide ${muted}`}>
                      <th className="px-5 pb-2 font-medium">Patient</th>
                      <th className="px-3 pb-2 font-medium">Doctor</th>
                      <th className="px-3 pb-2 font-medium">Paid</th>
                      <th className="px-3 pb-2 text-right font-medium">Amount</th>
                      <th className="px-5 pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y border-t ${divider}`}>
                    {payments.recent.map((p) => (
                      <tr key={p._id}>
                        <td className="px-5 py-3">
                          <p className="font-medium">{p.patient}</p>
                          <p className={`text-xs ${muted}`}>
                            {p.reference} · {p.details || METHOD[p.method] || p.method}
                          </p>
                        </td>
                        <td className="px-3 py-3">{p.doctor}</td>
                        <td className={`px-3 py-3 ${muted}`}>{formatDateTime(p.paidAt)}</td>
                        <td className="px-3 py-3 text-right font-medium tabular-nums">
                          {money(p.amount, p.currency)}
                          {p.currency !== "GBP" && <span className={`block text-xs font-normal ${muted}`}>≈ {gbp(p.amountGBP)}</span>}
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill tone={PAYMENT_STATUS[p.status]} isDarkMode={isDarkMode} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Top doctors */}
        {payouts && (
          <section className={`${card} ${payments ? "" : "xl:col-span-3"}`}>
            <h2 className="mb-4 font-semibold">Top doctors</h2>
            {payouts.topDoctors.length === 0 ? (
              <p className={`py-8 text-center text-sm ${muted}`}>No earnings yet.</p>
            ) : (
              <ul className="space-y-4">
                {payouts.topDoctors.map((b, i) => (
                  <li key={b._id} className="flex items-center gap-3">
                    <span className={`w-4 text-sm font-semibold ${muted}`}>{i + 1}</span>
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                      {initials(b.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link href={`/doctors/${b._id}`} className="block truncate text-sm font-medium hover:underline">
                        {b.name}
                      </Link>
                      <span className={`block truncate text-xs ${muted}`}>
                        {b.consultations} paid consultation{b.consultations === 1 ? "" : "s"}
                        {b.specialization ? ` · ${b.specialization}` : ""}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-semibold tabular-nums">{gbp(b.lifetimeGBP)}</span>
                      <span className={`block text-[11px] ${muted}`}>earned</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
