"use client";
import type { PatientFormData, PregnancyStatus } from "@/app/actions/patientAction";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaHeartbeat,
  FaInfoCircle,
  FaMobileAlt,
  FaSave,
  FaUser,
} from "react-icons/fa";

// Shared by PatientAdd and PatientEdit. Numbers are kept as strings while
// typing and converted on submit.

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  includeProfile: boolean;
  dateOfBirth: string;
  heightCm: string;
  weightKg: string;
  typicalCycleLength: string;
  typicalPeriodLength: string;
  lastPeriodStart: string;
  pregnancyStatus: PregnancyStatus;
  dueDate: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const PREGNANCY_OPTIONS: { value: PregnancyStatus; label: string }[] = [
  { value: "not_pregnant", label: "Not pregnant" },
  { value: "trying_to_conceive", label: "Trying to conceive" },
  { value: "pregnant", label: "Pregnant" },
  { value: "postpartum", label: "Postpartum" },
];

// Same colours as the pregnancy badges in the patient list.
const PREGNANCY_COLORS: Record<PregnancyStatus, { light: string; dark: string; selected: string }> = {
  not_pregnant: {
    light: "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100",
    dark: "border-gray-600 bg-gray-700/40 text-gray-300 hover:bg-gray-700",
    selected: "border-gray-700 bg-gray-700 text-white",
  },
  trying_to_conceive: {
    light: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    dark: "border-blue-800 bg-blue-900/40 text-blue-300 hover:bg-blue-900",
    selected: "border-blue-600 bg-blue-600 text-white",
  },
  pregnant: {
    light: "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100",
    dark: "border-pink-800 bg-pink-900/40 text-pink-300 hover:bg-pink-900",
    selected: "border-pink-600 bg-pink-600 text-white",
  },
  postpartum: {
    light: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
    dark: "border-purple-800 bg-purple-900/40 text-purple-300 hover:bg-purple-900",
    selected: "border-purple-600 bg-purple-600 text-white",
  },
};

const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const today = () => new Date().toISOString().slice(0, 10);
const normalizePhone = (value: string) => value.replace(/[\s().-]/g, "");

function toState(data?: PatientFormData): FormState {
  const p = data?.profile;
  return {
    fullName: data?.fullName ?? "",
    phone: data?.phone ?? "",
    email: data?.email ?? "",
    includeProfile: Boolean(p),
    dateOfBirth: p?.dateOfBirth ?? "",
    heightCm: p?.heightCm ? String(p.heightCm) : "",
    weightKg: p?.weightKg ? String(p.weightKg) : "",
    typicalCycleLength: String(p?.typicalCycleLength ?? 28),
    typicalPeriodLength: String(p?.typicalPeriodLength ?? 5),
    lastPeriodStart: p?.lastPeriodStart ?? "",
    pregnancyStatus: p?.pregnancyStatus ?? "not_pregnant",
    dueDate: p?.dueDate ?? "",
  };
}

function validate(f: FormState): Errors {
  const e: Errors = {};
  const inRange = (value: string, min: number, max: number) => {
    const n = Number(value);
    return value !== "" && Number.isFinite(n) && n >= min && n <= max;
  };

  if (f.fullName.trim().length < 2) e.fullName = "Enter the patient's full name";
  if (!E164.test(normalizePhone(f.phone))) e.phone = "Use international format, e.g. +447700900123";
  if (f.email.trim() && !EMAIL.test(f.email.trim())) e.email = "Enter a valid email address";

  if (f.includeProfile) {
    if (!f.dateOfBirth) e.dateOfBirth = "Date of birth is required";
    else if (f.dateOfBirth > today()) e.dateOfBirth = "Can't be in the future";
    if (!inRange(f.heightCm, 100, 230)) e.heightCm = "100–230 cm";
    if (!inRange(f.weightKg, 25, 250)) e.weightKg = "25–250 kg";
    if (!inRange(f.typicalCycleLength, 15, 60)) e.typicalCycleLength = "15–60 days";
    if (!inRange(f.typicalPeriodLength, 1, 14)) e.typicalPeriodLength = "1–14 days";
    if (f.lastPeriodStart && f.lastPeriodStart > today()) e.lastPeriodStart = "Can't be in the future";
    if (f.pregnancyStatus === "pregnant" && !f.dueDate) e.dueDate = "Due date is required when pregnant";
  }
  return e;
}

function toFormData(f: FormState): PatientFormData {
  return {
    fullName: f.fullName.trim(),
    phone: normalizePhone(f.phone),
    email: f.email.trim(),
    profile: f.includeProfile
      ? {
          dateOfBirth: f.dateOfBirth,
          heightCm: Number(f.heightCm),
          weightKg: Number(f.weightKg),
          typicalCycleLength: Number(f.typicalCycleLength),
          typicalPeriodLength: Number(f.typicalPeriodLength),
          lastPeriodStart: f.lastPeriodStart || undefined,
          pregnancyStatus: f.pregnancyStatus,
          dueDate: f.pregnancyStatus === "pregnant" ? f.dueDate : undefined,
        }
      : undefined,
  };
}

/** Label + input + error/hint. Defined outside the form so inputs keep focus while typing. */
function Field({
  name,
  title,
  hint,
  error,
  isDarkMode,
  children,
}: {
  name: string;
  title: string;
  hint?: string;
  error?: string;
  isDarkMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        {title}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : (
        hint && <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{hint}</p>
      )}
    </div>
  );
}

interface PatientFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialData?: PatientFormData;
  /** The patient already has a health profile, so it can be edited but not removed. */
  hasProfile?: boolean;
  /** Where Cancel goes. */
  cancelHref?: string;
  isSubmitting?: boolean;
  onSubmit: (data: PatientFormData) => void;
}

const PatientForm = ({
  title,
  description,
  submitLabel,
  initialData,
  hasProfile = false,
  cancelHref = "/patient",
  isSubmitting = false,
  onSubmit,
}: PatientFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toState(initialData));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    // After the first submit, re-check as the user fixes things.
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(toFormData(form));
  };

  const bmi =
    Number(form.heightCm) > 0 && Number(form.weightKg) > 0
      ? (Number(form.weightKg) / (Number(form.heightCm) / 100) ** 2).toFixed(1)
      : null;

  // ── styles ────────────────────────────────────────────────────────────────
  const card = `p-6 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const label = `block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`;
  const input = (hasError?: string) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${
      isDarkMode ? "bg-gray-900 text-gray-100 placeholder-gray-500" : "bg-white text-gray-900 placeholder-gray-400"
    } ${
      hasError
        ? "border-red-500 focus:ring-red-500"
        : isDarkMode
          ? "border-gray-700 focus:ring-gray-900"
          : "border-gray-300 focus:ring-gray-900"
    } focus:outline-none focus:ring-2`;

  const initial = (form.fullName.trim() || "?").charAt(0).toUpperCase();
  const statusLabel = PREGNANCY_OPTIONS.find((o) => o.value === form.pregnancyStatus)?.label;

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className={`mt-1 ${muted}`}>{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(cancelHref)}
            className={`px-4 py-2.5 rounded-lg border text-sm ${
              isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="patient-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors disabled:opacity-50"
          >
            <FaSave /> {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>

      <form id="patient-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Account */}
          <section className={card}>
            <div className="mb-5 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FaUser size={15} />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Account</h2>
                <p className={`text-xs ${muted}`}>Used to identify the patient and to sign in.</p>
              </div>
            </div>
            <div className="space-y-4">
              <Field name="fullName" title="Full name" error={errors.fullName} isDarkMode={isDarkMode}>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="e.g. Ayesha Khan"
                  maxLength={100}
                  className={input(errors.fullName)}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field name="phone" title="Mobile number" hint="With country code. The patient signs in with this." error={errors.phone} isDarkMode={isDarkMode}>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+44 7700 900123"
                    className={input(errors.phone)}
                  />
                </Field>
                <Field name="email" title="Email (optional)" error={errors.email} isDarkMode={isDarkMode}>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="ayesha@example.com"
                    className={input(errors.email)}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Health profile */}
          <section className={card}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                  <FaHeartbeat size={15} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Health profile</h2>
                  <p className={`text-xs ${muted}`}>
                    {hasProfile
                      ? "The patient's onboarding details."
                      : "Optional. Without it, the patient fills this in on first sign-in."}
                  </p>
                </div>
              </div>
              {!hasProfile && (
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <span className={muted}>Add now</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.includeProfile}
                    onClick={() => set("includeProfile", !form.includeProfile)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      form.includeProfile ? "bg-black ring-1 ring-white/20" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        form.includeProfile ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
              )}
            </div>

            {form.includeProfile ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field name="dateOfBirth" title="Date of birth" error={errors.dateOfBirth} isDarkMode={isDarkMode}>
                    <input
                      id="dateOfBirth"
                      type="date"
                      max={today()}
                      value={form.dateOfBirth}
                      onChange={(e) => set("dateOfBirth", e.target.value)}
                      className={input(errors.dateOfBirth)}
                    />
                  </Field>
                  <Field name="heightCm" title="Height (cm)" error={errors.heightCm} isDarkMode={isDarkMode}>
                    <input
                      id="heightCm"
                      type="number"
                      inputMode="decimal"
                      min={100}
                      max={230}
                      value={form.heightCm}
                      onChange={(e) => set("heightCm", e.target.value)}
                      placeholder="163"
                      className={input(errors.heightCm)}
                    />
                  </Field>
                  <Field name="weightKg" title="Weight (kg)" hint={bmi ? `BMI ${bmi}` : undefined} error={errors.weightKg} isDarkMode={isDarkMode}>
                    <input
                      id="weightKg"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min={25}
                      max={250}
                      value={form.weightKg}
                      onChange={(e) => set("weightKg", e.target.value)}
                      placeholder="61.5"
                      className={input(errors.weightKg)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field name="typicalCycleLength" title="Cycle length (days)" hint="Start to start" error={errors.typicalCycleLength} isDarkMode={isDarkMode}>
                    <input
                      id="typicalCycleLength"
                      type="number"
                      min={15}
                      max={60}
                      value={form.typicalCycleLength}
                      onChange={(e) => set("typicalCycleLength", e.target.value)}
                      className={input(errors.typicalCycleLength)}
                    />
                  </Field>
                  <Field name="typicalPeriodLength" title="Period length (days)" hint="Days of bleeding" error={errors.typicalPeriodLength} isDarkMode={isDarkMode}>
                    <input
                      id="typicalPeriodLength"
                      type="number"
                      min={1}
                      max={14}
                      value={form.typicalPeriodLength}
                      onChange={(e) => set("typicalPeriodLength", e.target.value)}
                      className={input(errors.typicalPeriodLength)}
                    />
                  </Field>
                  <Field name="lastPeriodStart" title="Last period started" hint="Optional" error={errors.lastPeriodStart} isDarkMode={isDarkMode}>
                    <input
                      id="lastPeriodStart"
                      type="date"
                      max={today()}
                      value={form.lastPeriodStart}
                      onChange={(e) => set("lastPeriodStart", e.target.value)}
                      className={input(errors.lastPeriodStart)}
                    />
                  </Field>
                </div>

                <div>
                  <span className={label}>Pregnancy status</span>
                  <div role="radiogroup" className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {PREGNANCY_OPTIONS.map((option) => {
                      const selected = form.pregnancyStatus === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => set("pregnancyStatus", option.value)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                            PREGNANCY_COLORS[option.value][selected ? "selected" : isDarkMode ? "dark" : "light"]
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.pregnancyStatus === "pregnant" && (
                  <div className="md:w-1/3">
                    <Field name="dueDate" title="Estimated due date" error={errors.dueDate} isDarkMode={isDarkMode}>
                      <input
                        id="dueDate"
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => set("dueDate", e.target.value)}
                        className={input(errors.dueDate)}
                      />
                    </Field>
                  </div>
                )}
              </div>
            ) : (
              <p className={`rounded-lg border border-dashed p-4 text-sm ${isDarkMode ? "border-gray-700" : "border-gray-300"} ${muted}`}>
                Turn on <span className="font-medium">Add now</span> to enter date of birth, height, weight, cycle and pregnancy details.
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className={card}>
            <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${muted}`}>Preview</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{form.fullName.trim() || "New patient"}</p>
                <p className={`truncate text-sm ${muted}`}>{normalizePhone(form.phone) || "No phone yet"}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className={`rounded-lg p-3 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                <dt className={`text-xs ${muted}`}>BMI</dt>
                <dd className="font-semibold">{form.includeProfile && bmi ? bmi : "—"}</dd>
              </div>
              <div className={`rounded-lg p-3 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                <dt className={`text-xs ${muted}`}>Cycle</dt>
                <dd className="font-semibold">{form.includeProfile ? `${form.typicalCycleLength || "—"} days` : "—"}</dd>
              </div>
              <div className={`col-span-2 rounded-lg p-3 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                <dt className={`text-xs ${muted}`}>Pregnancy</dt>
                <dd className="font-semibold">{form.includeProfile ? statusLabel : "Not set"}</dd>
              </div>
            </dl>
          </section>

          <section className={`${card} text-sm`}>
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <FaMobileAlt className="text-blue-600" /> How the patient signs in
            </div>
            <p className={muted}>
              Patients sign in to the app with their mobile number and a one-time SMS code — there&apos;s no password.
              Changing the number means they&apos;ll verify the new one at their next sign-in.
            </p>
            <div className={`mt-4 flex gap-2 rounded-lg p-3 text-xs ${isDarkMode ? "bg-blue-950/40 text-blue-200" : "bg-blue-50 text-blue-800"}`}>
              <FaInfoCircle className="mt-0.5 shrink-0" />
              Health details are private. Only enter what the patient has shared with the clinic.
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
};

export default PatientForm;
