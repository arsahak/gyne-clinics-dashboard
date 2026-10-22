import { getMyAccount } from "@/app/actions/account";
import { getPermissions } from "@/app/actions/teamAction";
import { auth } from "@/auth";
import MyProfile from "@/component/profile/MyProfile";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Profile – GyneClinics Admin" };

/** /profile — your own account, view only. */
export default async function ProfilePage() {
  const [session, result, permissions] = await Promise.all([auth(), getMyAccount(), getPermissions()]);
  // If the backend call fails, show what the session already knows.
  const account = result.data ?? {
    fullName: session?.user?.name || "You",
    email: session?.user?.email || undefined,
    emailVerified: Boolean(session?.user?.isEmailVerified),
    phoneVerified: false,
    role: session?.user?.role || "",
    avatar: session?.user?.avatar || undefined,
  };
  return <MyProfile account={account} error={result.success ? undefined : result.error} areas={permissions.data?.areas} mine={permissions.data?.mine} />;
}
