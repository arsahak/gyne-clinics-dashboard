"use client";
import { FilterPills } from "@/component/shared/ui";
import { setAutoMessage, type AutoMessage } from "@/app/actions/notificationAction";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaExclamationTriangle, FaLock, FaRobot, FaStethoscope, FaUser, FaUsers } from "react-icons/fa";
import { CHANNELS } from "./AnnouncementComposer";

/** Wraps {placeholders} so they stand out in the template. */
function Template({ text, isDarkMode }: { text: string; isDarkMode: boolean }) {
  return (
    <>
      {text.split(/(\{[a-z0-9]+\})/i).map((part, i) =>
        /^\{.+\}$/.test(part) ? (
          <span key={i} className={`rounded px-1 font-mono text-[12px] ${isDarkMode ? "bg-blue-900/60 text-blue-200" : "bg-blue-50 text-blue-700"}`}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** Live and switched on (planned ones aren't built, so they show as off). */
const isOn = (m: AutoMessage) => m.state === "live" && m.enabled;

/** Messages the app sends by itself: what triggers them, the text, and an on/off switch. */
const AutoMessageList = ({ initialMessages, error, smsPaused, isDarkMode }: { initialMessages: AutoMessage[]; error?: string; smsPaused: boolean; isDarkMode: boolean }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [to, setTo] = useState<"all" | "patient" | "doctor">("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const visible = messages.filter((m) => to === "all" || m.to === to || m.to === "both");

  /** Saves the switch on the backend; the list only changes once it worked. */
  const toggle = async (m: AutoMessage) => {
    setBusyKey(m.key);
    const result = await setAutoMessage(m.key, !m.enabled);
    setBusyKey(null);
    if (!result.success) {
      toast.error(result.error || "Failed to update");
      return;
    }
    setMessages((list) => list.map((x) => (x.key === m.key ? { ...x, enabled: !m.enabled } : x)));
    toast.success(result.message || `${m.name} turned ${m.enabled ? "off" : "on"}`);
  };

  return (
    <div className="space-y-4">
      {error && <p className={`rounded-xl border px-4 py-3 text-sm ${isDarkMode ? "border-red-800 bg-red-900/30 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}>{error}</p>}
      {smsPaused && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${isDarkMode ? "border-amber-800 bg-amber-900/30 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          <FaExclamationTriangle className="mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">SMS is paused.</span> Twilio hasn&apos;t approved the business profile yet, so login codes and booking texts only reach test numbers.
            Push and in-app messages are not affected.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills
          value={to}
          onChange={setTo}
          isDarkMode={isDarkMode}
          options={[
            { value: "all", label: "All", count: messages.length },
            { value: "patient", label: "To patients" },
            { value: "doctor", label: "To doctors" },
          ]}
        />
        <p className={`text-xs ${muted}`}>
          <span className="font-semibold text-green-600">{messages.filter((m) => m.state === "live").length} live</span> ·{" "}
          {messages.filter((m) => m.state === "planned").length} planned (need a scheduler first)
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {visible.map((m) => (
          <li key={m.key} className={`flex flex-col rounded-2xl border p-4 shadow-sm ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
            <div className="flex items-start gap-3">
              <span
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  m.to === "both" ? (isDarkMode ? "bg-indigo-900/60 text-indigo-300" : "bg-indigo-100 text-indigo-700") : m.to === "doctor" ? (isDarkMode ? "bg-teal-900/60 text-teal-300" : "bg-teal-100 text-teal-700") : isDarkMode ? "bg-rose-900/60 text-rose-300" : "bg-rose-100 text-rose-700"
                }`}
              >
                {m.to === "both" ? <FaUsers size={15} /> : m.to === "doctor" ? <FaStethoscope size={15} /> : <FaUser size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{m.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      m.state === "live"
                        ? isDarkMode
                          ? "bg-green-900/60 text-green-200"
                          : "bg-green-100 text-green-700"
                        : isDarkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.state === "live" ? "Live" : "Planned"}
                  </span>
                </div>
                <p className={`text-xs ${muted}`}>
                  {m.trigger} · {m.to === "both" ? "to patients and doctors" : `to the ${m.to}`}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isOn(m)}
                aria-label={`${m.name} on or off`}
                disabled={m.locked || m.state === "planned" || busyKey === m.key}
                title={m.locked ? "Always on: people need it to sign in" : m.state === "planned" ? "Not built yet" : undefined}
                onClick={() => toggle(m)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isOn(m) ? "bg-black ring-1 ring-white/20" : isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isOn(m) ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>

            <p className={`mt-3 rounded-xl px-3 py-2.5 text-sm leading-6 ${isDarkMode ? "bg-gray-900/60" : "bg-gray-50"}`}>
              <Template text={m.template} isDarkMode={isDarkMode} />
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {m.channels.map((c) => {
                const meta = CHANNELS[c];
                const paused = c === "sms" && smsPaused;
                return (
                  <span
                    key={c}
                    title={paused ? "Paused until Twilio approval" : meta.hint}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${
                      paused
                        ? isDarkMode
                          ? "border-amber-800 text-amber-300"
                          : "border-amber-300 text-amber-700"
                        : isDarkMode
                          ? "border-gray-600 text-gray-300"
                          : "border-gray-200 text-gray-600"
                    }`}
                  >
                    <meta.icon size={10} /> {meta.label}
                    {paused && " (paused)"}
                  </span>
                );
              })}
              {m.locked && (
                <span className={`inline-flex items-center gap-1 text-xs ${muted}`}>
                  <FaLock size={9} /> Always on
                </span>
              )}
              {m.sent7d !== null && m.state === "live" && (
                <span className={`ml-auto text-xs ${muted}`}>
                  {m.sent7d} sent this week
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className={`flex items-center gap-2 text-xs ${muted}`}>
        <FaRobot /> Words in <span className="font-mono">{"{braces}"}</span> are filled in for each person when the message goes out.
      </p>
    </div>
  );
};

export default AutoMessageList;
