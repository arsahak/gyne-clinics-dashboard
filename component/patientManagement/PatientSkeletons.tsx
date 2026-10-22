"use client";
import { useSidebar } from "@/lib/SidebarContext";

// Loading placeholders for the patient pages. Each one follows the layout of
// the real page so nothing jumps when the data arrives.

/** One grey pulsing block. */
function Bone({ className = "" }: { className?: string }) {
  const { isDarkMode } = useSidebar();
  return <div className={`animate-pulse rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} ${className}`} />;
}

function useSurface() {
  const { isDarkMode } = useSidebar();
  return {
    isDarkMode,
    page: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    card: `rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`,
    divider: isDarkMode ? "divide-gray-700 border-gray-700" : "divide-gray-200 border-gray-200",
  };
}

function StatCardsSkeleton() {
  const { card } = useSurface();
  return (
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
  );
}

/** Table rows only — used inside the patient list while a page loads. */
export function PatientRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i}>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Bone className="h-9 w-9 shrink-0 rounded-full" />
              <div className="space-y-2">
                <Bone className="h-3.5 w-32" />
                <Bone className="h-3 w-24" />
              </div>
            </div>
          </td>
          <td className="px-6 py-4"><Bone className="h-3.5 w-8" /></td>
          <td className="px-6 py-4"><Bone className="h-3.5 w-24" /></td>
          <td className="px-6 py-4">
            <div className="space-y-2">
              <Bone className="h-3.5 w-20" />
              <Bone className="h-3 w-16" />
            </div>
          </td>
          <td className="px-6 py-4"><Bone className="h-6 w-24 rounded-full" /></td>
          <td className="px-6 py-4"><Bone className="h-6 w-16 rounded-full" /></td>
          <td className="px-6 py-4"><Bone className="h-3.5 w-20" /></td>
          <td className="px-6 py-4">
            <div className="flex justify-end gap-2">
              <Bone className="h-8 w-8 rounded-lg" />
              <Bone className="h-8 w-8 rounded-lg" />
              <Bone className="h-8 w-8 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/** /patient while the list loads. */
export function PatientListSkeleton({ label = "Loading patients" }: { label?: string } = {}) {
  const { page, card, divider, isDarkMode } = useSurface();
  return (
    <div className={page} aria-busy="true" aria-label={label}>
      <StatCardsSkeleton />
      <div className={`${card} overflow-hidden rounded-lg`}>
        <div className={`flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between ${divider}`}>
          <Bone className="h-10 w-full md:w-[350px]" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Bone className="h-10 sm:w-44" />
            <Bone className="h-10 sm:w-44" />
            <Bone className="h-10 sm:w-32" />
          </div>
        </div>
        <table className="w-full">
          <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              {Array.from({ length: 8 }, (_, i) => (
                <th key={i} className="px-6 py-3">
                  <Bone className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${divider}`}>
            <PatientRowsSkeleton />
          </tbody>
        </table>
        <div className={`flex items-center justify-between border-t p-4 ${divider}`}>
          <Bone className="h-4 w-40" />
          <Bone className="h-8 w-48" />
        </div>
      </div>
    </div>
  );
}

/** /patient/add and /patient/edit/:id while the form loads. */
export function PatientFormSkeleton({ label = "Loading form" }: { label?: string } = {}) {
  const { page, card } = useSurface();
  return (
    <div className={page} aria-busy="true" aria-label={label}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Bone className="h-8 w-56" />
          <Bone className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <Bone className="h-10 w-24 rounded-lg" />
          <Bone className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Account */}
          <div className={`${card} p-6`}>
            <div className="mb-5 flex items-center gap-3">
              <Bone className="h-9 w-9 rounded-lg" />
              <div className="space-y-2">
                <Bone className="h-4 w-24" />
                <Bone className="h-3 w-56" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Bone className="h-3.5 w-20" />
                <Bone className="h-10 w-full rounded-lg" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <Bone className="h-3.5 w-28" />
                    <Bone className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Health profile */}
          <div className={`${card} p-6`}>
            <div className="mb-5 flex items-center gap-3">
              <Bone className="h-9 w-9 rounded-lg" />
              <div className="space-y-2">
                <Bone className="h-4 w-32" />
                <Bone className="h-3 w-64" />
              </div>
            </div>
            <div className="space-y-5">
              {Array.from({ length: 2 }, (_, row) => (
                <div key={row} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="space-y-2">
                      <Bone className="h-3.5 w-24" />
                      <Bone className="h-10 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Bone key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className={`${card} p-6`}>
            <Bone className="mb-4 h-3 w-16" />
            <div className="flex items-center gap-3">
              <Bone className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-32" />
                <Bone className="h-3 w-24" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Bone className="h-14 rounded-lg" />
              <Bone className="h-14 rounded-lg" />
              <Bone className="col-span-2 h-14 rounded-lg" />
            </div>
          </div>
          <div className={`${card} space-y-3 p-6`}>
            <Bone className="h-4 w-44" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-5/6" />
            <Bone className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** /patient/:id while the details load. */
export function PatientDetailsSkeleton({ label = "Loading patient" }: { label?: string } = {}) {
  const { page, card } = useSurface();
  return (
    <div className={page} aria-busy="true" aria-label={label}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Bone className="h-16 w-16 shrink-0 rounded-full" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bone className="h-8 w-52" />
              <Bone className="h-6 w-16 rounded-full" />
            </div>
            <Bone className="h-4 w-60" />
          </div>
        </div>
        <div className="flex gap-3">
          <Bone className="h-10 w-20 rounded-lg" />
          <Bone className="h-10 w-24 rounded-lg" />
          <Bone className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${card} space-y-3 p-4`}>
            <Bone className="h-9 w-9 rounded-lg" />
            <Bone className="h-3 w-16" />
            <Bone className="h-5 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={`${card} p-6 lg:col-span-2`}>
          <div className="mb-5 flex items-center gap-3">
            <Bone className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-56" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Bone className="h-3 w-24" />
                <Bone className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
        <div className={`${card} p-6`}>
          <div className="mb-5 flex items-center gap-3">
            <Bone className="h-9 w-9 rounded-lg" />
            <Bone className="h-4 w-24" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex justify-between gap-4">
                <Bone className="h-3.5 w-20" />
                <Bone className="h-3.5 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
