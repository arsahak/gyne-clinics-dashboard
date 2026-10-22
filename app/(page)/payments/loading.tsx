import { MoneyPageSkeleton } from "@/component/financeManagement/FinanceSkeletons";

export default function Loading() {
  return <MoneyPageSkeleton label="Loading payments" cols={10} />;
}
