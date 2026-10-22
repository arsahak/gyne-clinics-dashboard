"use client";
import {
  type PatientRecord,
  type PregnancyStatus,
  suspendPatient,
  unsuspendPatient,
} from "@/app/actions/patientAction";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaBaby,
  FaBan,
  FaBirthdayCake,
  FaCalendarAlt,
  FaEdit,
  FaHeartbeat,
  FaSyncAlt,
  FaUnlock,
  FaUser,
  FaWeight,
} from "react-icons/fa";

const PREGNANCY_LABELS: Record<PregnancyStatus, string> = {
  not_pregnant: "Not pregnant",
  trying_to_conceive: "Trying to conceive",
  pregnant: "Pregnant",
  postpartum: "Postpartum",
};

// Same colours as the pregnancy badges in the patient list and form.
const PREGNANCY_BADGE: Record<PregnancyStatus, { light: string; dark: string }> = {
  not_pregnant: { light: "bg-gray-100 text-gray-600", dark: "bg-gray-700 text-gray-300" },
  trying_to_conceive: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900 text-blue-300" },
  pregnant: { light: "bg-pink-100 text-pink-700", dark: "bg-pink-900 text-pink-300" },
  postpartum: { light: "bg-purple-100 text-purple-700", dark: "bg-purple-900 text-purple-300" },
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Never";

/** Next period estimate: last start + cycle length, moved forward to today or later. */
function nextPeriod(lastStart?: string, cycleDays?: number): string | undefined {
  if (!lastStart || !cycleDays) return undefined;
  const next = new Date(lastStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  while (next < today) next.setDate(next.getDate() + cycleDays);
  return next.toISOString();
}

const PatientDetails = ({ patient }: { patient: PatientRecord }) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const profile = patient.profile;
  const cycle = profile?.menstrualHistory;
  const bmi =
    profile?.heightCm && profile?.weightKg
      ? (profile.weightKg / (profile.heightCm / 100) ** 2).toFixed(1)
      : null;
  const nextPeriodAt = nextPeriod(cycle?.lastPeriodDate, cycle?.cycleLengthDays);
  const displayName = patient.name || patient.phone || "Patient";

  // ── styles ────────────────────────────────────────────────────────────────
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const tile = `rounded-xl border p-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const blackBtn =
    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors disabled:opacity-50";
  const redBtn =
    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50";
  const outlineBtn = `px-4 py-2.5 rounded-lg border text-sm ${
    isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"
  }`;

  const pregnancyBadge = (value?: PregnancyStatus) =>
    value ? (
      <span
        className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
          PREGNANCY_BADGE[value][isDarkMode ? "dark" : "light"]
        }`}
      >
        {PREGNANCY_LABELS[value]}
      </span>
    ) : (
      "—"
    );

  // ── actions ───────────────────────────────────────────────────────────────
  const handleBlock = async () => {
    const input = window.prompt(`Reason for blocking ${displayName}:`);
    if (input === null) return;
    setBusy(true);
    const response = await suspendPatient(patient._id, input.trim() || undefined);
    setBusy(false);
    if (response.success) {
      toast.success("Patient blocked");
      router.refresh();
    } else {
      toast.error(response.error || "Failed to block patient");
    }
  };

  const handleUnblock = async () => {
    if (!confirm(`Unblock ${displayName}?`)) return;
    setBusy(true);
    const response = await unsuspendPatient(patient._id);
    setBusy(false);
    if (response.success) {
      toast.success("Patient unblocked");
      router.refresh();
    } else {
      toast.error(response.error || "Failed to unblock patient");
    }
  };

  const tiles = [
    { icon: FaBirthdayCake, label: "Age", value: profile?.age !== undefined ? `${profile.age} years` : "—", tone: "bg-violet-100 text-violet-600" },
    { icon: FaWeight, label: "BMI", value: bmi ?? "—", tone: "bg-teal-100 text-teal-600" },
    { icon: FaSyncAlt, label: "Cycle", value: cycle?.cycleLengthDays ? `${cycle.cycleLengthDays} days` : "—", tone: "bg-rose-100 text-rose-600" },
    { icon: FaBaby, label: "Pregnancy", value: pregnancyBadge(profile?.pregnancyStatus), tone: "bg-pink-100 text-pink-600" },
  ];

  const healthRows: { label: string; value: React.ReactNode }[] = profile
    ? [
        { label: "Date of birth", value: formatDate(profile.dateOfBirth) },
        { label: "Age", value: profile.age !== undefined ? `${profile.age} years` : "—" },
        { label: "Height", value: profile.heightCm ? `${profile.heightCm} cm` : "—" },
        { label: "Weight", value: profile.weightKg ? `${profile.weightKg} kg` : "—" },
        { label: "BMI", value: bmi ?? "—" },
        { label: "Cycle length", value: cycle?.cycleLengthDays ? `${cycle.cycleLengthDays} days` : "—" },
        { label: "Period length", value: cycle?.periodLengthDays ? `${cycle.periodLengthDays} days` : "—" },
        { label: "Last period started", value: formatDate(cycle?.lastPeriodDate) },
        { label: "Next period (estimate)", value: formatDate(nextPeriodAt) },
        { label: "Pregnancy", value: pregnancyBadge(profile.pregnancyStatus) },
        ...(profile.pregnancyStatus === "pregnant"
          ? [{ label: "Due date", value: formatDate(profile.dueDate) }]
          : []),
        { label: "Reminders", value: profile.remindersEnabled ? "On" : "Off" },
      ]
    : [];

  const accountRows: { label: string; value: React.ReactNode }[] = [
    { label: "Phone", value: patient.phone || "—" },
    { label: "Email", value: patient.email || "—" },
    { label: "Verified", value: patient.isVerified ? "Yes" : "Not yet" },
    { label: "Profile", value: profile?.profileCompleted ? "Completed" : "Incomplete" },
    { label: "Joined", value: formatDate(patient.createdAt) },
    { label: "Last sign-in", value: formatDateTime(patient.lastLoginAt) },
  ];

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {patient.avatar ? (
            <Image
              src={patient.avatar}
              alt={displayName}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-3xl font-bold">{patient.name || "—"}</h1>
              {patient.suspended ? (
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"}`}>
                  Blocked
                </span>
              ) : (
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"}`}>
                  Active
                </span>
              )}
              {!patient.isVerified && (
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${isDarkMode ? "bg-amber-900 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                  Unverified
                </span>
              )}
            </div>
            <p className={`mt-1 text-sm ${muted}`}>
              {[patient.phone, patient.email].filter(Boolean).join(" · ") || "No contact details"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => router.push("/patient")} className={outlineBtn}>
            Back
          </button>
          <Link href={`/patient/edit/${patient._id}`} className={blackBtn}>
            <FaEdit size={13} /> Edit
          </Link>
          {patient.suspended ? (
            <button type="button" onClick={handleUnblock} disabled={busy} className={blackBtn}>
              <FaUnlock size={13} /> Unblock
            </button>
          ) : (
            <button type="button" onClick={handleBlock} disabled={busy} className={redBtn}>
              <FaBan size={13} /> Block
            </button>
          )}
        </div>
      </div>

      {/* Blocked notice */}
      {patient.suspended && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
            isDarkMode ? "border-red-900 bg-red-950/40 text-red-300" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <FaBan className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">
              Blocked{patient.suspendedAt ? ` on ${formatDate(patient.suspendedAt)}` : ""} — the patient can&apos;t sign in.
            </p>
            {patient.suspensionReason && <p className="mt-0.5">Reason: {patient.suspensionReason}</p>}
          </div>
        </div>
      )}

      {/* Summary tiles */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className={tile}>
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={15} />
            </span>
            <p className={`mt-3 text-xs ${muted}`}>{label}</p>
            <div className="mt-0.5 text-lg font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Health profile */}
        <section className={`${card} lg:col-span-2`}>
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
              <FaHeartbeat size={15} />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Health profile</h2>
              <p className={`text-xs ${muted}`}>From the patient&apos;s onboarding and profile.</p>
            </div>
          </div>

          {profile ? (
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {healthRows.map((row) => (
                <div key={row.label} className={`border-b pb-3 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                  <dt className={`text-xs ${muted}`}>{row.label}</dt>
                  <dd className="mt-1 text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className={`rounded-lg border border-dashed p-8 text-center ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
              <FaCalendarAlt className={`mx-auto mb-3 text-3xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
              <p className="font-medium">No health profile yet</p>
              <p className={`mt-1 text-sm ${muted}`}>
                The patient fills this in when they first sign in, or you can add it now.
              </p>
              <Link href={`/patient/edit/${patient._id}`} className={`${blackBtn} mx-auto mt-4 w-fit`}>
                <FaEdit size={13} /> Add health profile
              </Link>
            </div>
          )}
        </section>

        {/* Account */}
        <section className={card}>
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FaUser size={15} />
            </span>
            <h2 className="text-lg font-semibold">Account</h2>
          </div>
          <dl className="space-y-4">
            {accountRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4">
                <dt className={`text-sm ${muted}`}>{row.label}</dt>
                <dd className="text-right text-sm font-medium break-all">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
};

export default PatientDetails;
