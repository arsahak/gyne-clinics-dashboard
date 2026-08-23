"use client";
import {
  getUsers,
  suspendUser,
  unsuspendUser,
  UserRecord,
  UserRole,
  verifyUserAccount,
} from "@/app/actions/adminUserManagement";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaBan, FaCheckCircle, FaSearch, FaUsers } from "react-icons/fa";

interface UserManagementProps {
  initialUsers: UserRecord[];
  initialRole: UserRole | "all";
}

// This panel is scoped to patient/doctor accounts only — admin/staff live
// under Settings, shop customers under Customers.
const ROLE_TABS: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "patient", label: "Patients" },
  { value: "doctor", label: "Doctors" },
];
const VISIBLE_ROLES: UserRole[] = ["patient", "doctor"];

const UserManagement = ({ initialUsers, initialRole }: UserManagementProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [activeRole, setActiveRole] = useState<UserRole | "all">(initialRole);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const runSearch = async (role: UserRole | "all", searchTerm: string) => {
    setLoading(true);
    const response = await getUsers(role, searchTerm || undefined);
    if (response.success && response.data) {
      const data = response.data as UserRecord[];
      setUsers(role === "all" ? data.filter((u) => VISIBLE_ROLES.includes(u.role)) : data);
    }
    setLoading(false);
  };

  const handleRoleFilter = (role: UserRole | "all") => {
    setActiveRole(role);
    runSearch(role, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(activeRole, search);
  };

  const handleSuspend = async (user: UserRecord) => {
    const reason = window.prompt(`Reason for suspending ${user.name || user.email || user.phone}:`) || undefined;
    const response = await suspendUser(user._id, reason);
    if (response.success) {
      toast.success("User suspended");
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, suspended: true, suspensionReason: reason } : u)));
      router.refresh();
    } else {
      toast.error(response.error || "Failed to suspend user");
    }
  };

  const handleUnsuspend = async (user: UserRecord) => {
    const response = await unsuspendUser(user._id);
    if (response.success) {
      toast.success("User unsuspended");
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, suspended: false } : u)));
      router.refresh();
    } else {
      toast.error(response.error || "Failed to unsuspend user");
    }
  };

  const handleVerify = async (user: UserRecord) => {
    const response = await verifyUserAccount(user._id);
    if (response.success) {
      toast.success("User verified");
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isVerified: true } : u)));
      router.refresh();
    } else {
      toast.error(response.error || "Failed to verify user");
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Manage account access across all roles — suspend, unsuspend, or manually verify accounts
        </p>
      </div>

      {/* Role tabs + Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleRoleFilter(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeRole === tab.value
                  ? "bg-blue-600 border-blue-600 text-white"
                  : isDarkMode
                  ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or phone..."
            className={`px-4 py-2 rounded-lg border text-sm w-full md:w-64 ${
              isDarkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <button
            type="submit"
            className={`px-3 py-2 rounded-lg border ${
              isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FaSearch />
          </button>
        </form>
      </div>

      {/* Table */}
      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading users...</div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Verified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FaUsers className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                      <p className="text-gray-500">No users found</p>
                    </td>
                  </tr>
                )}
                {users.map((user) => (
                  <tr key={user._id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{user.name || "—"}</div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {user.email || user.phone || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-sm">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isVerified ? (
                        <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"}`}>
                          Verified
                        </span>
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.suspended ? (
                        <span
                          title={user.suspensionReason}
                          className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"}`}
                        >
                          Suspended
                        </span>
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"}`}>
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!user.isVerified && (
                          <button
                            onClick={() => handleVerify(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Manually verify"
                          >
                            <FaCheckCircle />
                          </button>
                        )}
                        {user.role !== "admin" && (
                          user.suspended ? (
                            <button
                              onClick={() => handleUnsuspend(user)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Unsuspend"
                            >
                              <FaCheckCircle />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Suspend"
                            >
                              <FaBan />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
