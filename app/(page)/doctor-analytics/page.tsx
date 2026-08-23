import { DoctorAnalytics, getDoctorAnalytics } from "@/app/actions/doctorAnalytics";
import DoctorAnalyticsDashboard from "@/component/doctorAnalytics/DoctorAnalyticsDashboard";

export const dynamic = "force-dynamic";

const DoctorAnalyticsPage = async () => {
  const response = await getDoctorAnalytics();
  const analytics = (response.success && response.data ? response.data : null) as DoctorAnalytics | null;

  return <DoctorAnalyticsDashboard analytics={analytics} />;
};

export default DoctorAnalyticsPage;
