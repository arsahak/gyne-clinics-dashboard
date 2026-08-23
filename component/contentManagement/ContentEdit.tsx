"use client";
import { Content, updateContent } from "@/app/actions/content";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import ContentForm, { ContentFormData } from "./ContentForm";

interface ContentEditProps {
  content: Content;
  existingCategories: string[];
}

const ContentEdit = ({ content, existingCategories }: ContentEditProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialData: ContentFormData = {
    title: content.title,
    body: content.body,
    format: content.format,
    imageUrl: content.imageUrl || "",
    category: content.category,
    readTimeMinutes: content.readTimeMinutes,
    visibility: content.visibility,
    sponsored: content.sponsored ?? false,
    sponsorName: content.sponsorName || "",
  };

  const handleSubmit = async (data: ContentFormData) => {
    setIsSubmitting(true);

    try {
      const response = await updateContent(content._id, data);

      if (response.success) {
        toast.success("Content updated successfully!");
        router.push("/content");
        router.refresh();
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
      initialData={initialData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      existingCategories={existingCategories}
    />
  );
};

export default ContentEdit;
