"use client";
import { ChatMessageRecord, getChatMessagesForAdmin } from "@/app/actions/chatModeration";
import { ChatMetadataRecord } from "@/app/actions/chatMonitoring";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaCommentDots,
  FaExclamationTriangle,
  FaFlag,
  FaMoneyBillWave,
  FaSearch,
} from "react-icons/fa";

const REGION_LABELS: Record<string, string> = {
  south_asia: "South Asia",
  east_southeast_asia: "East & SE Asia",
  middle_east: "Middle East",
  africa: "Africa",
  europe: "Europe",
  north_america: "North America",
  south_america: "South America",
  oceania: "Oceania",
};

interface DoctorPatientChatsProps {
  doctorName?: string;
  chats: ChatMetadataRecord[];
}

const initial = (name?: string) => (name?.trim()?.[0]?.toUpperCase() ?? "?");

const formatListTime = (iso?: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const formatBubbleTime = formatListTime;

const DoctorPatientChats = ({ doctorName, chats }: DoctorPatientChatsProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const filtered = useMemo(() => {
    let list = chats;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) => c.patient?.name?.toLowerCase().includes(q) || c.lastMessagePreview?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const at = new Date(a.lastMessageAt || a.createdAt).getTime();
      const bt = new Date(b.lastMessageAt || b.createdAt).getTime();
      return newestFirst ? bt - at : at - bt;
    });
  }, [chats, search, newestFirst]);

  const selected = filtered.find((c) => c._id === selectedId) ?? null;

  const selectChat = async (chat: ChatMetadataRecord) => {
    setSelectedId(chat._id);
    setLoadingMessages(true);
    const res = await getChatMessagesForAdmin(chat._id);
    setLoadingMessages(false);
    setMessages(res.success && res.data ? res.data : []);
  };

  // Auto-select the most recent conversation once, on initial load.
  useEffect(() => {
    if (!selectedId && filtered.length > 0) void selectChat(filtered[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const border = isDarkMode ? "border-gray-700" : "border-gray-200";
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const panelBg = isDarkMode ? "bg-gray-800" : "bg-white";

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className={`px-6 py-4 border-b flex items-center gap-3 ${border}`}>
        <button
          onClick={() => router.push("/chat-monitoring")}
          title="Back to Doctors"
          className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
        >
          <FaArrowLeft size={14} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Dr. {doctorName || "Unnamed"}</h1>
          <p className={`text-xs ${muted}`}>{chats.length} patient{chats.length === 1 ? "" : "s"} chatting with this doctor</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: this doctor's patients */}
        <div className={`w-80 flex-shrink-0 border-r flex flex-col ${border} ${panelBg}`}>
          <div className={`px-4 py-3 border-b ${border}`}>
            <div className="relative">
              <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} size={13} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patients"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
                }`}
              />
            </div>
          </div>

          <div className={`px-4 py-2 border-b flex items-center justify-between text-xs ${border} ${muted}`}>
            <span>Sort by</span>
            <button onClick={() => setNewestFirst((v) => !v)} className={isDarkMode ? "text-gray-200" : "text-gray-700"}>
              {newestFirst ? "Newest" : "Oldest"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <FaCommentDots className={`mx-auto text-3xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                <p className={`text-sm ${muted}`}>No conversations found</p>
              </div>
            ) : (
              filtered.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => selectChat(chat)}
                  className={`w-full text-left px-4 py-3 border-b flex gap-3 ${border} ${
                    selected?._id === chat._id
                      ? isDarkMode ? "bg-gray-700" : "bg-blue-50"
                      : isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"}`}>
                    {initial(chat.patient?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{chat.patient?.name || "Patient"}</span>
                      {chat.reported && <FaFlag className="text-red-500 flex-shrink-0" size={11} title="Reported" />}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`text-xs truncate ${muted}`}>{chat.lastMessagePreview || "No messages yet"}</span>
                      <span className={`text-[10px] flex-shrink-0 ${muted}`}>{formatListTime(chat.lastMessageAt || chat.createdAt)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: selected conversation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FaCommentDots className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                <p className={muted}>Select a patient to view the conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className={`px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3 ${border} ${panelBg}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"}`}>
                    {initial(selected.patient?.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{selected.patient?.name || "Patient"}</div>
                    <div className={`text-xs ${muted}`}>{selected.messageCount} message{selected.messageCount === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selected.paid ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full ${isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"}`}>
                      <FaMoneyBillWave /> {selected.fee ? `£${selected.fee}` : "Free"}
                      {selected.region && ` · ${REGION_LABELS[selected.region] || selected.region}`}
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 text-xs rounded-full ${isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}>Unpaid</span>
                  )}
                  {selected.reported && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full ${isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"}`}>
                      <FaFlag /> Reported
                    </span>
                  )}
                  {selected.flaggedCount > 0 && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full ${isDarkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800"}`}>
                      <FaExclamationTriangle /> {selected.flaggedCount} flagged
                    </span>
                  )}
                </div>
              </div>

              <div className={`flex-1 overflow-y-auto px-6 py-5 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                {loadingMessages ? (
                  <p className={`text-center text-sm ${muted}`}>Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className={`text-center text-sm ${muted}`}>No messages in this conversation yet</p>
                ) : (
                  <div className="space-y-5">
                    {messages.map((msg) => {
                      const isPatient = msg.senderRole === "patient";
                      return (
                        <div key={msg._id} className={`flex flex-col ${isPatient ? "items-end" : "items-start"}`}>
                          {isPatient && <span className={`text-xs mb-1 ${muted}`}>{formatBubbleTime(msg.createdAt)}</span>}
                          <div
                            className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                              isPatient
                                ? isDarkMode ? "bg-gray-100 text-gray-900" : "bg-gray-900 text-white"
                                : isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
                            } ${msg.flaggedForModeration ? "ring-2 ring-yellow-400" : ""}`}
                          >
                            {msg.text}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {!isPatient && (
                              <>
                                <span className={`text-xs ${muted}`}>{formatBubbleTime(msg.createdAt)}</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                                  Doctor
                                </span>
                              </>
                            )}
                            {msg.wasRedacted && <span className="text-[10px] text-yellow-600">🔒 Redacted</span>}
                            {msg.flaggedForModeration && (
                              <span className="text-[10px] text-red-500 flex items-center gap-1">
                                <FaExclamationTriangle size={9} /> Flagged
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={`px-6 py-3 border-t text-center text-xs ${border} ${muted} ${panelBg}`}>
                Admin view only — messages cannot be sent from the dashboard
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientChats;
