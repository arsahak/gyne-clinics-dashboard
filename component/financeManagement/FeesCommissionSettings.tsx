"use client";
import {
  getFeeSettings,
  runPayoutsNow,
  saveFeeSettings,
  type FeeChange,
  type FeeSettings,
  type PayoutRunInfo,
  type PayoutSchedule,
  type RegionId,
} from "@/app/actions/feesAction";
import { formatDateTime } from "@/component/shared/ui";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaCalculator,
  FaCheckCircle,
  FaClock,
  FaCreditCard,
  FaGlobeAmericas,
  FaHistory,
  FaInfoCircle,
  FaLock,
  FaPaperPlane,
  FaPercent,
  FaPlus,
  FaStripeS,
  FaTrashAlt,
  FaUndo,
  FaUniversity,
  FaWallet,
} from "react-icons/fa";

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
/** 0.2 → 20, 0.125 → 12.5 */
const toPercent = (rate: number) => Math.round(rate * 1000) / 10;

const ACTION_BTN = "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50";

interface Override {
  doctorId: string;
  name: string;
  ratePercent: number;
  note: string;
}

interface Form {
  ratePercent: number;
  minWithdrawal: number;
  schedule: PayoutSchedule;
  /** Price per region as a % of the UK fee. */
  regions: Record<RegionId, number>;
  overrides: Override[];
}

const formFrom = (s: FeeSettings): Form => ({
  ratePercent: toPercent(s.commissionRate),
  minWithdrawal: s.minWithdrawalGBP,
  schedule: s.payoutSchedule,
  regions: Object.fromEntries(s.regions.map((r) => [r.id, toPercent(r.multiplier)])) as Record<RegionId, number>,
  overrides: s.overrides.map((o) => ({ doctorId: o.doctor._id, name: o.doctor.name, ratePercent: toPercent(o.rate), note: o.note })),
});

/** What a patient in the region pays: a whole number, at least 1 (same rule as the backend). */
const regionPrice = (feeGBP: number, percent: number, currency: "GBP" | "USD", gbpToUsd: number) => {
  if (feeGBP <= 0) return "Free";
  const amount = Math.max(1, Math.round((currency === "GBP" ? feeGBP : feeGBP * gbpToUsd) * (percent / 100)));
  return currency === "GBP" ? `£${amount}` : `$${amount}`;
};

/** Platform money rules from the backend: commission, when doctors' earnings clear, and how they withdraw. */
const FeesCommissionSettings = ({ initial, canEdit, canPay = canEdit }: { initial: FeeSettings; canEdit: boolean; canPay?: boolean }) => {
  const { isDarkMode } = useSidebar();
  const [saved, setSaved] = useState<Form>(() => formFrom(initial));
  const [form, setForm] = useState<Form>(saved);
  const [meta, setMeta] = useState({ updatedAt: initial.updatedAt, updatedBy: initial.updatedBy });
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<FeeChange[]>(initial.history ?? []);
  const [payouts, setPayouts] = useState<PayoutRunInfo>(initial.payouts);
  const [running, setRunning] = useState(false);
  const { ratePercent, minWithdrawal, schedule, overrides, regions } = form;
  const setRegion = (id: RegionId, v: number) => setForm((f) => ({ ...f, regions: { ...f.regions, [id]: v } }));
  const setRatePercent = (v: number) => setForm((f) => ({ ...f, ratePercent: v }));
  const setMinWithdrawal = (v: number) => setForm((f) => ({ ...f, minWithdrawal: v }));
  const setSchedule = (v: PayoutSchedule) => setForm((f) => ({ ...f, schedule: v }));
  const setOverrides = (fn: (list: Override[]) => Override[]) => setForm((f) => ({ ...f, overrides: fn(f.overrides) }));
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  // Comes from the consultation rules; shown here because earnings clear when it ends.
  const followUpDays = initial.followUpDays;
  const SESSION_HOURS = initial.sessionHours;
  const [exampleFee, setExampleFee] = useState(40);
  const [newDoctorId, setNewDoctorId] = useState("");

  const save = async () => {
    setSaving(true);
    const result = await saveFeeSettings({
      commissionRate: Math.round(ratePercent * 10) / 1000,
      minWithdrawalGBP: minWithdrawal,
      payoutSchedule: schedule,
      regionMultipliers: Object.fromEntries(Object.entries(regions).map(([id, v]) => [id, Math.round(v * 10) / 1000])),
      overrides: overrides.map((o) => ({ doctorId: o.doctorId, rate: Math.round(o.ratePercent * 10) / 1000, note: o.note.trim() || undefined })),
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || "Failed to save");
      return;
    }
    setSaved(form);
    setMeta({ updatedAt: new Date().toISOString(), updatedBy: "You" });
    toast.success(result.message || "Saved");
    // Fresh history and payout preview (the schedule or minimum may have changed).
    const fresh = await getFeeSettings();
    if (fresh.success && fresh.data) {
      setHistory(fresh.data.history ?? []);
      setPayouts(fresh.data.payouts);
    }
  };

  /** Pay everyone who can be paid now (Stripe). */
  const payNow = async () => {
    setRunning(true);
    const result = await runPayoutsNow();
    setRunning(false);
    if (!result.success) {
      toast.error(result.error || "Couldn't send payouts");
      return;
    }
    if (result.data) setPayouts(result.data);
    if (result.result?.sent.length) toast.success(result.message || "Sent");
    else toast(result.message || "Nobody to pay right now", { icon: "ℹ️" });
  };

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-2xl border p-6 shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const input = `rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-300 bg-white text-gray-900"
  }`;
  const chip = (light: string, dark: string) => (isDarkMode ? dark : light);

  const commission = Math.round(exampleFee * ratePercent) / 100;
  const doctorGets = Math.round((exampleFee - commission) * 100) / 100;
  const free = initial.doctors.filter((d) => !overrides.some((o) => o.doctorId === d._id));

  const heading = (icon: React.ReactNode, title: string, sub: string, tone: string) => (
    <div className="mb-5 flex items-start gap-3">
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className={`text-sm ${muted}`}>{sub}</p>
      </div>
    </div>
  );

  const timeline = [
    { label: "Patient pays", sub: "Money comes to GyneClinics", day: "Day 0" },
    { label: "Consultation", sub: `${SESSION_HOURS}h chat with the doctor`, day: "Day 1" },
    { label: "Free follow-up", sub: `${followUpDays} days of follow-up messages`, day: `Day 1–${1 + followUpDays}` },
    { label: "Cleared", sub: "Doctor can withdraw", day: `Day ${1 + followUpDays}` },
  ];

  return (
    <div className={`pb-24 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div
        className={`mb-6 flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
          isDarkMode ? "border-gray-700 bg-gray-800 text-gray-300" : "border-gray-200 bg-white text-gray-600"
        }`}
      >
        {canEdit ? <FaInfoCircle className="mt-0.5 shrink-0" /> : <FaLock className="mt-0.5 shrink-0" />}
        <p className="flex-1">
          {canEdit ? "Changes apply to new bookings. Past bookings keep the rate they were made with." : "View only: your role can see these settings but not change them."}
          {meta.updatedAt && (
            <span className={`block text-xs ${muted}`}>
              Last changed {formatDateTime(meta.updatedAt)}
              {meta.updatedBy ? ` by ${meta.updatedBy}` : ""}
            </span>
          )}
        </p>
      </div>

      <fieldset disabled={!canEdit} className="grid grid-cols-1 gap-6 xl:grid-cols-2 disabled:opacity-90">
        {/* Commission */}
        <section className={card}>
          {heading(<FaPercent />, "Commission", "GyneClinics keeps this share of every consultation. The doctor gets the rest.", chip("bg-violet-100 text-violet-700", "bg-violet-900/60 text-violet-300"))}
          <label htmlFor="rate" className="mb-1.5 block text-sm font-medium">
            Platform commission
          </label>
          <div className="mb-6 flex items-center gap-3">
            <div className="relative w-36">
              <input
                id="rate"
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={ratePercent}
                onChange={(e) => setRatePercent(Math.min(50, Math.max(0, Number(e.target.value))))}
                className={`${input} w-full pr-8`}
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}>%</span>
            </div>
            <span className={`text-sm ${muted}`}>Doctors keep {100 - ratePercent}%</span>
          </div>

          <div className={`rounded-xl border p-4 ${isDarkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`}>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              <FaCalculator className={muted} /> Example
            </p>
            <div className="mb-4 flex items-center gap-2 text-sm">
              <span className={muted}>Consultation fee</span>
              <div className="relative w-28">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}>£</span>
                <input
                  type="number"
                  min={0}
                  value={exampleFee}
                  onChange={(e) => setExampleFee(Math.max(0, Number(e.target.value)))}
                  className={`${input} w-full py-1.5 pl-7`}
                  aria-label="Example fee"
                />
              </div>
            </div>
            {/* Split bar */}
            <div className="mb-3 flex h-3 overflow-hidden rounded-full" aria-hidden>
              <span className="bg-violet-500" style={{ width: `${ratePercent}%` }} />
              <span className="ml-0.5 flex-1 bg-green-500" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className={muted}>Patient pays</p>
                <p className="text-lg font-semibold tabular-nums">{gbp(exampleFee)}</p>
              </div>
              <div>
                <p className={`flex items-center gap-1.5 ${muted}`}>
                  <span className="h-2 w-2 rounded-full bg-violet-500" /> We keep
                </p>
                <p className="text-lg font-semibold tabular-nums">{gbp(commission)}</p>
              </div>
              <div>
                <p className={`flex items-center gap-1.5 ${muted}`}>
                  <span className="h-2 w-2 rounded-full bg-green-500" /> Doctor gets
                </p>
                <p className="text-lg font-semibold tabular-nums">{gbp(doctorGets)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Clearance */}
        <section className={card}>
          {heading(
            <FaClock />,
            "When earnings clear",
            "Like Fiverr: the doctor's share is held until the free follow-up ends, so refunds and disputes can be handled first.",
            chip("bg-amber-100 text-amber-700", "bg-amber-900/60 text-amber-300"),
          )}
          <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <p className="text-sm">
              <span className="font-medium">Free follow-up: {followUpDays} days</span>{" "}
              <span className={muted}>after the {SESSION_HOURS}h consultation</span>
            </p>
            <Link href="/consultation-settings#timing" className="text-sm font-medium text-blue-600 hover:underline">
              Change in Consultation Rules
            </Link>
          </div>

          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {timeline.map((step, i) => (
              <li
                key={step.label}
                className={`rounded-xl border p-3 ${
                  i === timeline.length - 1
                    ? chip("border-green-200 bg-green-50", "border-green-800 bg-green-900/30")
                    : isDarkMode
                      ? "border-gray-700 bg-gray-900/40"
                      : "border-gray-200 bg-gray-50"
                }`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${muted}`}>{step.day}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                  {i === timeline.length - 1 && <FaCheckCircle className="text-green-500" size={12} />}
                  {step.label}
                </p>
                <p className={`text-xs ${muted}`}>{step.sub}</p>
              </li>
            ))}
          </ol>
          <p className={`mt-4 text-xs ${muted}`}>A refund before this date takes the money back from the doctor&apos;s clearing balance, so no commission is charged.</p>
        </section>

        {/* Withdrawals */}
        <section className={card}>
          {heading(<FaWallet />, "Withdrawals", "How doctors get their cleared money.", chip("bg-green-100 text-green-700", "bg-green-900/60 text-green-300"))}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="min" className="mb-1.5 block text-sm font-medium">
                Minimum withdrawal
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}>£</span>
                <input id="min" type="number" min={0} value={minWithdrawal} onChange={(e) => setMinWithdrawal(Math.max(0, Number(e.target.value)))} className={`${input} w-full pl-7`} />
              </div>
            </div>
            <div>
              <label htmlFor="schedule" className="mb-1.5 block text-sm font-medium">
                When we pay
              </label>
              <select id="schedule" value={schedule} onChange={(e) => setSchedule(e.target.value as PayoutSchedule)} className={`${input} w-full`}>
                <option value="on_request">On request (within 3 working days)</option>
                <option value="weekly">Weekly, every Friday</option>
              </select>
            </div>
          </div>

          <div className={`mb-5 rounded-xl border p-4 ${isDarkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {saved.schedule === "weekly" && payouts.nextRunAt ? `Next payout: ${formatDateTime(payouts.nextRunAt)} (UK time)` : "Payouts go when doctors ask"}
                </p>
                <p className={`text-xs ${muted}`}>
                  {saved.schedule === "weekly"
                    ? `Every Friday at 9:00 UK time we send each doctor's available balance (at least ${gbp(saved.minWithdrawal)}) with Stripe.`
                    : "Doctors ask from Earnings; you send each one from Payouts, or all at once here."}
                </p>
              </div>
              {canPay && (
                <button
                  type="button"
                  disabled={running || payouts.preview.readyGBP <= 0}
                  onClick={payNow}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white ring-1 ring-white/20 hover:bg-gray-800 disabled:opacity-50"
                >
                  <FaPaperPlane size={10} /> {running ? "Sending…" : `Pay ${gbp(payouts.preview.readyGBP)} now`}
                </button>
              )}
            </div>
            <ul className={`mt-3 divide-y text-sm ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {payouts.preview.lines.length === 0 && <li className={`py-2 text-xs ${muted}`}>Nobody to pay right now.</li>}
              {payouts.preview.lines.slice(0, 5).map((l) => (
                <li key={l.doctor._id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    {l.doctor.name}
                    <span className={`ml-2 text-xs ${muted}`}>{l.source === "request" ? "asked" : "available balance"}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {l.blocker && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${chip("bg-amber-100 text-amber-700", "bg-amber-900/60 text-amber-300")}`}>{l.blocker}</span>
                    )}
                    <span className="font-medium tabular-nums">{gbp(l.amountGBP)}</span>
                  </span>
                </li>
              ))}
              {payouts.preview.lines.length > 5 && <li className={`py-2 text-xs ${muted}`}>and {payouts.preview.lines.length - 5} more</li>}
            </ul>
            {payouts.lastRun && (
              <p className={`mt-2 text-xs ${muted}`}>
                Last run {formatDateTime(payouts.lastRun.at)}
                {payouts.lastRun.trigger === "schedule" ? " (weekly)" : payouts.lastRun.by ? ` by ${payouts.lastRun.by}` : ""}: sent {gbp(payouts.lastRun.sentGBP)} to {payouts.lastRun.sent}
                {payouts.lastRun.skipped ? `, ${payouts.lastRun.skipped} skipped` : ""}
              </p>
            )}
          </div>

          <p className="mb-2 text-sm font-medium">How money moves</p>
          <div className="space-y-3">
            <div className={`flex items-start gap-3 rounded-xl border-2 p-4 ${isDarkMode ? "border-white" : "border-black"}`}>
              <FaStripeS className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  Stripe <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold uppercase text-white ring-1 ring-white/20">In use</span>
                  {initial.stripe?.mode === "test" && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${chip("bg-amber-100 text-amber-700", "bg-amber-900/60 text-amber-300")}`}>Test mode</span>
                  )}
                </p>
                <ul className={`mt-1 space-y-1 text-xs ${muted}`}>
                  <li className="flex items-start gap-1.5">
                    <FaCreditCard className="mt-0.5 shrink-0" size={10} /> Patients pay by card, Apple Pay or Google Pay. Refunds go back through Stripe.
                  </li>
                  <li className="flex items-start gap-1.5">
                    <FaUniversity className="mt-0.5 shrink-0" size={10} /> Doctors get paid with Stripe Connect: they add a bank account or debit card on Stripe, and payouts are sent from Payouts.
                  </li>
                </ul>
                {initial.stripe && (
                  <p className="mt-2 text-xs">
                    <span className="font-medium">{initial.stripe.doctorsReady}</span> of {initial.stripe.doctors} doctor{initial.stripe.doctors === 1 ? "" : "s"} ready to be paid
                    {initial.stripe.doctorsStarted > initial.stripe.doctorsReady && <span className={muted}> · {initial.stripe.doctorsStarted - initial.stripe.doctorsReady} still setting up</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Per-doctor commission */}
        <section className={card}>
          {heading(
            <FaPercent />,
            "Special commission for some doctors",
            `Everyone else pays the standard ${ratePercent}%.`,
            chip("bg-sky-100 text-sky-700", "bg-sky-900/60 text-sky-300"),
          )}
          <ul className={`mb-4 divide-y rounded-xl border ${isDarkMode ? "divide-gray-700 border-gray-700" : "divide-gray-200 border-gray-200"}`}>
            {overrides.length === 0 && <li className={`px-4 py-6 text-center text-sm ${muted}`}>No special rates.</li>}
            {overrides.map((o) => {
              const doctor = { name: o.name };
              return (
                <li key={o.doctorId} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doctor?.name}</p>
                    <input
                      value={o.note}
                      onChange={(e) => setOverrides((list) => list.map((x) => (x.doctorId === o.doctorId ? { ...x, note: e.target.value } : x)))}
                      placeholder="Why (only the team sees this)"
                      className={`mt-1 w-full bg-transparent text-xs focus:outline-none ${muted}`}
                    />
                  </div>
                  <div className="relative w-20">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      value={o.ratePercent}
                      onChange={(e) =>
                        setOverrides((list) => list.map((x) => (x.doctorId === o.doctorId ? { ...x, ratePercent: Math.min(50, Math.max(0, Number(e.target.value))) } : x)))
                      }
                      className={`${input} w-full py-1.5 pr-6`}
                      aria-label={`Commission for ${doctor?.name}`}
                    />
                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${muted}`}>%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOverrides((list) => list.filter((x) => x.doctorId !== o.doctorId))}
                    className={`${ACTION_BTN} ${chip("bg-rose-50 text-rose-600 hover:bg-rose-100", "bg-rose-900/60 text-rose-300 hover:bg-rose-900")}`}
                    title="Remove special rate"
                  >
                    <FaTrashAlt size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">
            <select value={newDoctorId} onChange={(e) => setNewDoctorId(e.target.value)} className={`${input} flex-1`} aria-label="Doctor">
              <option value="">Choose a doctor…</option>
              {free.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                  {d.specialization ? ` · ${d.specialization}` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!newDoctorId}
              onClick={() => {
                const d = initial.doctors.find((x) => x._id === newDoctorId);
                setOverrides((list) => [...list, { doctorId: newDoctorId, name: d?.name ?? "Doctor", ratePercent, note: "" }]);
                setNewDoctorId("");
              }}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800 disabled:opacity-50"
            >
              <FaPlus size={11} /> Add
            </button>
          </div>
        </section>
        {/* Prices by region */}
        <section className={`${card} xl:col-span-2`}>
          {heading(
            <FaGlobeAmericas />,
            "Prices by region",
            `Each doctor sets one UK fee. Patients elsewhere pay a share of it, in their currency. Shown for a ${gbp(exampleFee)} UK fee.`,
            chip("bg-teal-100 text-teal-700", "bg-teal-900/60 text-teal-300"),
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left text-xs uppercase tracking-wide ${muted}`}>
                  <th className="pb-2 font-medium">Region</th>
                  <th className="pb-2 font-medium">Currency</th>
                  <th className="pb-2 font-medium">Share of UK fee</th>
                  <th className="pb-2 text-right font-medium">Patient pays</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {initial.regions.map((r) => {
                  const value = regions[r.id];
                  const changed = value !== toPercent(r.defaultMultiplier);
                  return (
                    <tr key={r.id}>
                      <td className="py-2.5 pr-3 font-medium">{r.name}</td>
                      <td className={`py-2.5 pr-3 ${muted}`}>{r.currency}</td>
                      <td className="py-2.5 pr-3">
                        <div className="relative w-28">
                          <input
                            type="number"
                            min={5}
                            max={300}
                            step={5}
                            value={value}
                            onChange={(e) => setRegion(r.id, Math.min(300, Math.max(5, Number(e.target.value))))}
                            className={`${input} w-full py-1.5 pr-7`}
                            aria-label={`${r.name} price, % of the UK fee`}
                          />
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${muted}`}>%</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{regionPrice(exampleFee, value, r.currency, initial.gbpToUsd)}</td>
                      <td className="w-10 py-2.5 text-right">
                        {changed && (
                          <button
                            type="button"
                            onClick={() => setRegion(r.id, toPercent(r.defaultMultiplier))}
                            className={`${ACTION_BTN} ${chip("bg-gray-100 text-gray-600 hover:bg-gray-200", "bg-gray-700 text-gray-300 hover:bg-gray-600")}`}
                            title={`Back to the default (${toPercent(r.defaultMultiplier)}%)`}
                          >
                            <FaUndo size={11} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={`mt-3 text-xs ${muted}`}>
            USD prices use £1 = ${initial.gbpToUsd}. Prices are rounded to whole numbers. New bookings use these prices; the app shows them within a minute.
          </p>
        </section>

        {/* History */}
        <section className={`${card} xl:col-span-2`}>
          {heading(<FaHistory />, "Change history", "Every saved change, newest first.", chip("bg-gray-100 text-gray-700", "bg-gray-700 text-gray-300"))}
          {history.length === 0 ? (
            <p className={`py-4 text-center text-sm ${muted}`}>No changes yet. The defaults are in use.</p>
          ) : (
            <ol className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {history.slice(0, 10).map((h) => (
                <li key={h.at} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
                  <p className={`w-48 shrink-0 text-xs ${muted}`}>
                    {formatDateTime(h.at)}
                    <span className="block">{h.by ?? "Team"}</span>
                  </p>
                  <ul className="space-y-0.5 text-sm">
                    {h.changes.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>
      </fieldset>

      {/* Save bar */}
      {canEdit && dirty && (
        <div
          className={`fixed bottom-4 left-1/2 z-40 flex w-[min(640px,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border px-5 py-3 shadow-xl ${
            isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <p className="text-sm font-medium">You have unsaved changes</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setForm(saved)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50 ${isDarkMode ? "border-gray-700 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
            >
              Undo
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesCommissionSettings;
