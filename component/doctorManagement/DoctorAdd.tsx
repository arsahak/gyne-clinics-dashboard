"use client";
import { createDoctor, type DoctorFormData } from "@/app/actions/doctorAction";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import DoctorForm from "./DoctorForm";

const DoctorAdd = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: DoctorFormData) => {
    setIsSubmitting(true);
    try {
      const response = await createDoctor(data);
      if (response.success) {
        toast.success("Doctor created successfully!");
        router.push("/doctors");
      } else {
        toast.error(response.error || "Failed to create doctor");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DoctorForm
      title="Add New Doctor"
      description="Create a doctor account and profile. Doctors added here are approved straight away."
      submitLabel="Create Doctor"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default DoctorAdd;
