import { getReports, ReportRecord } from "@/app/actions/reportManagement";
import ReportManagement from "@/component/reportManagement/ReportManagement";

export const dynamic = "force-dynamic";

const ReportsPage = async () => {
  const response = await getReports("pending");
  const initialReports = (response.success && response.data ? response.data : []) as ReportRecord[];

  return <ReportManagement initialReports={initialReports} initialStatus="pending" />;
};

export default ReportsPage;
