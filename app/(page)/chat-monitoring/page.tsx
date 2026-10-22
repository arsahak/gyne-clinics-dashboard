import { getChatForStaff, getChatsPage } from "@/app/actions/chatMonitoringAction";
import ChatMonitor from "@/component/chatMonitoring/ChatMonitor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chat Monitoring – GyneClinics Admin" };

/** /chat-monitoring?chat=… — real patient–doctor chats, read only. loading.tsx shows a skeleton meanwhile. */
export default async function ChatMonitoringPage({ searchParams }: { searchParams: Promise<{ chat?: string }> }) {
  const { chat } = await searchParams;
  const [initial, initialChat] = await Promise.all([getChatsPage({ page: 1, limit: 20 }), chat ? getChatForStaff(chat) : Promise.resolve(undefined)]);
  return <ChatMonitor initial={initial} initialChat={initialChat} initialChatId={chat} now={new Date().toISOString()} />;
}
