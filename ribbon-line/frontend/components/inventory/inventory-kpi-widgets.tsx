"use client";

import { memo, useMemo } from "react";
import { Banknote, Boxes, PackageX, TrendingUp, TriangleAlert, Warehouse } from "lucide-react";
import type { InventoryKpiData } from "@/types/inventory";

interface InventoryKpiWidgetsProps {
  kpi: InventoryKpiData;
}

function InventoryKpiWidgetsComponent({ kpi }: InventoryKpiWidgetsProps) {
  const widgets = useMemo(
    () => [
      {
        key: "total_items",
        icon: Boxes,
        label: "Inventory Items",
        value: kpi.total_items.toLocaleString(),
        classes: "border-sky-500/20 bg-sky-500/10 text-sky-200",
      },
      {
        key: "total_value",
        icon: Banknote,
        label: "Inventory Value",
        value: `LKR ${kpi.total_value.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`,
        classes: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      },
      {
        key: "low_stock_count",
        icon: TriangleAlert,
        label: "Low / Critical",
        value: (kpi.low_stock_count + kpi.critical_count).toLocaleString(),
        classes: "border-amber-500/20 bg-amber-500/10 text-amber-200",
      },
      {
        key: "out_of_stock_count",
        icon: PackageX,
        label: "Out of Stock",
        value: kpi.out_of_stock_count.toLocaleString(),
        classes: "border-rose-500/20 bg-rose-500/10 text-rose-200",
      },
      {
        key: "overstocked_count",
        icon: Warehouse,
        label: "Overstocked",
        value: kpi.overstocked_count.toLocaleString(),
        classes: "border-indigo-500/20 bg-indigo-500/10 text-indigo-200",
      },
      {
        key: "fast_moving_count",
        icon: TrendingUp,
        label: "Fast Moving",
        value: kpi.fast_moving_count.toLocaleString(),
        classes: "border-teal-500/20 bg-teal-500/10 text-teal-200",
      },
    ],
    [kpi]
  );

  return (
    <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {widgets.map((widget) => (
        <div key={widget.key} className={`rounded-xl border p-4 ${widget.classes}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs text-zinc-400">{widget.label}</p>
            <widget.icon className="h-4 w-4 shrink-0" />
          </div>
          <p className="mt-2 text-lg font-semibold leading-tight tabular-nums text-zinc-100">{widget.value}</p>
        </div>
      ))}
    </section>
  );
}

export const InventoryKpiWidgets = memo(InventoryKpiWidgetsComponent);
