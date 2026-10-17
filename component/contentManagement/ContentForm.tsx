"use client";
import { uploadImage } from "@/app/actions/upload";
import RichTextEditor from "@/component/shared/RichTextEditor";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaSave, FaSpinner, FaTimes, FaUpload } from "react-icons/fa";

export interface ContentFormData {
  title: string;
  body: string;
  format: "text" | "image" | "blog";
  imageUrl?: string;
  category: string;
  readTimeMinutes?: number;
  visibility: "published" | "draft" | "hidden";
  sponsored?: boolean;
  sponsorName?: string;
}

interface ContentFormProps {
  initialData?: ContentFormData;
  onSubmit: (data: ContentFormData) => void;
  title: string;
  isSubmitting?: boolean;
  existingCategories: string[];
}

const NEW_CATEGORY_VALUE = "__new__";

const ContentForm = ({
  initialData,
  onSubmit,
  title,
  isSubmitting = false,
  existingCategories,
}: ContentFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();

  const [formData, setFormData] = useState<ContentFormData>(
    initialData || {
      title: "",
      body: "",
      format: "text",
      imageUrl: "",
      category: existingCategories[0] || "",
      readTimeMinutes: undefined,
      visibility: "published",
      sponsored: false,
      sponsorName: "",
    }
  );

  // Whether the category dropdown is in "type a new one" mode
  const [addingCategory, setAddingCategory] = useState(
    initialData ? !existingCategories.includes(initialData.category) : existingCategories.length === 0
  );

  const [uploadingImage, setUploadingImage] = useState(false);

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
      setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success("Image uploaded");
    } else {
      toast.error(result.error || "Failed to upload image");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "readTimeMinutes" ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === NEW_CATEGORY_VALUE) {
      setAddingCategory(true);
      setFormData((prev) => ({ ...prev, category: "" }));
    } else {
      setAddingCategory(false);
      setFormData((prev) => ({ ...prev, category: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.body.trim() || formData.body === "<p></p>") {
      alert("Body is required");
      return;
    }
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
            {initialData ? "Update this piece of content" : "Upload text, image, or blog content for patients"}
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
            <FaSave /> {isSubmitting ? "Saving..." : "Save Content"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">General Information</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Understanding Your Cycle"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Body</label>
                <RichTextEditor
                  value={formData.body}
                  onChange={(body) => setFormData((prev) => ({ ...prev, body }))}
                  placeholder="Write the full article content..."
                />
              </div>
              <div>
                <label className={labelClass}>Feature Image (optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl || ""}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://... or upload a file"
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
                    alt="Feature image preview"
                    className="mt-3 h-40 w-full object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">Format & Visibility</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Format</label>
                <select name="format" value={formData.format} onChange={handleChange} className={inputClass}>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="blog">Blog</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Visibility</label>
                <select name="visibility" value={formData.visibility} onChange={handleChange} className={inputClass}>
                  <option value="published">Published (visible to patients)</option>
                  <option value="draft">Draft (not yet visible)</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Read Time (minutes)</label>
                <input
                  type="number"
                  name="readTimeMinutes"
                  value={formData.readTimeMinutes ?? ""}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 4"
                  min={1}
                />
              </div>
            </div>
          </div>

          {/* Sponsored (F2) */}
          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">Sponsorship</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Sponsored Content</label>
                <input
                  type="checkbox"
                  checked={!!formData.sponsored}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sponsored: e.target.checked }))}
                  className="w-5 h-5 rounded"
                />
              </div>
              {formData.sponsored && (
                <div>
                  <label className={labelClass}>Sponsor Name</label>
                  <input
                    type="text"
                    name="sponsorName"
                    value={formData.sponsorName || ""}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. Wellness Co"
                  />
                </div>
              )}
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Sponsored content shows a "Sponsored" label to patients in the Learn feed.
              </p>
            </div>
          </div>

          {/* Category */}
          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">Category</h2>
            {!addingCategory ? (
              <select value={formData.category} onChange={handleCategorySelect} className={inputClass}>
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value={NEW_CATEGORY_VALUE}>+ Add new category…</option>
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Periods, Pregnancy, Wellness"
                  required
                  autoFocus
                />
                {existingCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingCategory(false);
                      setFormData((prev) => ({ ...prev, category: existingCategories[0] }));
                    }}
                    className={`text-xs ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    ← Choose an existing category instead
                  </button>
                )}
              </div>
            )}
            <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Categories are created automatically the first time you use them — patients browse content by category.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ContentForm;
