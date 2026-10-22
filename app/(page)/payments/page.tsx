import { getPaymentsPage } from "@/app/actions/paymentAction";
import { accessTo } from "@/lib/access";
import PaymentList from "@/component/financeManagement/PaymentList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payments – GyneClinics Admin" };

/** /payments — real payments (paid consultations). loading.tsx shows a skeleton meanwhile. */
export default async function PaymentsPage() {
  const [level, initial] = await Promise.all([accessTo("payments"), getPaymentsPage({ page: 1, limit: 10 })]);
  return <PaymentList initial={initial} now={new Date().toISOString()} canRefund={level === "manage"} />;
}
