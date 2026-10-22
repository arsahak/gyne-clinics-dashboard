import { getReviewsPage } from "@/app/actions/reviewAction";
import DoctorReviewList from "@/component/doctorReviewManagement/DoctorReviewList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Doctor Reviews – GyneClinics Admin" };

/** /doctor-reviews — patients' reviews of doctors, read from the backend. loading.tsx shows a skeleton meanwhile. */
export default async function DoctorReviewsPage() {
  const initial = await getReviewsPage({ page: 1, limit: 10 });
  return <DoctorReviewList initial={initial} />;
}
