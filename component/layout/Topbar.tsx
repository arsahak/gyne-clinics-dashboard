"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  IoMdArrowDown,
  IoMdLogOut,
  IoMdMenu,
  IoMdMoon,
  IoMdPerson,
  IoMdSettings,
  IoMdSunny,
} from "react-icons/io";
import NotificationBell from "./NotificationBell";
import type { Access } from "./LayoutWrapper";

// Ordered longest-path-first so nested routes (e.g. /ai-chatbot/stats) match
// before their parent (/ai-chatbot).
const PAGE_TITLES: { path: string; title: string }[] = [
  { path: "/ai-chatbot/knowledge-base", title: "Train AI" },
  { path: "/ai-chatbot/conversations", title: "Conversations" },
  { path: "/ai-chatbot/stats", title: "Statistics" },
  { path: "/ai-chatbot", title: "AI Chatbot" },
  { path: "/patient", title: "Patients" },
  { path: "/doctor-reviews", title: "Doctor Reviews" },
  { path: "/doctor-analytics", title: "Analytics" },
  { path: "/chat-moderation", title: "Chat Moderation" },
  { path: "/chat-monitoring", title: "Chat Monitoring" },
  { path: "/consultation-settings", title: "Consultation Rules" },
  { path: "/audit-logs", title: "Audit Logs" },
  { path: "/advertisements", title: "Advertisements" },
  { path: "/notifications", title: "Notifications" },
  { path: "/doctors", title: "Doctors" },
  { path: "/reports", title: "Reports" },
  { path: "/content", title: "Learn Articles" },
  { path: "/stories", title: "Community Stories" },
  { path: "/settings", title: "Team & Roles" },
  { path: "/profile", title: "Profile" },
  { path: "/consultations", title: "Consultations" },
  { path: "/payments", title: "Payments" },
  { path: "/payouts", title: "Payouts" },
  { path: "/fees-commission", title: "Fees & Commission" },
  { path: "/", title: "Dashboard" },
];

function getPageTitle(pathname: string): string {
  const match = PAGE_TITLES.find(
    ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
  );
  return match?.title || "Dashboard";
}

export default function Topbar({ access = null }: { access?: Access }) {
  // Unknown access shows everything; the backend still decides.
  const can = (area: "doctors" | "team") =>
    !access || (access[area] ?? "none") !== "none";
  const { isOpen, isMobile, isDarkMode, setIsDarkMode } = useSidebar();
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "?";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfileMenu && !target.closest("[data-profile-dropdown]")) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      toast.success("Logging out...");
      // Use client-side signOut from next-auth/react
      await signOut({ callbackUrl: "/sign-in" });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className={`fixed top-0 h-16 shadow-sm z-40 transition-all duration-200 ${
        isOpen
          ? "left-64 md:left-64 sm:left-56"
          : "left-16 md:left-16 sm:left-14"
      } ${isMobile && !isOpen ? "left-0" : ""} right-0 ${
        isDarkMode
          ? "bg-gray-900 border-b border-gray-700"
          : "bg-white border-b border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section - Menu Toggle & Search */}
        <div className="flex items-center gap-3">
          <button
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
            }`}
          >
            <IoMdMenu
              className={`w-5 h-5 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            />
          </button>

          {/* Page Title */}
          <h1
            className={`text-lg font-semibold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {pageTitle}
          </h1>
        </div>

        {/* Right Section - Icons & Profile */}
        <div className="flex items-center gap-2">
          {/* Light / dark switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isDarkMode}
            aria-label="Dark mode"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`relative mr-1 flex h-8 w-[60px] shrink-0 items-center justify-between rounded-full px-2 transition-colors ${
              isDarkMode
                ? "bg-gray-700 ring-1 ring-gray-600"
                : "bg-gray-100 ring-1 ring-gray-200"
            }`}
          >
            <IoMdSunny
              className={`relative z-10 h-4 w-4 transition-colors ${isDarkMode ? "text-gray-400" : "text-amber-500"}`}
            />
            <IoMdMoon
              className={`relative z-10 h-4 w-4 transition-colors ${isDarkMode ? "text-indigo-300" : "text-gray-400"}`}
            />
            <span
              className={`absolute top-1 h-6 w-6 rounded-full shadow transition-all duration-200 ${
                isDarkMode ? "left-[32px] bg-gray-900" : "left-1 bg-white"
              }`}
            />
          </button>

          {/* Live notifications (each person gets what their role can see) */}
          <NotificationBell />

          {/* Settings (Team & Roles) */}
          {can("team") && (
            <Link
              href="/settings"
              title="Settings"
              aria-label="Settings"
              className={`p-2 rounded-lg transition-colors ${
                pathname === "/settings" || pathname.startsWith("/settings/")
                  ? isDarkMode
                    ? "bg-gray-800"
                    : "bg-gray-100"
                  : isDarkMode
                    ? "hover:bg-gray-800"
                    : "hover:bg-gray-50"
              }`}
            >
              <IoMdSettings
                className={`w-5 h-5 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              />
            </Link>
          )}

          {/* Profile Dropdown (Logout only) */}
          <div className="relative" data-profile-dropdown>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
              }`}
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name || "User"}
                  className="w-8 h-8 rounded-full object-cover"
                  width={32}
                  height={32}
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                    isDarkMode ? "bg-blue-600" : "bg-gray-600"
                  }`}
                >
                  {getUserInitials()}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  {user?.name || "Guest"}
                </p>
                {user?.role && (
                  <p
                    className={`text-xs capitalize ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {user.role}
                  </p>
                )}
              </div>
              <IoMdArrowDown
                className={`w-4 h-4 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              />
            </button>

            {/* Dropdown Menu - Profile & Logout */}
            {showProfileMenu && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-2 z-50 ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <button
                  type="button"
                  className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                    isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push("/profile");
                  }}
                >
                  <IoMdPerson className="w-4 h-4" />
                  {getTranslation("profile", language)}
                </button>
                <hr
                  className={`my-2 ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                />
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                    isDarkMode
                      ? "text-red-400 hover:bg-gray-700"
                      : "text-red-600 hover:bg-gray-50"
                  } ${isLoggingOut ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <IoMdLogOut className="w-4 h-4" />
                  {isLoggingOut
                    ? getTranslation("saving", language) || "Logging out..."
                    : getTranslation("logout", language)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
