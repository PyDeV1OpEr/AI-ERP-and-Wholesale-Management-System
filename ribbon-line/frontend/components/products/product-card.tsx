"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Archive, Copy, Eye, Image, Settings, SquarePen, Tag, Trash2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { formatLkr } from "@/lib/currency";
import type { Product } from "@/types/products";

/** Fixed media height — every card reserves identical space for image or placeholder. */
const CARD_MEDIA_CLASS = "h-[72px] w-full shrink-0 sm:h-[80px]";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onArchiveToggle: (product: Product) => void;
  onView: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onRename: (product: Product) => void;
  onChangeCategory: (product: Product) => void;
  onRemoveImage: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onArchiveToggle, onView, onDuplicate, onRename, onChangeCategory, onRemoveImage }: ProductCardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  const statusLabel = product.is_archived ? "Archived" : product.is_active ? "Active" : "Inactive";
  const statusClass = product.is_archived
    ? "bg-zinc-800/90 text-zinc-300"
    : product.is_active
      ? "bg-emerald-500/20 text-emerald-300"
      : "bg-amber-500/20 text-amber-300";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const settingsItems = [
    { label: "Duplicate Product", icon: Copy, onClick: () => { onDuplicate(product); setSettingsOpen(false); } },
    { label: "Quick Rename", icon: SquarePen, onClick: () => { onRename(product); setSettingsOpen(false); } },
    { label: "Replace Product Image", icon: Image, onClick: () => { setSettingsOpen(false); } },
    { label: "Remove Product Image", icon: X, onClick: () => { onRemoveImage(product); setSettingsOpen(false); } },
    { label: "Change Category", icon: Tag, onClick: () => { onChangeCategory(product); setSettingsOpen(false); } },
    { label: "Open Full Edit", icon: SquarePen, onClick: () => { onEdit(product); setSettingsOpen(false); } },
    { label: "Archive Product", icon: Archive, onClick: () => { onArchiveToggle(product); setSettingsOpen(false); } },
  ];

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      {/* 1. Image / placeholder — fixed slot, never affects text flow */}
      <div className={`relative mb-3 ${CARD_MEDIA_CLASS}`}>
        <ProductImage
          src={product.image_url}
          alt={product.name}
          containerClassName={`${CARD_MEDIA_CLASS} rounded-xl border border-white/10`}
          showFallbackLabel={false}
        />
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* 2–5. Text block — same order and spacing on every card */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100">{product.name}</p>
          <p className="truncate text-xs text-zinc-400">{product.brand_name}</p>
          <p className="truncate text-xs text-zinc-500">{product.category_name ?? "Uncategorized"}</p>
        </div>

        <div className="mt-auto space-y-0.5 pt-3">
          <p className="text-sm font-semibold tabular-nums text-violet-200">{formatLkr(product.selling_price)}</p>
          <p className="text-xs tabular-nums text-zinc-500">Buy: {formatLkr(product.cost_price)}</p>
        </div>
      </div>

      {/* Hover actions — preserved, overlay does not shift layout */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <div className="m-3 flex items-center justify-end gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/95 p-2 backdrop-blur">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="rounded-lg p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            aria-label="Edit product"
          >
            <SquarePen className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onArchiveToggle(product)}
            className="rounded-lg p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            aria-label={product.is_archived ? "Restore product" : "Archive product"}
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onView(product)}
            className="rounded-lg p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            aria-label="View product"
          >
            <Eye className="h-4 w-4" />
          </button>
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="rounded-lg p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
              aria-label="Product settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-white/10 bg-[#0B0B0F]/98 p-2 backdrop-blur-xl shadow-2xl"
                >
                  <div className="space-y-1">
                    {settingsItems.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={item.onClick}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.article>
  );
}