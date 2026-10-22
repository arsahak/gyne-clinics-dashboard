import AccessGate from "@/component/access/AccessGate";

/** consultation-settings: needs "fees" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="fees">
      {children}
    </AccessGate>
  );
}
