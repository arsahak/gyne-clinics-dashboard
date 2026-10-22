"use client";
import { useSidebar } from "@/lib/SidebarContext";

// Loading placeholders shaped like the consultations page.

function Bone({ className = "" }: { className?: string }) {
  const { isDarkMode } = useSidebar();
  return <div className={`animate-pulse rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} ${className}`} />;
}

/** Table rows while a page of consultations loads. */
export function ConsultationRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i}>
          <td className="px-5 py-4">
            <div className="space-y-2">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-3 w-48" />
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="flex items-center gap-3">
              <Bone className="h-8 w-8 shrink-0 rounded-full" />
              <div className="space-y-2">
                <Bone className="h-3.5 w-24" />
                <Bone className="h-3 w-20" />
              </div>
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
              <Bone className="h-3 w-16" />
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="ml-auto space-y-2">
              <Bone className="ml-auto h-3.5 w-14" />
              <Bone className="ml-auto h-3 w-10" />
            </div>
          </td>
          <td className="px-5 py-4">
            <Bone className="h-6 w-24 rounded-full" />
          </td>
          <td className="px-5 py-4">
            <Bone className="ml-auto h-8 w-8 rounded-lg" />
          </td>
        </tr>
      ))}
    </>
  );
}

/** The whole page, for the first load (app/(page)/consultations/loading.tsx). */
export function ConsultationListSkeleton() {
  const { isDarkMode } = useSidebar();
  const card = `border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const divider = isDarkMode ? "divide-gray-700 border-gray-700" : "divide-gray-200 border-gray-200";
  return (
    <div className={isDarkMode ? "bg-gray-900" : "bg-gray-50"} aria-busy="true" aria-label="Loading consultations">
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
      <div className={`${card} overflow-hidden rounded-lg`}>
        <div className={`flex flex-col gap-3 border-b p-4 ${divider}`}>
          <div className="flex flex-wrap gap-2">
            {["w-16", "w-24", "w-28", "w-24", "w-24", "w-20"].map((w, i) => (
              <Bone key={i} className={`h-8 rounded-full ${w}`} />
            ))}
          </div>
          <div className="flex flex-col gap-2 xl:flex-row xl:justify-between">
            <Bone className="h-10 w-full xl:w-[320px]" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2].map((b) => (
                <Bone key={b} className="h-10 w-40" />
              ))}
            </div>
          </div>
        </div>
        <table className="w-full">
          <tbody className={`divide-y ${divider}`}>
            <ConsultationRowsSkeleton />
          </tbody>
        </table>
      </div>
    </div>
  );
}
