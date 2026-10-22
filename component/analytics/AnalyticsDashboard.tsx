"use client";
import StatCards, { type StatCard } from "@/component/shared/StatCards";
import { FilterPills, formatDate, initials, SampleDataNote } from "@/component/shared/ui";
import { commissionOf, type AnalyticsSample, type DailyPoint } from "@/lib/sample/analytics";
import { gbp } from "@/lib/sample/finance";
import { useSidebar } from "@/lib/SidebarContext";
import { useState } from "react";
import { FaCalendarCheck, FaMobileAlt, FaPoundSign, FaUserPlus } from "react-icons/fa";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Range = "7" | "30" | "90";
type Metric = "consultations" | "revenueGBP" | "signUps" | "appOpens";

const METRICS: { value: Metric; label: string; format: (n: number) => string }[] = [
  { value: "consultations", label: "Consultations", format: (n) => `${n}` },
  { value: "revenueGBP", label: "Revenue", format: (n) => gbp(Math.round(n)) },
  { value: "signUps", label: "Sign-ups", format: (n) => `${n}` },
  { value: "appOpens", label: "App opens", format: (n) => n.toLocaleString("en-GB") },
];

// Validated single-series colours (light / dark surface).
const BAR = { light: "#2563eb", dark: "#3b82f6" };

const sum = (list: DailyPoint[], key: Metric) => list.reduce((s, d) => s + d[key], 0);
const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Platform analytics: growth, the booking funnel, where patients are, and how doctors perform. */
const AnalyticsDashboard = ({ data }: { data: AnalyticsSample }) => {
  const { isDarkMode } = useSidebar();
  const [range, setRange] = useState<Range>("30");
  const [metric, setMetric] = useState<Metric>("consultations");

  const days = Number(range);
  const current = data.daily.slice(-days);
  // The 7 / 30 days before, for the change arrows (90 days has nothing before it).
  const previous = days < 90 ? data.daily.slice(-days * 2, -days) : [];
  const change = (key: Metric) => {
    if (!previous.length) return "";
    const before = sum(previous, key);
    if (!before) return "";
    const diff = (sum(current, key) - before) / before;
    return `${diff >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(diff * 100))}% vs previous ${days} days`;
  };

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-2xl border p-5 shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const axisTick = { fill: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: 11 };
  const barColor = isDarkMode ? BAR.dark : BAR.light;
  const track = isDarkMode ? "bg-gray-700" : "bg-gray-100";
  const barFill = isDarkMode ? "bg-blue-500" : "bg-blue-600";

  const opens = sum(current, "appOpens");
  const signUps = sum(current, "signUps");
  const consultations = sum(current, "consultations");
  const revenue = sum(current, "revenueGBP");

  const stats: StatCard[] = [
    { label: "App opens", value: opens.toLocaleString("en-GB"), sub: change("appOpens") || "Visits to the app", icon: FaMobileAlt, tone: "sky" },
    { label: "New sign-ups", value: signUps, sub: change("signUps") || `${pct(signUps / opens)} of visitors`, icon: FaUserPlus, tone: "rose" },
    { label: "Consultations", value: consultations, sub: change("consultations") || "Paid bookings", icon: FaCalendarCheck, tone: "teal" },
    { label: "Revenue", value: gbp(Math.round(revenue)), sub: change("revenueGBP") || `${gbp(commissionOf(revenue))} commission`, icon: FaPoundSign, tone: "blue" },
  ];

  // Booking funnel for the period.
  const completed = Math.round(consultations * 0.95);
  const funnel = [
    { label: "Opened the app", value: opens },
    { label: "Signed up", value: signUps },
    { label: "Booked a consultation", value: consultations },
    { label: "Finished it", value: completed },
    { label: "Left a review", value: Math.round(completed * 0.6) },
  ];

  const metricMeta = METRICS.find((m) => m.value === metric)!;
  const regionTotal = data.regions.reduce((s, r) => s + r.patients, 0);
  const topicMax = Math.max(...data.topics.map((t) => t.consultations));
  const busiest = [...data.hours].sort((a, b) => b.messages - a.messages)[0];

  return (
    <div className={isDarkMode ? "text-gray-100" : "text-gray-900"}>
      <SampleDataNote isDarkMode={isDarkMode}>Example numbers so you can see the design. Real numbers will show once the app sends its events to the backend.</SampleDataNote>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-sm ${muted}`}>
          {formatDate(current[0].date)} – {formatDate(current[current.length - 1].date)}
        </p>
        <FilterPills
          value={range}
          onChange={setRange}
          isDarkMode={isDarkMode}
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
            { value: "90", label: "Last 90 days" },
          ]}
        />
      </div>

      <StatCards cards={stats} isDarkMode={isDarkMode} />

      {/* Trend */}
      <section className={`${card} mb-6`}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">{metricMeta.label} per day</h2>
            <p className={`text-sm ${muted}`}>
              {metricMeta.format(sum(current, metric))} in total · {metricMeta.format(Math.round((sum(current, metric) / days) * 10) / 10)} a day on average
            </p>
          </div>
          <FilterPills value={metric} onChange={setMetric} isDarkMode={isDarkMode} options={METRICS.map((m) => ({ value: m.value, label: m.label }))} />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={current} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid vertical={false} stroke={isDarkMode ? "#374151" : "#f0f1f3"} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: isDarkMode ? "#4b5563" : "#e5e7eb" }}
                tick={axisTick}
                interval={days === 7 ? 0 : days === 30 ? 4 : 14}
                tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" })}
              />
              <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} tickFormatter={(v: number) => (metric === "revenueGBP" ? `£${v}` : `${v}`)} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                content={({ active, payload }) => {
                  const d = active && (payload?.[0]?.payload as DailyPoint | undefined);
                  if (!d) return null;
                  return (
                    <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-200 bg-white text-gray-900"}`}>
                      <p className="mb-1 font-semibold">{formatDate(d.date)}</p>
                      {METRICS.map((m) => (
                        <p key={m.value} className={m.value === metric ? "font-semibold" : muted}>
                          {m.label}: {m.format(d[m.value])}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar dataKey={metric} fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={days === 7 ? 36 : 16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Funnel */}
        <section className={card}>
          <h2 className="font-semibold">From visit to review</h2>
          <p className={`mb-4 text-sm ${muted}`}>How many people reach each step.</p>
          <ol className="space-y-3">
            {funnel.map((step, i) => (
              <li key={step.label}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span>{step.label}</span>
                  <span className="font-semibold tabular-nums">
                    {step.value.toLocaleString("en-GB")}
                    {i > 0 && <span className={`ml-1.5 text-xs font-normal ${muted}`}>{pct(step.value / funnel[i - 1].value)}</span>}
                  </span>
                </div>
                <div className={`h-2.5 overflow-hidden rounded-full ${track}`}>
                  <div className={`h-full rounded-full ${barFill}`} style={{ width: `${i === 0 ? 100 : Math.max(2, (step.value / funnel[i - 1].value) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ol>
          <p className={`mt-4 text-xs ${muted}`}>Each bar and percentage shows how many moved on from the step above.</p>
        </section>

        {/* Regions */}
        <section className={card}>
          <h2 className="font-semibold">Where patients are</h2>
          <p className={`mb-4 text-sm ${muted}`}>{regionTotal.toLocaleString("en-GB")} patients, by pricing region.</p>
          <ul className="space-y-3">
            {data.regions.map((r) => (
              <li key={r.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{r.name}</span>
                  <span className="tabular-nums">
                    {r.patients.toLocaleString("en-GB")} <span className={`text-xs ${muted}`}>{pct(r.patients / regionTotal)}</span>
                  </span>
                </div>
                <div className={`h-2 overflow-hidden rounded-full ${track}`}>
                  <div className={`h-full rounded-full ${barFill}`} style={{ width: `${(r.patients / data.regions[0].patients) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Topics */}
        <section className={card}>
          <h2 className="font-semibold">What patients ask about</h2>
          <p className={`mb-4 text-sm ${muted}`}>Consultations by topic. Useful for which doctors to add next.</p>
          <ul className="space-y-3">
            {data.topics.map((t) => (
              <li key={t.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{t.name}</span>
                  <span className="tabular-nums">{t.consultations}</span>
                </div>
                <div className={`h-2 overflow-hidden rounded-full ${track}`}>
                  <div className={`h-full rounded-full ${barFill}`} style={{ width: `${(t.consultations / topicMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Busy hours */}
      <section className={`${card} mb-6`}>
        <h2 className="font-semibold">Busy hours</h2>
        <p className={`mb-4 text-sm ${muted}`}>
          Patient messages by hour (UK time). Busiest at {String(busiest.hour).padStart(2, "0")}:00, so doctors online in the evening reply faster.
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.hours} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke={isDarkMode ? "#374151" : "#f0f1f3"} />
              <XAxis dataKey="hour" tickLine={false} axisLine={{ stroke: isDarkMode ? "#4b5563" : "#e5e7eb" }} tick={axisTick} interval={2} tickFormatter={(h: number) => `${String(h).padStart(2, "0")}:00`} />
              <YAxis tickLine={false} axisLine={false} tick={axisTick} width={44} />
              <Tooltip
                cursor={{ fill: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                content={({ active, payload }) => {
                  const h = active && (payload?.[0]?.payload as { hour: number; messages: number } | undefined);
                  if (!h) return null;
                  return (
                    <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-200 bg-white text-gray-900"}`}>
                      <p className="font-semibold">
                        {String(h.hour).padStart(2, "0")}:00–{String((h.hour + 1) % 24).padStart(2, "0")}:00
                      </p>
                      <p>{h.messages} messages</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="messages" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Doctors */}
      <section className={`overflow-hidden rounded-2xl border shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="p-5">
          <h2 className="font-semibold">Doctor performance</h2>
          <p className={`text-sm ${muted}`}>Last 90 days. Slow first replies are the most common reason for refunds.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                {["Doctor", "Consultations", "Rating", "First reply", "Finished", "Came back", "Revenue", "Our 20%"].map((h) => (
                  <th key={h} className={`px-5 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap ${h === "Doctor" ? "text-left" : "text-right"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {data.doctors.map((d) => (
                <tr key={d.doctor.id} className={isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                        {initials(d.doctor.name)}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{d.doctor.name}</div>
                        <div className={`text-xs ${muted}`}>{d.doctor.specialization}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums">{d.consultations}</td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums">
                    {d.rating.toFixed(1)} <span className="text-amber-400">★</span>
                    <div className={`text-xs ${muted}`}>{d.reviews} reviews</div>
                  </td>
                  <td className={`px-5 py-4 text-right text-sm tabular-nums ${d.firstReplyMinutes > 60 ? "font-semibold text-amber-600" : ""}`}>
                    {d.firstReplyMinutes} min
                  </td>
                  <td className={`px-5 py-4 text-right text-sm tabular-nums ${d.completionRate < 0.9 ? "font-semibold text-amber-600" : ""}`}>{pct(d.completionRate)}</td>
                  <td className="px-5 py-4 text-right text-sm tabular-nums">{d.repeatPatients}</td>
                  <td className="px-5 py-4 text-right text-sm font-medium tabular-nums">{gbp(d.revenueGBP)}</td>
                  <td className={`px-5 py-4 text-right text-sm tabular-nums ${muted}`}>{gbp(commissionOf(d.revenueGBP))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
