import { getConsultationsPage } from "@/app/actions/consultationAction";
import ConsultationList from "@/component/consultationManagement/ConsultationList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Consultations – GyneClinics Admin" };

/** /consultations — every booking, read from the backend. loading.tsx shows a skeleton meanwhile. */
export default async function ConsultationsPage() {
  const initial = await getConsultationsPage({ page: 1, limit: 10 });
  return <ConsultationList initial={initial} now={new Date().toISOString()} />;
}
