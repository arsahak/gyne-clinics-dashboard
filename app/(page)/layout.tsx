import LayoutWrapper from "@/component/layout/LayoutWrapper";
import { getMyAccess } from "@/lib/access";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Gyneclinics",
  description: "Gyneclinics Management System",
};

export default async function PageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await getMyAccess();
  return (
    <>
      {/* Full layout with Sidebar and Topbar */}
      {/* The sidebar shows only what this person's role can open. */}
      <LayoutWrapper access={access.loaded ? access.mine : null}>{children}</LayoutWrapper>
    </>
  );
}
