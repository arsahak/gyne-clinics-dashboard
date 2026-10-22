import AccessGate from "@/component/access/AccessGate";

/** payouts: needs "payouts" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="payouts" note={false}>
      {children}
    </AccessGate>
  );
}
