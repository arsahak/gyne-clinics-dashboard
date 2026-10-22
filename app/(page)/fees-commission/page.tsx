import { getFeeSettings } from "@/app/actions/feesAction";
import { accessTo } from "@/lib/access";
import FeesCommissionSettings from "@/component/financeManagement/FeesCommissionSettings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fees & Commission – GyneClinics Admin" };

/** /fees-commission — commission, clearance and withdrawal rules, from the backend. */
export default async function FeesCommissionPage() {
  const [fees, payouts, settings] = await Promise.all([accessTo("fees"), accessTo("payouts"), getFeeSettings()]);
  if (!settings.success || !settings.data) {
    return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{settings.error || "Couldn't load the fee settings."}</p>;
  }
  return <FeesCommissionSettings initial={settings.data} canEdit={fees === "manage"} canPay={payouts === "manage"} />;
}
