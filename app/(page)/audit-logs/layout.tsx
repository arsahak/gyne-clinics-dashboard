import AccessGate from "@/component/access/AccessGate";

/** audit-logs: needs "team" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="team">
      {children}
    </AccessGate>
  );
}
