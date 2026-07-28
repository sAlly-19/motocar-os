import { useMemo, useState, useEffect } from 'react';

export interface PaginationResult<T> {
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  currentItems: T[];
  next: () => void;
  prev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Simple client-side pagination over an in-memory array.
 * Automatically clamps page to a valid range when the source array shrinks
 * (e.g. after delete or filter).
 */
export function usePagination<T>(items: T[], pageSize = 20): PaginationResult<T> {
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const currentItems = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize, totalPages]);

  const next = () => setPage((p) => Math.min(totalPages, p + 1));
  const prev = () => setPage((p) => Math.max(1, p - 1));

  return {
    page,
    setPage: (p: number) => setPage(Math.min(totalPages, Math.max(1, p))),
    totalPages,
    totalItems,
    pageSize,
    currentItems,
    next,
    prev,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
