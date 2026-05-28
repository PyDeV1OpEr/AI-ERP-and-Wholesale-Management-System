"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Loader2,
  PackageOpen,
  X,
} from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { formatLkr } from "@/lib/currency";
import type { InventoryItem, StockMovement } from "@/types/inventory";

interface InventorySidePanelProps {
  item: InventoryItem | null;
  movements: StockMovement[];
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  healthy: { label: "Healthy", classes: "bg-emerald-500/20 text-emerald-300" },
  low_stock: { label: "Low Stock", classes: "bg-amber-500/20 text-amber-300" },
  critical: { label: "Critical", classes: "bg-rose-500/20 text-rose-300" },
  out_of_stock: { label: "Out of Stock", classes: "bg-zinc-800/90 text-zinc-400" },
};

const MOVEMENT_ICONS: Record<string, { icon: typeof ArrowUp; color: string }> = {
  received: { icon: ArrowDown, color: "text-emerald-400" },
  sent: { icon: ArrowUp, color: "text-rose-400" },
  adjusted: { icon: PackageOpen, color: "text-amber-400" },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function UnitDisplay({ item }: { item: InventoryItem }) {
  const baseQty = item.stock_quantity;
  const parentUnit = item.units.find((u) => !u.is_base);
  if (!parentUnit || !parentUnit.conversion_quantity) {
    return (
      <span>
        {baseQty.toLocaleString()} {item.base_unit}s
      </span>
    );
  }
  const parentQty = Math.floor(baseQty / parentUnit.conversion_quantity);
  const remainder = baseQty % parentUnit.conversion_quantity;
  return (
    <span>
      {parentQty > 0 && <>{parentQty} {parentUnit.unit_name}s </>}
      {remainder > 0 && (
        <span className="text-zinc-400">
          ({remainder} {item.base_unit}{remainder > 1 ? "s" : ""})
        </span>
      )}
    </span>
  );
}

export function InventorySidePanel({ item, movements, loading, isOpen, onClose }: InventorySidePanelProps) {
  return (
    <AnimatePresence>
      {isOpen && item && (
        <>
          <motion.button
            type="button"
            aria-label="Close panel backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="relative z-40 shrink-0 overflow-hidden border-l border-white/10 bg-[#0D0D12] lg:block"
          >
            <div className="flex h-full w-[380px] flex-col">
              <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-violet-300">Inventory Detail</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200"
                  aria-label="Close panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="relative mb-5 h-44 w-full overflow-hidden rounded-xl border border-white/10">
                  <ProductImage
                    src={item.image_url}
                    alt={item.name}
                    containerClassName="h-full w-full"
                    showFallbackLabel={false}
                  />
                </div>

                <div className="mb-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-zinc-100">{item.name}</h2>
                      <p className="text-sm text-zinc-400">{item.brand_name}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        (STATUS_STYLES[item.status] ?? STATUS_STYLES.healthy).classes
                      }`}
                    >
                      {(STATUS_STYLES[item.status] ?? STATUS_STYLES.healthy).label}
                    </span>
                  </div>
                </div>

                <div className="mb-5 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Available Quantity</span>
                    <span className="text-sm font-semibold tabular-nums text-zinc-100">
                      <UnitDisplay item={item} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Base Unit</span>
                    <span className="text-sm tabular-nums text-zinc-200">{item.base_unit}</span>
                  </div>
                  {item.units
                    .filter((u) => !u.is_base)
                    .map((u) => (
                      <div key={u.unit_name} className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">{u.unit_name}</span>
                        <span className="text-sm tabular-nums text-zinc-200">
                          {u.conversion_quantity ?? "?"} {u.parent_unit_name ?? item.base_unit}s
                        </span>
                      </div>
                    ))}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Unit Cost</span>
                    <span className="text-sm tabular-nums text-zinc-100">{formatLkr(item.unit_cost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Inventory Value</span>
                    <span className="text-sm font-semibold tabular-nums text-violet-200">
                      {formatLkr(item.inventory_value)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Reorder Level</span>
                    <span className="text-sm tabular-nums text-zinc-200">{item.reorder_level.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <h3 className="text-sm font-semibold text-zinc-100">Recent Movements</h3>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    </div>
                  ) : movements.length === 0 ? (
                    <p className="py-6 text-center text-xs text-zinc-500">No recent movements recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {movements.map((mov) => {
                        const iconDef = MOVEMENT_ICONS[mov.type] ?? MOVEMENT_ICONS.adjusted;
                        const Icon = iconDef.icon;
                        return (
                          <div
                            key={mov.id}
                            className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
                          >
                            <div className={`mt-0.5 rounded-lg p-1.5 ${iconDef.color} bg-white/5`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-zinc-100">
                                {mov.type === "received" && "Received"}
                                {mov.type === "sent" && "Sent"}
                                {mov.type === "adjusted" && "Adjusted"}{" "}
                                <span className="tabular-nums font-medium">{Math.abs(mov.quantity)}</span> units
                              </p>
                              {mov.notes && (
                                <p className="mt-0.5 truncate text-xs text-zinc-500">{mov.notes}</p>
                              )}
                            </div>
                            <span className="shrink-0 text-[10px] text-zinc-500">
                              {formatTimeAgo(mov.created_at)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
