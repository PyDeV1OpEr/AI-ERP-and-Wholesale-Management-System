"use client";

import { memo } from "react";
import type { InventoryItem, InventoryStatus } from "@/types/inventory";

const HEALTH_LABELS: Record<InventoryStatus, string> = {
  out_of_stock: "Out of Stock",
  critical: "Critical",
  low_stock: "Low",
  healthy: "Healthy",
  overstocked: "Overstocked",
  not_configured: "Needs Setup",
};

const HEALTH_BAR: Record<InventoryStatus, string> = {
  out_of_stock: "bg-rose-500",
  critical: "bg-orange-500",
  low_stock: "bg-amber-500",
  healthy: "bg-emerald-500",
  overstocked: "bg-indigo-500",
  not_configured: "bg-zinc-500",
};

function InventoryStockHealthCardComponent({ item }: { item: InventoryItem }) {
  const percentage = item.stock_health_percentage;
  const width = percentage == null ? 0 : Math.min(Math.max(percentage, 0), 100);
  const status = item.stock_health_status;

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Stock Health</p>
          <h3 className="mt-1 text-base font-semibold text-zinc-100">{HEALTH_LABELS[status] ?? "Needs Setup"}</h3>
        </div>
        <p className="text-2xl font-semibold tabular-nums text-zinc-100">
          {percentage == null ? "--" : `${percentage.toFixed(1)}%`}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${HEALTH_BAR[status] ?? HEALTH_BAR.not_configured}`} style={{ width: `${width}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-zinc-500">Current</p>
          <p className="mt-1 tabular-nums text-zinc-200">{item.stock_quantity.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Capacity</p>
          <p className="mt-1 tabular-nums text-zinc-200">{item.max_capacity > 0 ? item.max_capacity.toLocaleString() : "Not set"}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Reorder</p>
          <p className="mt-1 tabular-nums text-zinc-200">{item.reorder_level.toLocaleString()}</p>
        </div>
      </div>
    </section>
  );
}

export const InventoryStockHealthCard = memo(InventoryStockHealthCardComponent);

