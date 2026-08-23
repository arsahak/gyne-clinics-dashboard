import { DoctorReviewRecord, getDoctorReviews } from "@/app/actions/doctorReviewManagement";
import DoctorReviewManagement from "@/component/doctorReviewManagement/DoctorReviewManagement";

export const dynamic = "force-dynamic";

const DoctorReviewsPage = async () => {
  const response = await getDoctorReviews("all");
  const initialReviews = (response.success && response.data ? response.data : []) as DoctorReviewRecord[];

  return <DoctorReviewManagement initialReviews={initialReviews} initialStatus="all" />;
};

export default DoctorReviewsPage;
