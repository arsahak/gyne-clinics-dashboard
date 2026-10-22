import AccessGate from "@/component/access/AccessGate";

/** chat-moderation: needs "chat_moderation" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="chat_moderation">
      {children}
    </AccessGate>
  );
}
