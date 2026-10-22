"use client";
import { type AdvertisementRecord, updateAdvertisement } from "@/app/actions/advertisementAction";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { toAdForm, toAdInput } from "./adForm";
import AdvertisementForm, { type AdvertisementFormData } from "./AdvertisementForm";

const AdvertisementEdit = ({ advertisement }: { advertisement: AdvertisementRecord }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: AdvertisementFormData) => {
    setIsSubmitting(true);
    try {
      const response = await updateAdvertisement(advertisement._id, toAdInput(data));
      if (response.success) {
        toast.success("Ad updated successfully!");
        router.push(`/advertisements/${advertisement._id}`);
      } else toast.error(response.error || "Failed to update the ad");
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdvertisementForm
      title="Edit Ad"
      description={`Update “${advertisement.headline}”.`}
      submitLabel="Save Changes"
      initialData={toAdForm(advertisement)}
      cancelHref={`/advertisements/${advertisement._id}`}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default AdvertisementEdit;
