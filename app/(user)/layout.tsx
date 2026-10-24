import { LanguageProvider } from "@/lib/LanguageContext";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Gyneclinics - Dashboard",
  description: "Gyneclinics Dashboard",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      {/* Simple auth layout - no sidebar or topbar; uses root html/body from main layout */}
      {/* Auth pages always use the light theme, whatever the OS setting is. */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-primary/10 text-gray-900 [color-scheme:light]">
        <div className="w-full">{children}</div>
      </div>
    </LanguageProvider>
  );
}
