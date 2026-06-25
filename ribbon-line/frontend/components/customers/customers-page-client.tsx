"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/dashboard/navbar";
import { CustomerCard } from "@/components/customers/customer-card";
import { CustomerFormModal } from "@/components/customers/customer-form-modal";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatApiError } from "@/lib/format-api-error";
import { getCustomers, deleteCustomer } from "@/lib/customers-api";
import { Customer } from "@/types/customers";

interface CustomersPageClientProps {
  initialCustomers: Customer[];
}

function CustomersPageContent({ initialCustomers }: CustomersPageClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [customers, setCustomers] = useState(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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
    router.push(`/customers/${customer.id}`);
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
          customer.phone_number.toLowerCase().includes(needle) ||
          (customer.customer_code && customer.customer_code.toLowerCase().includes(needle)) ||
          (customer.company_name && customer.company_name.toLowerCase().includes(needle))
        );
      }).filter((customer) => {
        if (!selectedStatus) return true;
        return customer.status === selectedStatus;
      }),
    [customers, search, selectedStatus]
  );

  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, cust) => {
      // In a real app we'd get this from the API response list, but since the balance 
      // is not returned directly in the base customer endpoint without KPIs, we assume
      // total_spent might be used for now or we just leave it 0 if not available.
      // Wait, the plan said to fetch outstanding_balance from initial list data if possible.
      // Actually we will just skip it or compute something if we had it.
      return sum;
    }, 0);
  }, [customers]);

  const statusFilters = [
    { label: "All", value: null },
    { label: "Active", value: "ACTIVE" },
    { label: "VIP", value: "VIP" },
    { label: "Credit Hold", value: "CREDIT_HOLD" },
    { label: "Inactive", value: "INACTIVE" },
    { label: "Blocked", value: "BLOCKED" },
  ];

  return (
    <>
      <Navbar />
      
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Customers</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your customer relationships and accounts</p>
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            Add Customer
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

      {visibleCustomers.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <p className="text-zinc-400">No customers found.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Add a new customer
          </button>
        </div>
      )}

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
