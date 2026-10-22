import AccessGate from "@/component/access/AccessGate";

/** doctor-analytics: needs "analytics" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="analytics" note={false}>
      {children}
    </AccessGate>
  );
}
