"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/dashboard/navbar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatApiError } from "@/lib/format-api-error";
import { getOrders } from "@/lib/orders-api";
import { Order } from "@/types/orders";
import { OrderFormModal } from "@/components/orders/order-form-modal";
import { OrderCard } from "@/components/orders/order-card";

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
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (overrides?: {
    search?: string;
    status?: string;
  }) => {
    return getOrders({
      search: overrides?.search ?? search,
      status: overrides?.status ?? selectedStatus ?? undefined,
    });
  };

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchData();
      setOrders(response.items);
    } catch (reloadError) {
      const message = formatApiError(
        reloadError instanceof Error ? reloadError.message : ""
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalOpen(true);
  };

  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (!search.trim()) return true;
        const needle = search.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(needle) ||
          (order.customerName && order.customerName.toLowerCase().includes(needle))
        );
      }).filter((order) => {
        if (!selectedStatus) return true;
        return order.status === selectedStatus;
      }),
    [orders, search, selectedStatus]
  );

  const statusFilters = [
    { label: "All", value: null },
    { label: "Pending", value: "PENDING" },
    { label: "Reserved", value: "RESERVED" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Completed", value: "COMPLETED" },
  ];

  return (
    <>
      <Navbar />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Orders</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your orders and track their status</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none sm:w-64"
            />
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            Add Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setSelectedStatus(filter.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                selectedStatus === filter.value
                  ? "bg-violet-600 text-white"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onView={() => router.push(`/orders/${order.id}`)}
              onReload={reload}
            />
          ))}
        </div>
      )}

      {visibleOrders.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <p className="text-zinc-400">No orders found.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Create a new order
          </button>
        </div>
      )}

      <OrderFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
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
