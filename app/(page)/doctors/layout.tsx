import AccessGate from "@/component/access/AccessGate";

/** doctors: needs "doctors" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="doctors">
      {children}
    </AccessGate>
  );
}
