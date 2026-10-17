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
  X,
  AlertCircle,
  FileCheck,
  Brain,
  Zap,
  TrendingUp,
  Layers,
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
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
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
    if (!confirm(`Delete "${fileName}"?`)) return;

    const deleteToast = toast.loading("Deleting...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/knowledge-base/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Deleted successfully", { id: deleteToast });
        fetchDocuments();
      } else {
        toast.error(`Failed: ${data.message}`, { id: deleteToast });
      }
    } catch (error) {
      toast.error("Failed to delete", { id: deleteToast });
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

  // Get stats
  const stats = {
    total: documents.length,
    completed: documents.filter(d => d.status === "completed").length,
    processing: documents.filter(d => d.status === "processing").length,
    failed: documents.filter(d => d.status === "failed").length,
    totalChunks: documents.reduce((sum, d) => sum + d.chunkCount, 0),
  };

  const chatbotTypes = [
    { value: "general", label: "General", icon: "🏥", gradient: "from-blue-500 to-blue-600" },
    { value: "urogynaecology", label: "Urogynae", icon: "💧", gradient: "from-purple-500 to-purple-600" },
    { value: "aesthetic", label: "Aesthetic", icon: "✨", gradient: "from-pink-500 to-pink-600" },
    { value: "menopause", label: "Menopause", icon: "🌸", gradient: "from-orange-500 to-orange-600" },
  ];

  const getTypeConfig = (type: string) => chatbotTypes.find(t => t.value === type) || chatbotTypes[0];

  return (
    <div className={`${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Knowledge Base
          </h1>
        </div>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Train your AI with medical documents and research papers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-xl p-5 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Documents</p>
              <p className={`text-3xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-5 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Completed</p>
              <p className={`text-3xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-5 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Processing</p>
              <p className={`text-3xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{stats.processing}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-5 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Chunks</p>
              <p className={`text-3xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{stats.totalChunks}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Layers className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <div className={`rounded-xl p-6 h-full ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm"}`}>
            <div className="flex items-center gap-2 mb-6">
              <Upload className="w-5 h-5 text-primary" />
              <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Upload Document
              </h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Chatbot Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {chatbotTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setUploadType(type.value)}
                      disabled={uploading}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        uploadType === type.value
                          ? "border-primary bg-primary/10"
                          : isDarkMode
                          ? "border-gray-700 hover:border-gray-600"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className={`text-xs font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Step 1: Select PDF File
                </label>
                {!file ? (
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all hover:scale-[1.02] ${
                    isDarkMode
                      ? "border-gray-700 hover:border-primary bg-gray-750 hover:bg-gray-700"
                      : "border-gray-300 hover:border-primary bg-gray-50 hover:bg-blue-50"
                  }`}>
                    <div className="p-3 bg-primary/10 rounded-full mb-3">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <span className={`text-sm font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Click to select PDF
                    </span>
                    <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                      Max 10MB • PDF only
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                      required
                    />
                  </label>
                ) : (
                  <div className="space-y-2">
                    <div className={`border-2 rounded-lg p-4 ${
                      isDarkMode 
                        ? "border-green-600 bg-green-900/20" 
                        : "border-green-400 bg-green-50"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                          <FileCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                            {file.name}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {formatFileSize(file.size)} • Ready to upload
                          </p>
                        </div>
                        {!uploading && (
                          <button
                            type="button"
                            onClick={clearFile}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Remove file"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs flex items-center gap-1 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                      <CheckCircle className="w-3 h-3" />
                      File selected! Click "Upload & Train" button below to continue.
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Step 2: Add Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., General gynecology guidelines, Patient consultation procedures..."
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
                      : "bg-white border-gray-300 placeholder-gray-400"
                  }`}
                  rows={3}
                  disabled={uploading || !file}
                />
              </div>

              {/* Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Processing...</span>
                    <span className="text-primary font-semibold">{uploadProgress}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !file}
                className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-md ${
                  !file
                    ? isDarkMode
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed border-2 border-gray-300"
                    : uploading
                    ? "bg-blue-600 text-white"
                    : isDarkMode
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Uploading {uploadProgress}%</span>
                  </>
                ) : !file ? (
                  <>
                    <Upload className="w-5 h-5 opacity-50" />
                    <span>Select a PDF file first</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Upload & Train AI Now</span>
                  </>
                )}
              </button>
              
              {file && !uploading && (
                <div className={`text-center space-y-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  <p className="text-xs">✓ Ready to process</p>
                  <p className="text-xs font-medium">Click button above to start training</p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <div className={`rounded-xl p-6 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm"}`}>
            {/* Filter */}
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Documents ({documents.length})
              </h2>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="all">All Types</option>
                {chatbotTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className={`w-16 h-16 mx-auto mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                  <p className={`font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No documents yet</p>
                  <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                    Upload your first PDF to train the AI
                  </p>
                </div>
              ) : (
                documents.map((doc) => {
                  const typeConfig = getTypeConfig(doc.chatbotType);
                  const statusConfig = {
                    pending: { color: "text-yellow-600 bg-yellow-100", icon: Clock },
                    processing: { color: "text-blue-600 bg-blue-100", icon: Loader },
                    completed: { color: "text-green-600 bg-green-100", icon: CheckCircle },
                    failed: { color: "text-red-600 bg-red-100", icon: XCircle },
                  }[doc.status];

                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={doc._id}
                      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                        isDarkMode
                          ? "border-gray-700 hover:border-primary bg-gray-750"
                          : "border-gray-200 hover:border-primary"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 bg-gradient-to-br ${typeConfig.gradient} rounded-lg flex-shrink-0`}>
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className={`font-semibold text-sm truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {doc.fileName}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0 ${statusConfig.color}`}>
                              <StatusIcon className={`w-3 h-3 ${doc.status === "processing" ? "animate-spin" : ""}`} />
                              {doc.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs mb-2">
                            <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                              {typeConfig.icon} {typeConfig.label}
                            </span>
                            <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                              📦 {doc.chunkCount} chunks
                            </span>
                            <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                              📏 {formatFileSize(doc.fileSize)}
                            </span>
                            <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                              📅 {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {doc.description && (
                            <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
                              {doc.description}
                            </p>
                          )}
                          {doc.errorMessage && (
                            <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                              <p className="text-xs text-red-700">{doc.errorMessage}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(doc._id, doc.fileName)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseAdmin;
