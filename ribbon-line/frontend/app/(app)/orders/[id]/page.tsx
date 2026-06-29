"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, Loader2, PackageCheck, Trash2, Truck } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatApiError } from "@/lib/format-api-error";
import { formatLkr } from "@/lib/currency";
import {
  completeOrder,
  deleteOrder,
  deliverOrderItem,
  getOrder,
  getOrderExportUrl,
  reserveOrderItem,
  updateOrderItem,
} from "@/lib/orders-api";
import { Order, OrderItem, OrderItemUpdate } from "@/types/orders";

const itemStatusLabel = {
  PENDING: "Pending",
  RESERVED: "Reserved",
  DELIVERED: "Delivered",
  OUT_OF_STOCK: "Out of Stock",
};

function OrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await getOrder(Number(params.id));
      setOrder(data);
    } catch (err) {
      toast.error(formatApiError(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const runOrderAction = async (action: () => Promise<Order>, message: string) => {
    setBusy(true);
    try {
      const updated = await action();
      setOrder(updated);
      toast.success(message);
    } catch (err) {
      toast.error(formatApiError(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  };

  const handleItemUpdate = async (itemId: number, updates: OrderItemUpdate) => {
    if (!order || order.status === "COMPLETED") return;
    try {
      const updatedItem = await updateOrderItem(order.id, itemId, updates);
      setOrder({
        ...order,
        items: order.items.map((item) => (item.id === itemId ? { ...item, ...updatedItem } : item)),
      });
    } catch (err) {
      toast.error(formatApiError(err instanceof Error ? err.message : ""));
    }
  };

  const handleDeliver = (item: OrderItem) => {
    if (!order) return;
    const quantity = item.deliveredQuantity > 0 ? item.deliveredQuantity : item.requestedQuantity;
    void runOrderAction(() => deliverOrderItem(order.id, item.id, quantity), "Item delivered");
  };

  const handleDelete = async () => {
    if (!order) return;
    const confirmed = window.confirm("Delete this pending order? Reserved stock will be released.");
    if (!confirmed) return;
    setBusy(true);
    try {
      await deleteOrder(order.id);
      toast.success("Order deleted");
      router.push("/orders");
    } catch (err) {
      toast.error(formatApiError(err instanceof Error ? err.message : ""));
      setBusy(false);
    }
  };

  const statusClass = {
    PENDING: "bg-amber-500/15 text-amber-300",
    RESERVED: "bg-sky-500/15 text-sky-300",
    DELIVERED: "bg-emerald-500/15 text-emerald-300",
    COMPLETED: "bg-violet-500/15 text-violet-300",
  }[order?.status ?? "PENDING"];

  return (
    <>
      <Navbar />
      <div className="mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : order ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-zinc-100">{order.orderNumber}</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
                  {order.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">Created {new Date(order.createdAt).toLocaleString()}</p>
              <p className="mt-1 text-sm text-zinc-300">{order.customerName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {order.status === "COMPLETED" ? (
                <a
                  href={getOrderExportUrl(order.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/5"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              ) : (
                <>
                  <button
                    onClick={() => runOrderAction(() => completeOrder(order.id), "Order completed")}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {order.notes ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-1 text-sm text-zinc-400">Notes</p>
              <p className="text-zinc-100">{order.notes}</p>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Product</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Unit</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Requested</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Delivered</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Remaining</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-400">Total</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-zinc-100">
                        <div>{item.productName}</div>
                        {item.productCode ? <div className="text-xs text-zinc-500">{item.productCode}</div> : null}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={item.unit}
                          disabled={order.status === "COMPLETED" || item.status === "DELIVERED"}
                          onChange={(event) => handleItemUpdate(item.id, { unit: event.target.value })}
                          className="w-24 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none disabled:opacity-60"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={item.requestedQuantity}
                          disabled={order.status === "COMPLETED" || item.status === "DELIVERED"}
                          onChange={(event) => handleItemUpdate(item.id, { requestedQuantity: Number(event.target.value) })}
                          className="w-20 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none disabled:opacity-60"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max={item.requestedQuantity}
                          value={item.deliveredQuantity}
                          disabled={order.status === "COMPLETED" || item.status === "DELIVERED"}
                          onChange={(event) => handleItemUpdate(item.id, { deliveredQuantity: Number(event.target.value) })}
                          className="w-20 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none disabled:opacity-60"
                        />
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{item.remainingQuantity}</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.status}
                          disabled={order.status === "COMPLETED" || item.status === "DELIVERED"}
                          onChange={(event) => handleItemUpdate(item.id, { status: event.target.value })}
                          className="rounded-lg border border-white/10 bg-[#0D0D12] px-2 py-1 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none disabled:opacity-60"
                        >
                          {Object.entries(itemStatusLabel).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-100">{formatLkr(item.totalPrice)}</td>
                      <td className="px-4 py-3">
                        {order.status !== "COMPLETED" && item.status !== "DELIVERED" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => runOrderAction(() => reserveOrderItem(order.id, item.id), "Item reserved")}
                              disabled={busy || item.status === "RESERVED"}
                              className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-sky-300 disabled:opacity-40"
                              aria-label="Reserve item"
                            >
                              <PackageCheck className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeliver(item)}
                              disabled={busy}
                              className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-emerald-300 disabled:opacity-40"
                              aria-label="Deliver item"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end bg-white/5 px-4 py-3">
              <div className="text-right">
                <p className="text-sm text-zinc-400">Total</p>
                <p className="text-xl font-bold text-violet-200">{formatLkr(order.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-zinc-400">Order not found</p>
        </div>
      )}
    </>
  );
}

export default function OrderDetailPage() {
  return (
    <ToastProvider>
      <OrderDetailContent />
    </ToastProvider>
  );
}
