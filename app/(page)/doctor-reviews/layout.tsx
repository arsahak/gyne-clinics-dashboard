import AccessGate from "@/component/access/AccessGate";

/** doctor-reviews: needs "reviews" access (Team & Roles). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate area="reviews">
      {children}
    </AccessGate>
  );
}
