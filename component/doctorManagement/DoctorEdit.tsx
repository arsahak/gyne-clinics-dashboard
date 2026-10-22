"use client";
import { type DoctorFormData, type DoctorRecord, updateDoctor } from "@/app/actions/doctorAction";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import DoctorForm from "./DoctorForm";

/** DoctorRecord (as listed) → form values. */
function toFormData(doctor: DoctorRecord): DoctorFormData {
  return {
    fullName: doctor.user.name ?? "",
    phone: doctor.user.phone ?? "",
    email: doctor.user.email ?? "",
    title: doctor.title ?? "",
    specialization: doctor.specialization ?? "",
    qualifications: doctor.qualifications ?? [],
    experienceYears: doctor.experienceYears ?? 0,
    focusAreas: doctor.focusAreas ?? [],
    about: doctor.about ?? "",
    registrationNumber: doctor.registrationNumber ?? "",
    registrationBody: doctor.registrationBody ?? "",
    clinic: doctor.hospitalName ?? "",
    city: doctor.city ?? "",
    country: doctor.country ?? "",
    languages: doctor.languages ?? [],
    feeGBP: doctor.consultationFee ?? 0,
    schedule: doctor.schedule,
  };
}

const DoctorEdit = ({ doctor }: { doctor: DoctorRecord }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: DoctorFormData) => {
    setIsSubmitting(true);
    try {
      const response = await updateDoctor(doctor._id, data);
      if (response.success) {
        toast.success("Doctor updated successfully!");
        router.push("/doctors");
      } else {
        toast.error(response.error || "Failed to update doctor");
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
      title="Edit Doctor"
      description={`Update ${doctor.user.name || "this doctor"}'s account and profile.`}
      submitLabel="Save Changes"
      initialData={toFormData(doctor)}
      isEdit
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default DoctorEdit;
