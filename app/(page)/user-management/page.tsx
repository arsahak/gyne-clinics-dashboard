import { getUsers, UserRecord } from "@/app/actions/adminUserManagement";
import UserManagement from "@/component/userManagement/UserManagement";

export const dynamic = "force-dynamic";

const UserManagementPage = async () => {
  const response = await getUsers("all");
  const allUsers = (response.success && response.data ? response.data : []) as UserRecord[];
  // Scoped to patient/doctor accounts — admin/staff live under Settings, shop customers under Customers.
  const initialUsers = allUsers.filter((u) => u.role === "patient" || u.role === "doctor");

  return <UserManagement initialUsers={initialUsers} initialRole="all" />;
};

export default UserManagementPage;
