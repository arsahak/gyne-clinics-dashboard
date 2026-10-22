import AccessGate from "@/component/access/AccessGate";

/** stories/edit: needs "stories" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="stories" need="manage">
      {children}
    </AccessGate>
  );
}
