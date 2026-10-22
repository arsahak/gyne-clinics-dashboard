import { getReportsPage } from "@/app/actions/reportAction";
import ReportList from "@/component/reportManagement/ReportList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports – GyneClinics Admin" };

/** /reports — reports from patients and doctors, read from the backend. loading.tsx shows a skeleton meanwhile. */
export default async function ReportsPage() {
  const initial = await getReportsPage({ status: "todo", page: 1, limit: 10 });
  return <ReportList initial={initial} now={new Date().toISOString()} />;
}
