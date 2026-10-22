import type { Content, ContentCategory } from "@/app/actions/content";
import { FaBookOpen, FaCommentDots, FaFileAlt, FaImage, FaNewspaper } from "react-icons/fa";

// Labels and colours shared by the content pages. Categories and covers
// match the webapp's Learn page (webapp/lib/learn.ts).

export const CONTENT_CATEGORIES: ContentCategory[] = [
  "Periods",
  "Fertility",
  "Pregnancy",
  "Menopause",
  "Pelvic Health",
  "Wellness",
  "Stories",
];

export const FORMAT_META: Record<Content["format"], { label: string; hint: string; icon: typeof FaFileAlt }> = {
  guide: { label: "Article", hint: "An informative guide", icon: FaBookOpen },
  blog: { label: "Blog", hint: "Longer, more personal", icon: FaNewspaper },
  story: { label: "Story", hint: "A patient's experience", icon: FaCommentDots },
  image: { label: "Image", hint: "A picture with a caption", icon: FaImage },
};

/** The gradient a category's card gets in the app when there's no image. */
export const CATEGORY_COVER: Record<ContentCategory, { from: string; to: string }> = {
  Periods: { from: "#d13a8b", to: "#834d8b" },
  Fertility: { from: "#217580", to: "#34a3a8" },
  Pregnancy: { from: "#b08d48", to: "#d13a8b" },
  Menopause: { from: "#834d8b", to: "#0a2342" },
  "Pelvic Health": { from: "#217580", to: "#0a2342" },
  Wellness: { from: "#b08d48", to: "#217580" },
  Stories: { from: "#834d8b", to: "#d13a8b" },
};

export const DEFAULT_AUTHOR = "GyneClinics Editorial Team";
export const DEFAULT_AUTHOR_ROLE = "Reviewed by a consultant gynaecologist";
