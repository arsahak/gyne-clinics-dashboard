"use client";
import { ChatMessageRecord, getChatMessagesForAdmin, ReportedChat } from "@/app/actions/chatModeration";
import { useSidebar } from "@/lib/SidebarContext";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaCommentDots, FaExclamationTriangle } from "react-icons/fa";

interface ChatModerationProps {
  initialReports: ReportedChat[];
}

const ChatModeration = ({ initialReports }: ChatModerationProps) => {
  const { isDarkMode } = useSidebar();
  const [reports] = useState<ReportedChat[]>(initialReports);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const inputClass = isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";

  const viewConversation = async (chatId: string | undefined) => {
    if (!chatId) { toast.error("This report has no associated conversation"); return; }
    setOpenChatId(chatId);
    setLoadingMessages(true);
    const response = await getChatMessagesForAdmin(chatId);
    setLoadingMessages(false);
    if (response.success && response.data) setMessages(response.data);
    else toast.error(response.error || "Failed to load conversation");
  };

  return (
    <div className={`${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Chat Moderation</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Review reported conversations between patients and doctors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports list */}
        <div className={`rounded-lg shadow-sm border overflow-hidden ${inputClass}`}>
          {reports.length === 0 ? (
            <div className="p-12 text-center">
              <FaCommentDots className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
              <p className="text-gray-500">No reported conversations</p>
            </div>
          ) : (
            <div className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {reports.map((report) => (
                <button
                  key={report._id}
                  onClick={() => viewConversation(report.chat?._id)}
                  className={`w-full text-left p-4 transition-colors ${
                    openChatId === report.chat?._id
                      ? isDarkMode ? "bg-gray-700" : "bg-blue-50"
                      : isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FaExclamationTriangle className="text-yellow-500 flex-shrink-0" />
                    <span className="font-medium">
                      {report.reporter?.name || "Unknown"} reported {report.reportedUser?.name || "Unknown"}
                    </span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{report.reason}</p>
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {new Date(report.createdAt).toLocaleString()} · {report.status}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation viewer */}
        <div className={`rounded-lg shadow-sm border p-4 ${inputClass}`}>
          <h2 className="text-lg font-semibold mb-4">Conversation</h2>
          {!openChatId ? (
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Select a report to view the conversation.</p>
          ) : loadingMessages ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`p-3 rounded-lg ${
                    msg.senderRole === "doctor"
                      ? isDarkMode ? "bg-blue-950 ml-8" : "bg-blue-50 ml-8"
                      : isDarkMode ? "bg-gray-700 mr-8" : "bg-gray-100 mr-8"
                  }`}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold capitalize">{msg.senderRole}</span>
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.text}</p>
                  {msg.wasRedacted && (
                    <p className="text-xs mt-1 text-yellow-600">
                      🔒 Redacted: {msg.redactedTypes.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModeration;
