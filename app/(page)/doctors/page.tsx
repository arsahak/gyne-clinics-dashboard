import { getDoctorsPage } from "@/app/actions/doctorManagement";
import DoctorManagement from "@/component/doctorManagement/DoctorManagement";

export const dynamic = "force-dynamic";

const DoctorsPage = async () => {
  const response = await getDoctorsPage();

  return (
    <DoctorManagement
      initialDoctors={response.success && response.data ? response.data : []}
      initialPagination={response.pagination}
      initialStats={response.stats}
    />
  );
};

export default DoctorsPage;
