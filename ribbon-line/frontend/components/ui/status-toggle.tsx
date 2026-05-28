"use client";

import { cn } from "@/lib/utils";

interface StatusToggleProps {
  isActive: boolean;
  isArchived: boolean;
  onActiveChange: (active: boolean) => void;
  onArchivedChange: (archived: boolean) => void;
}

export function StatusToggle({ isActive, isArchived, onActiveChange, onArchivedChange }: StatusToggleProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => {
          onArchivedChange(false);
          onActiveChange(true);
        }}
        className={cn(
          "rounded-xl border p-4 text-left transition",
          !isArchived && isActive
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-white/10 bg-[#12121A] hover:border-white/20"
        )}
      >
        <p className="text-sm font-medium text-zinc-100">Active</p>
        <p className="mt-1 text-xs text-zinc-500">Visible and available for use across the ERP.</p>
      </button>
      <button
        type="button"
        onClick={() => {
          onArchivedChange(true);
          onActiveChange(false);
        }}
        className={cn(
          "rounded-xl border p-4 text-left transition",
          isArchived
            ? "border-zinc-500/40 bg-zinc-500/10"
            : "border-white/10 bg-[#12121A] hover:border-white/20"
        )}
      >
        <p className="text-sm font-medium text-zinc-100">Archived</p>
        <p className="mt-1 text-xs text-zinc-500">Hidden from daily use but kept safely in the database.</p>
      </button>
    </div>
  );
}
