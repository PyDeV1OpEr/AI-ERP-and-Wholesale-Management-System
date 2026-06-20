"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ValidationMessage } from "@/components/ui/validation-message";
import { formatApiError } from "@/lib/format-api-error";
import { createCustomer, updateCustomer, type Customer } from "@/lib/customers-api";

interface CustomerFormModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function CustomerFormModal({
  isOpen,
  customer,
  onClose,
  onSaved,
}: CustomerFormModalProps) {
  const toast = useToast();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "BLOCKED",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: customer?.full_name ?? "",
        email: customer?.email ?? "",
        phone_number: customer?.phone_number ?? "",
        address: customer?.address ?? "",
        status: customer?.status ?? "ACTIVE",
      });
      setSubmitError(null);
    }
  }, [isOpen, customer]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!formData.full_name.trim() || !formData.phone_number.trim()) {
      setSubmitError("Full name and phone number are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
        phone_number: formData.phone_number.trim(),
        address: formData.address.trim() || null,
        status: formData.status,
      };

      if (customer) {
        await updateCustomer(customer.id, payload);
        toast.success("Customer updated successfully.");
      } else {
        await createCustomer(payload);
        toast.success("Customer created successfully.");
      }
      await onSaved();
      onClose();
    } catch (error) {
      const message = formatApiError(
        error instanceof Error ? error.message : ""
      );
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Close modal backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-form-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D12] shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-violet-300">
                  Customer Master
                </p>
                <h2
                  id="customer-form-title"
                  className="text-lg font-semibold text-zinc-100"
                >
                  {customer ? "Edit Customer" : "Add Customer"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6">
              {submitError ? <ValidationMessage message={submitError} /> : null}

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                    placeholder="Enter address"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as
                          | "ACTIVE"
                          | "INACTIVE"
                          | "BLOCKED",
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4 md:px-6">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving
                  ? "Saving..."
                  : customer
                  ? "Save Changes"
                  : "Create Customer"}
              </button>
            </footer>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
