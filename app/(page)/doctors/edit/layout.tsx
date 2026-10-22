import AccessGate from "@/component/access/AccessGate";

/** doctors/edit: needs "doctors" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="doctors" need="manage">
      {children}
    </AccessGate>
  );
}
