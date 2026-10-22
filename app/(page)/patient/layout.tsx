import AccessGate from "@/component/access/AccessGate";

/** patient: needs "patients" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="patients">
      {children}
    </AccessGate>
  );
}
