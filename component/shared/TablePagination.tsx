"use client";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface TablePaginationProps {
  page: number;
  pages: number;
  limit: number;
  total: number;
  itemLabel: string;
  isDarkMode: boolean;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

// 1 2 3 4 5 … 49 style page list; collapses gaps with an ellipsis once there are >7 pages.
const getPageItems = (current: number, total: number): (number | "ellipsis")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis", total];
  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
};

const TablePagination = ({
  page,
  pages,
  limit,
  total,
  itemLabel,
  isDarkMode,
  disabled = false,
  onPageChange,
}: TablePaginationProps) => {
  if (total === 0) return null;

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const navButton = `flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
    isDarkMode ? "text-gray-300 enabled:hover:bg-gray-700" : "text-gray-600 enabled:hover:bg-gray-100"
  }`;

  const goTo = (next: number) => {
    if (next < 1 || next > pages || next === page) return;
    onPageChange(next);
  };

  return (
    <div
      className={`px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <p className={`text-sm ${muted}`}>
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} {itemLabel}
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button onClick={() => goTo(page - 1)} disabled={page <= 1 || disabled} className={navButton}>
          <FaChevronLeft size={10} /> Back
        </button>

        {getPageItems(page, pages).map((item, i) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className={`w-9 text-center text-sm ${muted}`}>
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => goTo(item)}
              disabled={disabled}
              aria-current={item === page ? "page" : undefined}
              className={`h-9 min-w-9 px-2 rounded-lg text-sm font-semibold transition-colors ${
                item === page
                  ? isDarkMode
                    ? "bg-white text-gray-900"
                    : "bg-gray-900 text-white"
                  : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= pages || disabled}
          className={navButton}
        >
          Next <FaChevronRight size={10} />
        </button>
      </nav>
    </div>
  );
};

export default TablePagination;
