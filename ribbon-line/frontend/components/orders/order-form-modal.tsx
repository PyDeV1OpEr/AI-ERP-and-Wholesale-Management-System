"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, PackagePlus, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ValidationMessage } from "@/components/ui/validation-message";
import { formatApiError } from "@/lib/format-api-error";
import { getCustomers } from "@/lib/customers-api";
import { getProducts } from "@/lib/products-api";
import { createOrder } from "@/lib/orders-api";
import { Customer } from "@/types/customers";
import { Product } from "@/types/products";
import { OrderItemCreate } from "@/types/orders";

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const FALLBACK_UNITS = ["Main", "Base", "Box", "Packet", "Bundle", "Carton", "Kilogram"];

export function OrderFormModal({ isOpen, onClose, onSaved }: OrderFormModalProps) {
  const toast = useToast();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [draftProductId, setDraftProductId] = useState<number | null>(null);
  const [draftUnit, setDraftUnit] = useState("Main");
  const [draftQuantity, setDraftQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItemCreate[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [customersRes, productsRes] = await Promise.all([
          getCustomers(undefined, undefined, 0, 100),
          getProducts({ limit: 100 }),
        ]);
        setCustomers(customersRes.items);
        setProducts(productsRes.items);
        setDraftProductId(productsRes.items[0]?.id ?? null);
      } catch (err) {
        setSubmitError(formatApiError(err instanceof Error ? err.message : ""));
      } finally {
        setLoading(false);
      }
    };
    loadData();
    setSelectedCustomer(null);
    setCustomerSearch("");
    setProductSearch("");
    setDraftUnit("Main");
    setDraftQuantity(1);
    setNotes("");
    setItems([]);
    setSubmitError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const selectedCustomerData = customers.find((customer) => customer.id === selectedCustomer) ?? null;
  const draftProduct = products.find((product) => product.id === draftProductId) ?? null;

  const filteredCustomers = useMemo(() => {
    const needle = customerSearch.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((customer) =>
      [customer.full_name, customer.customer_code, customer.company_name, customer.phone_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [customerSearch, customers]);

  const filteredProducts = useMemo(() => {
    const needle = productSearch.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) =>
      [product.name, product.sku, product.brand_name, product.category_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [productSearch, products]);

  const productUnits = (product: Product | null) => {
    if (!product) return FALLBACK_UNITS;
    const units = new Set(["Main", "Base", product.main_unit_name, product.base_unit_name, ...product.units.map((unit) => unit.name)]);
    return Array.from(units).filter(Boolean);
  };

  const addItem = () => {
    setSubmitError(null);
    if (!draftProductId) {
      setSubmitError("Please select a product");
      return;
    }
    if (draftQuantity <= 0) {
      setSubmitError("Quantity must be greater than zero");
      return;
    }
    const duplicate = items.some(
      (item) => item.productId === draftProductId && item.unit.toLowerCase() === draftUnit.toLowerCase()
    );
    if (duplicate) {
      setSubmitError("This product and unit is already in the order");
      return;
    }
    setItems([...items, { productId: draftProductId, unit: draftUnit, requestedQuantity: draftQuantity }]);
    setDraftQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (index: number, updates: Partial<OrderItemCreate>) => {
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], ...updates };
    setItems(nextItems);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!selectedCustomer) {
      setSubmitError("Please select a customer");
      return;
    }
    if (items.length === 0) {
      setSubmitError("Please add at least one product");
      return;
    }
    const invalidIndex = items.findIndex((item) => item.requestedQuantity <= 0 || !item.productId || !item.unit.trim());
    if (invalidIndex >= 0) {
      setSubmitError(`Item ${invalidIndex + 1} has invalid product, unit, or quantity`);
      return;
    }

    setSaving(true);
    try {
      await createOrder({
        customerId: selectedCustomer,
        items,
        notes: notes.trim() || null,
      });
      toast.success("Order created successfully.");
      await onSaved();
      onClose();
    } catch (error) {
      const message = formatApiError(error instanceof Error ? error.message : "");
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
            aria-labelledby="order-form-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D12] shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-violet-300">Order Master</p>
                <h2 id="order-form-title" className="text-lg font-semibold text-zinc-100">Create Wholesale Order</h2>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 md:px-6">
              {submitError ? <ValidationMessage message={submitError} /> : null}

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                </div>
              ) : (
                <>
                  <section className="grid gap-3 md:grid-cols-[1fr_1.2fr]">
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Search Customer *</label>
                      <input
                        value={customerSearch}
                        onChange={(event) => setCustomerSearch(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                        placeholder="Name, code, company, phone"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Customer *</label>
                      <select
                        value={selectedCustomer ?? ""}
                        onChange={(event) => setSelectedCustomer(event.target.value ? Number(event.target.value) : null)}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-[#0D0D12] px-3 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
                      >
                        <option value="">Select a customer</option>
                        {filteredCustomers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.full_name}{customer.customer_code ? ` (${customer.customer_code})` : ""}
                          </option>
                        ))}
                      </select>
                      {selectedCustomerData ? (
                        <p className="mt-2 text-xs text-zinc-500">
                          {selectedCustomerData.company_name || selectedCustomerData.phone_number} · {selectedCustomerData.customer_type}
                        </p>
                      ) : null}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_1.3fr_160px_120px_auto] md:items-end">
                      <div>
                        <label className="text-sm font-medium text-zinc-300">Search Product</label>
                        <input
                          value={productSearch}
                          onChange={(event) => setProductSearch(event.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                          placeholder="Product, SKU, brand"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-300">Product *</label>
                        <select
                          value={draftProductId ?? ""}
                          onChange={(event) => {
                            const productId = event.target.value ? Number(event.target.value) : null;
                            setDraftProductId(productId);
                            const product = products.find((item) => item.id === productId) ?? null;
                            setDraftUnit(productUnits(product)[0] ?? "Main");
                          }}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-[#0D0D12] px-3 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
                        >
                          <option value="">Select product</option>
                          {filteredProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}{product.sku ? ` (${product.sku})` : ""} · Available {product.available_stock_quantity ?? product.stock_quantity}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-300">Unit *</label>
                        <select
                          value={draftUnit}
                          onChange={(event) => setDraftUnit(event.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-[#0D0D12] px-3 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
                        >
                          {productUnits(draftProduct).map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-300">Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          value={draftQuantity}
                          onChange={(event) => setDraftQuantity(Number(event.target.value))}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.03] text-xs uppercase text-zinc-500">
                          <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Unit</th>
                            <th className="px-4 py-3">Requested</th>
                            <th className="px-4 py-3">Delivered</th>
                            <th className="px-4 py-3">Remaining</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {items.map((item, index) => {
                            const product = products.find((productItem) => productItem.id === item.productId);
                            return (
                              <tr key={`${item.productId}-${item.unit}`}>
                                <td className="px-4 py-3 text-zinc-100">{product?.name ?? "Unknown product"}</td>
                                <td className="px-4 py-3">
                                  <select
                                    value={item.unit}
                                    onChange={(event) => updateItem(index, { unit: event.target.value })}
                                    className="rounded-lg border border-white/10 bg-[#0D0D12] px-2 py-1 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
                                  >
                                    {productUnits(product ?? null).map((unit) => (
                                      <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.requestedQuantity}
                                    onChange={(event) => updateItem(index, { requestedQuantity: Number(event.target.value) })}
                                    className="w-24 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
                                  />
                                </td>
                                <td className="px-4 py-3 text-zinc-500">0</td>
                                <td className="px-4 py-3 text-zinc-300">{item.requestedQuantity}</td>
                                <td className="px-4 py-3 text-amber-300">Pending</td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-red-400"
                                    aria-label="Remove item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                                <PackagePlus className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
                                Add products to build this wholesale order.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <div>
                    <label className="text-sm font-medium text-zinc-300">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                      placeholder="Delivery instructions, salesperson notes, or warehouse notes"
                    />
                  </div>
                </>
              )}
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4 md:px-6">
              <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} disabled={saving || loading} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Creating..." : "Save Order"}
              </button>
            </footer>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
