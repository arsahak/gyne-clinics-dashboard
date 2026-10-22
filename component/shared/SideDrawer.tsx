"use client";
import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

interface SideDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  isDarkMode: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Panel that slides in from the right, for a payment or payout's details. */
const SideDrawer = ({ open, title, subtitle, isDarkMode, onClose, children, footer }: SideDrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <aside
        role="dialog"
        aria-label={title}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        } ${isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}
      >
        <header className={`flex items-start justify-between gap-3 border-b px-6 py-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{title}</h2>
            {subtitle && <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            <FaTimes />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className={`border-t px-6 py-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>{footer}</footer>}
      </aside>
    </div>
  );
};

export default SideDrawer;
