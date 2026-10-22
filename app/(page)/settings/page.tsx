import { getPermissions, getTeam } from "@/app/actions/teamAction";
import TeamList from "@/component/teamManagement/TeamList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team & Roles – GyneClinics Admin" };

/** /settings — the dashboard team and what each role can open, from the backend. loading.tsx shows a skeleton meanwhile. */
export default async function TeamPage() {
  const [team, permissions] = await Promise.all([getTeam(), getPermissions()]);
  return (
    <TeamList
      initialMembers={team.data?.members ?? []}
      initialManageable={team.data?.manageableRoles ?? []}
      initialPermissions={permissions.data ?? null}
      teamError={team.success ? undefined : team.error}
      now={new Date().toISOString()}
    />
  );
}
