"use client";

import { useState, useEffect } from "react";
import { useSidebar } from "@/lib/SidebarContext";
import {
  MessageSquare,
  User,
  Bot,
  Calendar,
  Filter,
  Search,
  Trash2,
  Eye,
  Download,
  Loader,
  Clock,
  FileText,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Message {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  sources?: string[];
}

interface Conversation {
  _id: string;
  sessionId: string;
  chatbotType: string;
  messages: Message[];
  startedAt: string;
  lastMessageAt: string;
}

export default function Conversations() {
  const { isDarkMode } = useSidebar();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [selectedType]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const url =
        selectedType === "all"
          ? `${API_BASE_URL}/api/chatbot/conversations?limit=100`
          : `${API_BASE_URL}/api/chatbot/conversations?chatbotType=${selectedType}&limit=100`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/chatbot/conversation/${sessionId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        alert("Conversation deleted successfully");
        fetchConversations();
        if (selectedConversation?.sessionId === sessionId) {
          setSelectedConversation(null);
          setShowModal(false);
        }
      } else {
        alert(`Delete failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation");
    }
  };

  const exportConversation = (conversation: Conversation) => {
    const content = `
Conversation Export
===================
Session ID: ${conversation.sessionId}
Type: ${conversation.chatbotType}
Started: ${new Date(conversation.startedAt).toLocaleString()}
Last Message: ${new Date(conversation.lastMessageAt).toLocaleString()}
Total Messages: ${conversation.messages.length}

Messages:
---------
${conversation.messages
  .map(
    (msg, idx) => `
[${idx + 1}] ${msg.sender.toUpperCase()} - ${new Date(msg.timestamp).toLocaleString()}
${msg.text}
${msg.sources && msg.sources.length > 0 ? `Sources: ${msg.sources.join(", ")}` : ""}
`
  )
  .join("\n---\n")}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${conversation.sessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (searchQuery.trim() === "") return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.sessionId.toLowerCase().includes(query) ||
      conv.chatbotType.toLowerCase().includes(query) ||
      conv.messages.some((msg) => msg.text.toLowerCase().includes(query))
    );
  });

  const chatbotTypes = [
    { value: "all", label: "All Types" },
    { value: "general", label: "General" },
    { value: "urogynaecology", label: "Urogynaecology" },
    { value: "aesthetic", label: "Aesthetic" },
    { value: "menopause", label: "Menopause" },
  ];

  return (
    <>
      {/* Header */}
      <div className={`border-b px-8 py-6 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}>
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Conversation History</h1>
            <p className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              View and manage all chatbot conversations
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-6">
        {/* Filters */}
        <div className={`rounded-xl shadow-sm p-4 mb-6 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-100"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300"
                }`}
              >
                {chatbotTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`rounded-lg shadow-sm p-4 border-l-4 border-blue-500 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{filteredConversations.length}</p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Total Conversations
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg shadow-sm p-4 border-l-4 border-green-500 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredConversations.reduce(
                    (acc, conv) => acc + conv.messages.filter((m) => m.sender === "user").length,
                    0
                  )}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  User Messages
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg shadow-sm p-4 border-l-4 border-purple-500 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredConversations.reduce(
                    (acc, conv) => acc + conv.messages.filter((m) => m.sender === "ai").length,
                    0
                  )}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  AI Responses
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className={`rounded-xl shadow-sm p-6 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${
                isDarkMode ? "text-gray-600" : "text-gray-300"
              }`} />
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                No conversations found
              </p>
              <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Conversations will appear here once users interact with the chatbot"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isDarkMode
                      ? "border-gray-700 hover:border-primary"
                      : "border-gray-200 hover:border-primary"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">
                          Session: {conversation.sessionId.slice(0, 20)}...
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {conversation.chatbotType}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                            {new Date(conversation.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                            {new Date(conversation.lastMessageAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                            {conversation.messages.filter((m) => m.sender === "user").length} user
                            msgs
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-gray-400" />
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                            {conversation.messages.filter((m) => m.sender === "ai").length} AI
                            responses
                          </span>
                        </div>
                      </div>

                      {/* First User Message Preview */}
                      {conversation.messages.find((m) => m.sender === "user") && (
                        <p className={`text-sm italic line-clamp-2 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}>
                          "{conversation.messages.find((m) => m.sender === "user")?.text}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedConversation(conversation);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View conversation"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => exportConversation(conversation)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Export conversation"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(conversation.sessionId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversation Detail Modal */}
      {showModal && selectedConversation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-bold">Conversation Details</h3>
                    <p className="text-sm opacity-90">
                      Session: {selectedConversation.sessionId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedConversation(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="px-3 py-1 bg-white/20 rounded-full">
                  {selectedConversation.chatbotType}
                </span>
                <span>Started: {new Date(selectedConversation.startedAt).toLocaleString()}</span>
                <span>{selectedConversation.messages.length} messages</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {selectedConversation.messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.sender === "user"
                        ? "bg-primary text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    {message.sender === "ai" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-secondary" />
                        <span className="text-xs font-semibold text-secondary">
                          AI Assistant
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <FileText className="w-3 h-3" />
                          <span>Sources: {message.sources.join(", ")}</span>
                        </div>
                      </div>
                    )}
                    <span
                      className={`text-xs mt-2 block ${
                        message.sender === "user" ? "text-white/70" : "text-gray-400"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => exportConversation(selectedConversation)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedConversation(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
