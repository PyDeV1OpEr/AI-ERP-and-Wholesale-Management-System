"use client";

import { motion } from "framer-motion";
import { SquarePen, Trash2 } from "lucide-react";
import { formatLkr } from "@/lib/currency";
import type { Customer } from "@/types/customers";

interface CustomerCardProps {
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerCard({ customer, onView, onEdit, onDelete }: CustomerCardProps) {
  const statusLabel = {
    ACTIVE: "Active",
    VIP: "VIP",
    CREDIT_HOLD: "Credit Hold",
    INACTIVE: "Inactive",
    BLOCKED: "Blocked",
  }[customer.status] || customer.status;

  const statusClass = {
    ACTIVE: "bg-emerald-500/20 text-emerald-300",
    VIP: "bg-fuchsia-500/20 text-fuchsia-300",
    CREDIT_HOLD: "bg-orange-500/20 text-orange-300",
    INACTIVE: "bg-amber-500/20 text-amber-300",
    BLOCKED: "bg-red-500/20 text-red-300",
  }[customer.status] || "bg-zinc-500/20 text-zinc-300";

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      onClick={() => onView(customer)}
      className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
    >
      {/* Header Strip */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {customer.customer_code && (
            <span className="text-xs font-medium text-zinc-500">
              {customer.customer_code}
            </span>
          )}
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-300">
            {customer.customer_type}
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Customer Info */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-1">
          <p className="line-clamp-2 text-base font-bold leading-snug text-zinc-100">
            {customer.full_name}
          </p>
          {customer.company_name && (
            <p className="truncate text-sm text-zinc-300">{customer.company_name}</p>
          )}
          <p className="truncate text-xs text-zinc-400 mt-2">{customer.phone_number}</p>
          {(customer.city || customer.country) && (
            <p className="truncate text-xs text-zinc-500">
              {[customer.city, customer.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Financials (Using total_spent for now if balance isn't directly available in list) */}
        <div className="mt-auto space-y-0.5 pt-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Total Spent</p>
              <p className="text-sm font-semibold tabular-nums text-violet-200">
                {formatLkr(customer.total_spent)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 mb-0.5">Credit Limit</p>
              <p className="text-sm font-medium tabular-nums text-zinc-300">
                {formatLkr(customer.credit_limit || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 opacity-0 transition duration-200 group-hover:opacity-100">
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0B0B0F]/95 p-1 backdrop-blur" onClick={(e) => e.stopPropagation()}>
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
