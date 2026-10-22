"use client";
import { type PatientFormData, type PatientRecord, updatePatient } from "@/app/actions/patientAction";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import PatientForm from "./PatientForm";

interface PatientEditProps {
  patient: PatientRecord;
}

/** PatientRecord (as listed) → form values. */
function toFormData(patient: PatientRecord): PatientFormData {
  const p = patient.profile;
  return {
    fullName: patient.name ?? "",
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    profile: p
      ? {
          dateOfBirth: p.dateOfBirth ?? "",
          heightCm: p.heightCm ?? 0,
          weightKg: p.weightKg ?? 0,
          typicalCycleLength: p.menstrualHistory?.cycleLengthDays ?? 28,
          typicalPeriodLength: p.menstrualHistory?.periodLengthDays ?? 5,
          lastPeriodStart: p.menstrualHistory?.lastPeriodDate?.slice(0, 10),
          pregnancyStatus: p.pregnancyStatus ?? "not_pregnant",
          dueDate: p.dueDate?.slice(0, 10),
        }
      : undefined,
  };
}

const PatientEdit = ({ patient }: PatientEditProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      const response = await updatePatient(patient._id, data);
      if (response.success) {
        toast.success("Patient updated successfully!");
        router.push("/patient");
      } else {
        toast.error(response.error || "Failed to update patient");
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
      title="Edit Patient"
      description={`Update ${patient.name || "this patient"}'s account and health details.`}
      submitLabel="Save Changes"
      initialData={toFormData(patient)}
      hasProfile={Boolean(patient.profile)}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default PatientEdit;
