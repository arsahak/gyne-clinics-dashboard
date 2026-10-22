import { getPatients } from "@/app/actions/patientAction";
import PatientList from "@/component/patientManagement/PatientList";

export const dynamic = "force-dynamic";

const UserManagementPage = async () => {
  const response = await getPatients();

  return (
    <PatientList
      initialPatients={response.success && response.data ? response.data : []}
      initialPagination={response.pagination}
      initialStats={response.stats}
    />
  );
};

export default UserManagementPage;
