import AccessGate from "@/component/access/AccessGate";

/** patient/edit: needs "patients" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="patients" need="manage">
      {children}
    </AccessGate>
  );
}
