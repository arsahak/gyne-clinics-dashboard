"use client";
import {
  AdvertisementRecord,
  deleteAdvertisement,
  getAdvertisements,
  toggleAdvertisementActive,
} from "@/app/actions/advertisementManagement";
import { AD_PLACEMENT_LABELS, AD_PLACEMENTS, AdPlacement } from "@/lib/adPlacements";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaAd, FaEdit, FaMousePointer, FaEye, FaPlus, FaTrash } from "react-icons/fa";

interface AdvertisementManagementProps {
  initialAds: AdvertisementRecord[];
  initialPlacement: AdPlacement | "all";
}

const TABS: { value: AdPlacement | "all"; label: string }[] = [
  { value: "all", label: "All Placements" },
  ...AD_PLACEMENTS.map((p) => ({ value: p, label: AD_PLACEMENT_LABELS[p] })),
];

const AdvertisementManagement = ({ initialAds, initialPlacement }: AdvertisementManagementProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [ads, setAds] = useState<AdvertisementRecord[]>(initialAds);
  const [activeTab, setActiveTab] = useState<AdPlacement | "all">(initialPlacement);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleTabChange = async (placement: AdPlacement | "all") => {
    setActiveTab(placement);
    setLoading(true);
    const response = await getAdvertisements(placement);
    if (response.success && response.data) {
      setAds(response.data as AdvertisementRecord[]);
    }
    setLoading(false);
  };

  const handleToggleActive = async (ad: AdvertisementRecord) => {
    const response = await toggleAdvertisementActive(ad._id, !ad.active);
    if (response.success) {
      toast.success(ad.active ? "Advertisement paused" : "Advertisement activated");
      setAds((prev) => prev.map((a) => (a._id === ad._id ? { ...a, active: !a.active } : a)));
      router.refresh();
    } else {
      toast.error(response.error || "Failed to update advertisement");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this advertisement?")) {
      const response = await deleteAdvertisement(id);
      if (response.success) {
        toast.success("Advertisement deleted successfully");
        setAds((prev) => prev.filter((a) => a._id !== id));
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete advertisement");
      }
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advertisements</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Manage banner ads and sponsored placements shown across the app
        </p>
      </div>

      {/* Placement tabs + Add button */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeTab === tab.value
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

        <Link
          href="/advertisements/add-advertisement"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
        >
          <FaPlus /> Add Advertisement
        </Link>
      </div>

      {/* Table */}
      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading advertisements...</div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Placement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {ads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FaAd className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                      <p className="text-gray-500">No advertisements found</p>
                    </td>
                  </tr>
                )}
                {ads.map((ad) => (
                  <tr key={ad._id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-14 h-10 rounded object-cover bg-gray-200 flex-shrink-0"
                        />
                        <div>
                          <div className="font-medium max-w-xs truncate">{ad.title}</div>
                          {ad.advertiserName && (
                            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{ad.advertiserName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {AD_PLACEMENT_LABELS[ad.placement]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{ad.priority}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1" title="Impressions">
                          <FaEye className="text-gray-400" /> {ad.impressions}
                        </span>
                        <span className="flex items-center gap-1" title="Clicks">
                          <FaMousePointer className="text-gray-400" /> {ad.clicks}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {ad.startDate || ad.endDate ? `${formatDate(ad.startDate)} – ${formatDate(ad.endDate)}` : "Always on"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(ad)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          ad.active
                            ? isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"
                            : isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ad.active ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/advertisements/edit-advertisement/${ad._id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => handleDelete(ad._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
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

export default AdvertisementManagement;
