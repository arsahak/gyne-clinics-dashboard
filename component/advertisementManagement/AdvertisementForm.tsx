"use client";
import { uploadImage } from "@/app/actions/upload";
import { AD_PLACEMENT_LABELS, AD_PLACEMENTS, AdPlacement } from "@/lib/adPlacements";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaSave, FaSpinner, FaTimes, FaUpload } from "react-icons/fa";

export interface AdvertisementFormData {
  title: string;
  imageUrl: string;
  linkUrl?: string;
  placement: AdPlacement;
  advertiserName?: string;
  priority: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
}

interface AdvertisementFormProps {
  initialData?: AdvertisementFormData;
  onSubmit: (data: AdvertisementFormData) => void;
  title: string;
  isSubmitting?: boolean;
}

const toDateInputValue = (iso?: string) => (iso ? iso.slice(0, 10) : "");

const AdvertisementForm = ({ initialData, onSubmit, title, isSubmitting = false }: AdvertisementFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();

  const [formData, setFormData] = useState<AdvertisementFormData>(
    initialData || {
      title: "",
      imageUrl: "",
      linkUrl: "",
      placement: "patient_home",
      advertiserName: "",
      priority: 0,
      active: true,
      startDate: "",
      endDate: "",
    }
  );

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? Number(value) : 0) : value,
    }));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    const result = await uploadImage(uploadFormData);
    setUploadingImage(false);

    if (result.success && result.url) {
      setFormData((prev) => ({ ...prev, imageUrl: result.url! }));
      toast.success("Image uploaded");
    } else {
      toast.error(result.error || "Failed to upload image");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClass = `w-full px-4 py-2 rounded-lg border ${
    isDarkMode
      ? "bg-gray-800 border-gray-700 text-gray-100"
      : "bg-white border-gray-300 text-gray-900"
  } focus:outline-none focus:ring-2 focus:ring-blue-500`;

  const labelClass = `block text-sm font-medium mb-1 ${
    isDarkMode ? "text-gray-400" : "text-gray-700"
  }`;

  return (
    <div className={`${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            {initialData ? "Update this advertisement" : "Create a banner ad for a specific screen"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FaTimes /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FaSave /> {isSubmitting ? "Saving..." : "Save Advertisement"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">Ad Details</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Cycle Vitamins Sale"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Banner Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://... or upload a file"
                    required
                  />
                  <label
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer whitespace-nowrap ${
                      uploadingImage
                        ? "opacity-50 cursor-not-allowed"
                        : isDarkMode
                        ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {uploadingImage ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                    {uploadingImage ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.imageUrl}
                    alt="Banner preview"
                    className="mt-3 h-32 w-full object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                  />
                )}
              </div>
              <div>
                <label className={labelClass}>Link URL (optional)</label>
                <input
                  type="text"
                  name="linkUrl"
                  value={formData.linkUrl || ""}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="https://... (where tapping the ad takes the user)"
                />
              </div>
              <div>
                <label className={labelClass}>Advertiser / Sponsor Name (optional)</label>
                <input
                  type="text"
                  name="advertiserName"
                  value={formData.advertiserName || ""}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Wellness Co"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">Placement & Frequency</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Placement</label>
                <select name="placement" value={formData.placement} onChange={handleChange} className={inputClass}>
                  {AD_PLACEMENTS.map((p) => (
                    <option key={p} value={p}>
                      {AD_PLACEMENT_LABELS[p]}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Where this ad renders in the app.
                </p>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className={inputClass}
                  min={0}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Lower number shows first when multiple ads share a placement.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <label className={labelClass}>Active</label>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">Schedule (optional)</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={toDateInputValue(formData.startDate)}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={toDateInputValue(formData.endDate)}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Leave blank to run indefinitely while Active is on.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdvertisementForm;
