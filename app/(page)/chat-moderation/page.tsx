import { getFlagsPage } from "@/app/actions/moderationAction";
import ModerationQueue from "@/component/chatModeration/ModerationQueue";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chat Moderation – GyneClinics Admin" };

/** /chat-moderation — what the chat safety filter caught, from the backend. loading.tsx shows a skeleton meanwhile. */
export default async function ChatModerationPage() {
  const initial = await getFlagsPage({ status: "new", page: 1, limit: 8 });
  return <ModerationQueue initial={initial} now={new Date().toISOString()} />;
}
