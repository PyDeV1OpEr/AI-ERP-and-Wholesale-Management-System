"use client";

import { motion } from "framer-motion";
import type { DashboardOrder } from "@/types/dashboard";

interface RecentOrdersProps {
  orders: DashboardOrder[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <h3 className="mb-4 text-base font-semibold text-zinc-100">Recent Orders</h3>
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#101017]/60 p-3"
          >
            <div>
              <p className="text-sm font-medium text-zinc-100">
                {order.id} - {order.customer_name}
              </p>
              <p className="text-xs text-zinc-400">
                {order.sku} | Qty {order.quantity}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-200">${order.total_amount.toLocaleString()}</p>
              <p className="text-xs text-violet-300">{order.status}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
