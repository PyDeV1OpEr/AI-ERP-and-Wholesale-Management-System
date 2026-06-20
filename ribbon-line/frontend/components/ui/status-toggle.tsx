"use client";

import { cn } from "@/lib/utils";

interface StatusToggleProps {
  isActive: boolean;
  onActiveChange: (active: boolean) => void;
}

export function StatusToggle({ isActive, onActiveChange }: StatusToggleProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onActiveChange(true)}
        className={cn(
          "rounded-xl border p-4 text-left transition",
          isActive
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-white/10 bg-[#12121A] hover:border-white/20"
        )}
      >
        <p className="text-sm font-medium text-zinc-100">Active</p>
        <p className="mt-1 text-xs text-zinc-500">Visible and available for use across the ERP.</p>
      </button>
      <button
        type="button"
        onClick={() => onActiveChange(false)}
        className={cn(
          "rounded-xl border p-4 text-left transition",
          !isActive
            ? "border-amber-500/40 bg-amber-500/10"
            : "border-white/10 bg-[#12121A] hover:border-white/20"
        )}
      >
        <p className="text-sm font-medium text-zinc-100">Inactive</p>
        <p className="mt-1 text-xs text-zinc-500">Kept in catalog but marked unavailable for operations.</p>
      </button>
    </div>
  );
}
