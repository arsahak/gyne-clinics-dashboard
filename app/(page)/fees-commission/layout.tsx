import AccessGate from "@/component/access/AccessGate";

/** fees-commission: needs "fees" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="fees" note={false}>
      {children}
    </AccessGate>
  );
}
