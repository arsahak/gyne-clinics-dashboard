"use client";
import { createContent } from "@/app/actions/content";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import ContentForm, { type ContentFormData } from "./ContentForm";

const ContentAdd = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ContentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await createContent(data);
      if (response.success) {
        toast.success("Content created successfully!");
        router.push("/content");
      } else {
        toast.error(response.error || "Failed to create content");
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
      title="Add New Content"
      description="Write an article, blog or story for the app's Learn page."
      submitLabel="Create Content"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default ContentAdd;
