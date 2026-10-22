"use client";
import { type DoctorMessaging, type DoctorRecord, updateDoctor } from "@/app/actions/doctorAction";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaComments } from "react-icons/fa";

const OPTIONS: { key: keyof DoctorMessaging; label: string; on: string; off: string }[] = [
  {
    key: "free",
    label: "Free messages",
    on: "Patients can message without booking or paying.",
    off: "Patients can't send free messages.",
  },
  {
    key: "consultation",
    label: "Message consultation",
    on: "Patients book and pay the fee for a chat consultation.",
    off: "Patients can't book a paid chat consultation.",
  },
];

/** How patients can reach the doctor. The doctor sets this too; at least one stays on. */
export function DoctorMessagingSettings({ doctor }: { doctor: DoctorRecord }) {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const messaging = doctor.messaging;

  const toggle = async (key: keyof DoctorMessaging) => {
    const next = { ...messaging, [key]: !messaging[key] };
    if (!next.free && !next.consultation) {
      toast.error("Keep at least one on, so patients can reach the doctor");
      return;
    }
    setBusy(true);
    const response = await updateDoctor(doctor._id, { messaging: next });
    setBusy(false);
    if (response.success) {
      toast.success(`${OPTIONS.find((o) => o.key === key)!.label} turned ${next[key] ? "on" : "off"}`);
      router.refresh();
    } else toast.error(response.error || "Failed to change the setting");
  };

  return (
    <section className={`rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
          <FaComments size={15} />
        </span>
        <h2 className="text-lg font-semibold">Messaging</h2>
      </div>
      <div className="space-y-4">
        {OPTIONS.map((option) => {
          const on = messaging[option.key];
          return (
            <div key={option.key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{option.label}</p>
                <p className={`mt-1 text-xs ${muted}`}>{on ? option.on : option.off}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={option.label}
                disabled={busy}
                onClick={() => toggle(option.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  on ? "bg-emerald-600" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
