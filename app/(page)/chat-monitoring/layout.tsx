import AccessGate from "@/component/access/AccessGate";

/** chat-monitoring: needs "chat_monitoring" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="chat_monitoring" note={false}>
      {children}
    </AccessGate>
  );
}
