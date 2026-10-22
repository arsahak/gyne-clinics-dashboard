import { getDoctorById } from "@/app/actions/doctorAction";
import DoctorEdit from "@/component/doctorManagement/DoctorEdit";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /doctors/edit/:id — edit one doctor. */
export default async function EditDoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getDoctorById(id);

  if (!response.success || !response.data) {
    redirect("/doctors");
  }

  return <DoctorEdit doctor={response.data} />;
}
