"use client";
import { createAdvertisement } from "@/app/actions/advertisementManagement";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import AdvertisementForm, { AdvertisementFormData } from "./AdvertisementForm";

const AdvertisementAdd = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: AdvertisementFormData) => {
    setIsSubmitting(true);

    try {
      const response = await createAdvertisement({
        ...data,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      });

      if (response.success) {
        toast.success("Advertisement created successfully!");
        router.push("/advertisements");
        router.refresh();
      } else {
        toast.error(response.error || "Failed to create advertisement");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return <AdvertisementForm title="Add New Advertisement" onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
};

export default AdvertisementAdd;
