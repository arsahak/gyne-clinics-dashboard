"use client";
import {
  approveDoctorUpdate,
  type DoctorRecord,
  rejectDoctorUpdate,
  setDoctorAutoApprove,
} from "@/app/actions/doctorAction";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaCheck, FaHourglassHalf, FaTimes, FaUserCheck } from "react-icons/fa";

// Review of an approved doctor's profile edits. Patients keep seeing the
// current profile until the admin approves the update.

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  title: "Job title",
  specialization: "Specialisation",
  qualifications: "Qualifications",
  experienceYears: "Experience",
  focusAreas: "Areas of focus",
  registrationNumber: "Registration number",
  registrationBody: "Registration body",
  clinic: "Clinic",
  city: "City",
  country: "Country",
  languages: "Languages",
  about: "About",
  feeGBP: "Consultation fee",
};

function formatValue(field: string, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (field === "feeGBP") return Number(value) === 0 ? "Free" : `£${value}`;
  if (field === "experienceYears") return `${value} years`;
  return String(value);
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

function Photo({ src, name }: { src?: string; name: string }) {
  return src ? (
    <Image src={src} alt={name} width={72} height={72} className="h-18 w-18 rounded-full object-cover" />
  ) : (
    <div className="flex h-18 w-18 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">No photo</div>
  );
}

/** The pending update with old and new values side by side, and Approve / Reject. */
export function DoctorUpdateReview({ doctor }: { doctor: DoctorRecord }) {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  const pending = doctor.pendingUpdate;
  if (!pending) return null;

  const name = doctor.user.name || "Doctor";
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const line = isDarkMode ? "border-gray-700" : "border-gray-200";
  const fields = Object.keys(pending.fields).filter((field) => field in FIELD_LABELS);

  const run = async (action: () => Promise<{ success: boolean; message?: string; error?: string }>) => {
    setBusy(true);
    const response = await action();
    setBusy(false);
    if (response.success) {
      toast.success(response.message || "Done");
      setReason("");
      router.refresh();
    } else toast.error(response.error || "Something went wrong");
  };

  return (
    <section
      className={`mb-6 rounded-xl border p-6 ${
        isDarkMode ? "border-amber-800 bg-amber-950/30" : "border-amber-200 bg-amber-50/60"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <FaHourglassHalf size={15} />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Profile update waiting for review</h2>
            <p className={`text-xs ${muted}`}>
              Sent {formatDateTime(pending.submittedAt)} · patients see the current profile until you approve
            </p>
          </div>
        </div>
      </div>

      <div className={`overflow-x-auto rounded-lg border ${line} ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        <table className="w-full text-sm">
          <thead className={`text-left text-xs uppercase ${muted}`}>
            <tr className={`border-b ${line}`}>
              <th className="px-4 py-2.5 font-medium">Field</th>
              <th className="px-4 py-2.5 font-medium">Current (patients see)</th>
              <th className="px-4 py-2.5 font-medium">New</th>
            </tr>
          </thead>
          <tbody>
            {pending.avatar !== undefined && (
              <tr className={`border-b ${line}`}>
                <td className={`px-4 py-3 align-top ${muted}`}>Photo</td>
                <td className="px-4 py-3">
                  <Photo src={doctor.user.avatar} name={name} />
                </td>
                <td className="px-4 py-3">
                  {pending.avatar ? <Photo src={pending.avatar} name={name} /> : <span className="text-rose-600">Remove photo</span>}
                </td>
              </tr>
            )}
            {fields.map((field) => (
              <tr key={field} className={`border-b last:border-0 ${line}`}>
                <td className={`px-4 py-3 align-top ${muted}`}>{FIELD_LABELS[field]}</td>
                <td className={`px-4 py-3 align-top whitespace-pre-line line-through decoration-rose-400/60 ${muted}`}>
                  {formatValue(field, doctor.liveFields[field])}
                </td>
                <td className="px-4 py-3 align-top font-medium whitespace-pre-line">{formatValue(field, pending.fields[field])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="Reason, if you reject (shown to the doctor)"
          className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDarkMode ? "border-gray-700 bg-gray-800 text-gray-100" : "border-gray-300 bg-white"
          }`}
        />
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => rejectDoctorUpdate(doctor._id, reason.trim() || undefined))}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <FaTimes size={12} /> Reject
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => approveDoctorUpdate(doctor._id))}
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-gray-800 disabled:opacity-50"
          >
            <FaCheck size={12} /> Approve update
          </button>
        </div>
      </div>
    </section>
  );
}

/** Per-doctor setting: profile edits need approval (default) or go live straight away. */
export function DoctorAutoApprove({ doctor }: { doctor: DoctorRecord }) {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const on = doctor.autoApproveUpdates;

  const toggle = async () => {
    setBusy(true);
    const response = await setDoctorAutoApprove(doctor._id, !on);
    setBusy(false);
    if (response.success) {
      toast.success(response.message || "Saved");
      router.refresh();
    } else toast.error(response.error || "Failed to change the setting");
  };

  return (
    <section className={`rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <FaUserCheck size={15} />
        </span>
        <h2 className="text-lg font-semibold">Profile updates</h2>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Auto-approve updates</p>
          <p className={`mt-1 text-xs ${muted}`}>
            {on
              ? "Edits go live straight away. Registration changes still need your approval."
              : "Every edit (and new photo) waits for your approval before patients see it."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Auto-approve profile updates"
          disabled={busy}
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            on ? "bg-emerald-600" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
          }`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
      {doctor.updateRejection && !doctor.pendingUpdate && (
        <p className={`mt-4 text-xs ${muted}`}>
          Last update rejected {formatDateTime(doctor.updateRejection.at)}
          {doctor.updateRejection.reason ? `: ${doctor.updateRejection.reason}` : ""}
        </p>
      )}
    </section>
  );
}
