"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { formatLkr } from "@/lib/currency";
import { getOrders } from "@/lib/orders-api";
import { Order } from "@/types/orders";

export function CustomerOrdersTab({ customerId }: { customerId: number }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrders({ customerId, limit: 50 })
      .then((response) => {
        if (active) setOrders(response.items);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-zinc-100">Orders</h3>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Delivered</th>
              <th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#0D0D12]">
            {orders.map((order) => {
              const requested = order.items.reduce((sum, item) => sum + item.requestedQuantity, 0);
              const delivered = order.items.reduce((sum, item) => sum + item.deliveredQuantity, 0);
              const remaining = order.items.reduce((sum, item) => sum + item.remainingQuantity, 0);
              return (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="cursor-pointer hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 font-medium text-zinc-100">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-zinc-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-zinc-300">{order.items.length}</td>
                  <td className="px-4 py-3 text-zinc-300">{requested}</td>
                  <td className="px-4 py-3 text-emerald-300">{delivered}</td>
                  <td className="px-4 py-3 text-amber-300">{remaining}</td>
                  <td className="px-4 py-3 text-zinc-300">{order.status.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-right font-medium text-violet-200">{formatLkr(order.totalAmount)}</td>
                </tr>
              );
            })}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">No orders recorded for this customer.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
