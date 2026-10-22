"use client";
import { useSidebar } from "@/lib/SidebarContext";

// Loading placeholders for Chat Monitoring and Chat Moderation.

function Bone({ className = "" }: { className?: string }) {
  const { isDarkMode } = useSidebar();
  return <div className={`animate-pulse rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} ${className}`} />;
}

function useCard() {
  const { isDarkMode } = useSidebar();
  return {
    isDarkMode,
    card: `border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`,
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
  };
}

function StatSkeletons() {
  const { card } = useCard();
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

/** Rows in the chat list. */
export function ChatListRowsSkeleton({ rows = 6 }: { rows?: number }) {
  const { border } = useCard();
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className={`flex gap-3 border-b px-4 py-3 ${border}`}>
          <Bone className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bone className="h-3.5 w-40" />
            <Bone className="h-3 w-56" />
            <Bone className="h-3 w-20" />
          </div>
        </li>
      ))}
    </>
  );
}

/** Message bubbles while a chat opens. */
export function TranscriptSkeleton() {
  return (
    <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading the chat">
      {["w-2/3", "w-1/2 ml-auto", "w-3/5", "w-2/5 ml-auto", "w-1/2"].map((w, i) => (
        <Bone key={i} className={`h-14 rounded-2xl ${w}`} />
      ))}
    </div>
  );
}

/** Whole Chat Monitoring page (app/(page)/chat-monitoring/loading.tsx). */
export function ChatMonitorSkeleton() {
  const { isDarkMode, card, border } = useCard();
  return (
    <div className={isDarkMode ? "bg-gray-900" : "bg-gray-50"} aria-busy="true" aria-label="Loading chats">
      <StatSkeletons />
      <div className={`${card} flex h-[560px] overflow-hidden rounded-2xl`}>
        <aside className={`w-full max-w-sm shrink-0 border-r ${border}`}>
          <div className={`space-y-2 border-b p-3 ${border}`}>
            <Bone className="h-9 w-full" />
            <div className="flex gap-2">
              {["w-12", "w-14", "w-20", "w-12"].map((w, i) => (
                <Bone key={i} className={`h-8 rounded-full ${w}`} />
              ))}
            </div>
          </div>
          <ul>
            <ChatListRowsSkeleton />
          </ul>
        </aside>
        <section className="hidden flex-1 md:block">
          <div className={`space-y-2 border-b px-6 py-4 ${border}`}>
            <Bone className="h-4 w-64" />
            <Bone className="h-3 w-48" />
          </div>
          <TranscriptSkeleton />
        </section>
      </div>
    </div>
  );
}

/** Flag cards in the moderation queue. */
export function FlagCardsSkeleton({ cards = 4 }: { cards?: number }) {
  const { card } = useCard();
  return (
    <ul className="space-y-3" aria-busy="true">
      {Array.from({ length: cards }, (_, i) => (
        <li key={i} className={`${card} space-y-3 rounded-2xl p-4`}>
          <div className="flex gap-2">
            <Bone className="h-5 w-28 rounded-full" />
            <Bone className="h-5 w-32 rounded-full" />
          </div>
          <div className="flex gap-3">
            <Bone className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3.5 w-56" />
              <Bone className="h-10 w-full rounded-2xl" />
            </div>
          </div>
          <div className="flex gap-2 sm:pl-12">
            {[0, 1, 2].map((b) => (
              <Bone key={b} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Whole Chat Moderation page (app/(page)/chat-moderation/loading.tsx). */
export function ModerationSkeleton() {
  const { isDarkMode, card } = useCard();
  return (
    <div className={isDarkMode ? "bg-gray-900" : "bg-gray-50"} aria-busy="true" aria-label="Loading flagged messages">
      <StatSkeletons />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${card} h-fit space-y-4 rounded-2xl p-5`}>
          <Bone className="h-4 w-40" />
          <Bone className="h-3 w-56" />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <Bone className="h-9 w-9 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Bone className="h-3.5 w-32" />
                <Bone className="h-1.5 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4 xl:col-span-2">
          <div className="flex gap-2">
            {["w-20", "w-16", "w-20", "w-24", "w-24", "w-12"].map((w, i) => (
              <Bone key={i} className={`h-8 rounded-full ${w}`} />
            ))}
          </div>
          <FlagCardsSkeleton />
        </div>
      </div>
    </div>
  );
}
