"use client";

import { useState, useEffect } from "react";
import { useSidebar } from "@/lib/SidebarContext";
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Loader,
  Database,
  X,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import toast from "react-hot-toast";

interface KnowledgeBaseDocument {
  _id: string;
  chatbotType: string;
  fileName: string;
  fileSize: number;
  description?: string;
  uploadedAt: string;
  processedAt?: string;
  chunkCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const KnowledgeBaseAdmin = () => {
  const { isDarkMode } = useSidebar();
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>("general");
  const [description, setDescription] = useState("");

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const url =
        selectedType === "all"
          ? `${API_BASE_URL}/api/knowledge-base/list`
          : `${API_BASE_URL}/api/knowledge-base/list?chatbotType=${selectedType}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // Auto-refresh every 10 seconds to check processing status
    const interval = setInterval(fetchDocuments, 10000);
    return () => clearInterval(interval);
  }, [selectedType]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      toast.success(`Selected: ${selectedFile.name}`);
    }
  };

  // Handle file upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatbotType", uploadType);
      formData.append("description", description);

      const response = await fetch(`${API_BASE_URL}/api/knowledge-base/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (data.success) {
        toast.success("File uploaded successfully! Processing in background...");
        setFile(null);
        setDescription("");
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        // Fetch documents after a brief delay
        setTimeout(() => {
          fetchDocuments();
        }, 1000);
      } else {
        toast.error(`Upload failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  // Handle file deletion
  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    const deleteToast = toast.loading("Deleting document...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/knowledge-base/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Document deleted successfully", { id: deleteToast });
        fetchDocuments();
      } else {
        toast.error(`Delete failed: ${data.message}`, { id: deleteToast });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document", { id: deleteToast });
    }
  };

  // Clear selected file
  const clearFile = () => {
    setFile(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const configs = {
      pending: { icon: Clock, color: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "Pending" },
      processing: { icon: Loader, color: "bg-blue-100 text-blue-700 border-blue-300", label: "Processing" },
      completed: { icon: CheckCircle, color: "bg-green-100 text-green-700 border-green-300", label: "Completed" },
      failed: { icon: XCircle, color: "bg-red-100 text-red-700 border-red-300", label: "Failed" },
    };

    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}
      >
        <Icon size={14} className={status === "processing" ? "animate-spin" : ""} />
        {config.label}
      </span>
    );
  };

  const chatbotTypes = [
    { value: "general", label: "General Gynaecology", color: "bg-blue-500" },
    { value: "urogynaecology", label: "Urogynaecology", color: "bg-purple-500" },
    { value: "aesthetic", label: "Aesthetic Gynaecology", color: "bg-pink-500" },
    { value: "menopause", label: "Menopause", color: "bg-orange-500" },
  ];

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Knowledge Base</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Upload and manage PDF documents for the AI chatbot training
        </p>
      </div>

      {/* Upload Form */}
      <div className={`rounded-xl shadow-sm p-6 mb-6 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Upload className="text-primary" size={24} />
          Upload New Document
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chatbot Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Chatbot Type *
              </label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300"
                }`}
                required
                disabled={uploading}
              >
                {chatbotTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                PDF File *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-100"
                      : "bg-white border-gray-300"
                  }`}
                  required
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          {/* File Preview */}
          {file && (
            <div className={`p-4 rounded-lg border-2 border-dashed ${
              isDarkMode ? "bg-gray-700 border-gray-600" : "bg-blue-50 border-blue-300"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCheck className="text-primary" size={24} />
                  <div>
                    <p className="font-semibold">{file.name}</p>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-red-600" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the document content..."
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
                  : "bg-white border-gray-300"
              }`}
              rows={2}
              disabled={uploading}
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Uploading...</span>
                <span className="font-semibold text-primary">{uploadProgress}%</span>
              </div>
              <div className={`w-full rounded-full h-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-secondary text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {uploading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload Document
              </>
            )}
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className={`rounded-xl shadow-sm p-4 mb-6 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedType("all")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedType === "all"
                ? "bg-primary text-white shadow-md"
                : isDarkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Types
          </button>
          {chatbotTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                selectedType === type.value
                  ? "bg-primary text-white shadow-md"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${type.color}`} />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database className="text-primary" size={24} />
          Documents ({documents.length})
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size={40} className="animate-spin text-primary mb-4" />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={64} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
            <p className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              No documents found
            </p>
            <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              {selectedType === "all"
                ? "Upload your first PDF document to get started"
                : `No documents for ${selectedType} chatbot`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className={`border-2 rounded-xl p-5 transition-all hover:shadow-md ${
                  isDarkMode
                    ? "border-gray-700 hover:border-primary bg-gray-750"
                    : "border-gray-200 hover:border-primary bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText size={20} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{doc.fileName}</h3>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className={`flex items-center gap-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        <div className={`w-2 h-2 rounded-full ${chatbotTypes.find(t => t.value === doc.chatbotType)?.color || "bg-gray-500"}`} />
                        <span className="font-medium">
                          {chatbotTypes.find(t => t.value === doc.chatbotType)?.label || doc.chatbotType}
                        </span>
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        <span className="font-medium">Size:</span> {formatFileSize(doc.fileSize)}
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        <span className="font-medium">Chunks:</span> {doc.chunkCount}
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        <span className="font-medium">Uploaded:</span>{" "}
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Description */}
                    {doc.description && (
                      <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {doc.description}
                      </p>
                    )}

                    {/* Error Message */}
                    {doc.errorMessage && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{doc.errorMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(doc._id, doc.fileName)}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Delete document"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseAdmin;
