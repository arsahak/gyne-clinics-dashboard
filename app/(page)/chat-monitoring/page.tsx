import { ChatMetadataRecord, getChatsMetadata } from "@/app/actions/chatMonitoring";
import ChatMonitoring from "@/component/chatMonitoring/ChatMonitoring";

export const dynamic = "force-dynamic";

const ChatMonitoringPage = async () => {
  const response = await getChatsMetadata();
  const chats = (response.success && response.data ? response.data : []) as ChatMetadataRecord[];

  return <ChatMonitoring chats={chats} />;
};

export default ChatMonitoringPage;
