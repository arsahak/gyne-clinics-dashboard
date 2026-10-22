import { getDoctorsPage } from "@/app/actions/doctorAction";
import DoctorList from "@/component/doctorManagement/DoctorList";

export const dynamic = "force-dynamic";

const DoctorsPage = async () => {
  const response = await getDoctorsPage();

  return (
    <DoctorList
      initialDoctors={response.success && response.data ? response.data : []}
      initialPagination={response.pagination}
      initialStats={response.stats}
      initialError={response.success ? undefined : response.error}
    />
  );
};

export default DoctorsPage;
