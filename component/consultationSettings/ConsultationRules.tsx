"use client";
import { SampleDataNote } from "@/component/shared/ui";
import { BOOKING_WINDOWS, MIN_NOTICE, regionalPrice, SLOT_LENGTHS, type ConsultationRules as Rules } from "@/lib/sample/consultationRules";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import type { IconType } from "react-icons";
import { FaArrowRight, FaCalendarAlt, FaClock, FaComments, FaGlobeEurope, FaShieldAlt, FaUndo, FaVideo } from "react-icons/fa";

const SECTIONS: { id: string; label: string; icon: IconType }[] = [
  { id: "timing", label: "Timing and refunds", icon: FaClock },
  { id: "messaging", label: "How patients reach doctors", icon: FaComments },
  { id: "booking", label: "Booking", icon: FaCalendarAlt },
  { id: "prices", label: "Fees and regional prices", icon: FaGlobeEurope },
  { id: "video", label: "Video calls", icon: FaVideo },
  { id: "safety", label: "Chat safety", icon: FaShieldAlt },
];

// ── Small building blocks (module level so inputs keep focus while typing) ──

const useTheme = () => {
  const { isDarkMode } = useSidebar();
  return {
    isDarkMode,
    muted: isDarkMode ? "text-gray-400" : "text-gray-500",
    input: `rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-300 bg-white text-gray-900"
    }`,
  };
};

function Heading({ id, title, sub }: { id: string; title: string; sub: string }) {
  const { isDarkMode, muted } = useTheme();
  const Icon = SECTIONS.find((s) => s.id === id)!.icon;
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
        <Icon size={15} />
      </span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className={`text-sm ${muted}`}>{sub}</p>
      </div>
    </div>
  );
}

function Toggle({ on, onChange, label, hint, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  const { isDarkMode, muted } = useTheme();
  return (
  <div className="flex items-start justify-between gap-4 py-3">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className={`text-xs ${muted}`}>{hint}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        on ? "bg-black ring-1 ring-white/20" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
      }`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  </div>
  );
}

function NumberRow({ label, hint, value, unit, min, max, onChange }: { label: string; hint?: string; value: number; unit: string; min: number; max: number; onChange: (v: number) => void }) {
  const { muted, input } = useTheme();
  // Text while typing, so the box can be empty for a moment; the number is fixed on leaving it.
  const [text, setText] = useState(String(value));
  const [last, setLast] = useState(value);
  if (last !== value) {
    setLast(value);
    setText(String(value));
  }
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
  <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className={`text-xs ${muted}`}>{hint}</p>}
    </div>
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={min}
        max={max}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value !== "" && !Number.isNaN(Number(e.target.value))) onChange(clamp(Number(e.target.value)));
        }}
        onBlur={() => setText(String(value))}
        className={`${input} w-24 text-right`}
        aria-label={label}
      />
      <span className={`w-14 text-sm ${muted}`}>{unit}</span>
    </div>
  </div>
  );
}

function Choice({ label, hint, options, value, unit, onChange }: { label: string; hint?: string; options: number[]; value: number; unit: string; onChange: (v: number) => void }) {
  const { isDarkMode, muted } = useTheme();
  return (
  <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className={`text-xs ${muted}`}>{hint}</p>}
    </div>
    <div className={`inline-flex rounded-lg border p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${value === o ? "bg-black text-white" : `${muted} hover:text-current`}`}
        >
          {o}
          {unit}
        </button>
      ))}
    </div>
  </div>
  );
}


/** The rules every consultation follows: timing, booking, prices, video and chat safety. */
const ConsultationRules = ({ initialRules }: { initialRules: Rules }) => {
  const { isDarkMode } = useSidebar();
  const [saved, setSaved] = useState(initialRules);
  const [rules, setRules] = useState(initialRules);
  const [exampleFee, setExampleFee] = useState(40);
  const dirty = JSON.stringify(rules) !== JSON.stringify(saved);

  const set = <K extends keyof Rules>(key: K, value: Rules[K]) => setRules((r) => ({ ...r, [key]: value }));
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `scroll-mt-24 rounded-2xl border p-6 shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const input = `rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-300 bg-white text-gray-900"
  }`;
  const divider = isDarkMode ? "divide-gray-700" : "divide-gray-100";

  const timeline = [
    { label: "Book and pay", sub: `Slot held ${rules.slotHoldMinutes} min while paying`, tone: "bg-gray-400" },
    { label: "Consultation", sub: `${rules.sessionHours}h open chat with the doctor`, tone: "bg-violet-500" },
    { label: "Free follow-up", sub: `${rules.followUpDays} days of questions on the same concern`, tone: "bg-amber-500" },
    { label: "Closed", sub: "Doctor's earnings clear", tone: "bg-green-500" },
  ];

  return (
    <div className={`pb-24 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
      <SampleDataNote isDarkMode={isDarkMode}>
        These are the rules the app uses today. Changes stay on this page for now; saving will work once the settings are stored on the backend.
      </SampleDataNote>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[220px_1fr]">
        {/* Section list */}
        <nav className="hidden xl:block" aria-label="Sections">
          <ul className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-600 hover:bg-white"}`}>
                  <s.icon size={13} /> {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          {/* Timing */}
          <section id="timing" className={card}>
            <Heading id="timing" title="Timing and refunds" sub="What happens after a patient books, and when they get their money back." />
            <ol className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-4">
              {timeline.map((step, i) => (
                <li key={step.label} className={`rounded-xl border p-3 ${isDarkMode ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"}`}>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className={`h-2 w-2 rounded-full ${step.tone}`} /> {i + 1}. {step.label}
                  </p>
                  <p className={`mt-1 text-xs ${muted}`}>{step.sub}</p>
                </li>
              ))}
            </ol>
            <div className={`divide-y ${divider}`}>
              <NumberRow label="Consultation length" hint="The chat is fully open for this long after it starts." value={rules.sessionHours} unit="hours" min={1} max={72} onChange={(v) => set("sessionHours", v)} />
              <NumberRow
                label="Free follow-up"
                hint="Patients can keep asking about the same concern. Doctors' earnings clear when it ends."
                value={rules.followUpDays}
                unit="days"
                min={0}
                max={30}
                onChange={(v) => set("followUpDays", v)}
              />
              <NumberRow
                label="Reply guarantee"
                hint="If the doctor hasn't replied in this time, the patient gets a full refund automatically."
                value={rules.replyGuaranteeHours}
                unit="hours"
                min={1}
                max={48}
                onChange={(v) => set("replyGuaranteeHours", v)}
              />
              <NumberRow label="Hold a slot while paying" hint="Nobody else can book the slot during checkout." value={rules.slotHoldMinutes} unit="minutes" min={5} max={30} onChange={(v) => set("slotHoldMinutes", v)} />
            </div>
            <p className={`mt-3 flex items-center gap-2 text-xs ${muted}`}>
              <FaUndo size={10} /> Commission and payouts use the follow-up length too.
              <Link href="/fees-commission" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">
                Fees &amp; Commission <FaArrowRight size={9} />
              </Link>
            </p>
          </section>

          {/* Messaging */}
          <section id="messaging" className={card}>
            <Heading id="messaging" title="How patients reach doctors" sub="Defaults for new doctors. Each doctor offers free messages, paid consultations, or both." />
            <div className={`divide-y ${divider}`}>
              <Toggle
                on={rules.paidConsultationDefault}
                onChange={(v) => (v || rules.freeMessagesDefault ? set("paidConsultationDefault", v) : toast.error("Keep at least one way on"))}
                label="Paid consultations"
                hint="Patients book a time (or chat now) and pay the doctor's fee."
              />
              <Toggle
                on={rules.freeMessagesDefault}
                onChange={(v) => (v || rules.paidConsultationDefault ? set("freeMessagesDefault", v) : toast.error("Keep at least one way on"))}
                label="Free messages"
                hint="Patients can message the doctor without booking."
              />
              <Toggle on={rules.instantChatDefault} onChange={(v) => set("instantChatDefault", v)} label="Chat now" hint="When the doctor is online, patients can start straight away instead of booking a slot." />
              <Toggle on={rules.doctorsChooseMessaging} onChange={(v) => set("doctorsChooseMessaging", v)} label="Doctors can change these in their app" hint="Off = only the team can change how a doctor is reached." />
            </div>
          </section>

          {/* Booking */}
          <section id="booking" className={card}>
            <Heading id="booking" title="Booking" sub="Defaults for a new doctor's schedule. Patients see slots made from it." />
            <div className={`divide-y ${divider}`}>
              <Choice label="Slot length" options={SLOT_LENGTHS} unit=" min" value={rules.slotMinutesDefault} onChange={(v) => set("slotMinutesDefault", v)} />
              <Choice label="Book up to" hint="How far ahead patients can book." options={BOOKING_WINDOWS} unit=" days" value={rules.bookingWindowDaysDefault} onChange={(v) => set("bookingWindowDaysDefault", v)} />
              <Choice label="Minimum notice" hint="The earliest a patient can book before a slot." options={MIN_NOTICE} unit="h" value={rules.minNoticeHoursDefault} onChange={(v) => set("minNoticeHoursDefault", v)} />
              <Toggle on={rules.doctorsEditSchedule} onChange={(v) => set("doctorsEditSchedule", v)} label="Doctors set their own hours" hint="Weekly hours, days off and the options above, from the doctor's app." />
            </div>
          </section>

          {/* Prices */}
          <section id="prices" className={card}>
            <Heading id="prices" title="Fees and regional prices" sub="Doctors set one fee in pounds. Each region pays a share of it, in its own currency." />
            <div className={`mb-4 divide-y ${divider}`}>
              <NumberRow label="Lowest fee a doctor can set" value={rules.minFeeGBP} unit="£" min={0} max={rules.maxFeeGBP} onChange={(v) => set("minFeeGBP", v)} />
              <NumberRow label="Highest fee a doctor can set" value={rules.maxFeeGBP} unit="£" min={rules.minFeeGBP} max={1000} onChange={(v) => set("maxFeeGBP", v)} />
              <Toggle on={rules.allowFreeConsultations} onChange={(v) => set("allowFreeConsultations", v)} label="Allow free consultations" hint="A doctor can set the fee to £0 (no payment step)." />
            </div>

            <div className={`overflow-hidden rounded-xl border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm ${isDarkMode ? "bg-gray-900/40" : "bg-gray-50"}`}>
                <span className="font-medium">Price by region</span>
                <span className={`flex items-center gap-2 ${muted}`}>
                  Example fee £
                  <input
                    type="number"
                    min={0}
                    value={exampleFee}
                    onChange={(e) => setExampleFee(Math.max(0, Number(e.target.value) || 0))}
                    className={`${input} w-20 py-1`}
                    aria-label="Example fee"
                  />
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={`text-left text-xs uppercase tracking-wide ${muted}`}>
                    <tr>
                      <th className="px-4 py-2 font-medium">Region</th>
                      <th className="px-4 py-2 font-medium">Share of fee</th>
                      <th className="px-4 py-2 text-right font-medium">Patient pays</th>
                      <th className="px-4 py-2 font-medium">Local payment</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${divider}`}>
                    {rules.regions.map((r, i) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2.5 font-medium whitespace-nowrap">{r.name}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={5}
                              max={100}
                              step={5}
                              value={Math.round(r.multiplier * 100)}
                              onChange={(e) => {
                                const multiplier = Math.min(100, Math.max(5, Number(e.target.value) || 5)) / 100;
                                set("regions", rules.regions.map((x, j) => (j === i ? { ...x, multiplier } : x)));
                              }}
                              className={`${input} w-20 py-1.5 text-right`}
                              aria-label={`${r.name} share of fee`}
                            />
                            <span className={muted}>%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap">
                          {regionalPrice(exampleFee, r, rules.gbpToUsd)} <span className={`text-xs font-normal ${muted}`}>{r.currency}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {r.localMethods.length === 0 ? (
                              <span className={`text-xs ${muted}`}>Card, Apple Pay, Google Pay</span>
                            ) : (
                              r.localMethods.map((m) => (
                                <span key={m} className={`rounded-full px-2 py-0.5 text-xs ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                                  {m}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={`border-t px-4 py-2.5 text-xs ${muted} ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                Card and Apple Pay / Google Pay work everywhere. Fixed rate £1 = ${rules.gbpToUsd}. Patients see the price for the region they are in.
              </p>
            </div>
          </section>

          {/* Video */}
          <section id="video" className={card}>
            <Heading id="video" title="Video calls" sub="Doctor and patient can start a video call during a paid consultation." />
            <div className={`divide-y ${divider}`}>
              <Toggle on={rules.videoEnabled} onChange={(v) => set("videoEnabled", v)} label="Allow video calls" hint="Two people per call: the doctor and the patient." />
              <NumberRow label="Longest call" hint="The call ends by itself after this." value={rules.videoMaxMinutes} unit="minutes" min={10} max={120} onChange={(v) => set("videoMaxMinutes", v)} />
              <Toggle
                on={rules.videoRecording}
                onChange={(v) => set("videoRecording", v)}
                label="Record calls"
                hint="Off. Recording health calls needs the patient's clear consent and secure storage first, so it isn't built."
                disabled
              />
            </div>
          </section>

          {/* Safety */}
          <section id="safety" className={card}>
            <Heading id="safety" title="Chat safety" sub="Keeps patients and doctors talking inside GyneClinics, and helps in an emergency." />
            <div className={`divide-y ${divider}`}>
              <Toggle on={rules.blockPhone} onChange={(v) => set("blockPhone", v)} label="Block phone numbers" />
              <Toggle on={rules.blockEmail} onChange={(v) => set("blockEmail", v)} label="Block email addresses" />
              <Toggle on={rules.blockLinks} onChange={(v) => set("blockLinks", v)} label="Block links and websites" />
              <Toggle on={rules.blockSocial} onChange={(v) => set("blockSocial", v)} label="Block WhatsApp and social media handles" />
            </div>
            <div className="mt-4">
              <label htmlFor="emergency" className="mb-1.5 block text-sm font-medium">
                Emergency advice
              </label>
              <p className={`mb-2 text-xs ${muted}`}>Shown to the patient when they write words like heavy bleeding or severe pain.</p>
              <textarea id="emergency" rows={3} value={rules.emergencyMessage} onChange={(e) => set("emergencyMessage", e.target.value)} className={`${input} w-full resize-y`} />
            </div>
            <p className={`mt-3 text-xs ${muted}`}>
              Caught messages go to{" "}
              <Link href="/chat-moderation" className="font-medium text-blue-600 hover:underline">
                Chat Moderation
              </Link>
              .
            </p>
          </section>
        </div>
      </div>

      {/* Save bar */}
      {dirty && (
        <div
          className={`fixed bottom-4 left-1/2 z-40 flex w-[min(640px,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border px-5 py-3 shadow-xl ${
            isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <p className="text-sm font-medium">You have unsaved changes</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRules(saved)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${isDarkMode ? "border-gray-700 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => {
                setSaved(rules);
                toast.success("Saved on this page. It will apply to the app once settings are on the backend.");
              }}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800"
            >
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationRules;
