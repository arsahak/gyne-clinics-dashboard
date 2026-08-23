"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Loader,
  Database,
} from "lucide-react";

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
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
      alert("Failed to fetch documents");
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

  // Handle file upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatbotType", uploadType);
      formData.append("description", description);

      const response = await fetch(`${API_BASE_URL}/api/knowledge-base/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert("File uploaded successfully! Processing in background...");
        setFile(null);
        setDescription("");
        fetchDocuments();
      } else {
        alert(`Upload failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Handle file deletion
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/knowledge-base/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Document deleted successfully");
        fetchDocuments();
      } else {
        alert(`Delete failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document");
    }
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
      pending: { icon: Clock, color: "text-yellow-600 bg-yellow-100", label: "Pending" },
      processing: { icon: Loader, color: "text-blue-600 bg-blue-100", label: "Processing" },
      completed: { icon: CheckCircle, color: "text-green-600 bg-green-100", label: "Completed" },
      failed: { icon: XCircle, color: "text-red-600 bg-red-100", label: "Failed" },
    };

    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}
      >
        <Icon size={14} className={status === "processing" ? "animate-spin" : ""} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 px-6 pt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Knowledge Base Management
          </h1>
          <p className="text-gray-600">
            Upload and manage PDF documents for the AI chatbot to learn from
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 mx-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload size={24} />
            Upload New Document
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chatbot Type *
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="general">General Gynaecology</option>
                  <option value="urogynaecology">Urogynaecology</option>
                  <option value="aesthetic">Aesthetic Gynaecology</option>
                  <option value="menopause">Menopause</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF File *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the document content..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload Document
                </>
              )}
            </button>
          </form>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 mx-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by type:</label>
            <div className="flex gap-2">
              {["all", "general", "urogynaecology", "aesthetic", "menopause"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    selectedType === type
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-sm p-6 mx-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database size={24} />
            Knowledge Base Documents ({documents.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={32} className="animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText size={20} className="text-primary" />
                        <h3 className="font-semibold text-gray-900">{doc.fileName}</h3>
                        <StatusBadge status={doc.status} />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                        <div>
                          <span className="font-medium">Type:</span>{" "}
                          {doc.chatbotType.charAt(0).toUpperCase() + doc.chatbotType.slice(1)}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span> {formatFileSize(doc.fileSize)}
                        </div>
                        <div>
                          <span className="font-medium">Chunks:</span> {doc.chunkCount}
                        </div>
                        <div>
                          <span className="font-medium">Uploaded:</span>{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>

                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                      )}

                      {doc.errorMessage && (
                        <p className="text-sm text-red-600 mb-2">Error: {doc.errorMessage}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseAdmin;
