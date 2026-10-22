"use client";
import { useState } from "react";

/**
 * Splits a list that is already in memory into pages for <TablePagination>.
 * Goes back to page 1 whenever `resetKey` changes (e.g. a filter or search).
 */
export function usePagedList<T>(items: T[], pageSize = 10, resetKey?: unknown) {
  const [page, setPage] = useState(1);
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setPage(1);
  }

  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pages,
    limit: pageSize,
    total: items.length,
    setPage,
  };
}
