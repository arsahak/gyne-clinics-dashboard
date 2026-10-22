import { getOverview } from "@/app/actions/dashboardAction";
import { auth } from "@/auth";
import DashboardOverview from "@/component/dashboard/DashboardOverview";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard – GyneClinics Admin",
};

/** / — the admin home, all live from GET /dashboard/overview (only the parts this role can see). loading.tsx shows a skeleton meanwhile. */
export default async function DashboardPage() {
  const [session, overview] = await Promise.all([auth(), getOverview()]);
  return <DashboardOverview initial={overview.data ?? null} error={overview.success ? undefined : overview.error} name={session?.user?.name ?? undefined} />;
}
