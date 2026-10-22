"use client";
import { createAdvertisement } from "@/app/actions/advertisementAction";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { toAdInput } from "./adForm";
import AdvertisementForm, { type AdvertisementFormData } from "./AdvertisementForm";

const AdvertisementAdd = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: AdvertisementFormData) => {
    setIsSubmitting(true);
    try {
      const response = await createAdvertisement(toAdInput(data));
      if (response.success) {
        toast.success("Ad created successfully!");
        router.push("/advertisements");
      } else toast.error(response.error || "Failed to create the ad");
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdvertisementForm
      title="Add New Ad"
      description="Create a labelled banner for the app. The preview shows exactly how patients see it."
      submitLabel="Create Ad"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default AdvertisementAdd;
