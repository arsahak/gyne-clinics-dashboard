import { DoctorRecord, getDoctors } from "@/app/actions/doctorManagement";
import DoctorManagement from "@/component/doctorManagement/DoctorManagement";

export const dynamic = "force-dynamic";

const DoctorsPage = async () => {
  const response = await getDoctors("all");
  const initialDoctors = (response.success && response.data ? response.data : []) as DoctorRecord[];

  return <DoctorManagement initialDoctors={initialDoctors} initialStatus="all" />;
};

export default DoctorsPage;
