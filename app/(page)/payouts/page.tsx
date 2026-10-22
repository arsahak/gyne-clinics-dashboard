import { getBalances, getWithdrawalsPage } from "@/app/actions/payoutAction";
import { accessTo } from "@/lib/access";
import PayoutList from "@/component/financeManagement/PayoutList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payouts – GyneClinics Admin" };

/** /payouts — doctors' real withdrawal requests and balances. loading.tsx shows a skeleton meanwhile. */
export default async function PayoutsPage() {
  const [level, initial, balances] = await Promise.all([accessTo("payouts"), getWithdrawalsPage({ status: "todo", page: 1, limit: 10 }), getBalances()]);
  return (
    <PayoutList
      initial={initial}
      initialBalances={balances.data ?? []}
      balancesError={balances.success ? undefined : balances.error}
      now={new Date().toISOString()}
      canManage={level === "manage"}
    />
  );
}
