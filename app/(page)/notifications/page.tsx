import { getNotifications, NotificationRecord } from "@/app/actions/notificationManagement";
import NotificationManagement from "@/component/notificationManagement/NotificationManagement";

export const dynamic = "force-dynamic";

const NotificationsPage = async () => {
  const response = await getNotifications();
  const initialNotifications = (response.success && response.data ? response.data : []) as NotificationRecord[];

  return <NotificationManagement initialNotifications={initialNotifications} />;
};

export default NotificationsPage;
