"use client";
import { Bone } from "@/component/financeManagement/FinanceSkeletons";
import { useSidebar } from "@/lib/SidebarContext";

/** The dashboard home while its numbers load. */
export default function HomeSkeleton() {
  const { isDarkMode } = useSidebar();
  const card = `rounded-2xl border p-5 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  return (
    <div aria-busy="true" aria-label="Loading the dashboard">
      <div className="mb-6 space-y-2">
        <Bone className="h-8 w-72" />
        <Bone className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${card} flex items-start gap-3`}>
            <Bone className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3.5 w-28" />
              <Bone className="h-6 w-20" />
              <Bone className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className={`${card} mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4`}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Bone className="h-3.5 w-24" />
            <Bone className="h-7 w-20" />
            <Bone className="h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${card} space-y-3`}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3.5 w-32" />
                <Bone className="h-3 w-44" />
              </div>
              <Bone className="h-7 w-8 rounded-full" />
            </div>
          ))}
        </div>
        <div className={`${card} xl:col-span-2`}>
          <Bone className="mb-2 h-4 w-48" />
          <Bone className="mb-4 h-3 w-80 max-w-full" />
          <div className="flex h-72 items-end gap-2">
            {Array.from({ length: 30 }, (_, i) => (
              <Bone key={i} className={`flex-1 ${["h-1/3", "h-2/3", "h-1/2", "h-3/4", "h-1/4"][i % 5]}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
