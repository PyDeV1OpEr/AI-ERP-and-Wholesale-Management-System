"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ValidationMessage } from "@/components/ui/validation-message";
import { formatApiError } from "@/lib/format-api-error";
import { createCustomer, updateCustomer } from "@/lib/customers-api";
import { Customer } from "@/types/customers";

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
    company_name: "",
    email: "",
    phone_number: "",
    whatsapp_number: "",
    address: "",
    city: "",
    country: "",
    postal_code: "",
    customer_type: "RETAIL" as "RETAIL" | "WHOLESALE" | "VIP" | "DISTRIBUTOR",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "BLOCKED" | "VIP" | "CREDIT_HOLD",
    credit_limit: "0",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: customer?.full_name ?? "",
        company_name: customer?.company_name ?? "",
        email: customer?.email ?? "",
        phone_number: customer?.phone_number ?? "",
        whatsapp_number: customer?.whatsapp_number ?? "",
        address: customer?.address ?? "",
        city: customer?.city ?? "",
        country: customer?.country ?? "",
        postal_code: customer?.postal_code ?? "",
        customer_type: customer?.customer_type ?? "RETAIL",
        status: customer?.status ?? "ACTIVE",
        credit_limit: (customer?.credit_limit ?? 0).toString(),
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

    const parsedCreditLimit = parseFloat(formData.credit_limit);
    if (isNaN(parsedCreditLimit) || parsedCreditLimit < 0) {
      setSubmitError("Credit limit must be a valid positive number");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        company_name: formData.company_name.trim() || null,
        email: formData.email.trim() || null,
        phone_number: formData.phone_number.trim(),
        whatsapp_number: formData.whatsapp_number.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        customer_type: formData.customer_type,
        status: formData.status,
        credit_limit: parsedCreditLimit,
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

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 md:px-6">
              {submitError ? <ValidationMessage message={submitError} /> : null}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({ ...formData, company_name: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp_number}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp_number: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                      placeholder="Enter WhatsApp number"
                    />
                  </div>
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
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                      placeholder="Country"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) =>
                        setFormData({ ...formData, postal_code: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                      placeholder="Code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-4 mt-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-300">
                      Customer Type
                    </label>
                    <select
                      value={formData.customer_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customer_type: e.target.value as any,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#0D0D12] px-3 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
                    >
                      <option value="RETAIL">Retail</option>
                      <option value="WHOLESALE">Wholesale</option>
                      <option value="DISTRIBUTOR">Distributor</option>
                      <option value="VIP">VIP</option>
                    </select>
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
                          status: e.target.value as any,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#0D0D12] px-3 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="VIP">VIP</option>
                      <option value="CREDIT_HOLD">Credit Hold</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">
                      Credit Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.credit_limit}
                      onChange={(e) =>
                        setFormData({ ...formData, credit_limit: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
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
