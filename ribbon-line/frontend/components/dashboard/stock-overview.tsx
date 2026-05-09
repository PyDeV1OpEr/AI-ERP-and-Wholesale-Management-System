"use client";

import { motion } from "framer-motion";
import type { DashboardStockItem } from "@/types/dashboard";

interface StockOverviewProps {
  stock: DashboardStockItem[];
}

export function StockOverview({ stock }: StockOverviewProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <h3 className="mb-4 text-base font-semibold text-zinc-100">Stock Overview</h3>
      <div className="space-y-3">
        {stock.map((item) => {
          const ratio = Math.min((item.available_units / (item.reorder_level * 2)) * 100, 100);
          return (
            <div key={item.id} className="rounded-xl border border-white/10 bg-[#101017]/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-zinc-100">{item.item_name}</p>
                <p className="text-xs text-zinc-400">{item.sku}</p>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${ratio}%` }} />
              </div>
              <p className="text-xs text-zinc-400">
                {item.available_units} units available | reorder at {item.reorder_level}
              </p>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
