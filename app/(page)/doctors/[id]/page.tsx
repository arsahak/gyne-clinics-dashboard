import { ChatMetadataRecord, getChatsMetadata } from "@/app/actions/chatMonitoring";
import { AppointmentRecord, DoctorRecord, getDoctorAppointments, getDoctors } from "@/app/actions/doctorManagement";
import { getNotifications, NotificationRecord } from "@/app/actions/notificationManagement";
import DoctorDetailsPage from "@/component/doctorManagement/DoctorDetailsPage";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DoctorDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [doctorsRes, appointmentsRes, chatsRes, notificationsRes] = await Promise.all([
    getDoctors("all"),
    getDoctorAppointments(),
    getChatsMetadata(),
    getNotifications(),
  ]);

  const doctors = (doctorsRes.success && doctorsRes.data ? doctorsRes.data : []) as DoctorRecord[];
  const doctor = doctors.find((d) => d._id === id);
  if (!doctor) redirect("/doctors");

  const appointments = (appointmentsRes.success && appointmentsRes.data ? appointmentsRes.data : []) as AppointmentRecord[];
  const chats = (chatsRes.success && chatsRes.data ? chatsRes.data : []) as ChatMetadataRecord[];
  const notifications = (notificationsRes.success && notificationsRes.data ? notificationsRes.data : []) as NotificationRecord[];

  return (
    <DoctorDetailsPage
      doctor={doctor}
      appointments={appointments.filter((a) => a.doctor?._id === doctor.user._id)}
      chats={chats.filter((c) => c.doctor?._id === doctor.user._id)}
      sentNotifications={notifications.filter((n) => n.recipient === doctor.user._id)}
    />
  );
}
