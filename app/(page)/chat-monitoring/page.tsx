import { ChatMetadataRecord, getChatsMetadata } from "@/app/actions/chatMonitoring";
import DoctorChatOverview from "@/component/chatMonitoring/DoctorChatOverview";

export const dynamic = "force-dynamic";

const ChatMonitoringPage = async () => {
  const response = await getChatsMetadata();
  const chats = (response.success && response.data ? response.data : []) as ChatMetadataRecord[];

  return <DoctorChatOverview chats={chats} />;
};

export default ChatMonitoringPage;
