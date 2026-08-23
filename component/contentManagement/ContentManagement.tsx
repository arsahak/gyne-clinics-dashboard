"use client";
import { Content, deleteContent, getContents, hideContent, unhideContent } from "@/app/actions/content";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaEdit, FaEyeSlash, FaFileAlt, FaEye, FaPlus, FaTrash } from "react-icons/fa";

interface ContentManagementProps {
  initialContents: Content[];
  initialCategory: string;
}

const ContentManagement = ({ initialContents, initialCategory }: ContentManagementProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [contents, setContents] = useState<Content[]>(initialContents);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(false);

  // Categories are derived from whatever content already exists — no separate
  // category collection to manage, admins just type a new one on the form.
  const categories = useMemo(() => {
    const set = new Set(contents.map((c) => c.category));
    return ["All", ...Array.from(set)];
  }, [contents]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getVisibilityColor = (visibility: string) => {
    const colors: Record<string, string> = {
      published: isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800",
      draft: isDarkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800",
      hidden: isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800",
    };
    return colors[visibility] || "";
  };

  const handleCategoryFilter = async (category: string) => {
    setActiveCategory(category);
    setLoading(true);
    const response = await getContents(category === "All" ? undefined : category);
    if (response.success && response.data) {
      setContents(response.data as Content[]);
    }
    setLoading(false);
  };

  const handleHide = async (id: string) => {
    const reason = window.prompt("Reason for hiding this content (optional):") || undefined;
    const response = await hideContent(id, reason);
    if (response.success) {
      toast.success("Content hidden");
      setContents((prev) => prev.map((c) => (c._id === id ? { ...c, visibility: "hidden" } : c)));
      router.refresh();
    } else {
      toast.error(response.error || "Failed to hide content");
    }
  };

  const handleUnhide = async (id: string) => {
    const response = await unhideContent(id);
    if (response.success) {
      toast.success("Content restored");
      setContents((prev) => prev.map((c) => (c._id === id ? { ...c, visibility: "published" } : c)));
      router.refresh();
    } else {
      toast.error(response.error || "Failed to restore content");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this content?")) {
      const response = await deleteContent(id);
      if (response.success) {
        toast.success("Content deleted successfully");
        setContents((prev) => prev.filter((c) => c._id !== id));
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete content");
      }
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Content</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Upload and manage educational content shown to patients
        </p>
      </div>

      {/* Category tabs + Add button */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === cat
                  ? "bg-blue-600 border-blue-600 text-white"
                  : isDarkMode
                  ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <Link
          href="/content/add-content"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
        >
          <FaPlus /> Add Content
        </Link>
      </div>

      {/* Table */}
      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading content...</div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Format</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Visibility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {contents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FaFileAlt className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                      <p className="text-gray-500">No content found</p>
                    </td>
                  </tr>
                )}
                {contents.map((content) => (
                  <tr key={content._id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-medium max-w-xs truncate">{content.title}</div>
                        {content.sponsored && (
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${
                            isDarkMode ? "bg-purple-900 text-purple-300" : "bg-purple-100 text-purple-700"
                          }`}>
                            SPONSORED
                          </span>
                        )}
                      </div>
                      {content.sponsored && content.sponsorName && (
                        <div className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          by {content.sponsorName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{content.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-sm">{content.format}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getVisibilityColor(content.visibility)}`}>
                        {content.visibility}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(content.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/content/edit-content/${content._id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FaEdit />
                        </Link>
                        {content.visibility === "hidden" ? (
                          <button
                            onClick={() => handleUnhide(content._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Restore"
                          >
                            <FaEye />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHide(content._id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Hide"
                          >
                            <FaEyeSlash />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(content._id)}
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

export default ContentManagement;
