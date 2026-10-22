import { auth } from "@/auth";
import { cache } from "react";

// What the signed-in staff member can open, from GET /api/v1/users/permissions.
// Read once per request. The backend checks every call too; this only shapes the UI.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type AccessLevel = "none" | "view" | "manage";
export type AreaKey =
  | "patients"
  | "doctors"
  | "consultations"
  | "reviews"
  | "reports"
  | "chat_moderation"
  | "chat_monitoring"
  | "payments"
  | "payouts"
  | "content"
  | "stories"
  | "ads"
  | "notifications"
  | "chatbot"
  | "analytics"
  | "fees"
  | "team";

export interface MyAccess {
  role: string;
  /** Area → level. Empty if it couldn't be loaded. */
  mine: Partial<Record<AreaKey, AccessLevel>>;
  /** False when the backend couldn't be reached: the UI then shows everything and the backend decides. */
  loaded: boolean;
}

export const getMyAccess = cache(async (): Promise<MyAccess> => {
  const session = await auth();
  const role = session?.user?.role ?? "";
  const token = session?.accessToken;
  if (!token) return { role, mine: {}, loaded: false };
  try {
    const response = await fetch(`${API_URL}/api/v1/users/permissions`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) return { role, mine: {}, loaded: false };
    const body = await response.json();
    return { role: body.data.myRole ?? role, mine: body.data.mine ?? {}, loaded: true };
  } catch {
    return { role, mine: {}, loaded: false };
  }
});

/** The signed-in user's level for one area ("manage" when unknown, so the backend decides). */
export async function accessTo(area: AreaKey): Promise<AccessLevel> {
  const access = await getMyAccess();
  return access.loaded ? (access.mine[area] ?? "none") : "manage";
}
