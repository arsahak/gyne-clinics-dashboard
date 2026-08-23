"use client";
import { ChatMetadataRecord } from "@/app/actions/chatMonitoring";
import { useSidebar } from "@/lib/SidebarContext";
import { FaCommentDots, FaFlag, FaShieldAlt } from "react-icons/fa";

interface ChatMonitoringProps {
  chats: ChatMetadataRecord[];
}

const ChatMonitoring = ({ chats }: ChatMonitoringProps) => {
  const { isDarkMode } = useSidebar();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Chat Monitoring</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Oversight of patient–doctor conversations by metadata only — message content is never shown here
        </p>
      </div>

      <div className={`mb-6 flex items-start gap-3 p-4 rounded-lg border ${isDarkMode ? "bg-blue-950 border-blue-900 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
        <FaShieldAlt className="mt-0.5 flex-shrink-0" />
        <p className="text-sm">
          This view shows conversation activity (participants, message counts, timing) without exposing what was
          said. To review actual message content, a patient or doctor must first file a report — see Chat Moderation.
        </p>
      </div>

      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
          {chats.length === 0 ? (
            <div className="p-12 text-center">
              <FaCommentDots className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
              <p className="text-gray-500">No conversations yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Messages</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Flagged</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Reported</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {chats.map((chat) => (
                  <tr key={chat._id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{chat.patient?.name || "—"}</div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{chat.patient?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{chat.doctor?.name || "—"}</div>
                      <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{chat.doctor?.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{chat.messageCount}</td>
                    <td className="px-6 py-4 text-sm">
                      {chat.flaggedCount > 0 ? (
                        <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800"}`}>
                          {chat.flaggedCount} flagged
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(chat.lastMessageAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(chat.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {chat.reported ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"}`}>
                          <FaFlag /> Reported
                        </span>
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"}`}>
                          Clean
                        </span>
                      )}
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

export default ChatMonitoring;
