import { getAnnouncementsPage, getAudience, getAutoMessages } from "@/app/actions/notificationAction";
import NotificationCenter from "@/component/notificationManagement/NotificationCenter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications – GyneClinics Admin" };

// Twilio rejected the business profile, so SMS only reaches test numbers for now.
const SMS_PAUSED = true;

/** /notifications — announcements and automatic messages, from the backend. loading.tsx shows a skeleton meanwhile. */
export default async function NotificationsPage() {
  const [initial, audience, auto] = await Promise.all([getAnnouncementsPage({ page: 1, limit: 8 }), getAudience(), getAutoMessages()]);
  return (
    <NotificationCenter
      initial={initial}
      audience={audience.data ?? null}
      autoMessages={auto.data ?? []}
      autoError={auto.success ? undefined : auto.error}
      smsPaused={SMS_PAUSED}
      now={new Date().toISOString()}
    />
  );
}
