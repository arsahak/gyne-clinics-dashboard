"use client";
import type { DoctorFormData, DoctorSchedule } from "@/app/actions/doctorAction";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaBriefcaseMedical,
  FaCalendarAlt,
  FaClinicMedical,
  FaIdCard,
  FaInfoCircle,
  FaPlus,
  FaSave,
  FaTimes,
  FaUser,
} from "react-icons/fa";

// Shared by DoctorAdd and DoctorEdit. Numbers are kept as strings while
// typing and converted on submit.

export const SPECIALIZATIONS = [
  "General Gynaecology",
  "Reproductive Medicine",
  "Urogynaecology & Pelvic Health",
  "Menopause & HRT",
  "Pregnancy Care",
  "Adolescent Gynaecology",
  "Intimate Wellness",
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // Monday = 0
const SLOT_LENGTHS = [15, 20, 30, 45, 60];
const TIME_OPTIONS = Array.from({ length: 35 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizePhone = (value: string) => value.replace(/[\s().-]/g, "");

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  title: string;
  specialization: string;
  qualifications: string[];
  experienceYears: string;
  focusAreas: string[];
  about: string;
  registrationNumber: string;
  registrationBody: string;
  clinic: string;
  city: string;
  country: string;
  languages: string[];
  feeGBP: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  slotMinutes: number;
  instantChat: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

/** Weekly ranges → the simple "days + one time range" the form edits. */
function scheduleToState(schedule?: Partial<DoctorSchedule>) {
  const weekly = schedule?.weekly ?? [];
  const ranges = weekly.flat();
  return {
    weekdays: weekly.length ? weekly.flatMap((day, i) => (day.length ? [i] : [])) : [0, 1, 2, 3, 4],
    startTime: ranges.map((r) => r.start).sort()[0] ?? "09:00",
    endTime: ranges.map((r) => r.end).sort().at(-1) ?? "17:00",
    slotMinutes: schedule?.slotMinutes ?? 30,
    instantChat: schedule?.instantChat ?? true,
  };
}

function toState(data?: DoctorFormData): FormState {
  return {
    fullName: data?.fullName ?? "",
    phone: data?.phone ?? "",
    email: data?.email ?? "",
    title: data?.title ?? "",
    specialization: data?.specialization ?? SPECIALIZATIONS[0],
    qualifications: data?.qualifications ?? [],
    experienceYears: data?.experienceYears !== undefined ? String(data.experienceYears) : "",
    focusAreas: data?.focusAreas ?? [],
    about: data?.about ?? "",
    registrationNumber: data?.registrationNumber ?? "",
    registrationBody: data?.registrationBody ?? "General Medical Council (UK)",
    clinic: data?.clinic ?? "",
    city: data?.city ?? "",
    country: data?.country ?? "",
    languages: data?.languages ?? ["English"],
    feeGBP: data?.feeGBP !== undefined ? String(data.feeGBP) : "40",
    ...scheduleToState(data?.schedule),
  };
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

function validate(f: FormState): Errors {
  const e: Errors = {};
  const intIn = (value: string, min: number, max: number) =>
    value !== "" && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;

  if (f.fullName.trim().length < 2) e.fullName = "Enter the doctor's full name";
  if (!E164.test(normalizePhone(f.phone))) e.phone = "Use international format, e.g. +447700900123";
  if (f.email.trim() && !EMAIL.test(f.email.trim())) e.email = "Enter a valid email address";
  if (f.title.trim().length < 2) e.title = "Enter a job title";
  if (!f.qualifications.length) e.qualifications = "Add at least one qualification";
  if (!intIn(f.experienceYears, 0, 70)) e.experienceYears = "0–70 years";
  if (f.registrationNumber.trim().length < 3) e.registrationNumber = "Enter the registration number";
  if (f.registrationBody.trim().length < 2) e.registrationBody = "Enter the registration body";
  if (f.city.trim().length < 2) e.city = "Enter the city";
  if (f.country.trim() && !/^[A-Za-z]{2}$/.test(f.country.trim())) e.country = "2-letter code, e.g. GB";
  if (!f.languages.length) e.languages = "Add at least one language";
  if (f.feeGBP === "" || Number(f.feeGBP) < 0 || Number(f.feeGBP) > 10000) e.feeGBP = "0 or more";
  if (!f.weekdays.length) e.weekdays = "Choose at least one day";
  if (toMinutes(f.endTime) <= toMinutes(f.startTime)) e.endTime = "End must be after start";
  return e;
}

function toFormData(f: FormState, includeSchedule: boolean): DoctorFormData {
  return {
    fullName: f.fullName.trim(),
    phone: normalizePhone(f.phone),
    email: f.email.trim(),
    title: f.title.trim(),
    specialization: f.specialization,
    qualifications: f.qualifications,
    experienceYears: Number(f.experienceYears),
    focusAreas: f.focusAreas,
    about: f.about.trim(),
    registrationNumber: f.registrationNumber.trim(),
    registrationBody: f.registrationBody.trim(),
    clinic: f.clinic.trim(),
    city: f.city.trim(),
    country: f.country.trim().toUpperCase() || undefined,
    languages: f.languages,
    feeGBP: Number(f.feeGBP),
    ...(includeSchedule && {
      schedule: {
        weekly: WEEKDAYS.map((_, day) => (f.weekdays.includes(day) ? [{ start: f.startTime, end: f.endTime }] : [])),
        slotMinutes: f.slotMinutes,
        instantChat: f.instantChat,
      },
    }),
  };
}

/** Label + input + error/hint. Outside the form so inputs keep focus while typing. */
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

/** Type a value and press Enter (or +) to add it as a chip. */
function ChipInput({
  id,
  values,
  onChange,
  placeholder,
  inputClass,
  isDarkMode,
}: {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  inputClass: string;
  isDarkMode: boolean;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const value = draft.trim();
    if (value && !values.includes(value)) onChange([...values, value]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={add}
          aria-label="Add"
          className={`shrink-0 rounded-lg border px-3 ${isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"}`}
        >
          <FaPlus size={12} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                isDarkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-50 text-blue-700"
              }`}
            >
              {value}
              <button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((v) => v !== value))}>
                <FaTimes size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface DoctorFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialData?: DoctorFormData;
  isEdit?: boolean;
  isSubmitting?: boolean;
  onSubmit: (data: DoctorFormData) => void;
}

const DoctorForm = ({
  title,
  description,
  submitLabel,
  initialData,
  isEdit = false,
  isSubmitting = false,
  onSubmit,
}: DoctorFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toState(initialData));
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  // On edit, only send the schedule if it was changed (it may have several ranges per day).
  const [scheduleTouched, setScheduleTouched] = useState(!isEdit);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (["weekdays", "startTime", "endTime", "slotMinutes", "instantChat"].includes(key)) setScheduleTouched(true);
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(toFormData(form, scheduleTouched));
  };

  // ── styles ────────────────────────────────────────────────────────────────
  const card = `p-6 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const input = (hasError?: string) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${
      isDarkMode ? "bg-gray-900 text-gray-100 placeholder-gray-500" : "bg-white text-gray-900 placeholder-gray-400"
    } ${
      hasError ? "border-red-500 focus:ring-red-500" : isDarkMode ? "border-gray-700 focus:ring-gray-500" : "border-gray-300 focus:ring-gray-900"
    } focus:outline-none focus:ring-2`;

  const section = (Icon: typeof FaUser, tone: string, heading: string, sub: string) => (
    <div className="mb-5 flex items-center gap-3">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={15} />
      </span>
      <div>
        <h2 className="text-lg font-semibold">{heading}</h2>
        <p className={`text-xs ${muted}`}>{sub}</p>
      </div>
    </div>
  );

  const initial = (form.fullName.trim().replace(/^Dr\.?\s*/i, "") || "?").charAt(0).toUpperCase();

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
            onClick={() => router.push("/doctors")}
            className={`px-4 py-2.5 rounded-lg border text-sm ${
              isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="doctor-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors disabled:opacity-50"
          >
            <FaSave /> {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>

      <form id="doctor-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Account */}
          <section className={card}>
            {section(FaUser, "bg-blue-100 text-blue-600", "Account", "The doctor signs in to the app with this mobile number.")}
            <div className="space-y-4">
              <Field name="fullName" title="Full name" error={errors.fullName} isDarkMode={isDarkMode}>
                <input id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="e.g. Dr. Amelia Hart" maxLength={100} className={input(errors.fullName)} />
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field name="phone" title="Mobile number" hint="With country code." error={errors.phone} isDarkMode={isDarkMode}>
                  <input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+44 7700 900123" className={input(errors.phone)} />
                </Field>
                <Field name="email" title="Email (optional)" error={errors.email} isDarkMode={isDarkMode}>
                  <input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="doctor@example.com" className={input(errors.email)} />
                </Field>
              </div>
            </div>
          </section>

          {/* Professional */}
          <section className={card}>
            {section(FaBriefcaseMedical, "bg-violet-100 text-violet-600", "Professional profile", "What patients see on the doctor's profile.")}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field name="title" title="Job title" error={errors.title} isDarkMode={isDarkMode}>
                  <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Consultant Gynaecologist" className={input(errors.title)} />
                </Field>
                <Field name="specialization" title="Specialisation" isDarkMode={isDarkMode}>
                  <select id="specialization" value={form.specialization} onChange={(e) => set("specialization", e.target.value)} className={input()}>
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field name="qualifications" title="Qualifications" hint="Press Enter to add each one." error={errors.qualifications} isDarkMode={isDarkMode}>
                  <ChipInput id="qualifications" values={form.qualifications} onChange={(v) => set("qualifications", v)} placeholder="e.g. MRCOG" inputClass={input(errors.qualifications)} isDarkMode={isDarkMode} />
                </Field>
                <Field name="experienceYears" title="Years of experience" error={errors.experienceYears} isDarkMode={isDarkMode}>
                  <input id="experienceYears" type="number" min={0} max={70} value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} placeholder="12" className={input(errors.experienceYears)} />
                </Field>
              </div>
              <Field name="focusAreas" title="Areas of focus (optional)" hint="Press Enter to add each one." isDarkMode={isDarkMode}>
                <ChipInput id="focusAreas" values={form.focusAreas} onChange={(v) => set("focusAreas", v)} placeholder="e.g. PCOS" inputClass={input()} isDarkMode={isDarkMode} />
              </Field>
              <Field name="about" title="About (optional)" hint={`${form.about.length}/2000`} isDarkMode={isDarkMode}>
                <textarea id="about" rows={4} maxLength={2000} value={form.about} onChange={(e) => set("about", e.target.value)} placeholder="A short, friendly introduction for patients." className={input()} />
              </Field>
            </div>
          </section>

          {/* Registration + practice */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className={card}>
              {section(FaIdCard, "bg-amber-100 text-amber-600", "Registration", "Checked before the doctor goes live.")}
              <div className="space-y-4">
                <Field name="registrationNumber" title="Registration number" error={errors.registrationNumber} isDarkMode={isDarkMode}>
                  <input id="registrationNumber" value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} placeholder="GMC 1234567" className={input(errors.registrationNumber)} />
                </Field>
                <Field name="registrationBody" title="Registration body" error={errors.registrationBody} isDarkMode={isDarkMode}>
                  <input id="registrationBody" value={form.registrationBody} onChange={(e) => set("registrationBody", e.target.value)} className={input(errors.registrationBody)} />
                </Field>
              </div>
            </section>

            <section className={card}>
              {section(FaClinicMedical, "bg-teal-100 text-teal-600", "Practice", "Where the doctor works and consults.")}
              <div className="space-y-4">
                <Field name="clinic" title="Clinic or hospital (optional)" isDarkMode={isDarkMode}>
                  <input id="clinic" value={form.clinic} onChange={(e) => set("clinic", e.target.value)} placeholder="GyneClinics Harley Street" className={input()} />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field name="city" title="City" error={errors.city} isDarkMode={isDarkMode}>
                      <input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="London" className={input(errors.city)} />
                    </Field>
                  </div>
                  <Field name="country" title="Country" error={errors.country} isDarkMode={isDarkMode}>
                    <input id="country" value={form.country} maxLength={2} onChange={(e) => set("country", e.target.value.toUpperCase())} placeholder="GB" className={input(errors.country)} />
                  </Field>
                </div>
                <Field name="languages" title="Languages" error={errors.languages} isDarkMode={isDarkMode}>
                  <ChipInput id="languages" values={form.languages} onChange={(v) => set("languages", v)} placeholder="e.g. Bangla" inputClass={input(errors.languages)} isDarkMode={isDarkMode} />
                </Field>
              </div>
            </section>
          </div>

          {/* Fee + availability */}
          <section className={card}>
            {section(FaCalendarAlt, "bg-rose-100 text-rose-600", "Fee & availability", "When patients can book, and the base consultation fee.")}
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field name="feeGBP" title="Base fee (GBP)" hint="UK price. 0 = free." error={errors.feeGBP} isDarkMode={isDarkMode}>
                  <input id="feeGBP" type="number" min={0} value={form.feeGBP} onChange={(e) => set("feeGBP", e.target.value)} className={input(errors.feeGBP)} />
                </Field>
                <Field name="slotMinutes" title="Slot length" isDarkMode={isDarkMode}>
                  <select id="slotMinutes" value={form.slotMinutes} onChange={(e) => set("slotMinutes", Number(e.target.value))} className={input()}>
                    {SLOT_LENGTHS.map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                </Field>
                <div>
                  <span className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Chat now</span>
                  <label className="flex h-[42px] cursor-pointer items-center gap-3 text-sm">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.instantChat}
                      onClick={() => set("instantChat", !form.instantChat)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        form.instantChat ? "bg-black ring-1 ring-white/20" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.instantChat ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                    <span className={muted}>{form.instantChat ? "Accepts instant chats" : "Booked slots only"}</span>
                  </label>
                </div>
              </div>

              <Field name="weekdays" title="Working days" error={errors.weekdays} isDarkMode={isDarkMode}>
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((day, index) => {
                    const on = form.weekdays.includes(index);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          set("weekdays", on ? form.weekdays.filter((d) => d !== index) : [...form.weekdays, index].sort((a, b) => a - b))
                        }
                        className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                          on
                            ? "border-black bg-black text-white ring-1 ring-white/20"
                            : isDarkMode
                              ? "border-gray-700 text-gray-300 hover:border-gray-500"
                              : "border-gray-300 text-gray-700 hover:border-gray-500"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4 md:w-2/3">
                <Field name="startTime" title="From" isDarkMode={isDarkMode}>
                  <select id="startTime" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className={input()}>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field name="endTime" title="To" error={errors.endTime} isDarkMode={isDarkMode}>
                  <select id="endTime" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className={input(errors.endTime)}>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className={card}>
            <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${muted}`}>Preview</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">{initial}</div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{form.fullName.trim() || "New doctor"}</p>
                <p className={`truncate text-sm ${muted}`}>{form.title.trim() || "Job title"}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Specialty", form.specialization],
                ["Experience", form.experienceYears ? `${form.experienceYears} years` : "—"],
                ["Fee", form.feeGBP === "0" ? "Free" : form.feeGBP ? `£${form.feeGBP}` : "—"],
                ["Days", form.weekdays.length ? form.weekdays.map((d) => WEEKDAYS[d]).join(", ") : "—"],
              ].map(([label, value]) => (
                <div key={label} className={`rounded-lg p-3 ${label === "Specialty" || label === "Days" ? "col-span-2" : ""} ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                  <dt className={`text-xs ${muted}`}>{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={`${card} text-sm`}>
            <div className={`flex gap-2 rounded-lg p-3 text-xs ${isDarkMode ? "bg-blue-950/40 text-blue-200" : "bg-blue-50 text-blue-800"}`}>
              <FaInfoCircle className="mt-0.5 shrink-0" />
              {isEdit
                ? "Changes apply straight away. A new phone number has to be verified at the doctor's next sign-in."
                : "Doctors added here are approved straight away and can sign in with this mobile number."}
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
};

export default DoctorForm;
