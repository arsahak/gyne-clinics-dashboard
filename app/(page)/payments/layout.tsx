import AccessGate from "@/component/access/AccessGate";

/** payments: needs "payments" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="payments" note={false}>
      {children}
    </AccessGate>
  );
}
