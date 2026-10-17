"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FaAd,
  FaBookOpen,
  FaFileAlt,
  FaRobot,
  FaStethoscope,
  FaUserShield,
} from "react-icons/fa";
import { IoIosArrowDown, IoMdHome, IoMdMoon, IoMdSunny } from "react-icons/io";
import { MdSettings, MdVideocam } from "react-icons/md";
import { RxDoubleArrowLeft } from "react-icons/rx";

interface MenuItem {
  icon: React.ReactElement;
  label: string;
  path: string;
  expandable?: boolean;
  subItems?: { label: string; path: string }[];
  badge?: string;
}

const getMenuItems = (language: string): MenuItem[] => [
  {
    icon: <IoMdHome className="w-5 h-5" />,
    label: "Dashboard",
    path: "/",
  },
  {
    icon: <FaUserShield className="w-5 h-5" />,
    label: "Patient",
    path: "/patient",
  },
  {
    icon: <FaStethoscope className="w-5 h-5" />,
    label: "Doctor Discovery",
    path: "/doctors",
    expandable: true,
    subItems: [
      { label: "Doctors", path: "/doctors" },
      { label: "Doctor Reviews", path: "/doctor-reviews" },
      { label: "Chat Moderation", path: "/chat-moderation" },
      { label: "Chat Monitoring", path: "/chat-monitoring" },
      { label: "Reports", path: "/reports" },
      { label: "Notifications", path: "/notifications" },
      { label: "Analytics", path: "/doctor-analytics" },
    ],
  },
  // {
  //   icon: <FaShoppingCart className="w-5 h-5" />,
  //   label: "Orders",
  //   path: "/orders",
  // },
  // {
  //   icon: <FaBoxOpen className="w-5 h-5" />,
  //   label: "Products",
  //   path: "/products",
  // },
  // {
  //   icon: <FaTags className="w-5 h-5" />,
  //   label: "Categories",
  //   path: "/categories",
  // },
  // {
  //   icon: <MdInventory className="w-5 h-5" />,
  //   label: "Inventory",
  //   path: "/inventory",
  // },
  // {
  //   icon: <FaUsers className="w-5 h-5" />,
  //   label: "Customers",
  //   path: "/customers",
  // },
  // {
  //   icon: <FaChartLine className="w-5 h-5" />,
  //   label: "Analytics",
  //   path: "/analytics",
  // },
  // {
  //   icon: <FaClipboardList className="w-5 h-5" />,
  //   label: "Reviews",
  //   path: "/reviews",
  // },
  {
    icon: <FaFileAlt className="w-5 h-5" />,
    label: "Content",
    path: "/content",
  },
  {
    icon: <FaBookOpen className="w-5 h-5" />,
    label: "Stories",
    path: "/stories",
  },

  {
    icon: <FaRobot className="w-5 h-5" />,
    label: "AI Chatbot",
    path: "/ai-chatbot",
    expandable: true,
    // badge: "NEW",
    subItems: [
      { label: "Train AI", path: "/ai-chatbot/knowledge-base" },
      { label: "Conversations", path: "/ai-chatbot/conversations" },
      { label: "Statistics", path: "/ai-chatbot/stats" },
    ],
  },
  {
    icon: <FaAd className="w-5 h-5" />,
    label: "Advertisements",
    path: "/advertisements",
  },
  // {
  //   icon: <FaClipboardCheck className="w-5 h-5" />,
  //   label: "Audit Logs",
  //   path: "/audit-logs",
  // },
  {
    icon: <MdVideocam className="w-5 h-5" />,
    label: "Consultation Settings",
    path: "/consultation-settings",
  },
  {
    icon: <MdSettings className="w-5 h-5" />,
    label: "Settings",
    path: "/settings",
  },
];

export default function Sidebar() {
  const { isOpen, setIsOpen, isMobile, isDarkMode, setIsDarkMode } =
    useSidebar();
  const { language } = useLanguage();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const menuItems = getMenuItems(language);

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
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const isExpanded = expandedSections[item.label];

            return (
              <div key={item.path}>
                <div className="flex items-center">
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 flex-1 ${
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
        </nav>

        {/* Theme Toggle */}
        <div
          className={`p-3 transition-colors duration-200 ${
            isDarkMode ? "border-t border-gray-700" : "border-t border-gray-200"
          }`}
        >
          {isOpen ? (
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                isDarkMode
                  ? "text-gray-300 hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {isDarkMode ? (
                <IoMdSunny className="w-5 h-5" />
              ) : (
                <IoMdMoon className="w-5 h-5" />
              )}
              <span className="font-medium text-sm">
                {isDarkMode
                  ? getTranslation("lightMode", language)
                  : getTranslation("darkMode", language)}
              </span>
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-full flex items-center justify-center px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "text-gray-300 hover:bg-gray-800"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isDarkMode ? (
                  <IoMdSunny className="w-5 h-5" />
                ) : (
                  <IoMdMoon className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
        </div>
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
