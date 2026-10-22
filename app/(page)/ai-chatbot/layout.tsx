import AccessGate from "@/component/access/AccessGate";

/** ai-chatbot: needs "chatbot" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="chatbot">
      {children}
    </AccessGate>
  );
}
