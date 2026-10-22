"use client";
import type { Audience, AudienceCounts, Channel, LinkTarget, NewAnnouncement, RegionId } from "@/app/actions/notificationAction";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaBell, FaCalendarAlt, FaCommentAlt, FaExclamationTriangle, FaInbox, FaMobileAlt, FaPaperPlane, FaSave } from "react-icons/fa";

export const CHANNELS: Record<Channel, { label: string; hint: string; icon: typeof FaBell }> = {
  in_app: { label: "In the app", hint: "Shows in the bell inbox. Reaches everyone.", icon: FaInbox },
  push: { label: "Push notification", hint: "Pops up on the phone. Only people who turned notifications on.", icon: FaMobileAlt },
  sms: { label: "SMS", hint: "Text message. Costs money per message; keep it short.", icon: FaCommentAlt },
};

export const AUDIENCE_LABEL: Record<Audience, string> = { all: "Everyone", patients: "Patients", doctors: "Doctors" };

/** Where tapping it goes. Each opens the right page for patients and for doctors. */
export const LINKS: { value: LinkTarget | ""; label: string }[] = [
  { value: "", label: "Nothing, just the message" },
  { value: "home", label: "Home" },
  { value: "doctors", label: "Find a doctor" },
  { value: "learn", label: "Learn" },
  { value: "share_story", label: "Learn › Share story" },
  { value: "cycle", label: "Cycle tracker" },
  { value: "consultations", label: "My consultations" },
  { value: "messages", label: "Messages" },
  { value: "earnings", label: "Earnings (doctors)" },
];
export const linkLabel = (v?: string) => LINKS.find((l) => l.value === v)?.label;

export const REGION_NAMES: Record<RegionId, string> = {
  europe: "Europe & UK",
  north_america: "North America",
  middle_east: "Middle East",
  asia_pacific: "East Asia & Pacific",
  latin_america: "Latin America",
  africa: "Africa",
  south_asia: "South Asia",
};
const TITLE_MAX = 60;
const BODY_MAX = 240;
const SMS_MAX = 160;

export interface ComposerDraft {
  title: string;
  body: string;
  audience: Audience;
  region: RegionId | "";
  channels: Channel[];
  link: LinkTarget | "";
  /** Set when a draft was opened in the form; sending removes that draft. */
  fromDraft?: string;
}

export const EMPTY_DRAFT: ComposerDraft = { title: "", body: "", audience: "patients", region: "", channels: ["in_app"], link: "" };

interface ComposerProps {
  draft: ComposerDraft;
  onDraft: (draft: ComposerDraft) => void;
  /** Live counts from the backend (null if they couldn't be loaded). */
  counts: AudienceCounts | null;
  /** SMS can't go out yet (Twilio business profile not approved). */
  smsPaused: boolean;
  isDarkMode: boolean;
  /** Saves it; resolves true when it worked. */
  onSubmit: (input: NewAnnouncement) => Promise<boolean>;
}

/** Write an announcement, choose who gets it and how, see it on a phone, send or schedule. */
const AnnouncementComposer = ({ draft, onDraft, counts, smsPaused, isDarkMode, onSubmit }: ComposerProps) => {
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduleAt, setScheduleAt] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ComposerDraft>(key: K, value: ComposerDraft[K]) => onDraft({ ...draft, [key]: value });
  const toggleChannel = (c: Channel) =>
    set("channels", draft.channels.includes(c) ? draft.channels.filter((x) => x !== c) : [...draft.channels, c]);

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-2xl border p-5 shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const input = `w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500" : "border-gray-300 bg-white placeholder-gray-400"
  }`;
  const label = "mb-1.5 block text-sm font-medium";
  const errorText = "mt-1 text-xs text-red-500";

  // Reach, from live counts: active patients and approved doctors, in the chosen region.
  const countFor = (a: Audience, region: RegionId | "") => {
    if (!counts) return 0;
    const p = region ? counts.regions.patients[region] ?? 0 : counts.patients;
    const d = region ? counts.regions.doctors[region] ?? 0 : counts.doctors;
    return a === "patients" ? p : a === "doctors" ? d : p + d;
  };
  const reach = countFor(draft.audience, draft.region);
  const smsText = `GyneClinics: ${draft.title ? `${draft.title}. ` : ""}${draft.body}`;

  const errors = {
    title: !draft.title.trim() ? "Add a title" : "",
    body: !draft.body.trim() ? "Write the message" : "",
    channels: draft.channels.length === 0 ? "Pick at least one way to send it" : "",
    when: when === "later" && !scheduleAt ? "Choose the date and time" : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  const submit = async (action: "send" | "schedule" | "draft") => {
    setTried(true);
    if (action !== "draft" && !valid) {
      toast.error("Fix the highlighted fields first");
      return;
    }
    if (action === "draft" && (!draft.title.trim() || draft.channels.length === 0)) {
      toast.error("Add a title and a way to send it to save a draft");
      return;
    }
    setBusy(true);
    const ok = await onSubmit({
      action,
      title: draft.title.trim(),
      body: draft.body.trim(),
      audience: draft.audience,
      region: draft.region || undefined,
      channels: draft.channels,
      link: draft.link || undefined,
      scheduledAt: action === "schedule" ? new Date(scheduleAt).toISOString() : undefined,
      fromDraft: draft.fromDraft,
    });
    setBusy(false);
    if (ok) {
      setTried(false);
      setWhen("now");
      setScheduleAt("");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <section className={`${card} space-y-5 xl:col-span-3`}>
        <div>
          <h2 className="font-semibold">New announcement</h2>
          <p className={`text-sm ${muted}`}>News, tips or service updates for patients and doctors.</p>
        </div>

        {/* Audience */}
        <div>
          <span className={label}>Who gets it</span>
          <div className="grid grid-cols-3 gap-2">
            {(["patients", "doctors", "all"] as Audience[]).map((a) => {
              const n = countFor(a, draft.region);
              const active = draft.audience === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => set("audience", a)}
                  aria-pressed={active}
                  className={`rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                    active ? (isDarkMode ? "border-white" : "border-black") : isDarkMode ? "border-gray-700 hover:border-gray-500" : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <span className="block text-sm font-medium">{AUDIENCE_LABEL[a]}</span>
                  <span className={`text-xs ${muted}`}>{n.toLocaleString("en-GB")} people</span>
                </button>
              );
            })}
          </div>
          <select value={draft.region} onChange={(e) => set("region", e.target.value as RegionId | "")} className={`${input} mt-2`} aria-label="Region">
            <option value="">All regions</option>
            {(Object.keys(REGION_NAMES) as RegionId[]).map((r) => (
              <option key={r} value={r}>
                Only {REGION_NAMES[r]} ({countFor(draft.audience, r).toLocaleString("en-GB")})
              </option>
            ))}
          </select>
        </div>

        {/* Channels */}
        <div>
          <span className={label}>How to send it</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(Object.keys(CHANNELS) as Channel[]).map((c) => {
              const meta = CHANNELS[c];
              const on = draft.channels.includes(c);
              return (
                <label
                  key={c}
                  className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 transition-colors ${
                    on ? (isDarkMode ? "border-white" : "border-black") : isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <input type="checkbox" checked={on} onChange={() => toggleChannel(c)} className="mt-1 h-4 w-4 accent-black" />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <meta.icon size={12} /> {meta.label}
                    </span>
                    <span className={`block text-xs ${muted}`}>{meta.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {tried && errors.channels && <p className={errorText}>{errors.channels}</p>}
          {draft.channels.includes("push") && (
            <p className={`mt-2 flex items-start gap-2 rounded-lg border p-2.5 text-xs ${isDarkMode ? "border-blue-800 bg-blue-900/30 text-blue-200" : "border-blue-200 bg-blue-50 text-blue-800"}`}>
              <FaExclamationTriangle className="mt-0.5 shrink-0" />
              Push notifications aren&apos;t connected yet. Until they are, people get it in the app.
            </p>
          )}
          {smsPaused && draft.channels.includes("sms") && (
            <p className={`mt-2 flex items-start gap-2 rounded-lg border p-2.5 text-xs ${isDarkMode ? "border-amber-800 bg-amber-900/30 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              <FaExclamationTriangle className="mt-0.5 shrink-0" />
              SMS can&apos;t go out until Twilio approves the business profile. The in-app part is still sent.
            </p>
          )}
        </div>

        {/* Text */}
        <div>
          <label htmlFor="an-title" className={label}>
            Title
          </label>
          <input id="an-title" value={draft.title} maxLength={TITLE_MAX} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Menopause week: free Q&A" className={input} />
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-red-500">{tried ? errors.title : ""}</span>
            <span className={muted}>
              {draft.title.length}/{TITLE_MAX}
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="an-body" className={label}>
            Message
          </label>
          <textarea
            id="an-body"
            rows={3}
            value={draft.body}
            maxLength={BODY_MAX}
            onChange={(e) => set("body", e.target.value)}
            placeholder="Say it in one or two short sentences."
            className={`${input} resize-y`}
          />
          <div className="mt-1 flex justify-between gap-3 text-xs">
            <span className="text-red-500">{tried ? errors.body : ""}</span>
            <span className={muted}>
              {draft.channels.includes("sms") && (
                <span className={smsText.length > SMS_MAX ? "font-medium text-amber-600" : ""}>
                  SMS {smsText.length}/{SMS_MAX}
                  {smsText.length > SMS_MAX ? " (2 texts)" : ""} ·{" "}
                </span>
              )}
              {draft.body.length}/{BODY_MAX}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="an-link" className={label}>
              Opens when tapped
            </label>
            <select id="an-link" value={draft.link} onChange={(e) => set("link", e.target.value as LinkTarget | "")} className={input}>
              {LINKS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={label}>When</span>
            <div className="flex gap-2">
              {(["now", "later"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWhen(w)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium ${
                    when === w ? "border-black bg-black text-white ring-1 ring-white/20" : isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-300 text-gray-700"
                  }`}
                >
                  {w === "now" ? "Send now" : "Schedule"}
                </button>
              ))}
            </div>
          </div>
        </div>
        {when === "later" && (
          <div>
            <label htmlFor="an-when" className={label}>
              Date and time (your time)
            </label>
            <input id="an-when" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={input} />
            {tried && errors.when && <p className={errorText}>{errors.when}</p>}
          </div>
        )}

        <div className={`flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <p className={`text-sm ${muted}`}>
            Goes to <span className={`font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>{reach.toLocaleString("en-GB")}</span> {reach === 1 ? "person" : "people"}
            {!counts && " (couldn't count right now)"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => submit("draft")}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
                isDarkMode ? "border-gray-700 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FaSave size={12} /> Save draft
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => submit(when === "now" ? "send" : "schedule")}
              className="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800 disabled:opacity-50"
            >
              {when === "now" ? <FaPaperPlane size={12} /> : <FaCalendarAlt size={12} />} {when === "now" ? "Send now" : "Schedule"}
            </button>
          </div>
        </div>
      </section>

      <PhonePreview draft={draft} smsText={smsText} isDarkMode={isDarkMode} />
    </div>
  );
};

/** How it will look: lock-screen push, the in-app inbox, and the SMS. */
function PhonePreview({ draft, smsText, isDarkMode }: { draft: ComposerDraft; smsText: string; isDarkMode: boolean }) {
  const title = draft.title || "Your title";
  const body = draft.body || "Your message shows here.";
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";

  return (
    <section className="xl:col-span-2">
      <p className={`mb-3 text-xs font-semibold uppercase tracking-wide ${muted}`}>Preview</p>
      <div className="mx-auto w-full max-w-[320px] rounded-[2.5rem] border-[10px] border-gray-900 bg-gradient-to-b from-rose-200 via-purple-200 to-indigo-200 p-3 shadow-xl">
        <div className="mb-4 flex justify-center">
          <span className="h-5 w-24 rounded-full bg-gray-900" />
        </div>
        <p className="text-center text-4xl font-light text-gray-800">09:41</p>
        <p className="mb-5 text-center text-xs text-gray-700">Thursday</p>

        {draft.channels.includes("push") && (
          <div className="mb-3 rounded-2xl bg-white/80 p-3 shadow-sm backdrop-blur">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-pink-500 to-purple-600 text-[10px] font-bold text-white">G</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">GyneClinics</span>
              <span className="ml-auto text-[11px] text-gray-500">now</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="line-clamp-3 text-sm text-gray-700">{body}</p>
          </div>
        )}

        {draft.channels.includes("sms") && (
          <div className="mb-3 rounded-2xl bg-white/80 p-3 shadow-sm">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">Messages · GyneClinic</p>
            <p className="rounded-2xl rounded-bl-sm bg-gray-200 px-3 py-2 text-sm text-gray-900">{draft.title || draft.body ? smsText : "GyneClinics: your SMS shows here."}</p>
          </div>
        )}

        {draft.channels.includes("in_app") && (
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <FaBell size={10} /> In the app
            </p>
            <div className="flex gap-2.5">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-pink-500" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-600">{body}</p>
                {draft.link && <p className="mt-1 text-xs font-medium text-pink-600">Open {linkLabel(draft.link)} ›</p>}
              </div>
            </div>
          </div>
        )}

        {draft.channels.length === 0 && <p className="rounded-2xl bg-white/70 p-4 text-center text-sm text-gray-600">Pick how to send it to see a preview.</p>}
        <div className="mt-6 flex justify-center">
          <span className="h-1 w-28 rounded-full bg-gray-800" />
        </div>
      </div>
    </section>
  );
}

export default AnnouncementComposer;
