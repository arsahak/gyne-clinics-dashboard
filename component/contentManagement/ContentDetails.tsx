"use client";
import { type Content, deleteContent, updateContent } from "@/app/actions/content";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import toast from "react-hot-toast";
import { FaBullhorn, FaClock, FaEdit, FaInfoCircle, FaTrashAlt } from "react-icons/fa";
import { CATEGORY_COVER, FORMAT_META } from "./contentMeta";
import { VISIBILITY_COLORS, VISIBILITY_OPTIONS } from "./ContentList";

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

/**
 * The body is HTML from the editor. Keep text formatting, links and images;
 * drop scripts, embeds, inline handlers and javascript: links.
 */
function cleanHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed, form, input, button, link, meta").forEach((el) => el.remove());
  doc.body.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on") || name === "style" || ((name === "href" || name === "src") && value.startsWith("javascript:"))) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === "A") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });
  return doc.body.innerHTML;
}

/** Readable styles for the editor's HTML (headings, lists, quotes, links, images). */
const ARTICLE =
  "text-[15px] leading-7 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:my-4 [&_img]:rounded-lg [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6";

const ContentDetails = ({ content }: { content: Content }) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // Clean the HTML in the browser only (DOMParser isn't available on the server).
  const inBrowser = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const body = useMemo(() => (inBrowser ? cleanHtml(content.body || "") : null), [inBrowser, content.body]);

  const format = FORMAT_META[content.format] ?? FORMAT_META.guide;
  const cover = CATEGORY_COVER[content.category] ?? CATEGORY_COVER.Wellness;
  const theme = isDarkMode ? 1 : 0;
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const outlineBtn = `px-4 py-2.5 rounded-lg border text-sm ${
    isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"
  }`;

  const handleVisibility = async (visibility: Content["visibility"]) => {
    setBusy(true);
    const response = await updateContent(content._id, { visibility });
    setBusy(false);
    if (response.success) {
      toast.success(`Now ${visibility}`);
      router.refresh();
    } else toast.error(response.error || "Failed to change visibility");
  };

  const handleDelete = async () => {
    setBusy(true);
    const response = await deleteContent(content._id);
    if (response.success) {
      toast.success("Content deleted");
      router.push("/content");
    } else {
      setBusy(false);
      toast.error(response.error || "Failed to delete content");
    }
  };

  const rows = [
    { label: "Link in the app", value: <span className="font-mono text-xs">/patient/learn/{content.slug}</span> },
    { label: "Category", value: content.category || "—" },
    { label: "Format", value: format.label },
    { label: "Read time", value: content.readTimeMinutes ? `${content.readTimeMinutes} min` : "—" },
    { label: "Created", value: formatDateTime(content.createdAt) },
    { label: "Last updated", value: formatDateTime(content.updatedAt) },
  ];

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white/90"
            style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
          >
            <format.icon size={22} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold">{content.title}</h1>
            <p className={`mt-1 text-sm ${muted}`}>
              {[content.category, format.label, content.readTimeMinutes ? `${content.readTimeMinutes} min read` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => router.push("/content")} className={outlineBtn}>
            Back
          </button>
          <Link
            href={`/content/edit/${content._id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors"
          >
            <FaEdit size={13} /> Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <FaTrashAlt size={12} /> Delete
          </button>
          <select
            value={content.visibility}
            disabled={busy}
            onChange={(e) => handleVisibility(e.target.value as Content["visibility"])}
            aria-label="Visibility"
            className={`cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-wait disabled:opacity-60 ${VISIBILITY_COLORS[content.visibility][theme]}`}
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {content.visibility !== "published" && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
            content.visibility === "draft"
              ? isDarkMode
                ? "border-amber-900 bg-amber-950/40 text-amber-300"
                : "border-amber-200 bg-amber-50 text-amber-800"
              : isDarkMode
                ? "border-gray-700 bg-gray-800 text-gray-300"
                : "border-gray-300 bg-gray-100 text-gray-700"
          }`}
        >
          <FaInfoCircle className="mt-0.5 shrink-0" />
          {content.visibility === "draft"
            ? "Draft: patients can't see this yet. Set it to Published when it's ready."
            : "Hidden: taken down from the Learn feed. Set it to Published to show it again."}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* The article, as patients read it */}
        <article className={`${card} lg:col-span-2`}>
          {content.imageUrl ? (
            <Image src={content.imageUrl} alt="" width={1200} height={600} className="mb-6 h-72 w-full rounded-lg object-cover" />
          ) : (
            <div
              className="mb-6 flex h-48 items-center justify-center rounded-lg text-white/90"
              style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
            >
              <format.icon size={40} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isDarkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-50 text-blue-700"}`}>
              {content.category}
            </span>
            {content.sponsored && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isDarkMode ? "bg-purple-900 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
                Sponsored{content.sponsorName ? ` by ${content.sponsorName}` : ""}
              </span>
            )}
            {content.readTimeMinutes && (
              <span className={`flex items-center gap-1.5 text-xs ${muted}`}>
                <FaClock size={10} /> {content.readTimeMinutes} min read
              </span>
            )}
          </div>
          <h2 className="mt-3 text-2xl font-bold">{content.title}</h2>
          <div className={`mt-3 border-b pb-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <p className="text-sm font-medium">{content.authorName}</p>
            {content.authorRole && <p className={`text-xs ${muted}`}>{content.authorRole}</p>}
          </div>
          {content.excerpt && <p className={`mt-4 text-[17px] ${muted}`}>{content.excerpt}</p>}
          {body === null ? (
            <div className="mt-6 space-y-3">
              {[100, 92, 96, 70].map((w) => (
                <div key={w} className={`h-3.5 animate-pulse rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : body.trim() ? (
            <div className={`mt-4 ${ARTICLE}`} dangerouslySetInnerHTML={{ __html: body }} />
          ) : (
            <p className={`mt-4 ${muted}`}>No text yet.</p>
          )}
        </article>

        <aside className="space-y-6">
          <section className={card}>
            <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${muted}`}>Details</h2>
            <dl className="space-y-4">
              {rows.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4">
                  <dt className={`shrink-0 text-sm ${muted}`}>{row.label}</dt>
                  <dd className="text-right text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={card}>
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <FaBullhorn size={14} />
              </span>
              <h2 className="text-lg font-semibold">Sponsorship</h2>
            </div>
            <p className={`text-sm ${muted}`}>
              {content.sponsored
                ? `Sponsored by ${content.sponsorName || "a sponsor"}. Patients see a "Sponsored" label.`
                : "Not sponsored."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ContentDetails;
