"use client";
import { useSidebar } from "@/lib/SidebarContext";

// Loading placeholders shaped like the Doctor Reviews page.

function Bone({ className = "" }: { className?: string }) {
  const { isDarkMode } = useSidebar();
  return <div className={`animate-pulse rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} ${className}`} />;
}

/** Table rows while a page of reviews loads. */
export function ReviewRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i}>
          <td className="px-5 py-4">
            <div className="space-y-2">
              <Bone className="h-3 w-20" />
              <Bone className="h-3.5 w-72" />
              <Bone className="h-3.5 w-52" />
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="space-y-2">
              <Bone className="h-3.5 w-28" />
              <Bone className="h-3 w-24" />
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="space-y-2">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-3 w-20" />
            </div>
          </td>
          <td className="px-5 py-4">
            <Bone className="h-3.5 w-20" />
          </td>
          <td className="px-5 py-4">
            <Bone className="h-6 w-28 rounded-full" />
          </td>
          <td className="px-5 py-4">
            <div className="flex justify-end gap-2">
              {[0, 1, 2].map((b) => (
                <Bone key={b} className="h-8 w-8 rounded-lg" />
              ))}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/** The whole page, for the first load (app/(page)/doctor-reviews/loading.tsx). */
export function ReviewListSkeleton() {
  const { isDarkMode } = useSidebar();
  const card = `border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const divider = isDarkMode ? "divide-gray-700 border-gray-700" : "divide-gray-200 border-gray-200";
  return (
    <div className={isDarkMode ? "bg-gray-900" : "bg-gray-50"} aria-busy="true" aria-label="Loading reviews">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${card} flex items-start gap-3 rounded-2xl p-5`}>
            <Bone className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-6 w-12" />
              <Bone className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map((c) => (
          <div key={c} className={`${card} space-y-3 rounded-2xl p-5`}>
            <Bone className="h-4 w-36" />
            <Bone className="h-3 w-52" />
            {Array.from({ length: 5 }, (_, i) => (
              <Bone key={i} className="h-3 w-full" />
            ))}
          </div>
        ))}
      </div>
      <div className={`${card} overflow-hidden rounded-lg`}>
        <div className={`flex flex-col gap-3 border-b p-4 ${divider}`}>
          <div className="flex flex-wrap gap-2">
            {["w-16", "w-32", "w-24", "w-20"].map((w, i) => (
              <Bone key={i} className={`h-8 rounded-full ${w}`} />
            ))}
          </div>
          <div className="flex flex-col gap-2 xl:flex-row xl:justify-between">
            <Bone className="h-10 w-full xl:w-[320px]" />
            <div className="flex gap-2">
              <Bone className="h-10 w-40" />
              <Bone className="h-10 w-40" />
            </div>
          </div>
        </div>
        <table className="w-full">
          <tbody className={`divide-y ${divider}`}>
            <ReviewRowsSkeleton />
          </tbody>
        </table>
      </div>
    </div>
  );
}
