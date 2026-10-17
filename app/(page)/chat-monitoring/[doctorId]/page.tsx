import { ChatMetadataRecord, getChatsMetadata } from "@/app/actions/chatMonitoring";
import DoctorPatientChats from "@/component/chatMonitoring/DoctorPatientChats";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DoctorChatsPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = await params;

  const response = await getChatsMetadata();
  const chats = (response.success && response.data ? response.data : []) as ChatMetadataRecord[];
  const doctorChats = chats.filter((c) => c.doctor?._id === doctorId);

  if (doctorChats.length === 0) redirect("/chat-monitoring");

  return <DoctorPatientChats doctorName={doctorChats[0]?.doctor?.name} chats={doctorChats} />;
}
