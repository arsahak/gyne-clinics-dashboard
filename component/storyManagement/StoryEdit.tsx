"use client";
import { type Story, updateStory } from "@/app/actions/storyAction";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import StoryForm, { type StoryFormData } from "./StoryForm";

const StoryEdit = ({ story }: { story: Story }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: StoryFormData) => {
    setIsSubmitting(true);
    try {
      const response = await updateStory(story._id, data);
      if (response.success) {
        toast.success("Story updated");
        router.push(`/stories/${story._id}`);
      } else toast.error(response.error || "Failed to update the story");
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StoryForm
      title="Edit Story"
      description={`Corrections to “${story.title}”, sent by ${story.patient?.fullName || "a patient"}.`}
      submitLabel="Save Changes"
      initialData={{
        title: story.title,
        body: story.body,
        topic: story.topic,
        anonymous: story.anonymous,
        authorName: story.authorName ?? "",
        imageUrl: story.imageUrl ?? "",
      }}
      cancelHref={`/stories/${story._id}`}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default StoryEdit;
