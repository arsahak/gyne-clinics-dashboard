"use client";
import { AdvertisementRecord, updateAdvertisement } from "@/app/actions/advertisementManagement";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import AdvertisementForm, { AdvertisementFormData } from "./AdvertisementForm";

interface AdvertisementEditProps {
  advertisement: AdvertisementRecord;
}

const AdvertisementEdit = ({ advertisement }: AdvertisementEditProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialData: AdvertisementFormData = {
    title: advertisement.title,
    imageUrl: advertisement.imageUrl,
    linkUrl: advertisement.linkUrl || "",
    placement: advertisement.placement,
    advertiserName: advertisement.advertiserName || "",
    priority: advertisement.priority,
    active: advertisement.active,
    startDate: advertisement.startDate || "",
    endDate: advertisement.endDate || "",
  };

  const handleSubmit = async (data: AdvertisementFormData) => {
    setIsSubmitting(true);

    try {
      const response = await updateAdvertisement(advertisement._id, {
        ...data,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      });

      if (response.success) {
        toast.success("Advertisement updated successfully!");
        router.push("/advertisements");
        router.refresh();
      } else {
        toast.error(response.error || "Failed to update advertisement");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdvertisementForm
      title="Edit Advertisement"
      initialData={initialData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default AdvertisementEdit;
