import AccessGate from "@/component/access/AccessGate";

/** consultations: needs "consultations" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="consultations" note={false}>
      {children}
    </AccessGate>
  );
}
