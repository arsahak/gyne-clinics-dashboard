import { getPatientById } from "@/app/actions/patientAction";
import PatientEdit from "@/component/patientManagement/PatientEdit";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /patient/edit/:id — edit one patient. */
export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getPatientById(id);

  if (!response.success || !response.data) {
    redirect("/patient");
  }

  return <PatientEdit patient={response.data} />;
}
