import AccessGate from "@/component/access/AccessGate";

/** reports: needs "reports" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="reports">
      {children}
    </AccessGate>
  );
}
