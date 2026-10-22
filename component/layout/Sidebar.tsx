"use client";

import type { Access } from "@/component/layout/LayoutWrapper";
import type { AreaKey } from "@/lib/access";
import { useSidebar } from "@/lib/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FaAd,
  FaBalanceScale,
  FaBookOpen,
  FaBullhorn,
  FaCalendarCheck,
  FaChartLine,
  FaComments,
  FaFileAlt,
  FaFlag,
  FaMoneyBillWave,
  FaPercent,
  FaRobot,
  FaStar,
  FaStethoscope,
  FaUserShield,
  FaUsersCog,
  FaWallet,
} from "react-icons/fa";
import { IoIosArrowDown, IoMdHome } from "react-icons/io";
import { MdVideocam } from "react-icons/md";
import { RxDoubleArrowLeft } from "react-icons/rx";

interface MenuItem {
  icon: React.ReactElement;
  label: string;
  path: string;
  /** The Team & Roles area that controls who sees it (none = always shown). */
  area?: AreaKey;
  expandable?: boolean;
  subItems?: { label: string; path: string }[];
  badge?: string;
}

interface MenuSection {
  /** Shown above the group when the sidebar is open. */
  title?: string;
  items: MenuItem[];
}

const icon = (Icon: typeof FaAd) => <Icon className="w-[18px] h-[18px]" />;

// Grouped by the job: people, care, money, content, then settings.
const getMenuSections = (): MenuSection[] => [
  { items: [{ icon: <IoMdHome className="w-5 h-5" />, label: "Dashboard", path: "/" }] },
  {
    title: "People",
    items: [
      { icon: icon(FaUserShield), label: "Patients", area: "patients", path: "/patient" },
      { icon: icon(FaStethoscope), label: "Doctors", area: "doctors", path: "/doctors" },
    ],
  },
  {
    title: "Care",
    items: [
      { icon: icon(FaCalendarCheck), label: "Consultations", area: "consultations", path: "/consultations" },
      { icon: icon(FaStar), label: "Doctor Reviews", area: "reviews", path: "/doctor-reviews" },
    ],
  },
  {
    title: "Safety",
    items: [
      { icon: icon(FaFlag), label: "Reports", area: "reports", path: "/reports" },
      { icon: icon(FaBalanceScale), label: "Chat Moderation", area: "chat_moderation", path: "/chat-moderation" },
      { icon: icon(FaComments), label: "Chat Monitoring", area: "chat_monitoring", path: "/chat-monitoring" },
    ],
  },
  {
    title: "Money",
    items: [
      { icon: icon(FaMoneyBillWave), label: "Payments", area: "payments", path: "/payments" },
      { icon: icon(FaWallet), label: "Payouts", area: "payouts", path: "/payouts" },
    ],
  },
  {
    title: "Content",
    items: [
      { icon: icon(FaFileAlt), label: "Learn Articles", area: "content", path: "/content" },
      { icon: icon(FaBookOpen), label: "Community Stories", area: "stories", path: "/stories" },
      { icon: icon(FaAd), label: "Advertisements", area: "ads", path: "/advertisements" },
    ],
  },
  {
    title: "Engage",
    items: [
      { icon: icon(FaBullhorn), label: "Notifications", area: "notifications", path: "/notifications" },
      {
        icon: icon(FaRobot),
        label: "AI Chatbot",
        area: "chatbot",
        path: "/ai-chatbot",
        expandable: true,
        subItems: [
          { label: "Overview", path: "/ai-chatbot" },
          { label: "Train AI", path: "/ai-chatbot/knowledge-base" },
          { label: "Conversations", path: "/ai-chatbot/conversations" },
          { label: "Statistics", path: "/ai-chatbot/stats" },
        ],
      },
    ],
  },
  { title: "Insights", items: [{ icon: icon(FaChartLine), label: "Analytics", area: "analytics", path: "/doctor-analytics" }] },
  {
    title: "Settings",
    items: [
      { icon: icon(FaPercent), label: "Fees & Commission", area: "fees", path: "/fees-commission" },
      { icon: <MdVideocam className="w-5 h-5" />, label: "Consultation Rules", area: "fees", path: "/consultation-settings" },
      { icon: icon(FaUsersCog), label: "Team & Roles", area: "team", path: "/settings" },
    ],
  },
];

/** Active on its own page and the pages under it (e.g. /content/123). */
const isActivePath = (pathname: string, path: string) =>
  path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

/** Only the pages this role can open (all of them when access is unknown). */
const visibleSections = (access: Access): MenuSection[] =>
  getMenuSections()
    .map((section) => ({ ...section, items: section.items.filter((item) => !access || !item.area || (access[item.area] ?? "none") !== "none") }))
    .filter((section) => section.items.length > 0);

export default function Sidebar({ access = null }: { access?: Access }) {
  const { isOpen, setIsOpen, isMobile, isDarkMode } = useSidebar();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [label]: !(prev[label] ?? isActivePath(pathname, menuSections.flatMap((s) => s.items).find((i) => i.label === label)?.path ?? "")),
    }));
  };

  const menuSections = visibleSections(access);

  return (
    <div className="relative">
      <aside
        className={`fixed left-0 top-0 transition-all duration-200 h-screen shadow-sm z-50 flex flex-col ${
          isOpen ? "w-64 md:w-64 sm:w-56" : "w-16 md:w-16 sm:w-14"
        } ${isMobile && !isOpen ? "hidden" : ""} ${
          isDarkMode
            ? "bg-gray-900 text-gray-100 border-r border-gray-700"
            : "bg-white text-gray-800 border-r border-gray-200"
        }`}
      >
        {/* Logo — full wordmark when open, brand "G" mark when collapsed */}
        <div
          className={`h-16 flex items-center justify-center px-4 shrink-0 transition-colors duration-200 ${
            isDarkMode ? "border-b border-gray-700" : "border-b border-gray-200"
          }`}
        >
          <Link href="/" aria-label="Gyneclinics dashboard home">
            {isOpen ? (
              <Image
                src="/assets/logo/gyneclinics-logo.webp"
                alt="Gyneclinics"
                width={150}
                height={51}
                priority
                className="h-auto w-[150px]"
              />
            ) : (
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-secondary to-brand-accent text-white font-bold text-lg shadow-sm">
                G
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`sidebar-scroll flex-1 overflow-y-auto py-4 pl-3 pr-2 ${isDarkMode ? "sidebar-scroll-dark" : ""}`}>
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title ?? "top"} className={sectionIndex > 0 ? "mt-4" : ""}>
              {section.title &&
                (isOpen ? (
                  <p
                    className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {section.title}
                  </p>
                ) : (
                  <div className={`mx-3 mb-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />
                ))}
              <div className="space-y-0.5">
          {section.items.map((item) => {
            const isActive = item.expandable ? pathname === item.path : isActivePath(pathname, item.path);
            // A group opens by itself on one of its pages.
            const isExpanded = expandedSections[item.label] ?? isActivePath(pathname, item.path);

            return (
              <div key={item.path}>
                <div className="flex items-center">
                  <Link
                    href={item.path}
                    title={isOpen ? undefined : item.label}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 flex-1 ${
                      isActive
                        ? isDarkMode
                          ? "bg-blue-900 text-blue-300"
                          : "bg-blue-50 text-blue-600"
                        : isDarkMode
                          ? "text-gray-300 hover:bg-gray-800"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {isOpen && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                  </Link>

                  {/* Badge */}
                  {isOpen && item.badge && (
                    <div
                      className={`text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 transition-colors duration-200 ${
                        isDarkMode ? "bg-blue-600" : "bg-gray-600"
                      }`}
                    >
                      {item.badge}
                    </div>
                  )}

                  {/* Chevron for expandable sections */}
                  {isOpen && item.expandable && (
                    <button
                      onClick={() => toggleSection(item.label)}
                      className={`p-1 rounded transition-colors duration-200 ${
                        isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                      }`}
                    >
                      <IoIosArrowDown
                        className={`w-4 h-4 transition-all duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        } ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      />
                    </button>
                  )}
                </div>

                {/* Sub-items */}
                {isOpen && item.expandable && isExpanded && item.subItems && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.path}
                        href={subItem.path}
                        className={`block px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                          pathname === subItem.path
                            ? isDarkMode
                              ? "text-blue-300 bg-blue-900"
                              : "text-blue-600 bg-blue-50"
                            : isDarkMode
                              ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      {/* Toggle Button - Responsive positioning */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 z-50 w-6 h-6 md:w-7 md:h-7 sm:w-5 sm:h-5 ${
          isDarkMode
            ? "bg-gray-800 border border-gray-600 hover:bg-gray-700"
            : "bg-white border border-gray-300 hover:bg-gray-50"
        }`}
        style={{
          transform: "translateY(-50%)",
          left: isOpen ? "calc(16rem - 16px)" : "calc(4rem - 16px)",
        }}
      >
        <RxDoubleArrowLeft
          className={`w-3 h-3 ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        />
      </button>
    </div>
  );
}
