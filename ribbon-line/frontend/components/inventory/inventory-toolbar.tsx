"use client";

import { memo } from "react";
import { Grid3X3, List, Search } from "lucide-react";
import type { Category } from "@/types/products";

interface InventoryToolbarProps {
  search: string;
  selectedCategoryId: number | null;
  selectedStatus: string | null;
  categories: Category[];
  viewMode: "list" | "grid";
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: number | null) => void;
  onStatusChange: (value: string | null) => void;
  onViewModeChange: (mode: "list" | "grid") => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "healthy", label: "Healthy" },
  { value: "overstocked", label: "Overstocked" },
  { value: "low_stock", label: "Low Stock" },
  { value: "critical", label: "Critical" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "not_configured", label: "Needs Setup" },
];

function InventoryToolbarComponent({
  search,
  selectedCategoryId,
  selectedStatus,
  categories,
  viewMode,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onViewModeChange,
}: InventoryToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#12121A] px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search inventory by product or brand..."
          className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedCategoryId ?? ""}
          onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : null)}
          className="min-w-36 rounded-xl border border-white/10 bg-[#12121A] px-3 py-2 text-sm text-zinc-300 outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus ?? ""}
          onChange={(e) => onStatusChange(e.target.value || null)}
          className="min-w-36 rounded-xl border border-white/10 bg-[#12121A] px-3 py-2 text-sm text-zinc-300 outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#12121A] p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`rounded-lg p-1.5 transition ${
              viewMode === "list"
                ? "bg-violet-500/20 text-violet-100"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`rounded-lg p-1.5 transition ${
              viewMode === "grid"
                ? "bg-violet-500/20 text-violet-100"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            aria-label="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export const InventoryToolbar = memo(InventoryToolbarComponent);
