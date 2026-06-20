"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Settings2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { updateInventorySettings } from "@/lib/inventory-api";
import { formatApiError } from "@/lib/format-api-error";
import { useToast } from "@/components/ui/toast";
import type { InventoryItem, InventorySettingsPayload } from "@/types/inventory";

interface InventorySettingsModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: (updated: InventoryItem) => void;
}

export function InventorySettingsModal({ isOpen, item, onClose, onSaved }: InventorySettingsModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(0);
  const [packSize, setPackSize] = useState(1);
  const [stockLocation, setStockLocation] = useState("");

  useEffect(() => {
    if (!item) return;
    setMaxCapacity(item.max_capacity);
    setReorderLevel(item.reorder_level);
    setPackSize(item.standard_pack_size || 1);
    setStockLocation(item.stock_location ?? "");
  }, [item]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) return;

    setSaving(true);
    try {
      const payload: InventorySettingsPayload = {
        max_capacity: maxCapacity,
        reorder_level: reorderLevel,
        standard_pack_size: packSize,
        stock_location: stockLocation.trim() || null,
      };

      const updated = await updateInventorySettings(item.product_id, payload);
      onSaved(updated);
      toast.success("Inventory settings updated");
      onClose();
    } catch (err) {
      toast.error(formatApiError(err instanceof Error ? err.message : "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close settings"
          />
          <motion.form
            onSubmit={handleSave}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#0D0D12] p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-sky-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Inventory Settings</p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-100">{item.name}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Max Capacity</span>
                <input
                  type="number"
                  min={0}
                  value={maxCapacity}
                  onChange={(event) => setMaxCapacity(Math.max(0, Number.parseInt(event.target.value, 10) || 0))}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#12121A] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-sky-500/50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Reorder Level</span>
                <input
                  type="number"
                  min={0}
                  value={reorderLevel}
                  onChange={(event) => setReorderLevel(Math.max(0, Number.parseInt(event.target.value, 10) || 0))}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#12121A] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-sky-500/50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Standard Pack Size</span>
                <input
                  type="number"
                  min={1}
                  value={packSize}
                  onChange={(event) => setPackSize(Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#12121A] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-sky-500/50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-zinc-400">Stock Location</span>
                <input
                  value={stockLocation}
                  onChange={(event) => setStockLocation(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#12121A] px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-sky-500/50"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Settings
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}

