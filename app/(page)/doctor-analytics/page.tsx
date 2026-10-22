import AnalyticsDashboard from "@/component/analytics/AnalyticsDashboard";
import { sampleAnalytics } from "@/lib/sample/analytics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics – GyneClinics Admin" };

/** /doctor-analytics — growth, booking funnel, regions and doctor performance (sample data for now). */
export default function AnalyticsPage() {
  return <AnalyticsDashboard data={sampleAnalytics(new Date())} />;
}
