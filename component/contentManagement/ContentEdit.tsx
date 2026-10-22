"use client";
import { type Content, updateContent } from "@/app/actions/content";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import ContentForm, { type ContentFormData } from "./ContentForm";

/** Content (as fetched) → form values. */
function toFormData(content: Content): ContentFormData {
  return {
    title: content.title,
    body: content.body,
    // Summaries taken from the text stay empty, so they keep following it.
    excerpt: content.excerptEstimated ? "" : (content.excerpt ?? ""),
    format: content.format,
    imageUrl: content.imageUrl ?? "",
    category: content.category,
    // Estimated read times stay empty, so they keep following the text.
    readTimeMinutes: content.readTimeEstimated ? undefined : content.readTimeMinutes,
    visibility: content.visibility,
    authorName: content.authorName ?? "",
    authorRole: content.authorRole ?? "",
    sponsored: content.sponsored ?? false,
    sponsorName: content.sponsorName ?? "",
  };
}

const ContentEdit = ({ content }: { content: Content }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ContentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await updateContent(content._id, data);
      if (response.success) {
        toast.success("Content updated successfully!");
        router.push(`/content/${content._id}`);
      } else {
        toast.error(response.error || "Failed to update content");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContentForm
      title="Edit Content"
      description={`Update “${content.title}”.`}
      submitLabel="Save Changes"
      initialData={toFormData(content)}
      cancelHref={`/content/${content._id}`}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default ContentEdit;
