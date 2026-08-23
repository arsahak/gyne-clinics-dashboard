"use client";
import { getNotifications, NotificationRecord, sendNotification } from "@/app/actions/notificationManagement";
import { useSidebar } from "@/lib/SidebarContext";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaBell, FaPaperPlane } from "react-icons/fa";

interface NotificationManagementProps {
  initialNotifications: NotificationRecord[];
}

const NotificationManagement = ({ initialNotifications }: NotificationManagementProps) => {
  const { isDarkMode } = useSidebar();
  const [notifications, setNotifications] = useState<NotificationRecord[]>(initialNotifications);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "patients" | "doctors">("all");
  const [sending, setSending] = useState(false);

  const inputClass = `w-full px-4 py-2 rounded-lg border ${
    isDarkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"
  } focus:outline-none focus:ring-2 focus:ring-blue-500`;

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { toast.error("Title and body are required"); return; }
    setSending(true);
    const response = await sendNotification(title.trim(), body.trim(), audience);
    setSending(false);

    if (!response.success) { toast.error(response.error || "Failed to send notification"); return; }

    toast.success("Notification sent");
    setTitle("");
    setBody("");
    const refreshed = await getNotifications();
    if (refreshed.success && refreshed.data) setNotifications(refreshed.data);
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Send announcements to patients and doctors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose form */}
        <div className={`lg:col-span-1 p-6 rounded-lg border h-fit ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h2 className="text-lg font-semibold mb-4">New Announcement</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. New Feature" />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} className={`${inputClass} h-28`} placeholder="Announcement details..." />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} className={inputClass}>
                <option value="all">Everyone</option>
                <option value="patients">Patients only</option>
                <option value="doctors">Doctors only</option>
              </select>
            </div>
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FaPaperPlane /> {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>

        {/* Sent history */}
        <div className={`lg:col-span-2 rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <FaBell className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
              <p className="text-gray-500">No notifications sent yet</p>
            </div>
          ) : (
            <div className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {notifications.map((n) => (
                <div key={n._id} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{n.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                      {n.audience}
                    </span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{n.body}</p>
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;
