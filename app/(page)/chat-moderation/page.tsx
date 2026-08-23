import { getReportedChats, ReportedChat } from "@/app/actions/chatModeration";
import ChatModeration from "@/component/chatModeration/ChatModeration";

export const dynamic = "force-dynamic";

const ChatModerationPage = async () => {
  const response = await getReportedChats();
  const initialReports = (response.success && response.data ? response.data : []) as ReportedChat[];

  return <ChatModeration initialReports={initialReports} />;
};

export default ChatModerationPage;
