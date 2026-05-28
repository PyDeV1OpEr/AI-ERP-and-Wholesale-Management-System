"use client";

import { FormEvent, memo, useMemo, useState } from "react";
import { Loader2, Minus, PackagePlus, SlidersHorizontal } from "lucide-react";
import { applyInventoryStockOperation } from "@/lib/inventory-api";
import { formatApiError } from "@/lib/format-api-error";
import { useToast } from "@/components/ui/toast";
import type { InventoryItem, InventoryStockOperationPayload } from "@/types/inventory";

interface InventoryStockOperationsProps {
  item: InventoryItem;
  onUpdated: (item: InventoryItem) => void;
}

const OPERATIONS: Array<{
  value: InventoryStockOperationPayload["operation"];
  label: string;
  icon: typeof PackagePlus;
}> = [
  { value: "add", label: "Add", icon: PackagePlus },
  { value: "remove", label: "Remove", icon: Minus },
  { value: "adjust", label: "Adjust", icon: SlidersHorizontal },
];

function InventoryStockOperationsComponent({ item, onUpdated }: InventoryStockOperationsProps) {
  const toast = useToast();
  const [operation, setOperation] = useState<InventoryStockOperationPayload["operation"]>("add");
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const quantityLabel = useMemo(() => {
    if (operation === "adjust") return "Set quantity to";
    return operation === "add" ? "Quantity to add" : "Quantity to remove";
  }, [operation]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await applyInventoryStockOperation(item.product_id, {
        operation,
        quantity,
        notes: notes.trim() || null,
      });
      onUpdated(response.item);
      setQuantity(0);
      setNotes("");
      toast.success("Inventory quantity updated");
    } catch (err) {
      toast.error(formatApiError(err instanceof Error ? err.message : "Stock operation failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Manage Inventory</p>
        <h3 className="mt-1 text-base font-semibold text-zinc-100">Stock Quantity</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {OPERATIONS.map((itemOperation) => {
            const Icon = itemOperation.icon;
            const active = operation === itemOperation.value;
            return (
              <button
                key={itemOperation.value}
                type="button"
                onClick={() => setOperation(itemOperation.value)}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  active
                    ? "border-sky-500/50 bg-sky-500/15 text-sky-100"
                    : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {itemOperation.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
          <label className="block">
            <span className="text-xs font-medium text-zinc-400">{quantityLabel}</span>
            <input
              type="number"
              min={operation === "adjust" ? 0 : 1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(0, Number.parseInt(event.target.value, 10) || 0))}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#12121A] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-sky-500/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-400">Notes</span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#12121A] px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-sky-500/50"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Current: <span className="tabular-nums text-zinc-300">{item.stock_quantity.toLocaleString()}</span>{" "}
            {item.base_unit}
            {item.stock_quantity === 1 ? "" : "s"}
          </p>
          <button
            type="submit"
            disabled={saving || (operation !== "adjust" && quantity <= 0)}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply
          </button>
        </div>
      </form>
    </section>
  );
}

export const InventoryStockOperations = memo(InventoryStockOperationsComponent);

