"use client";
import { useSidebar } from "@/lib/SidebarContext";

// Loading placeholders for the story pages, shaped like the real pages.

function Bone({ className = "" }: { className?: string }) {
  const { isDarkMode } = useSidebar();
  return <div className={`animate-pulse rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} ${className}`} />;
}

function useSurface() {
  const { isDarkMode } = useSidebar();
  return {
    page: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    card: `rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`,
    divider: isDarkMode ? "divide-gray-700 border-gray-700" : "divide-gray-200 border-gray-200",
  };
}

export function StoryRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i}>
          <td className="px-6 py-4"><div className="flex items-center gap-3"><Bone className="h-10 w-14 shrink-0 rounded-lg" /><div className="space-y-2"><Bone className="h-3.5 w-44" /><Bone className="h-3 w-56" /></div></div></td>
          <td className="px-6 py-4"><div className="space-y-2"><Bone className="h-3.5 w-24" /><Bone className="h-3 w-20" /></div></td>
          <td className="px-6 py-4"><Bone className="h-6 w-20 rounded-full" /></td>
          <td className="px-6 py-4"><Bone className="h-3.5 w-20" /></td>
          <td className="px-6 py-4"><Bone className="h-6 w-32 rounded-full" /></td>
          <td className="px-6 py-4"><div className="flex justify-end gap-2">{[0, 1, 2].map((b) => <Bone key={b} className="h-8 w-8 rounded-lg" />)}</div></td>
        </tr>
      ))}
    </>
  );
}

export function StoryListSkeleton() {
  const { page, card, divider } = useSurface();
  return (
    <div className={page}>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${card} flex items-start gap-3 rounded-2xl p-5`}>
            <Bone className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2"><Bone className="h-3.5 w-24" /><Bone className="h-6 w-12" /><Bone className="h-3 w-32" /></div>
          </div>
        ))}
      </div>
      <div className={`${card} overflow-hidden rounded-lg`}>
        <div className={`flex flex-col gap-3 border-b p-4 xl:flex-row xl:justify-between ${divider}`}>
          <Bone className="h-10 w-full xl:w-[350px]" />
          <div className="flex flex-wrap gap-2">{[0, 1, 2].map((b) => <Bone key={b} className="h-10 w-40" />)}</div>
        </div>
        <table className="w-full"><tbody className={`divide-y ${divider}`}><StoryRowsSkeleton /></tbody></table>
      </div>
    </div>
  );
}

export function StoryDetailsSkeleton() {
  const { page, card } = useSurface();
  return (
    <div className={page}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4"><Bone className="h-14 w-14 rounded-2xl" /><div className="space-y-2"><Bone className="h-8 w-72" /><Bone className="h-4 w-52" /></div></div>
        <div className="flex gap-3"><Bone className="h-10 w-20" /><Bone className="h-10 w-20" /><Bone className="h-10 w-24" /></div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={`${card} space-y-4 p-6 lg:col-span-2`}>
          <Bone className="h-40 w-full rounded-2xl" /><Bone className="h-6 w-24 rounded-full" /><Bone className="h-7 w-2/3" />
          {["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-3/5"].map((w, i) => <Bone key={i} className={`h-3.5 ${w}`} />)}
        </div>
        <div className="space-y-6">
          <div className={`${card} space-y-3 p-6`}><Bone className="h-3 w-16" /><Bone className="h-14 w-full" /><Bone className="h-10 w-full" /><Bone className="h-28 w-full" /></div>
          <div className={`${card} space-y-4 p-6`}>{[0, 1, 2, 3, 4].map((r) => <div key={r} className="flex justify-between"><Bone className="h-3.5 w-20" /><Bone className="h-3.5 w-28" /></div>)}</div>
        </div>
      </div>
    </div>
  );
}

export function StoryFormSkeleton() {
  const { page, card } = useSurface();
  return (
    <div className={page}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2"><Bone className="h-8 w-44" /><Bone className="h-4 w-96 max-w-full" /></div>
        <div className="flex gap-3"><Bone className="h-10 w-20" /><Bone className="h-10 w-36" /></div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className={`${card} space-y-4 p-6`}><Bone className="h-9 w-32" /><Bone className="h-10 w-full" /><Bone className="h-72 w-full" /></div>
          <div className={`${card} space-y-4 p-6`}><Bone className="h-9 w-32" /><Bone className="h-10 w-full" /></div>
        </div>
        <div className="space-y-6">{["h-56", "h-24", "h-20"].map((h) => <div key={h} className={`${card} space-y-3 p-6`}><Bone className={`${h} w-full`} /></div>)}</div>
      </div>
    </div>
  );
}
