"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, X } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { CustomerCard } from "@/components/customers/customer-card";
import { CustomerFormModal } from "@/components/customers/customer-form-modal";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatApiError } from "@/lib/format-api-error";
import { getCustomers, deleteCustomer, type Customer } from "@/lib/customers-api";

interface CustomersPageClientProps {
  initialCustomers: Customer[];
}

function CustomersPageContent({ initialCustomers }: CustomersPageClientProps) {
  const toast = useToast();
  const [customers, setCustomers] = useState(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (overrides?: {
    search?: string;
    status?: string;
  }) => {
    return getCustomers(
      overrides?.search ?? search,
      overrides?.status ?? selectedStatus ?? undefined
    );
  };

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchData();
      setCustomers(response.items);
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
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const openView = (customer: Customer) => {
    setViewingCustomer(customer);
    setViewModalOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    const confirmed = window.confirm(
      `Delete "${customer.full_name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteCustomer(customer.id);
      toast.success(`"${customer.full_name}" deleted.`);
      await reload();
    } catch (deleteError) {
      toast.error(
        formatApiError(
          deleteError instanceof Error ? deleteError.message : ""
        )
      );
    }
  };

  const visibleCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        if (!search.trim()) return true;
        const needle = search.toLowerCase();
        return (
          customer.full_name.toLowerCase().includes(needle) ||
          (customer.email && customer.email.toLowerCase().includes(needle)) ||
          customer.phone_number.toLowerCase().includes(needle)
        );
      }),
    [customers, search]
  );

  return (
    <>
      <Navbar />
      
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Customers</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your customer profiles</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none sm:w-64"
            />
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
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
          {visibleCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onView={openView}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {viewModalOpen && viewingCustomer && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
            <motion.button
              type="button"
              aria-label="Close modal backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewModalOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="customer-view-title"
              tabIndex={-1}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D12] shadow-2xl"
            >
              <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-300">
                    Customer Preview
                  </p>
                  <h2
                    id="customer-view-title"
                    className="text-lg font-semibold text-zinc-100"
                  >
                    {viewingCustomer.full_name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Status
                    </p>
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        viewingCustomer.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : viewingCustomer.status === "INACTIVE"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {viewingCustomer.status === "ACTIVE"
                        ? "Active"
                        : viewingCustomer.status === "INACTIVE"
                        ? "Inactive"
                        : "Blocked"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Phone
                    </p>
                    <p className="text-sm text-zinc-100">
                      {viewingCustomer.phone_number}
                    </p>
                  </div>
                  {viewingCustomer.email && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">
                        Email
                      </p>
                      <p className="text-sm text-zinc-100">
                        {viewingCustomer.email}
                      </p>
                    </div>
                  )}
                  {viewingCustomer.address && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">
                        Address
                      </p>
                      <p className="text-sm text-zinc-100">
                        {viewingCustomer.address}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Total Orders
                    </p>
                    <p className="text-sm text-zinc-100 font-semibold">
                      {viewingCustomer.total_orders_count}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Total Spent
                    </p>
                    <p className="text-sm text-violet-200 font-semibold">
                      {viewingCustomer.total_spent}
                    </p>
                  </div>
                  {viewingCustomer.last_order_date && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">
                        Last Order
                      </p>
                      <p className="text-sm text-zinc-100">
                        {new Date(
                          viewingCustomer.last_order_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewModalOpen(false);
                    openEdit(viewingCustomer);
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
                >
                  Edit Customer
                </button>
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm text-white transition hover:bg-violet-500"
                >
                  Close
                </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CustomerFormModal
        isOpen={modalOpen}
        customer={editingCustomer}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
      />
    </>
  );
}

export function CustomersPageClient(props: CustomersPageClientProps) {
  return (
    <ToastProvider>
      <CustomersPageContent {...props} />
    </ToastProvider>
  );
}
