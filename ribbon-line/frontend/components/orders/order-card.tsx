"use client";

import { motion } from "framer-motion";
import { formatLkr } from "@/lib/currency";
import type { Order } from "@/types/orders";

interface OrderCardProps {
  order: Order;
  onView: () => void;
  onReload: () => void;
}

export function OrderCard({ order, onView }: OrderCardProps) {
  const statusLabel = {
    PENDING: "Pending",
    RESERVED: "Reserved",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
  }[order.status] || order.status;

  const statusClass = {
    PENDING: "bg-amber-500/20 text-amber-300",
    RESERVED: "bg-blue-500/20 text-blue-300",
    DELIVERED: "bg-emerald-500/20 text-emerald-300",
    COMPLETED: "bg-fuchsia-500/20 text-fuchsia-300",
  }[order.status] || "bg-zinc-500/20 text-zinc-300";

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      onClick={onView}
      className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
    >
      {/* Header Strip */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">
            {order.orderNumber}
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Order Info */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-1">
          <p className="line-clamp-2 text-base font-bold leading-snug text-zinc-100">
            {order.customerName || "Unknown Customer"}
          </p>
          {order.notes && (
            <p className="truncate text-sm text-zinc-400">{order.notes}</p>
          )}
          <p className="truncate text-xs text-zinc-500 mt-2">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Total & Items */}
        <div className="mt-auto space-y-0.5 pt-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Total Amount</p>
              <p className="text-sm font-semibold tabular-nums text-violet-200">
                {formatLkr(order.totalAmount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 mb-0.5">Items</p>
              <p className="text-sm font-medium tabular-nums text-zinc-300">
                {order.items.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
