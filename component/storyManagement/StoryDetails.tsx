"use client";
import { deleteStory, setStoryStatus, type Story, type StoryStatus } from "@/app/actions/storyAction";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaCheck, FaClock, FaCommentDots, FaEdit, FaEyeSlash, FaTimes, FaTrashAlt, FaUndo, FaUserSecret } from "react-icons/fa";
import { bylineFor, formatDay, readMinutes, STATUS_META, STORY_COVER, wordCount } from "./storyMeta";

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

/** Review page: the story as patients will read it, with approve / reject / hide. */
const StoryDetails = ({ story }: { story: Story }) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  const status = STATUS_META[story.status];
  const theme = isDarkMode ? "dark" : "light";
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const outlineBtn = `px-4 py-2.5 rounded-lg border text-sm ${
    isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"
  }`;
  const paragraphs = story.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const changeStatus = async (next: StoryStatus, note?: string) => {
    setBusy(true);
    const response = await setStoryStatus(story._id, next, note);
    setBusy(false);
    if (response.success) {
      toast.success(
        next === "approved" ? "Approved: it now shows in Learn" : next === "rejected" ? "Rejected" : next === "hidden" ? "Hidden from Learn" : "Moved back to review",
      );
      setReason("");
      router.refresh();
    } else toast.error(response.error || "Failed to update the story");
  };

  const handleDelete = async () => {
    setBusy(true);
    const response = await deleteStory(story._id);
    if (response.success) {
      toast.success("Story deleted");
      router.push("/stories");
    } else {
      setBusy(false);
      toast.error(response.error || "Failed to delete the story");
    }
  };

  const rows = [
    { label: "Sent by", value: story.patient?.fullName || "—" },
    { label: "Phone", value: story.patient?.phone || "—" },
    { label: "Shown as", value: story.anonymous ? "Anonymous" : bylineFor(story) },
    { label: "Sent", value: formatDateTime(story.createdAt) },
    { label: "Reviewed", value: story.reviewedAt ? `${formatDay(story.reviewedAt)}${story.reviewedBy?.fullName ? ` by ${story.reviewedBy.fullName}` : ""}` : "Not yet" },
    { label: "Length", value: `${wordCount(story.body)} words · ${readMinutes(story.body)} min read` },
  ];

  const greenBtn = "flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50";
  const redBtn = "flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50";
  const plainBtn = `flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
    isDarkMode ? "border-gray-700 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
  }`;

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: `linear-gradient(135deg, ${STORY_COVER.from}, ${STORY_COVER.to})` }}
          >
            <FaCommentDots size={22} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold">{story.title}</h1>
            <p className={`mt-1 flex flex-wrap items-center gap-2 text-sm ${muted}`}>
              {bylineFor(story)} · {story.topic} ·
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status[theme]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => router.push("/stories")} className={outlineBtn}>
            Back
          </button>
          <Link
            href={`/stories/edit/${story._id}`}
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* The story, as patients will read it */}
        <article className={`${card} lg:col-span-2`}>
          <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${muted}`}>As patients will read it</h2>
          {story.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.imageUrl} alt="" className="mb-6 h-64 w-full rounded-2xl object-cover" />
          ) : (
            <div
              className="mb-6 flex h-40 items-center justify-center rounded-2xl text-white/90"
              style={{ background: `linear-gradient(135deg, ${STORY_COVER.from}, ${STORY_COVER.to})` }}
            >
              <FaCommentDots size={38} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isDarkMode ? "bg-purple-900/50 text-purple-200" : "bg-purple-50 text-purple-700"}`}>
              Stories
            </span>
            <span className={`flex items-center gap-1.5 text-xs ${muted}`}>
              <FaClock size={10} /> {readMinutes(story.body)} min read
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold">{story.title}</h2>
          <div className={`mt-3 border-b pb-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              {story.anonymous && <FaUserSecret className={muted} />}
              {bylineFor(story)}
            </p>
            <p className={`text-xs ${muted}`}>Community story · {story.topic} · Approved by GyneClinics</p>
          </div>
          <div className="mt-4 space-y-4 text-[15px] leading-7">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        </article>

        <aside className="space-y-6">
          {/* Review */}
          <section className={card}>
            <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${muted}`}>Review</h2>
            <div className={`mb-4 rounded-lg border p-3 text-sm ${status[theme]}`}>
              <p className="font-medium">{status.label}</p>
              <p className="text-xs opacity-80">{status.hint}</p>
              {story.status === "rejected" && story.rejectionReason && (
                <p className="mt-2 text-xs">
                  <span className="font-medium">Reason:</span> {story.rejectionReason}
                </p>
              )}
            </div>

            {story.status === "pending" && (
              <div className="space-y-3">
                <button type="button" disabled={busy} onClick={() => changeStatus("approved")} className={greenBtn}>
                  <FaCheck size={12} /> Approve and publish
                </button>
                <div className={`rounded-lg border p-3 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <label htmlFor="reason" className={`mb-1.5 block text-xs font-medium ${muted}`}>
                    Reason, if you reject (the patient sees it)
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    maxLength={300}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Please remove the clinic's name and send it again."
                    className={`mb-2 w-full resize-y rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode ? "border-gray-700 bg-gray-900 text-gray-100" : "border-gray-300 bg-white"
                    }`}
                  />
                  <button type="button" disabled={busy} onClick={() => changeStatus("rejected", reason.trim() || undefined)} className={redBtn}>
                    <FaTimes size={12} /> Reject
                  </button>
                </div>
              </div>
            )}

            {story.status === "approved" && (
              <button type="button" disabled={busy} onClick={() => changeStatus("hidden")} className={plainBtn}>
                <FaEyeSlash size={13} /> Hide from Learn
              </button>
            )}

            {(story.status === "rejected" || story.status === "hidden") && (
              <div className="space-y-2">
                <button type="button" disabled={busy} onClick={() => changeStatus("approved")} className={greenBtn}>
                  <FaCheck size={12} /> {story.status === "hidden" ? "Show in Learn again" : "Approve instead"}
                </button>
                <button type="button" disabled={busy} onClick={() => changeStatus("pending")} className={plainBtn}>
                  <FaUndo size={11} /> Move back to review
                </button>
              </div>
            )}
          </section>

          {/* Details */}
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
            {story.anonymous && (
              <p className={`mt-4 flex gap-2 text-xs ${muted}`}>
                <FaUserSecret className="mt-0.5 shrink-0" /> The patient asked to stay anonymous. Only staff see who sent it.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default StoryDetails;
