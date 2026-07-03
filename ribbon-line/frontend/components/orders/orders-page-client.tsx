"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/dashboard/navbar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatApiError } from "@/lib/format-api-error";
import { formatLkr } from "@/lib/currency";
import { getOrders } from "@/lib/orders-api";
import { Order } from "@/types/orders";
import { OrderFormModal } from "@/components/orders/order-form-modal";

type FilterType = "all" | "pending" | "completed";

interface OrdersPageClientProps {
  initialOrders: Order[];
}

function OrdersPageContent({ initialOrders }: OrdersPageClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (activeFilter?: FilterType, activeSearch?: string) => {
    setLoading(true);
    setError(null);
    const currentFilter = activeFilter ?? filter;
    const currentSearch = activeSearch ?? search;
    try {
      const response = await getOrders({
        status: currentFilter === "all" ? undefined : currentFilter.toUpperCase(),
        search: currentSearch || undefined,
      });
      setOrders(response.items);
    } catch (err) {
      const message = formatApiError(
        err instanceof Error ? err.message : ""
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!search.trim()) return true;
      const needle = search.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(needle) ||
        (order.customerName &&
          order.customerName.toLowerCase().includes(needle))
      );
    });
  }, [orders, search]);

  const statusFilters: { label: string; value: FilterType }[] = [
    { label: "All Orders", value: "all" },
    { label: "Pending Orders", value: "pending" },
    { label: "Done Orders", value: "completed" },
  ];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/15 text-amber-300";
      case "COMPLETED":
        return "bg-emerald-500/15 text-emerald-300";
      default:
        return "bg-gray-500/15 text-gray-300";
    }
  };

  return (
    <>
      <Navbar />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Orders</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your orders and track their status
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer, product..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none sm:w-80"
            />
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            Create Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-2">
          {statusFilters.map((statusOption) => (
            <button
              key={statusOption.value}
              onClick={() => {
                setFilter(statusOption.value);
                fetchData(statusOption.value);
              }}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === statusOption.value
                  ? "bg-violet-600 text-white"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              }`}
            >
              {statusOption.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-400">
                  Order ID
                </th>
                <th className="px-6 py-4 font-medium text-zinc-400">
                  Customer
                </th>
                <th className="px-6 py-4 font-medium text-zinc-400">
                  Date
                </th>
                <th className="px-6 py-4 font-medium text-zinc-400">
                  Total Value
                </th>
                <th className="px-6 py-4 font-medium text-zinc-400">
                  Status
                </th>
                <th className="px-6 py-4 font-medium text-zinc-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td
                      colSpan={6}
                      className="px-6 py-6"
                    >
                      <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded"></div>
                    </td>
                  </tr>
                ))
              ) : visibleOrders.length > 0 ? (
                visibleOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-zinc-100 font-medium">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-zinc-200">
                      {order.customerName || "Unknown Customer"}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-zinc-100">
                      {formatLkr(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                        View Order
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-zinc-500"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchData()}
      />
    </>
  );
}

export function OrdersPageClient(props: OrdersPageClientProps) {
  return (
    <ToastProvider>
      <OrdersPageContent {...props} />
    </ToastProvider>
  );
}
