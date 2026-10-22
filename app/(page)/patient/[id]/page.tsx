import { getPatientById } from "@/app/actions/patientAction";
import PatientDetails from "@/component/patientManagement/PatientDetails";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /patient/:id — one patient's details. */
export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getPatientById(id);

  if (!response.success || !response.data) {
    redirect("/patient");
  }

  return <PatientDetails patient={response.data} />;
}
