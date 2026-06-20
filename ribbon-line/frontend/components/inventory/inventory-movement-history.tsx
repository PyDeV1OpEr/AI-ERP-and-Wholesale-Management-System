"use client";

import { memo, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, PackageOpen } from "lucide-react";
import { getInventoryMovements } from "@/lib/inventory-api";
import type { InventoryMovementPageResponse, StockMovement } from "@/types/inventory";

interface InventoryMovementHistoryProps {
  productId: number;
  refreshKey: number;
}

const MOVEMENT_ICON: Record<string, { icon: typeof ArrowDown; classes: string; label: string }> = {
  STOCK_IN: { icon: ArrowDown, classes: "bg-emerald-500/10 text-emerald-300", label: "Stock In" },
  STOCK_OUT: { icon: ArrowUp, classes: "bg-rose-500/10 text-rose-300", label: "Stock Out" },
  OPENING_STOCK: { icon: ArrowDown, classes: "bg-sky-500/10 text-sky-300", label: "Opening Stock" },
  ADJUSTMENT: { icon: PackageOpen, classes: "bg-amber-500/10 text-amber-300", label: "Adjusted" },
};

function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateStr));
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const meta = MOVEMENT_ICON[movement.movement_type] ?? MOVEMENT_ICON.ADJUSTMENT;
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className={`mt-0.5 rounded-lg p-1.5 ${meta.classes}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-100">
          {meta.label} <span className="tabular-nums font-semibold">{Math.abs(movement.quantity).toLocaleString()}</span> units
        </p>
        {movement.notes ? <p className="mt-1 truncate text-xs text-zinc-500">{movement.notes}</p> : null}
      </div>
      <p className="shrink-0 text-xs text-zinc-500">{formatTime(movement.created_at)}</p>
    </div>
  );
}

function InventoryMovementHistoryComponent({ productId, refreshKey }: InventoryMovementHistoryProps) {
  const [data, setData] = useState<InventoryMovementPageResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [productId, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getInventoryMovements(productId, { page, page_size: 10 })
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch(() => {
        if (!cancelled) setData({ items: [], page, page_size: 10, total: 0, total_pages: 0 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, page, refreshKey]);

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Movement History</p>
          <h3 className="mt-1 text-base font-semibold text-zinc-100">Recent Activity</h3>
        </div>
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-zinc-500" /> : null}
      </div>

      {!loading && (!data || data.items.length === 0) ? (
        <div className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-zinc-500">
          No stock movements recorded yet.
        </div>
      ) : null}

      <div className="space-y-2">
        {(data?.items ?? []).map((movement) => (
          <MovementRow key={movement.id} movement={movement} />
        ))}
      </div>

      {data && data.total_pages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Page {data.page} of {data.total_pages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(value - 1, 1))}
              disabled={loading || page <= 1}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => value + 1)}
              disabled={loading || page >= data.total_pages}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export const InventoryMovementHistory = memo(InventoryMovementHistoryComponent);

