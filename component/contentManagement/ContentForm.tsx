"use client";
import type { Content, ContentCategory } from "@/app/actions/content";
import { uploadImage } from "@/app/actions/upload";
import RichTextEditor from "@/component/shared/RichTextEditor";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaBullhorn,
  FaClock,
  FaFileAlt,
  FaImage,
  FaInfoCircle,
  FaNewspaper,
  FaSave,
  FaSpinner,
  FaTag,
  FaTimes,
  FaUpload,
  FaUserEdit,
} from "react-icons/fa";
import { CATEGORY_COVER, CONTENT_CATEGORIES, DEFAULT_AUTHOR, DEFAULT_AUTHOR_ROLE, FORMAT_META } from "./contentMeta";

// Shared by ContentAdd and ContentEdit. Fields match what the webapp's Learn
// page shows: cover image, category, title, summary, byline, read time, text.

export interface ContentFormData {
  title: string;
  body: string;
  /** Empty = taken from the start of the body. */
  excerpt: string;
  format: Content["format"];
  imageUrl?: string;
  category: ContentCategory;
  /** null = estimate it from the body. */
  readTimeMinutes?: number | null;
  visibility: Content["visibility"];
  authorName: string;
  authorRole: string;
  sponsored?: boolean;
  sponsorName?: string;
}

type Errors = Partial<
  Record<"title" | "body" | "excerpt" | "sponsorName" | "readTimeMinutes" | "imageUrl" | "authorName" | "authorRole", string>
>;

const EXCERPT_MAX = 300;
const URL_PATTERN = /^https?:\/\/\S+$/i;

const VISIBILITIES: {
  value: Content["visibility"];
  label: string;
  hint: string;
  colors: { light: string; dark: string; selected: string };
}[] = [
  {
    value: "published",
    label: "Published",
    hint: "Patients see it",
    colors: {
      light: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
      dark: "border-green-800 bg-green-900/40 text-green-300 hover:bg-green-900",
      selected: "border-green-600 bg-green-600 text-white",
    },
  },
  {
    value: "draft",
    label: "Draft",
    hint: "Only staff see it",
    colors: {
      light: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
      dark: "border-amber-800 bg-amber-900/40 text-amber-300 hover:bg-amber-900",
      selected: "border-amber-500 bg-amber-500 text-white",
    },
  },
  {
    value: "hidden",
    label: "Hidden",
    hint: "Taken down",
    colors: {
      light: "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100",
      dark: "border-gray-600 bg-gray-700/40 text-gray-300 hover:bg-gray-700",
      selected: "border-gray-700 bg-gray-700 text-white",
    },
  },
];

/** The body without HTML. */
const plainText = (html: string) =>
  html
    .replace(/<\/(p|h[1-6]|li|div|blockquote)>|<br\s*\/?>/gi, "$& ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** What the app shows when the summary is left empty. */
const autoExcerpt = (html: string) => {
  const text = plainText(html);
  return text.length <= 160 ? text : `${text.slice(0, 160).replace(/\s+\S*$/, "")}…`;
};

function validate(f: ContentFormData): Errors {
  const e: Errors = {};
  if (f.title.trim().length < 3) e.title = "Give it a title (at least 3 characters)";
  if (!plainText(f.body) && !/<img/i.test(f.body)) e.body = "Write the content";
  if (f.excerpt.trim().length > EXCERPT_MAX) e.excerpt = `At most ${EXCERPT_MAX} characters`;
  if (f.format === "image" && !f.imageUrl?.trim()) e.imageUrl = "An image post needs an image";
  if (f.imageUrl?.trim() && !URL_PATTERN.test(f.imageUrl.trim())) e.imageUrl = "Use a full link, starting with https://";
  if (f.readTimeMinutes != null && (!Number.isInteger(f.readTimeMinutes) || f.readTimeMinutes < 1 || f.readTimeMinutes > 120))
    e.readTimeMinutes = "1–120 minutes";
  if (f.authorName.trim().length > 80) e.authorName = "At most 80 characters";
  if (f.authorRole.trim().length > 120) e.authorRole = "At most 120 characters";
  if (f.sponsored && !f.sponsorName?.trim()) e.sponsorName = "Who is sponsoring it?";
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

interface ContentFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialData?: ContentFormData;
  /** Where Cancel goes. */
  cancelHref?: string;
  isSubmitting?: boolean;
  onSubmit: (data: ContentFormData) => void;
}

const ContentForm = ({
  title,
  description,
  submitLabel,
  initialData,
  cancelHref = "/content",
  isSubmitting = false,
  onSubmit,
}: ContentFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();

  const [form, setForm] = useState<ContentFormData>(
    () =>
      initialData ?? {
        title: "",
        body: "",
        excerpt: "",
        format: "guide",
        imageUrl: "",
        category: "Periods",
        readTimeMinutes: undefined,
        visibility: "draft",
        authorName: DEFAULT_AUTHOR,
        authorRole: DEFAULT_AUTHOR_ROLE,
        sponsored: false,
        sponsorName: "",
      },
  );
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof ContentFormData>(key: K, value: ContentFormData[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    // After the first submit, re-check as things get fixed.
    if (submitted) setErrors(validate(next));
  };

  const words = plainText(form.body).split(" ").filter(Boolean).length;
  const estimatedMinutes = Math.max(1, Math.round(words / 200));
  const summary = form.excerpt.trim() || autoExcerpt(form.body);
  const hasImage = Boolean(form.imageUrl?.trim() && URL_PATTERN.test(form.imageUrl.trim()));

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
    if (Object.keys(found).length > 0) return;
    onSubmit({
      ...form,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      imageUrl: form.imageUrl?.trim() || "",
      readTimeMinutes: form.readTimeMinutes ?? null,
      authorName: form.authorName.trim() || DEFAULT_AUTHOR,
      authorRole: form.authorRole.trim(),
      sponsorName: form.sponsored ? form.sponsorName?.trim() : undefined,
    });
  };

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
  const sectionHead = (Icon: typeof FaFileAlt, tone: string, heading: string, sub?: string) => (
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

  const FormatIcon = FORMAT_META[form.format].icon;
  const cover = CATEGORY_COVER[form.category];
  const readTime = form.readTimeMinutes ?? (words ? estimatedMinutes : undefined);

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
            form="content-form"
            disabled={isSubmitting || uploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors disabled:opacity-50"
          >
            <FaSave /> {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>

      <form id="content-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Content */}
          <section className={card}>
            {sectionHead(FaFileAlt, "bg-indigo-100 text-indigo-600", "Content", "What patients read in the app's Learn page.")}
            <div className="space-y-4">
              <Field name="title" title="Title" error={errors.title} isDarkMode={isDarkMode}>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. What is a “normal” menstrual cycle?"
                  maxLength={150}
                  className={input(errors.title)}
                />
              </Field>
              <Field
                name="excerpt"
                title="Summary"
                hint={`Shown on the card and at the top of the article. Leave empty to use the start of the text. ${form.excerpt.length}/${EXCERPT_MAX}`}
                error={errors.excerpt}
                isDarkMode={isDarkMode}
              >
                <textarea
                  id="excerpt"
                  rows={2}
                  maxLength={EXCERPT_MAX}
                  value={form.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  placeholder={autoExcerpt(form.body) || "One or two sentences on what the reader will learn."}
                  className={`${input(errors.excerpt)} resize-y`}
                />
              </Field>
              <div>
                <span className={label}>Text</span>
                <div className={`overflow-hidden rounded-lg ${errors.body ? "ring-2 ring-red-500" : ""}`}>
                  <RichTextEditor value={form.body} onChange={(body) => set("body", body)} placeholder="Write the full content..." />
                </div>
                {errors.body ? (
                  <p className="mt-1 text-xs text-red-500">{errors.body}</p>
                ) : (
                  <p className={`mt-1 text-xs ${muted}`}>
                    {words} {words === 1 ? "word" : "words"}
                    {words > 0 && ` · about ${estimatedMinutes} min read`}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Image */}
          <section className={card}>
            {sectionHead(
              FaImage,
              "bg-pink-100 text-pink-600",
              "Cover image",
              form.format === "image"
                ? "Required for an image post."
                : "Optional. Without one, the app shows the category's coloured cover.",
            )}
            <Field name="imageUrl" title="Image link" error={errors.imageUrl} isDarkMode={isDarkMode}>
              <div className="flex gap-2">
                <input
                  id="imageUrl"
                  value={form.imageUrl ?? ""}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="https://… or upload a file"
                  className={input(errors.imageUrl)}
                />
                <label
                  className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm whitespace-nowrap ${
                    uploading
                      ? "cursor-not-allowed opacity-50"
                      : isDarkMode
                        ? "border-gray-700 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                  {uploading ? "Uploading..." : "Upload"}
                  <input type="file" accept="image/*" onChange={handleImage} disabled={uploading} className="hidden" />
                </label>
              </div>
            </Field>
            {hasImage ? (
              <div className="relative mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt="Cover preview"
                  className={`h-56 w-full rounded-lg border object-cover ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                />
                <button
                  type="button"
                  onClick={() => set("imageUrl", "")}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/75"
                >
                  <FaTimes size={10} /> Remove
                </button>
              </div>
            ) : (
              <div
                className="mt-4 flex h-32 items-center justify-center rounded-lg text-white/90"
                style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <FormatIcon /> {form.category} cover
                </span>
              </div>
            )}
          </section>

          {/* Byline */}
          <section className={card}>
            {sectionHead(FaUserEdit, "bg-teal-100 text-teal-600", "Byline", "Who patients see as the author.")}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field name="authorName" title="Author" hint="e.g. a doctor's name, or the editorial team." error={errors.authorName} isDarkMode={isDarkMode}>
                <input
                  id="authorName"
                  value={form.authorName}
                  onChange={(e) => set("authorName", e.target.value)}
                  placeholder={DEFAULT_AUTHOR}
                  maxLength={80}
                  className={input(errors.authorName)}
                />
              </Field>
              <Field name="authorRole" title="Role or note" hint="Shown under the name." error={errors.authorRole} isDarkMode={isDarkMode}>
                <input
                  id="authorRole"
                  value={form.authorRole}
                  onChange={(e) => set("authorRole", e.target.value)}
                  placeholder={DEFAULT_AUTHOR_ROLE}
                  maxLength={120}
                  className={input(errors.authorRole)}
                />
              </Field>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Preview, as the card looks in the app */}
          <section className={card}>
            <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${muted}`}>Preview in the app</h2>
            <div className={`overflow-hidden rounded-3xl border ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="h-32 w-full object-cover" />
              ) : (
                <div
                  className="flex h-32 items-center justify-center text-white/90"
                  style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
                >
                  <FormatIcon size={28} />
                </div>
              )}
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      form.format === "story"
                        ? isDarkMode
                          ? "bg-purple-900/60 text-purple-200"
                          : "bg-purple-50 text-purple-700"
                        : isDarkMode
                          ? "bg-teal-900/60 text-teal-200"
                          : "bg-teal-50 text-teal-700"
                    }`}
                  >
                    {form.category}
                  </span>
                  {form.sponsored && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDarkMode ? "bg-amber-900 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                      Sponsored
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 font-semibold">{form.title.trim() || "Your title"}</p>
                <p className={`mt-1 line-clamp-2 text-sm ${muted}`}>{summary || "Your summary"}</p>
                <p className={`mt-3 flex items-center gap-1.5 text-xs ${muted}`}>
                  <FaClock size={10} /> {readTime ? `${readTime} min read` : "Read time"} · {form.authorName.trim() || DEFAULT_AUTHOR}
                </p>
              </div>
            </div>
          </section>

          {/* Publishing */}
          <section className={card}>
            {sectionHead(FaNewspaper, "bg-emerald-100 text-emerald-600", "Publishing")}
            <div className="space-y-5">
              <div>
                <span className={label}>Format</span>
                <div role="radiogroup" className="grid grid-cols-2 gap-2">
                  {(Object.keys(FORMAT_META) as Content["format"][]).map((value) => {
                    const option = FORMAT_META[value];
                    const selected = form.format === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        title={option.hint}
                        onClick={() => set("format", value)}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors ${
                          selected
                            ? "border-black bg-black text-white ring-1 ring-white/20"
                            : isDarkMode
                              ? "border-gray-700 text-gray-300 hover:bg-gray-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <option.icon size={13} /> {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className={label}>Visibility</span>
                <div role="radiogroup" className="space-y-2">
                  {VISIBILITIES.map((option) => {
                    const selected = form.visibility === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => set("visibility", option.value)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                          option.colors[selected ? "selected" : isDarkMode ? "dark" : "light"]
                        }`}
                      >
                        {option.label}
                        <span className={`text-xs font-normal ${selected ? "text-white/80" : "opacity-70"}`}>{option.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field
                name="readTimeMinutes"
                title="Read time (minutes)"
                hint={words ? `Leave empty to use the estimate (${estimatedMinutes} min).` : "Leave empty to estimate it from the text."}
                error={errors.readTimeMinutes}
                isDarkMode={isDarkMode}
              >
                <input
                  id="readTimeMinutes"
                  type="number"
                  min={1}
                  max={120}
                  value={form.readTimeMinutes ?? ""}
                  onChange={(e) => set("readTimeMinutes", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder={words ? String(estimatedMinutes) : "e.g. 4"}
                  className={input(errors.readTimeMinutes)}
                />
              </Field>
            </div>
          </section>

          {/* Category */}
          <section className={card}>
            {sectionHead(FaTag, "bg-blue-100 text-blue-600", "Category", "The tab it appears under in Learn.")}
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
              {CONTENT_CATEGORIES.map((category) => {
                const selected = form.category === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set("category", category)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? "border-transparent text-white"
                        : isDarkMode
                          ? "border-gray-700 text-gray-300 hover:bg-gray-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                    style={
                      selected
                        ? { background: `linear-gradient(135deg, ${CATEGORY_COVER[category].from}, ${CATEGORY_COVER[category].to})` }
                        : undefined
                    }
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Sponsorship */}
          <section className={card}>
            <div className="flex items-start justify-between gap-4">
              {sectionHead(FaBullhorn, "bg-purple-100 text-purple-600", "Sponsored")}
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(form.sponsored)}
                aria-label="Sponsored content"
                onClick={() => set("sponsored", !form.sponsored)}
                className={`relative mt-1.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  form.sponsored ? "bg-black ring-1 ring-white/20" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.sponsored ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </div>
            {form.sponsored ? (
              <Field name="sponsorName" title="Sponsor name" error={errors.sponsorName} isDarkMode={isDarkMode}>
                <input
                  id="sponsorName"
                  value={form.sponsorName ?? ""}
                  onChange={(e) => set("sponsorName", e.target.value)}
                  placeholder="e.g. Wellness Co"
                  className={input(errors.sponsorName)}
                />
              </Field>
            ) : (
              <p className={`flex gap-2 text-xs ${muted}`}>
                <FaInfoCircle className="mt-0.5 shrink-0" />
                Turn on for paid content. Patients see &ldquo;Sponsored by&rdquo; and the sponsor&apos;s name.
              </p>
            )}
          </section>
        </aside>
      </form>
    </div>
  );
};

export default ContentForm;
