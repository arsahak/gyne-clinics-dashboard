"use client";
import { Customer, deleteCustomer, getCustomers } from "@/app/actions/customer";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaCreditCard,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTimesCircle,
  FaTrash,
  FaUser,
  FaUsers,
} from "react-icons/fa";

interface CustomerManagementProps {
  initialCustomers: Customer[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-indigo-100 text-indigo-600",
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-600",
  "bg-orange-100 text-orange-600",
];

const SORT_OPTIONS = [
  { label: "Newest first", sortBy: "createdAt", sortOrder: "desc" as const },
  { label: "Oldest first", sortBy: "createdAt", sortOrder: "asc" as const },
  { label: "Highest spender", sortBy: "totalSpent", sortOrder: "desc" as const },
  { label: "Most orders", sortBy: "totalOrders", sortOrder: "desc" as const },
];

const CustomerManagement = ({
  initialCustomers,
  pagination: initialPagination,
}: CustomerManagementProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortIndex, setSortIndex] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US");
  };

  const getPrimaryAddress = (customer: Customer) => {
    return (
      customer.billingAddresses?.find((a) => a.isDefaultBilling) ||
      customer.billingAddresses?.[0] ||
      customer.shippingAddresses?.find((a) => a.isDefaultShipping) ||
      customer.shippingAddresses?.[0]
    );
  };

  const fetchCustomers = async (term: string, sortIdx: number) => {
    setLoading(true);
    const { sortBy, sortOrder } = SORT_OPTIONS[sortIdx];
    const response = await getCustomers(1, 20, term, sortBy, sortOrder);
    if (response.success && response.data) {
      setCustomers(response.data as Customer[]);
      setPagination(response.pagination);
    }
    setLoading(false);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchCustomers(term, sortIndex);
  };

  const handleSortChange = (value: string) => {
    const idx = Number(value);
    setSortIndex(idx);
    fetchCustomers(searchTerm, idx);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      const response = await deleteCustomer(id);
      if (response.success) {
        toast.success("Customer deleted successfully");
        setCustomers(customers.filter((c) => c._id !== id));
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete customer");
      }
    }
  };

  const totalCustomers = pagination?.total ?? customers.length;
  // No `suspended`/status field exists on the Customer model yet, so every
  // loaded customer counts as active and the Status badge is a static display.
  const activeCustomers = customers.length;
  const inactiveCustomers = 0;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const statCards = [
    {
      label: "Total Customers",
      value: totalCustomers,
      sub: "All registered customers",
      icon: FaUsers,
      iconClass: isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-50 text-blue-600",
    },
    {
      label: "Active",
      value: activeCustomers,
      sub: "Can access their account",
      icon: FaCheckCircle,
      iconClass: isDarkMode ? "bg-green-900 text-green-300" : "bg-green-50 text-green-600",
    },
    {
      label: "Inactive",
      value: inactiveCustomers,
      sub: "Account access blocked",
      icon: FaTimesCircle,
      iconClass: isDarkMode ? "bg-red-900 text-red-300" : "bg-red-50 text-red-600",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      sub: "Paid customer orders",
      icon: FaCreditCard,
      iconClass: isDarkMode ? "bg-purple-900 text-purple-300" : "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Customers</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            View and manage registered customer accounts
          </p>
        </div>

        <Link
          href="/customers/add-customer"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
            isDarkMode
              ? "bg-white text-gray-900 hover:bg-gray-200"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          <FaPlus size={12} /> Add Customer
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-5 flex items-start gap-3 ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className={`p-2.5 rounded-lg ${card.iconClass}`}>
              <card.icon size={18} />
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {card.label}
              </p>
              <p className="text-2xl font-bold mt-0.5">{card.value}</p>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              isDarkMode ? "text-gray-400" : "text-gray-400"
            }`}
            size={14}
          />
          <input
            type="text"
            placeholder="Search name, email, phone or company"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-gray-100"
                : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        <select
          value={sortIndex}
          onChange={(e) => handleSortChange(e.target.value)}
          className={`px-4 py-2.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-gray-100"
              : "bg-white border-gray-300 text-gray-900"
          }`}
        >
          {SORT_OPTIONS.map((opt, idx) => (
            <option key={opt.label} value={idx}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Customers Table */}
      <div
        className={`rounded-lg shadow-sm border overflow-hidden ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading customers...</div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <FaUser className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                      <p className="text-gray-500">No customers found</p>
                    </td>
                  </tr>
                )}
                {customers.map((customer, index) => {
                  const address = getPrimaryAddress(customer);
                  return (
                    <tr
                      key={customer._id}
                      className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-bold mr-3 ${
                              AVATAR_COLORS[index % AVATAR_COLORS.length]
                            }`}
                          >
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium">{customer.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{customer.email || "—"}</div>
                        <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {customer.phone || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{address?.city || "—"}</div>
                        <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {address?.country || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{customer.totalOrders || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            isDarkMode
                              ? "bg-green-900 text-green-300"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/customers/edit-customer/${customer._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(customer._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-t ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Showing 1 to {customers.length} of {pagination?.total || customers.length} customers
          </div>
          <div className="flex gap-2">
            <button
              disabled={!pagination || pagination.page <= 1}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "border-gray-700 hover:bg-gray-700 disabled:opacity-50"
                  : "border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              }`}
            >
              Previous
            </button>
            <button
              disabled={!pagination || pagination.page >= pagination.pages}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "border-gray-700 hover:bg-gray-700 disabled:opacity-50"
                  : "border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
