"use client";

import { Filter, Plus, Search } from "lucide-react";

interface ProductsHeaderProps {
  search: string;
  includeArchived: boolean;
  selectedBrandId: number | null;
  selectedCategoryId: number | null;
  brands: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  onSearchChange: (value: string) => void;
  onBrandChange: (value: number | null) => void;
  onCategoryChange: (value: number | null) => void;
  onToggleArchived: () => void;
  onOpenCreate: () => void;
}

export function ProductsHeader({
  search,
  includeArchived,
  selectedBrandId,
  selectedCategoryId,
  brands,
  categories,
  onSearchChange,
  onBrandChange,
  onCategoryChange,
  onToggleArchived,
  onOpenCreate
}: ProductsHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Catalog Management</p>
          <h1 className="text-2xl font-semibold text-zinc-100">Products</h1>
        </div>
        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#12121A] px-3 py-2">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by product or brand"
            className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#12121A] px-3 py-2 text-sm text-zinc-300">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <select
            value={selectedBrandId ?? ""}
            onChange={(event) => onBrandChange(event.target.value ? Number(event.target.value) : null)}
            className="rounded-xl border border-white/10 bg-[#12121A] px-3 py-2 text-sm text-zinc-300"
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <select
            value={selectedCategoryId ?? ""}
            onChange={(event) => onCategoryChange(event.target.value ? Number(event.target.value) : null)}
            className="rounded-xl border border-white/10 bg-[#12121A] px-3 py-2 text-sm text-zinc-300"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            onClick={onToggleArchived}
            className={`rounded-xl border px-3 py-2 text-sm transition ${
              includeArchived
                ? "border-violet-500/40 bg-violet-500/20 text-violet-100"
                : "border-white/10 bg-[#12121A] text-zinc-300"
            }`}
          >
            {includeArchived ? "Viewing Archived" : "Hide Archived"}
          </button>
        </div>
      </div>
    </header>
  );
}
