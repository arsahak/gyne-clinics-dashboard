import type { Story, StoryStatus, StoryTopic } from "@/app/actions/storyAction";

// Labels and colours shared by the story pages. Topics match the webapp's
// Learn categories; the cover matches how it shows community stories.

export const STORY_TOPICS: StoryTopic[] = ["Periods", "Fertility", "Pregnancy", "Menopause", "Pelvic Health", "Wellness", "Stories"];

/** The webapp's cover for a community story without a photo. */
export const STORY_COVER = { from: "#765885", to: "#cc619d" };

export const STATUS_META: Record<StoryStatus, { label: string; hint: string; light: string; dark: string; dot: string }> = {
  pending: {
    label: "Waiting for review",
    hint: "Not visible yet",
    light: "bg-amber-50 text-amber-800 border-amber-200",
    dark: "bg-amber-900/50 text-amber-300 border-amber-800",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    hint: "In Learn → Stories",
    light: "bg-green-50 text-green-800 border-green-200",
    dark: "bg-green-900/50 text-green-300 border-green-800",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    hint: "The patient sees why",
    light: "bg-rose-50 text-rose-700 border-rose-200",
    dark: "bg-rose-900/50 text-rose-300 border-rose-800",
    dot: "bg-rose-500",
  },
  hidden: {
    label: "Hidden",
    hint: "Taken down after approval",
    light: "bg-gray-100 text-gray-700 border-gray-300",
    dark: "bg-gray-700 text-gray-200 border-gray-600",
    dot: "bg-gray-400",
  },
};

export const STATUS_ORDER: StoryStatus[] = ["pending", "approved", "rejected", "hidden"];

/** The name patients see on the story. */
export const bylineFor = (story: Pick<Story, "anonymous" | "authorName">) =>
  story.anonymous ? "Anonymous" : story.authorName?.trim() || "Community member";

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** About 200 words a minute, at least 1, like the webapp. */
export const readMinutes = (text: string) => Math.max(1, Math.ceil(wordCount(text) / 200));

export const formatDay = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
