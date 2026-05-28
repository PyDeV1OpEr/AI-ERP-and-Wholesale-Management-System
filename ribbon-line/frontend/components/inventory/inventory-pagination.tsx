"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo } from "react";

interface InventoryPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

function InventoryPaginationComponent({
  page,
  pageSize,
  total,
  totalPages,
  loading,
  onPageChange,
}: InventoryPaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-400">
        Showing <span className="tabular-nums text-zinc-200">{start.toLocaleString()}</span>-
        <span className="tabular-nums text-zinc-200">{end.toLocaleString()}</span> of{" "}
        <span className="tabular-nums text-zinc-200">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={loading || page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <span className="min-w-24 text-center text-sm tabular-nums text-zinc-400">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={loading || page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export const InventoryPagination = memo(InventoryPaginationComponent);

