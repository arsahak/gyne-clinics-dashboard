import AccessGate from "@/component/access/AccessGate";

/** notifications: needs "notifications" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="notifications">
      {children}
    </AccessGate>
  );
}
