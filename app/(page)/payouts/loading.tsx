import { MoneyPageSkeleton } from "@/component/financeManagement/FinanceSkeletons";

export default function Loading() {
  return <MoneyPageSkeleton label="Loading payouts" cols={6} />;
}
