import AccessGate from "@/component/access/AccessGate";

/** advertisements/add: needs "ads" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="ads" need="manage">
      {children}
    </AccessGate>
  );
}
