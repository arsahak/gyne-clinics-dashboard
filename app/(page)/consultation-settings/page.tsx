import ConsultationRules from "@/component/consultationSettings/ConsultationRules";
import { CURRENT_RULES } from "@/lib/sample/consultationRules";

export const metadata = { title: "Consultation Rules – GyneClinics Admin" };

/** /consultation-settings — timing, booking, prices, video and chat safety rules. */
export default function ConsultationSettingsPage() {
  return <ConsultationRules initialRules={CURRENT_RULES} />;
}
