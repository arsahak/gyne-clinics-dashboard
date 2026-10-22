"use client";
import type { AdSlot, AdTone } from "@/app/actions/advertisementAction";
import { uploadImage } from "@/app/actions/upload";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaBullhorn,
  FaCalendarAlt,
  FaCheck,
  FaImage,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPalette,
  FaSave,
  FaSpinner,
  FaTimes,
  FaUpload,
} from "react-icons/fa";
import { AD_SLOTS, AD_TONES } from "./adMeta";
import AdvertisementPreview from "./AdvertisementPreview";

// Shared by AdvertisementAdd and AdvertisementEdit. Fields match the webapp's
// ad banner, so what you see in the preview is what patients see.

export interface AdvertisementFormData {
  advertiser: string;
  headline: string;
  body: string;
  cta: string;
  linkUrl: string;
  /** Kept as text while typing; "" = no price. */
  price: string;
  tone: AdTone;
  imageUrl: string;
  placements: AdSlot[];
  priority: string;
  active: boolean;
  /** yyyy-MM-dd or "". */
  startDate: string;
  endDate: string;
}

type Errors = Partial<Record<keyof AdvertisementFormData, string>>;

const URL_PATTERN = /^https?:\/\/\S+$/i;
const CTA_SUGGESTIONS = ["Learn more", "Shop now", "Book now", "Find out more"];

export const EMPTY_AD: AdvertisementFormData = {
  advertiser: "",
  headline: "",
  body: "",
  cta: "Learn more",
  linkUrl: "",
  price: "",
  tone: "primary",
  imageUrl: "",
  placements: ["home"],
  priority: "0",
  active: true,
  startDate: "",
  endDate: "",
};

function validate(f: AdvertisementFormData): Errors {
  const e: Errors = {};
  if (f.advertiser.trim().length < 2) e.advertiser = "Who is advertising?";
  if (f.headline.trim().length < 3) e.headline = "Write a headline (at least 3 characters)";
  if (f.headline.length > 60) e.headline = "Keep it under 60 characters so it fits on one line";
  if (!f.body.trim()) e.body = "Add one line about the offer";
  if (f.body.length > 120) e.body = "Keep it under 120 characters";
  if (!f.cta.trim()) e.cta = "Add the button text";
  if (!URL_PATTERN.test(f.linkUrl.trim())) e.linkUrl = "Where the button goes, starting with https://";
  if (f.price.trim() && !(Number(f.price) > 0)) e.price = "Enter a price, e.g. 29.99, or leave it empty";
  if (f.imageUrl.trim() && !URL_PATTERN.test(f.imageUrl.trim())) e.imageUrl = "Use a full link, starting with https://";
  if (f.placements.length === 0) e.placements = "Choose at least one place to show it";
  if (!Number.isInteger(Number(f.priority)) || Number(f.priority) < 0 || Number(f.priority) > 100) e.priority = "0–100";
  if (f.startDate && f.endDate && f.endDate < f.startDate) e.endDate = "Ends before it starts";
  return e;
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

interface AdvertisementFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialData?: AdvertisementFormData;
  cancelHref?: string;
  isSubmitting?: boolean;
  onSubmit: (data: AdvertisementFormData) => void;
}

const AdvertisementForm = ({
  title,
  description,
  submitLabel,
  initialData,
  cancelHref = "/advertisements",
  isSubmitting = false,
  onSubmit,
}: AdvertisementFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [form, setForm] = useState<AdvertisementFormData>(() => initialData ?? EMPTY_AD);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof AdvertisementFormData>(key: K, value: AdvertisementFormData[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (submitted) setErrors(validate(next));
  };

  const togglePlacement = (slot: AdSlot) =>
    set("placements", form.placements.includes(slot) ? form.placements.filter((s) => s !== slot) : [...form.placements, slot]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("image", file);
    const result = await uploadImage(data);
    setUploading(false);
    if (result.success && result.url) {
      set("imageUrl", result.url);
      toast.success("Image uploaded");
    } else toast.error(result.error || "Failed to upload the image");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(form);
  };

  // ── styles ────────────────────────────────────────────────────────────────
  const card = `p-6 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
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
  const sectionHead = (Icon: typeof FaBullhorn, tone: string, heading: string, sub?: string) => (
    <div className="mb-5 flex items-center gap-3">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={15} />
      </span>
      <div>
        <h2 className="text-lg font-semibold">{heading}</h2>
        {sub && <p className={`text-xs ${muted}`}>{sub}</p>}
      </div>
    </div>
  );
  const counter = (value: string, max: number) => (
    <span className={value.length > max ? "text-red-500" : undefined}>
      {value.length}/{max}
    </span>
  );
  const hasImage = Boolean(form.imageUrl.trim() && URL_PATTERN.test(form.imageUrl.trim()));

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
            form="ad-form"
            disabled={isSubmitting || uploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors disabled:opacity-50"
          >
            <FaSave /> {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>

      {/* Live preview, full width so it looks like the app */}
      <section className={`${card} mb-6`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Preview in the app</h2>
          <span className={`text-xs ${muted}`}>Patients always see the “Ad” label</span>
        </div>
        <AdvertisementPreview
          advertiser={form.advertiser}
          headline={form.headline}
          body={form.body}
          cta={form.cta}
          priceGBP={form.price ? Number(form.price) : null}
          tone={form.tone}
          imageUrl={hasImage ? form.imageUrl : undefined}
          dark={isDarkMode}
        />
      </section>

      <form id="ad-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Ad text */}
          <section className={card}>
            {sectionHead(FaBullhorn, "bg-indigo-100 text-indigo-600", "Ad", "What the banner says.")}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field name="advertiser" title="Advertiser" error={errors.advertiser} isDarkMode={isDarkMode}>
                  <input
                    id="advertiser"
                    value={form.advertiser}
                    onChange={(e) => set("advertiser", e.target.value)}
                    placeholder="e.g. WHP Store"
                    maxLength={60}
                    className={input(errors.advertiser)}
                  />
                </Field>
                <Field name="price" title="Price (GBP, optional)" hint="Shown on the right. Other regions are converted." error={errors.price} isDarkMode={isDarkMode}>
                  <div className="relative">
                    <span className={`pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm ${muted}`}>£</span>
                    <input
                      id="price"
                      inputMode="decimal"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))}
                      placeholder="29.99"
                      className={`${input(errors.price)} pl-8`}
                    />
                  </div>
                </Field>
              </div>
              <Field name="headline" title="Headline" error={errors.headline} isDarkMode={isDarkMode}>
                <input
                  id="headline"
                  value={form.headline}
                  onChange={(e) => set("headline", e.target.value)}
                  placeholder="e.g. Women's Multivitamin Formula"
                  className={input(errors.headline)}
                />
                {!errors.headline && <p className={`mt-1 text-right text-xs ${muted}`}>{counter(form.headline, 60)}</p>}
              </Field>
              <Field name="body" title="One line about it" error={errors.body} isDarkMode={isDarkMode}>
                <input
                  id="body"
                  value={form.body}
                  onChange={(e) => set("body", e.target.value)}
                  placeholder="e.g. Iron, folate and B vitamins in one daily tablet."
                  className={input(errors.body)}
                />
                {!errors.body && <p className={`mt-1 text-right text-xs ${muted}`}>{counter(form.body, 120)}</p>}
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field name="cta" title="Button text" error={errors.cta} isDarkMode={isDarkMode}>
                  <input
                    id="cta"
                    value={form.cta}
                    onChange={(e) => set("cta", e.target.value)}
                    maxLength={24}
                    className={input(errors.cta)}
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {CTA_SUGGESTIONS.map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => set("cta", text)}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          form.cta === text
                            ? "border-black bg-black text-white"
                            : isDarkMode
                              ? "border-gray-700 text-gray-300 hover:bg-gray-700"
                              : "border-gray-300 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field name="linkUrl" title="Button link" hint="Opens in a new tab." error={errors.linkUrl} isDarkMode={isDarkMode}>
                  <input
                    id="linkUrl"
                    value={form.linkUrl}
                    onChange={(e) => set("linkUrl", e.target.value)}
                    placeholder="https://"
                    className={input(errors.linkUrl)}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Where it shows */}
          <section className={card}>
            {sectionHead(FaMapMarkerAlt, "bg-blue-100 text-blue-600", "Where it shows", "Choose one or more places in the app.")}
            <div role="group" aria-label="Placements" className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {AD_SLOTS.map((slot) => {
                const selected = form.placements.includes(slot.value);
                return (
                  <button
                    key={slot.value}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => togglePlacement(slot.value)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selected
                        ? isDarkMode
                          ? "border-blue-500 bg-blue-900/30"
                          : "border-blue-500 bg-blue-50"
                        : isDarkMode
                          ? "border-gray-700 hover:bg-gray-700"
                          : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        selected ? "border-blue-600 bg-blue-600 text-white" : isDarkMode ? "border-gray-500" : "border-gray-400"
                      }`}
                    >
                      {selected && <FaCheck size={9} />}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{slot.label}</span>
                      <span className={`block text-xs ${muted}`}>{slot.where}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.placements && <p className="mt-2 text-xs text-red-500">{errors.placements}</p>}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Colour */}
          <section className={card}>
            {sectionHead(FaPalette, "bg-pink-100 text-pink-600", "Colour")}
            <div role="radiogroup" aria-label="Colour" className="grid grid-cols-4 gap-2">
              {(Object.keys(AD_TONES) as AdTone[]).map((tone) => {
                const selected = form.tone === tone;
                return (
                  <button
                    key={tone}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set("tone", tone)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      selected ? "border-black ring-1 ring-black" : isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <span className="h-7 w-full rounded-md" style={{ background: `linear-gradient(90deg, ${AD_TONES[tone].soft}, ${AD_TONES[tone].color})` }} />
                    {AD_TONES[tone].label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Schedule */}
          <section className={card}>
            <div className="flex items-start justify-between gap-4">
              {sectionHead(FaCalendarAlt, "bg-emerald-100 text-emerald-600", "Schedule", form.active ? "On" : "Paused: not shown")}
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                aria-label="Ad switched on"
                onClick={() => set("active", !form.active)}
                className={`relative mt-1.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  form.active ? "bg-emerald-600" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field name="startDate" title="Starts" error={errors.startDate} isDarkMode={isDarkMode}>
                  <input id="startDate" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={input(errors.startDate)} />
                </Field>
                <Field name="endDate" title="Ends" error={errors.endDate} isDarkMode={isDarkMode}>
                  <input id="endDate" type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={input(errors.endDate)} />
                </Field>
              </div>
              <p className={`flex gap-2 text-xs ${muted}`}>
                <FaInfoCircle className="mt-0.5 shrink-0" /> Leave both empty to run until you pause it.
              </p>
              <Field name="priority" title="Priority" hint="0–100. When ads share a place, the higher one shows." error={errors.priority} isDarkMode={isDarkMode}>
                <input
                  id="priority"
                  type="number"
                  min={0}
                  max={100}
                  value={form.priority}
                  onChange={(e) => set("priority", e.target.value)}
                  className={input(errors.priority)}
                />
              </Field>
            </div>
          </section>

          {/* Image */}
          <section className={card}>
            {sectionHead(FaImage, "bg-amber-100 text-amber-600", "Image", "Optional small square beside the text.")}
            <Field name="imageUrl" title="Image link" error={errors.imageUrl} isDarkMode={isDarkMode}>
              <div className="flex gap-2">
                <input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="https://…"
                  className={input(errors.imageUrl)}
                />
                <label
                  className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                    uploading
                      ? "cursor-not-allowed opacity-50"
                      : isDarkMode
                        ? "border-gray-700 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Upload an image"
                >
                  {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                  <input type="file" accept="image/*" onChange={handleImage} disabled={uploading} className="hidden" />
                </label>
              </div>
            </Field>
            {hasImage && (
              <div className="mt-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => set("imageUrl", "")}
                  className={`inline-flex items-center gap-1.5 text-xs ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"}`}
                >
                  <FaTimes size={10} /> Remove
                </button>
              </div>
            )}
          </section>
        </aside>
      </form>
    </div>
  );
};

export default AdvertisementForm;
