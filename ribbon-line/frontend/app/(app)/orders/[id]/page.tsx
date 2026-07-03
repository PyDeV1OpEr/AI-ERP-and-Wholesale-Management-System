"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, Trash2, Truck } from "lucide-react";
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
  updateOrderItem,
} from "@/lib/orders-api";
import { Order, OrderItem, OrderItemUpdate } from "@/types/orders";

const itemStatusLabel = {
  PENDING: "Pending",
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

  const runOrderAction = async (
    action: () => Promise<Order>,
    message: string
  ) => {
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

  const handleItemUpdate = async (
    itemId: number,
    updates: OrderItemUpdate
  ) => {
    if (!order || order.status === "COMPLETED") return;
    try {
      const updatedItem = await updateOrderItem(order.id, itemId, updates);
      setOrder({
        ...order,
        items: order.items.map((item) =>
          item.id === itemId ? { ...item, ...updatedItem } : item
        ),
      });
    } catch (err) {
      toast.error(formatApiError(err instanceof Error ? err.message : ""));
    }
  };

  const handleDeliver = (item: OrderItem) => {
    if (!order) return;
    const quantity =
      item.deliveredQuantity > 0
        ? item.deliveredQuantity
        : item.requestedQuantity;
    void runOrderAction(
      () => deliverOrderItem(order.id, item.id, quantity),
      "Item delivered"
    );
  };

  const handleDelete = async () => {
    if (!order) return;
    const confirmed = window.confirm(
      "Delete this pending order? This action cannot be undone."
    );
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
    COMPLETED: "bg-emerald-500/15 text-emerald-300",
  }[order?.status ?? "PENDING"];

  const getItemStatusClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/15 text-amber-300";
      case "DELIVERED":
        return "bg-emerald-500/15 text-emerald-300";
      case "OUT_OF_STOCK":
        return "bg-rose-500/15 text-rose-300";
      default:
        return "bg-gray-500/15 text-gray-300";
    }
  };

  const calculateTotals = () => {
    if (!order) return { deliveredTotal: 0, total: 0 };
    let deliveredTotal = 0;
    let total = 0;

    order.items.forEach((item) => {
      total += parseFloat(item.totalPrice);
      if (item.status === "DELIVERED") {
        deliveredTotal += parseFloat(item.totalPrice);
      }
    });

    return { deliveredTotal, total };
  };

  const { deliveredTotal, total } = calculateTotals();

  return (
    <>
      <Navbar />
      <div className="mb-6">
        <button
          onClick={() => router.push("/orders")}
          className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"></div>
        </div>
      ) : order ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-zinc-100">
                  {order.orderNumber}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
                >
                  {order.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                Created {new Date(order.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-zinc-200">
                {order.customerName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {order.status === "COMPLETED" ? (
                <a
                  href={getOrderExportUrl(order.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/5"
                >
                  <Download className="h-4 w-4" />
                  Download Invoice
                </a>
              ) : (
                <>
                  <button
                    onClick={() =>
                      runOrderAction(
                        () => completeOrder(order.id),
                        "Order finalized"
                      )
                    }
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finalize Order
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Order
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

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left font-medium text-zinc-400">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left font-medium text-zinc-400">
                        Unit
                      </th>
                      <th className="px-6 py-4 text-left font-medium text-zinc-400">
                        Requested
                      </th>
                      <th className="px-6 py-4 text-left font-medium text-zinc-400">
                        Delivered
                      </th>
                      <th className="px-6 py-4 text-left font-medium text-zinc-400">
                        Remaining
                      </th>
                      <th className="px-6 py-4 text-left font-medium text-zinc-400">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right font-medium text-zinc-400">
                        Total
                      </th>
                      <th className="px-6 py-4 text-right font-medium text-zinc-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-zinc-100">
                          <div>{item.productName}</div>
                          {item.productCode ? (
                            <div className="text-xs text-zinc-500">
                              {item.productCode}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            value={item.unit}
                            disabled={
                              order.status === "COMPLETED" ||
                              item.status === "DELIVERED"
                            }
                            onChange={(e) =>
                              handleItemUpdate(item.id, { unit: e.target.value })
                            }
                            className="w-24 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none disabled:opacity-60"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="1"
                            value={item.requestedQuantity}
                            disabled={
                              order.status === "COMPLETED" ||
                              item.status === "DELIVERED"
                            }
                            onChange={(e) =>
                              handleItemUpdate(item.id, {
                                requestedQuantity: parseInt(e.target.value),
                              })
                            }
                            className="w-20 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none disabled:opacity-60"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max={item.requestedQuantity}
                            value={item.deliveredQuantity}
                            disabled={
                              order.status === "COMPLETED" ||
                              item.status === "DELIVERED"
                            }
                            onChange={(e) =>
                              handleItemUpdate(item.id, {
                                deliveredQuantity: parseInt(e.target.value),
                              })
                            }
                            className="w-20 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none disabled:opacity-60"
                          />
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {item.remainingQuantity}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={item.status}
                            disabled={
                              order.status === "COMPLETED" ||
                              item.status === "DELIVERED"
                            }
                            onChange={(e) =>
                              handleItemUpdate(item.id, {
                                status: e.target.value as any,
                              })
                            }
                            className="rounded-lg border border-white/10 bg-[#0D0D12] px-2 py-1 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none disabled:opacity-60"
                          >
                            {Object.entries(itemStatusLabel).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right text-zinc-100">
                          {formatLkr(item.totalPrice)}
                        </td>
                        <td className="px-6 py-4">
                          {order.status !== "COMPLETED" &&
                          item.status !== "DELIVERED" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleDeliver(item)}
                                disabled={busy}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-600/20 disabled:opacity-50"
                              >
                                <Truck className="h-3.5 w-3.5" />
                                Deliver
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 p-5 bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-zinc-300 mb-4">
                  Financial Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Total Order</span>
                    <span className="text-sm text-zinc-200">
                      {formatLkr(total.toString())}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">
                      Delivered Total
                    </span>
                    <span className="text-sm font-semibold text-emerald-300">
                      {formatLkr(deliveredTotal.toString())}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-zinc-100">
                        Remaining Balance
                      </span>
                      <span className="text-base font-bold text-violet-300">
                        {formatLkr((total - deliveredTotal).toString())}
                      </span>
                    </div>
                  </div>
                </div>
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
