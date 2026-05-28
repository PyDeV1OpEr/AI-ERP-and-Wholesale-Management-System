"use client";

import { memo, useMemo } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { formatLkr } from "@/lib/currency";
import type { InventoryItem, InventoryStatus } from "@/types/inventory";

interface InventoryListingProps {
  items: InventoryItem[];
  loading: boolean;
  viewMode: "list" | "grid";
  onItemClick: (item: InventoryItem) => void;
  selectedItemId: number | null;
}

const STATUS_STYLES: Record<InventoryStatus, { label: string; classes: string }> = {
  healthy: { label: "Healthy", classes: "bg-emerald-500/15 text-emerald-200" },
  overstocked: { label: "Overstocked", classes: "bg-indigo-500/15 text-indigo-200" },
  low_stock: { label: "Low Stock", classes: "bg-amber-500/15 text-amber-200" },
  critical: { label: "Critical", classes: "bg-orange-500/15 text-orange-200" },
  out_of_stock: { label: "Out of Stock", classes: "bg-rose-500/15 text-rose-200" },
  not_configured: { label: "Needs Setup", classes: "bg-zinc-700/60 text-zinc-300" },
};

function QuantityDisplay({ item }: { item: InventoryItem }) {
  return (
    <span className="tabular-nums">
      {item.stock_quantity.toLocaleString()} {item.base_unit}
      {item.stock_quantity === 1 ? "" : "s"}
    </span>
  );
}

function StockHealthInline({ item }: { item: InventoryItem }) {
  const width = item.stock_health_percentage == null ? 0 : Math.min(item.stock_health_percentage, 100);
  return (
    <div className="w-28">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] text-zinc-500">Health</span>
        <span className="text-[10px] tabular-nums text-zinc-400">
          {item.stock_health_percentage == null ? "Setup" : `${item.stock_health_percentage.toFixed(1)}%`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-zinc-300" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function LoadingRows({ viewMode }: { viewMode: "list" | "grid" }) {
  return (
    <div className={viewMode === "grid" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2"}>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className={viewMode === "grid" ? "h-40 animate-pulse rounded-xl bg-white/5" : "h-16 animate-pulse rounded-xl bg-white/5"} />
      ))}
    </div>
  );
}

function InventoryListingComponent({ items, loading, viewMode, onItemClick, selectedItemId }: InventoryListingProps) {
  const emptyCopy = useMemo(
    () => ({
      title: "No inventory items found.",
      body: "Create products or adjust filters to see inventory records.",
    }),
    []
  );

  if (loading) {
    return <LoadingRows viewMode={viewMode} />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
        <p className="text-zinc-300">{emptyCopy.title}</p>
        <p className="mt-1 text-sm text-zinc-500">{emptyCopy.body}</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const status = STATUS_STYLES[item.status] ?? STATUS_STYLES.not_configured;
          return (
            <button
              key={item.product_id}
              type="button"
              onClick={() => onItemClick(item)}
              className={`flex min-h-40 flex-col rounded-xl border p-4 text-left transition ${
                selectedItemId === item.product_id
                  ? "border-sky-500/50 bg-sky-500/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#12121A]">
                  <ProductImage
                    src={item.image_url}
                    alt={item.name}
                    containerClassName="h-full w-full"
                    showFallbackLabel={false}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-100">{item.name}</p>
                  <p className="truncate text-xs text-zinc-500">{item.brand_name}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.classes}`}>
                  {status.label}
                </span>
              </div>

              <div className="mt-auto space-y-2 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Quantity</span>
                  <span className="text-zinc-100"><QuantityDisplay item={item} /></span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Value</span>
                  <span className="text-zinc-100">{formatLkr(item.inventory_value)}</span>
                </div>
                <StockHealthInline item={item} />
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const status = STATUS_STYLES[item.status] ?? STATUS_STYLES.not_configured;
        return (
          <button
            key={item.product_id}
            type="button"
            onClick={() => onItemClick(item)}
            className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition ${
              selectedItemId === item.product_id
                ? "border-sky-500/50 bg-sky-500/10"
                : "border-white/10 bg-white/[0.03] hover:border-white/20"
            }`}
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#12121A]">
              <ProductImage
                src={item.image_url}
                alt={item.name}
                containerClassName="h-full w-full"
                showFallbackLabel={false}
              />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
              <div className="min-w-0 flex-[2]">
                <p className="truncate text-sm font-medium text-zinc-100">{item.name}</p>
                <p className="truncate text-xs text-zinc-500">{item.category_name ?? "Uncategorized"}</p>
              </div>
              <div className="hidden w-28 shrink-0 md:block">
                <p className="text-xs text-zinc-500">Brand</p>
                <p className="truncate text-sm text-zinc-200">{item.brand_name}</p>
              </div>
              <div className="w-36 shrink-0">
                <p className="text-xs text-zinc-500">Quantity</p>
                <p className="text-sm text-zinc-100"><QuantityDisplay item={item} /></p>
              </div>
              <div className="hidden w-32 shrink-0 lg:block">
                <p className="text-xs text-zinc-500">Inventory Value</p>
                <p className="text-sm tabular-nums text-zinc-100">{formatLkr(item.inventory_value)}</p>
              </div>
              <div className="hidden shrink-0 lg:block">
                <StockHealthInline item={item} />
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}>
                {status.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export const InventoryListing = memo(InventoryListingComponent);

