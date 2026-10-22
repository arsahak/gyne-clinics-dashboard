"use client";
import { createPatient, type PatientFormData } from "@/app/actions/patientAction";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import PatientForm from "./PatientForm";

const PatientAdd = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      const response = await createPatient(data);
      if (response.success) {
        toast.success("Patient created successfully!");
        router.push("/patient");
      } else {
        toast.error(response.error || "Failed to create patient");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PatientForm
      title="Add New Patient"
      description="Create a patient account. They sign in to the app with this mobile number."
      submitLabel="Create Patient"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default PatientAdd;
