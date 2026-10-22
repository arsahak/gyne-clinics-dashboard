import AccessGate from "@/component/access/AccessGate";

/** settings: needs "team" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="team" note={false}>
      {children}
    </AccessGate>
  );
}
