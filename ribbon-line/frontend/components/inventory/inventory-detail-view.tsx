"use client";

import dynamic from "next/dynamic";
import { memo, useState } from "react";
import { ArrowLeft, Barcode, Boxes, Package, Settings2, Truck } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { InventorySettingsModal } from "@/components/inventory/inventory-settings-modal";
import { InventoryStockHealthCard } from "@/components/inventory/inventory-stock-health-card";
import { InventoryStockOperations } from "@/components/inventory/inventory-stock-operations";
import { formatLkr } from "@/lib/currency";
import type { InventoryItem } from "@/types/inventory";

interface InventoryDetailViewProps {
  item: InventoryItem | null;
  loading: boolean;
  onBack: () => void;
  onUpdated: (item: InventoryItem) => void;
}

const InventoryAnalyticsPanel = dynamic(
  () => import("@/components/inventory/inventory-analytics-panel").then((mod) => mod.InventoryAnalyticsPanel),
  { ssr: false, loading: () => <LazyCard title="Stock Intelligence" /> }
);

const InventoryMovementHistory = dynamic(
  () => import("@/components/inventory/inventory-movement-history").then((mod) => mod.InventoryMovementHistory),
  { ssr: false, loading: () => <LazyCard title="Movement History" /> }
);

function LazyCard({ title }: { title: string }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{title}</p>
      <div className="mt-4 space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
        <div className="h-20 animate-pulse rounded-lg bg-white/5" />
      </div>
    </section>
  );
}

function DetailLoading() {
  return (
    <div className="space-y-4">
      <div className="h-12 animate-pulse rounded-xl bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-b-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-medium tabular-nums text-zinc-100">{value}</span>
    </div>
  );
}

function InventoryDetailViewComponent({ item, loading, onBack, onUpdated }: InventoryDetailViewProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading || !item) {
    return <DetailLoading />;
  }

  const handleUpdated = (updated: InventoryItem) => {
    setRefreshKey((value) => value + 1);
    onUpdated(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-white/10 p-2 text-zinc-300 transition hover:bg-white/5"
            aria-label="Back to inventory list"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Inventory Detail</p>
            <h2 className="truncate text-xl font-semibold text-zinc-100">{item.name}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-white/5"
        >
          <Settings2 className="h-4 w-4" />
          Inventory Settings
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#12121A]">
              <ProductImage
                src={item.image_url}
                alt={item.name}
                containerClassName="h-full w-full"
                showFallbackLabel={false}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-zinc-100">{item.name}</p>
              <p className="mt-1 truncate text-sm text-zinc-400">{item.brand_name}</p>
              <p className="mt-2 text-sm text-zinc-500">{item.description || "No description recorded."}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-x-5 gap-y-4 border-t border-white/10 pt-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-sky-300" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Category</p>
                <p className="truncate text-sm text-zinc-200">{item.category_name ?? "Uncategorized"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-emerald-300" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Supplier</p>
                <p className="truncate text-sm text-zinc-200">{item.supplier_name ?? "Not recorded"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Boxes className="h-4 w-4 text-amber-300" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">SKU</p>
                <p className="truncate text-sm text-zinc-200">{item.sku ?? "Not recorded"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Barcode className="h-4 w-4 text-indigo-300" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Barcode</p>
                <p className="truncate text-sm text-zinc-200">{item.barcode ?? "Not recorded"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Pricing & Value</p>
          <div className="mt-3">
            <ValueRow label="Current Quantity" value={`${item.stock_quantity.toLocaleString()} ${item.base_unit}${item.stock_quantity === 1 ? "" : "s"}`} />
            <ValueRow label="Unit Cost" value={formatLkr(item.unit_cost)} />
            <ValueRow label="Selling Price" value={formatLkr(item.selling_price)} />
            <ValueRow label="Inventory Value" value={formatLkr(item.inventory_value)} />
            <ValueRow label="Standard Pack Size" value={item.standard_pack_size.toLocaleString()} />
          </div>
        </section>

        <InventoryStockHealthCard item={item} />
        <InventoryStockOperations item={item} onUpdated={handleUpdated} />

        <InventoryAnalyticsPanel productId={item.product_id} refreshKey={refreshKey} />
        <InventoryMovementHistory productId={item.product_id} refreshKey={refreshKey} />
      </div>

      <InventorySettingsModal
        isOpen={settingsOpen}
        item={item}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleUpdated}
      />
    </div>
  );
}

export const InventoryDetailView = memo(InventoryDetailViewComponent);
