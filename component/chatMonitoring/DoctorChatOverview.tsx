"use client";
import { ChatMetadataRecord } from "@/app/actions/chatMonitoring";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { FaCommentDots, FaFlag, FaUserMd } from "react-icons/fa";

interface DoctorChatOverviewProps {
  chats: ChatMetadataRecord[];
}

const formatDate = (iso?: number) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const DoctorChatOverview = ({ chats }: DoctorChatOverviewProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();

  const doctorGroups = useMemo(() => {
    const map = new Map<string, { doctor: NonNullable<ChatMetadataRecord["doctor"]>; chats: ChatMetadataRecord[] }>();
    for (const c of chats) {
      if (!c.doctor?._id) continue;
      if (!map.has(c.doctor._id)) map.set(c.doctor._id, { doctor: c.doctor, chats: [] });
      map.get(c.doctor._id)!.chats.push(c);
    }
    return Array.from(map.values()).sort((a, b) => {
      const at = Math.max(...a.chats.map((c) => new Date(c.lastMessageAt || c.createdAt).getTime()));
      const bt = Math.max(...b.chats.map((c) => new Date(c.lastMessageAt || c.createdAt).getTime()));
      return bt - at;
    });
  }, [chats]);

  return (
    <div className={`${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Chat Monitoring</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Doctors with active conversations — click a doctor to see every patient chatting with them
        </p>
      </div>

      <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
          {doctorGroups.length === 0 ? (
            <div className="p-12 text-center">
              <FaUserMd className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
              <p className="text-gray-500">No conversations yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Patients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Messages</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Flagged</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Reported</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Activity</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {doctorGroups.map((group) => {
                  const messageCount = group.chats.reduce((sum, c) => sum + c.messageCount, 0);
                  const flaggedCount = group.chats.reduce((sum, c) => sum + c.flaggedCount, 0);
                  const reportedCount = group.chats.filter((c) => c.reported).length;
                  const lastActivity = Math.max(...group.chats.map((c) => new Date(c.lastMessageAt || c.createdAt).getTime()));
                  return (
                    <tr
                      key={group.doctor._id}
                      onClick={() => router.push(`/chat-monitoring/${group.doctor._id}`)}
                      className={`cursor-pointer ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">Dr. {group.doctor.name || "Unnamed"}</div>
                        <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{group.doctor.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <FaCommentDots className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                          {group.chats.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{messageCount}</td>
                      <td className="px-6 py-4 text-sm">
                        {flaggedCount > 0 ? (
                          <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800"}`}>
                            {flaggedCount} flagged
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {reportedCount > 0 ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"}`}>
                            <FaFlag /> {reportedCount}
                          </span>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"}`}>
                            Clean
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(lastActivity)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorChatOverview;
