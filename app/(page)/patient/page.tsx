import { getPatients } from "@/app/actions/adminUserManagement";
import UserManagement from "@/component/userManagement/UserManagement";

export const dynamic = "force-dynamic";

const UserManagementPage = async () => {
  const response = await getPatients();

  return (
    <UserManagement
      initialPatients={response.success && response.data ? response.data : []}
      initialPagination={response.pagination}
      initialStats={response.stats}
    />
  );
};

export default UserManagementPage;
