"use client";
import { createContent } from "@/app/actions/content";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import ContentForm, { ContentFormData } from "./ContentForm";

interface ContentAddProps {
  existingCategories: string[];
}

const ContentAdd = ({ existingCategories }: ContentAddProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ContentFormData) => {
    setIsSubmitting(true);

    try {
      const response = await createContent(data);

      if (response.success) {
        toast.success("Content created successfully!");
        router.push("/content");
        router.refresh();
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
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      existingCategories={existingCategories}
    />
  );
};

export default ContentAdd;
