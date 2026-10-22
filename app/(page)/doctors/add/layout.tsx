import AccessGate from "@/component/access/AccessGate";

/** doctors/add: needs "doctors" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="doctors" need="manage">
      {children}
    </AccessGate>
  );
}
