"use client";

import { motion } from "framer-motion";
import { Eye, SquarePen, Trash2 } from "lucide-react";
import { formatLkr } from "@/lib/currency";
import type { Customer } from "@/lib/customers-api";

interface CustomerCardProps {
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerCard({ customer, onView, onEdit, onDelete }: CustomerCardProps) {
  const statusLabel = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    BLOCKED: "Blocked",
  }[customer.status];

  const statusClass = {
    ACTIVE: "bg-emerald-500/20 text-emerald-300",
    INACTIVE: "bg-amber-500/20 text-amber-300",
    BLOCKED: "bg-red-500/20 text-red-300",
  }[customer.status];

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      {/* Status Badge */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Customer Info */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100">
            {customer.full_name}
          </p>
          {customer.email && (
            <p className="truncate text-xs text-zinc-400">{customer.email}</p>
          )}
          <p className="truncate text-xs text-zinc-400">{customer.phone_number}</p>
          {customer.address && (
            <p className="truncate text-xs text-zinc-500">{customer.address}</p>
          )}
        </div>

        {/* Financials */}
        <div className="mt-auto space-y-0.5 pt-3">
          <p className="text-sm font-semibold tabular-nums text-violet-200">
            {formatLkr(customer.total_spent)}
          </p>
          <p className="text-xs tabular-nums text-zinc-500">
            {customer.total_orders_count} Orders
          </p>
          {customer.last_order_date && (
            <p className="text-xs tabular-nums text-zinc-500">
              Last order: {new Date(customer.last_order_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <div className="m-3 flex items-center justify-end gap-2 rounded-xl border border-white/10 bg-[#0B0B0F]/95 p-2 backdrop-blur">
          <button
            type="button"
            onClick={() => onView(customer)}
            className="rounded-lg p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            aria-label="View customer"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="rounded-lg p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            aria-label="Edit customer"
          >
            <SquarePen className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(customer)}
            className="rounded-lg p-2 text-zinc-300 hover:bg-white/10 hover:text-red-400"
            aria-label="Delete customer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
