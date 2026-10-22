"use client";
import {
  type DoctorListStatus,
  type DoctorRecord,
  setDoctorStatus,
  setFeaturedDoctor,
} from "@/app/actions/doctorAction";
import { DoctorMessagingSettings } from "@/component/doctorManagement/DoctorMessaging";
import { DoctorAutoApprove, DoctorUpdateReview } from "@/component/doctorManagement/DoctorUpdateReview";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaBan,
  FaBriefcaseMedical,
  FaCalendarAlt,
  FaComments,
  FaEdit,
  FaFileAlt,
  FaIdCard,
  FaMoneyBillWave,
  FaStar,
  FaUser,
  FaUserClock,
} from "react-icons/fa";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const STATUS_OPTIONS: { value: DoctorListStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "blocked", label: "Blocked" },
];

const STATUS_DONE: Record<DoctorListStatus, string> = {
  pending: "moved to pending",
  approved: "approved",
  rejected: "rejected",
  blocked: "blocked",
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "Never";

const DoctorDetails = ({ doctor }: { doctor: DoctorRecord }) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const name = doctor.user.name || doctor.user.phone || "Doctor";
  const status: DoctorListStatus = doctor.suspended ? "blocked" : doctor.approvalStatus;
  const schedule = doctor.schedule;

  // ── styles ────────────────────────────────────────────────────────────────
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const tile = `rounded-xl border p-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const chip = (light: string, dark: string) => (isDarkMode ? dark : light);
  const outlineBtn = `px-4 py-2.5 rounded-lg border text-sm ${
    isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"
  }`;
  const blackBtn =
    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors disabled:opacity-50";

  const STATUS_COLORS: Record<DoctorListStatus, string> = {
    pending: chip("bg-amber-50 text-amber-800 border-amber-200", "bg-amber-900/50 text-amber-300 border-amber-800"),
    approved: chip("bg-green-50 text-green-800 border-green-200", "bg-green-900/50 text-green-300 border-green-800"),
    rejected: chip("bg-rose-50 text-rose-700 border-rose-200", "bg-rose-900/50 text-rose-300 border-rose-800"),
    blocked: chip("bg-gray-100 text-gray-700 border-gray-300", "bg-gray-700 text-gray-200 border-gray-600"),
  };

  const tags = (values?: string[]) =>
    values?.length ? (
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span key={value} className={`rounded-full px-2.5 py-1 text-xs font-medium ${chip("bg-blue-50 text-blue-700", "bg-blue-900/50 text-blue-200")}`}>
            {value}
          </span>
        ))}
      </div>
    ) : (
      "—"
    );

  // ── actions ───────────────────────────────────────────────────────────────
  const handleStatus = async (value: DoctorListStatus) => {
    setBusy(true);
    const response = await setDoctorStatus(doctor, value);
    setBusy(false);
    if (response.success) {
      toast.success(`${name} ${STATUS_DONE[value]}`);
      router.refresh();
    } else toast.error(response.error || "Failed to update status");
  };

  const handleFeatured = async () => {
    setBusy(true);
    const response = await setFeaturedDoctor(doctor._id, !doctor.featured);
    setBusy(false);
    if (response.success) {
      toast.success(doctor.featured ? "Removed from featured" : "Marked as featured");
      router.refresh();
    } else toast.error(response.error || "Failed to update featured status");
  };

  const tiles = [
    { icon: FaUserClock, label: "Experience", value: doctor.experienceYears != null ? `${doctor.experienceYears} years` : "—", tone: "bg-violet-100 text-violet-600" },
    { icon: FaMoneyBillWave, label: "Consultation fee", value: doctor.consultationFee === 0 ? "Free" : doctor.consultationFee != null ? `£${doctor.consultationFee}` : "—", tone: "bg-teal-100 text-teal-600" },
    { icon: FaStar, label: "Rating", value: doctor.reviewCount ? `${doctor.avgRating.toFixed(1)} (${doctor.reviewCount})` : "No reviews yet", tone: "bg-amber-100 text-amber-600" },
    { icon: FaComments, label: "Consultations", value: String(doctor.consultationCount ?? 0), tone: "bg-sky-100 text-sky-600" },
  ];

  const rows = (items: { label: string; value: React.ReactNode }[]) => (
    <dl className="space-y-4">
      {items.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4">
          <dt className={`shrink-0 text-sm ${muted}`}>{row.label}</dt>
          <dd className="text-right text-sm font-medium break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );

  const sectionTitle = (Icon: typeof FaUser, tone: string, title: string) => (
    <div className="mb-5 flex items-center gap-3">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={15} />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          {doctor.user.avatar ? (
            <Image src={doctor.user.avatar} alt={name} width={64} height={64} className="h-16 w-16 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
              {name.replace(/^Dr\.?\s*/i, "").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-3xl font-bold">
              {doctor.user.name || "Unnamed"}
              {doctor.featured && <FaStar className="text-amber-400" size={18} title="Featured" />}
            </h1>
            <p className={`mt-1 text-sm ${muted}`}>
              {[doctor.title, doctor.specialization, doctor.user.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => router.push("/doctors")} className={outlineBtn}>
            Back
          </button>
          <Link href={`/doctors/edit/${doctor._id}`} className={blackBtn}>
            <FaEdit size={13} /> Edit
          </Link>
          {doctor.approvalStatus === "approved" && (
            <button
              type="button"
              onClick={handleFeatured}
              disabled={busy}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium disabled:opacity-50 ${
                doctor.featured
                  ? chip("border-amber-300 bg-amber-50 text-amber-700", "border-amber-700 bg-amber-900/40 text-amber-300")
                  : outlineBtn
              }`}
            >
              <FaStar size={13} /> {doctor.featured ? "Featured" : "Feature"}
            </button>
          )}
          <select
            value={status}
            disabled={busy}
            onChange={(e) => handleStatus(e.target.value as DoctorListStatus)}
            aria-label="Doctor status"
            className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-wait disabled:opacity-60 ${STATUS_COLORS[status]}`}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Profile update to review */}
      <DoctorUpdateReview doctor={doctor} />

      {/* Blocked / rejected notice */}
      {(doctor.suspended || doctor.approvalStatus === "rejected") && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
            isDarkMode ? "border-red-900 bg-red-950/40 text-red-300" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <FaBan className="mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            {doctor.suspended && (
              <p>
                <span className="font-semibold">
                  Blocked{doctor.suspendedAt ? ` on ${formatDate(doctor.suspendedAt)}` : ""} — can&apos;t sign in.
                </span>
                {doctor.suspensionReason && ` Reason: ${doctor.suspensionReason}`}
              </p>
            )}
            {doctor.approvalStatus === "rejected" && (
              <p>
                <span className="font-semibold">Verification rejected — hidden from patients.</span>
                {doctor.rejectionReason && ` Reason: ${doctor.rejectionReason}`}
              </p>
            )}
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
        <div className="space-y-6 lg:col-span-2">
          {/* Professional */}
          <section className={card}>
            {sectionTitle(FaBriefcaseMedical, "bg-violet-100 text-violet-600", "Professional profile")}
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                { label: "Job title", value: doctor.title || "—" },
                { label: "Specialisation", value: doctor.specialization || "—" },
                { label: "Qualifications", value: tags(doctor.qualifications) },
                { label: "Areas of focus", value: tags(doctor.focusAreas) },
                { label: "Languages", value: tags(doctor.languages) },
                { label: "Practice", value: [doctor.hospitalName, doctor.hospitalAddress].filter(Boolean).join(", ") || "—" },
              ].map((row) => (
                <div key={row.label} className={`border-b pb-3 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                  <dt className={`text-xs ${muted}`}>{row.label}</dt>
                  <dd className="mt-1 text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5">
              <p className={`text-xs ${muted}`}>About</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{doctor.about || "No introduction yet."}</p>
            </div>
          </section>

          {/* Availability */}
          <section className={card}>
            {sectionTitle(FaCalendarAlt, "bg-rose-100 text-rose-600", "Availability")}
            {schedule ? (
              <>
                <ul className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-100"}`}>
                  {WEEKDAYS.map((day, index) => {
                    const ranges = schedule.weekly?.[index] ?? [];
                    return (
                      <li key={day} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="font-medium">{day}</span>
                        {ranges.length ? (
                          <span className="tabular-nums">{ranges.map((r) => `${r.start}–${r.end}`).join(", ")}</span>
                        ) : (
                          <span className={muted}>Off</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {[
                    `${schedule.slotMinutes}-minute slots`,
                    schedule.instantChat ? "Accepts Chat now" : "Booked slots only",
                    `Book up to ${schedule.bookingWindowDays} days ahead`,
                    `${schedule.minNoticeHours}h notice`,
                    schedule.timezone,
                    ...(schedule.timeOff?.length ? [`${schedule.timeOff.length} days off planned`] : []),
                  ].map((label) => (
                    <span key={label} className={`rounded-full px-2.5 py-1 ${chip("bg-gray-100 text-gray-700", "bg-gray-700 text-gray-200")}`}>
                      {label}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className={`text-sm ${muted}`}>No schedule set yet.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {/* Registration */}
          <section className={card}>
            {sectionTitle(FaIdCard, "bg-amber-100 text-amber-600", "Registration")}
            {rows([
              { label: "Number", value: <span className="font-mono">{doctor.registrationNumber || "—"}</span> },
              { label: "Body", value: doctor.registrationBody || "—" },
              {
                label: "Verification",
                value: <span className={`rounded-full border px-2.5 py-0.5 text-xs ${STATUS_COLORS[doctor.approvalStatus]}`}>{doctor.approvalStatus}</span>,
              },
              { label: "Reviewed", value: formatDate(doctor.verifiedAt) },
            ])}
            <div className="mt-5">
              <p className={`mb-2 text-xs ${muted}`}>Documents</p>
              {doctor.documents.length ? (
                <ul className="space-y-2">
                  {doctor.documents.map((doc) => (
                    <li key={doc.url}>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:underline ${chip("bg-gray-50", "bg-gray-900")}`}
                      >
                        <FaFileAlt className="shrink-0 text-blue-600" />
                        <span className="truncate">{doc.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`text-sm ${muted}`}>No documents uploaded.</p>
              )}
            </div>
          </section>

          <DoctorMessagingSettings doctor={doctor} />
          <DoctorAutoApprove doctor={doctor} />

          {/* Account */}
          <section className={card}>
            {sectionTitle(FaUser, "bg-blue-100 text-blue-600", "Account")}
            {rows([
              { label: "Phone", value: doctor.user.phone || "—" },
              { label: "Email", value: doctor.user.email || "—" },
              { label: "Phone verified", value: doctor.user.phoneVerified ? "Yes" : "Not yet" },
              { label: "Account", value: doctor.suspended ? "Blocked" : "Active" },
              { label: "Joined", value: formatDate(doctor.createdAt) },
              { label: "Last sign-in", value: formatDateTime(doctor.user.lastLoginAt) },
            ])}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DoctorDetails;
