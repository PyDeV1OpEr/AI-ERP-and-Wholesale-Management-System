"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Loader2, RotateCcw, Search, Trash2 } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { ProductImage } from "@/components/ui/product-image";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatLkr } from "@/lib/currency";
import { formatApiError } from "@/lib/format-api-error";
import {
  getArchivedProducts,
  permanentlyDeleteProduct,
  restoreProduct,
} from "@/lib/products-api";
import type { Product } from "@/types/products";

interface ArchivedProductsPageClientProps {
  initialProducts: Product[];
}

function formatArchivedDate(value: string | null): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ArchivedProductsContent({ initialProducts }: ArchivedProductsPageClientProps) {
  const toast = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const visibleProducts = useMemo(() => {
    if (!search.trim()) return products;
    const needle = search.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(needle) ||
        product.brand_name.toLowerCase().includes(needle)
    );
  }, [products, search]);

  const reload = async () => {
    setLoading(true);
    try {
      const response = await getArchivedProducts();
      setProducts(response.items);
    } catch (error) {
      toast.error(formatApiError(error instanceof Error ? error.message : ""));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (product: Product) => {
    setPendingId(product.id);
    try {
      await restoreProduct(product.id);
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      toast.success(`"${product.name}" restored to active catalog.`);
    } catch (error) {
      toast.error(formatApiError(error instanceof Error ? error.message : ""));
    } finally {
      setPendingId(null);
    }
  };

  const handlePermanentDelete = async (product: Product) => {
    setPendingId(product.id);
    try {
      await permanentlyDeleteProduct(product.id);
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      setConfirmDeleteId(null);
      toast.success(`"${product.name}" permanently deleted.`);
    } catch (error) {
      toast.error(formatApiError(error instanceof Error ? error.message : ""));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <header className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Product Archive Manager</p>
            <h1 className="text-2xl font-semibold text-zinc-100">Archived Products</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Controlled archive for products removed from active catalog and inventory views.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
          >
            Back to Products
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-[#12121A] px-3 py-2">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search archived products"
            className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <Archive className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-zinc-300">No archived products.</p>
          <p className="mt-1 text-sm text-zinc-500">Archived products will appear here for restore or permanent deletion.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleProducts.map((product) => {
            const isPending = pendingId === product.id;
            const isConfirmingDelete = confirmDeleteId === product.id;

            return (
              <article
                key={product.id}
                className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#12121A]">
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      containerClassName="h-full w-full"
                      showFallbackLabel={false}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-100">{product.name}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {product.brand_name} · {product.category_name ?? "Uncategorized"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Archived {formatArchivedDate(product.archived_at)}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-zinc-500">
                      Sell {formatLkr(product.selling_price)} · Buy {formatLkr(product.cost_price)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                  {isConfirmingDelete ? (
                    <div className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 md:w-auto">
                      <p className="text-xs text-rose-200">
                        This action is irreversible. All stock history will be lost.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handlePermanentDelete(product)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500 disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleRestore(product)}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        Restore
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setConfirmDeleteId(product.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Permanently
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
    </>
  );
}

export function ArchivedProductsPageClient(props: ArchivedProductsPageClientProps) {
  return (
    <ToastProvider>
      <ArchivedProductsContent {...props} />
    </ToastProvider>
  );
}
