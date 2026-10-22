"use client";
import type { StoryTopic } from "@/app/actions/storyAction";
import { uploadImage } from "@/app/actions/upload";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaClock, FaCommentDots, FaImage, FaInfoCircle, FaSave, FaSpinner, FaTag, FaTimes, FaUpload, FaUserSecret } from "react-icons/fa";
import { readMinutes, STORY_COVER, STORY_TOPICS, wordCount } from "./storyMeta";

// Staff corrections to a patient's story: typos, topic, photo, how the name
// shows. The story stays the patient's own words.

export interface StoryFormData {
  title: string;
  body: string;
  topic: StoryTopic;
  anonymous: boolean;
  authorName: string;
  imageUrl: string;
}

type Errors = Partial<Record<keyof StoryFormData, string>>;
const URL_PATTERN = /^https?:\/\/\S+$/i;

// Same rules as the app's "Share story" form (no minimum length for the story).
function validate(f: StoryFormData): Errors {
  const e: Errors = {};
  if (f.title.trim().length < 5) e.title = "At least 5 characters";
  if (f.title.length > 120) e.title = "At most 120 characters";
  if (!f.body.trim()) e.body = "The story can't be empty";
  if (!f.anonymous && f.authorName.trim().length < 2) e.authorName = "Add the name to show, or publish anonymously";
  if (f.imageUrl.trim() && !URL_PATTERN.test(f.imageUrl.trim())) e.imageUrl = "Use a full link, starting with https://";
  return e;
}

function Field({ name, title, hint, error, isDarkMode, children }: { name: string; title: string; hint?: string; error?: string; isDarkMode: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        {title}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : hint && <p className={`mt-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{hint}</p>}
    </div>
  );
}

interface StoryFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialData: StoryFormData;
  cancelHref: string;
  isSubmitting?: boolean;
  onSubmit: (data: StoryFormData) => void;
}

const StoryForm = ({ title, description, submitLabel, initialData, cancelHref, isSubmitting = false, onSubmit }: StoryFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [form, setForm] = useState<StoryFormData>(initialData);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof StoryFormData>(key: K, value: StoryFormData[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (submitted) setErrors(validate(next));
  };

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
    if (Object.keys(found).length === 0) onSubmit({ ...form, title: form.title.trim(), body: form.body.trim(), authorName: form.authorName.trim(), imageUrl: form.imageUrl.trim() });
  };

  const card = `p-6 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const input = (hasError?: string) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${
      isDarkMode ? "bg-gray-900 text-gray-100 placeholder-gray-500" : "bg-white text-gray-900 placeholder-gray-400"
    } ${hasError ? "border-red-500 focus:ring-red-500" : isDarkMode ? "border-gray-700 focus:ring-gray-900" : "border-gray-300 focus:ring-gray-900"} focus:outline-none focus:ring-2`;
  const sectionHead = (Icon: typeof FaTag, tone: string, heading: string, sub?: string) => (
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
  const hasImage = Boolean(form.imageUrl.trim() && URL_PATTERN.test(form.imageUrl.trim()));
  const byline = form.anonymous ? "Anonymous" : form.authorName.trim() || "Community member";
  const excerpt = form.body.length > 155 ? `${form.body.slice(0, 152).trimEnd()}…` : form.body;

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className={`mt-1 ${muted}`}>{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(cancelHref)}
            className={`px-4 py-2.5 rounded-lg border text-sm ${isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="story-form"
            disabled={isSubmitting || uploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors disabled:opacity-50"
          >
            <FaSave /> {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>

      <form id="story-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className={card}>
            {sectionHead(FaCommentDots, "bg-purple-100 text-purple-600", "Story", "Fix typos only; keep the patient's own words.")}
            <div className="space-y-4">
              <Field name="title" title="Title" error={errors.title} isDarkMode={isDarkMode}>
                <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} className={input(errors.title)} />
              </Field>
              <Field
                name="body"
                title="Story"
                hint={`${wordCount(form.body)} words · ${readMinutes(form.body)} min read. A blank line starts a new paragraph.`}
                error={errors.body}
                isDarkMode={isDarkMode}
              >
                <textarea id="body" rows={14} value={form.body} onChange={(e) => set("body", e.target.value)} className={`${input(errors.body)} resize-y leading-relaxed`} />
              </Field>
            </div>
          </section>

          <section className={card}>
            {sectionHead(FaImage, "bg-pink-100 text-pink-600", "Photo", "Optional. Shown at the top of the story.")}
            <Field name="imageUrl" title="Image link" error={errors.imageUrl} isDarkMode={isDarkMode}>
              <div className="flex gap-2">
                <input id="imageUrl" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://… or upload a file" className={input(errors.imageUrl)} />
                <label
                  className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${
                    uploading ? "cursor-not-allowed opacity-50" : isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                  {uploading ? "Uploading..." : "Upload"}
                  <input type="file" accept="image/*" onChange={handleImage} disabled={uploading} className="hidden" />
                </label>
              </div>
            </Field>
            {hasImage && (
              <div className="relative mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="" className={`h-56 w-full rounded-lg border object-cover ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />
                <button
                  type="button"
                  onClick={() => set("imageUrl", "")}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/75"
                >
                  <FaTimes size={10} /> Remove
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {/* Preview as the Learn card */}
          <section className={card}>
            <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${muted}`}>Preview in Learn</h2>
            <div className={`overflow-hidden rounded-3xl border ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 items-center justify-center text-white/90" style={{ background: `linear-gradient(135deg, ${STORY_COVER.from}, ${STORY_COVER.to})` }}>
                  <FaCommentDots size={28} />
                </div>
              )}
              <div className="p-4">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${isDarkMode ? "bg-purple-900/60 text-purple-200" : "bg-purple-50 text-purple-700"}`}>Stories</span>
                <p className="mt-2 line-clamp-2 font-semibold">{form.title.trim() || "Title"}</p>
                <p className={`mt-1 line-clamp-2 text-sm ${muted}`}>{excerpt}</p>
                <p className={`mt-3 flex items-center gap-1.5 text-xs ${muted}`}>
                  <FaClock size={10} /> {readMinutes(form.body)} min read · {byline}
                </p>
              </div>
            </div>
          </section>

          <section className={card}>
            {sectionHead(FaTag, "bg-blue-100 text-blue-600", "Topic")}
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Topic">
              {STORY_TOPICS.map((topic) => {
                const selected = form.topic === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set("topic", topic)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      selected ? "border-black bg-black text-white" : isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={card}>
            <div className="flex items-start justify-between gap-4">
              {sectionHead(FaUserSecret, "bg-gray-100 text-gray-700", "Anonymous", form.anonymous ? "The name isn't shown" : "The name below is shown")}
              <button
                type="button"
                role="switch"
                aria-checked={form.anonymous}
                aria-label="Publish anonymously"
                onClick={() => set("anonymous", !form.anonymous)}
                className={`relative mt-1.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.anonymous ? "bg-black ring-1 ring-white/20" : isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.anonymous ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            {form.anonymous ? (
              <p className={`flex gap-2 text-xs ${muted}`}>
                <FaInfoCircle className="mt-0.5 shrink-0" /> Respect the patient&apos;s choice. Turn this off only if they asked you to.
              </p>
            ) : (
              <Field name="authorName" title="Name shown" hint="e.g. Ayesha, 27" error={errors.authorName} isDarkMode={isDarkMode}>
                <input id="authorName" value={form.authorName} onChange={(e) => set("authorName", e.target.value)} maxLength={60} className={input(errors.authorName)} />
              </Field>
            )}
          </section>
        </aside>
      </form>
    </div>
  );
};

export default StoryForm;
