"use client";
import { useSidebar } from "@/lib/SidebarContext";

// Loading placeholders for Payments and Payouts.

export function Bone({ className = "" }: { className?: string }) {
  const { isDarkMode } = useSidebar();
  return <div className={`animate-pulse rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} ${className}`} />;
}

/** Table rows while a page loads. `cols` = number of columns. */
export function MoneyRowsSkeleton({ rows = 6, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="px-5 py-4">
              {c === cols - 1 ? (
                <Bone className="ml-auto h-8 w-8 rounded-lg" />
              ) : (
                <div className="space-y-2">
                  <Bone className={`h-3.5 ${c === 0 ? "w-28" : "w-20"}`} />
                  {c < 3 && <Bone className="h-3 w-16" />}
                </div>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** A whole money page: stat cards, toolbar and table (for loading.tsx). */
export function MoneyPageSkeleton({ label, cols = 8 }: { label: string; cols?: number }) {
  const { isDarkMode } = useSidebar();
  const card = `border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const divider = isDarkMode ? "divide-gray-700 border-gray-700" : "divide-gray-200 border-gray-200";
  return (
    <div className={isDarkMode ? "bg-gray-900" : "bg-gray-50"} aria-busy="true" aria-label={label}>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${card} flex items-start gap-3 rounded-2xl p-5`}>
            <Bone className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-6 w-20" />
              <Bone className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className={`${card} overflow-hidden rounded-lg`}>
        <div className={`flex flex-col gap-3 border-b p-4 xl:flex-row xl:justify-between ${divider}`}>
          <Bone className="h-10 w-full xl:w-[320px]" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map((b) => (
              <Bone key={b} className="h-10 w-40" />
            ))}
          </div>
        </div>
        <table className="w-full">
          <tbody className={`divide-y ${divider}`}>
            <MoneyRowsSkeleton cols={cols} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
