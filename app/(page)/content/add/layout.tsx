import AccessGate from "@/component/access/AccessGate";

/** content/add: needs "content" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="content" need="manage">
      {children}
    </AccessGate>
  );
}
