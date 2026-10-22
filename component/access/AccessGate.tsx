import { accessTo, type AreaKey } from "@/lib/access";
import { NoAccess, ViewOnlyNote } from "./AccessNotes";

export const AREA_LABEL: Record<AreaKey, string> = {
  patients: "Patients",
  doctors: "Doctors",
  consultations: "Consultations",
  reviews: "Doctor reviews",
  reports: "Reports",
  chat_moderation: "Chat moderation",
  chat_monitoring: "Chat monitoring",
  payments: "Payments",
  payouts: "Payouts",
  content: "Learn articles",
  stories: "Community stories",
  ads: "Advertisements",
  notifications: "Notifications",
  chatbot: "the AI chatbot",
  analytics: "Analytics",
  fees: "Fees & settings",
  team: "Team & Roles",
};

/**
 * Wraps a dashboard section (in its layout.tsx): no access → a lock screen;
 * view only → a note above the page. `need="manage"` is for add/edit pages.
 * The backend enforces the same rules on every call.
 */
export default async function AccessGate({ area, need = "view", note = true, children }: { area: AreaKey; need?: "view" | "manage"; note?: boolean; children: React.ReactNode }) {
  const level = await accessTo(area);
  const label = AREA_LABEL[area];
  if (level === "none" || (need === "manage" && level !== "manage")) return <NoAccess area={label} needManage={level === "view"} />;
  return (
    <>
      {note && level === "view" && need === "view" && <ViewOnlyNote area={label} />}
      {children}
    </>
  );
}
