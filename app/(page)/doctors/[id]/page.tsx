import { getDoctorById } from "@/app/actions/doctorAction";
import DoctorDetails from "@/component/doctorManagement/DoctorDetails";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /doctors/:id — one doctor's details. */
export default async function DoctorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getDoctorById(id);

  if (!response.success || !response.data) {
    redirect("/doctors");
  }

  return <DoctorDetails doctor={response.data} />;
}
