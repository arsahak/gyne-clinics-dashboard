import AccessGate from "@/component/access/AccessGate";

/** content: needs "content" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="content">
      {children}
    </AccessGate>
  );
}
