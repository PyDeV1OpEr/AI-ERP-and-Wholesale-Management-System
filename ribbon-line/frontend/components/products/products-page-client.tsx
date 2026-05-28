"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { ProductCard } from "@/components/products/product-card";
import { ProductFormModal } from "@/components/products/product-form-modal";
import { ProductsHeader } from "@/components/products/products-header";
import { ProductImage } from "@/components/ui/product-image";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatLkr } from "@/lib/currency";
import { formatApiError } from "@/lib/format-api-error";
import { getProducts, updateArchiveStatus, updateProduct, uploadProductImage } from "@/lib/products-api";
import type { Brand, Category, Product } from "@/types/products";

interface ProductsPageClientProps {
  initialProducts: Product[];
  initialBrands: Brand[];
  initialCategories: Category[];
}

function ProductsPageContent({ initialProducts, initialBrands, initialCategories }: ProductsPageClientProps) {
  const toast = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [brands, setBrands] = useState(initialBrands);
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renamingProduct, setRenamingProduct] = useState<Product | null>(null);
  const [newName, setNewName] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [changingCategoryProduct, setChangingCategoryProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (overrides?: {
    include_archived?: boolean;
    search?: string;
    brand_id?: number;
    category_id?: number;
  }) => {
    return getProducts({
      include_archived: overrides?.include_archived ?? includeArchived,
      search: overrides?.search ?? search,
      brand_id: overrides?.brand_id ?? selectedBrandId ?? undefined,
      category_id: overrides?.category_id ?? selectedCategoryId ?? undefined
    });
  };

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchProducts();
      setProducts(response.items);
    } catch (reloadError) {
      const message = formatApiError(reloadError instanceof Error ? reloadError.message : "");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const openView = (product: Product) => {
    setViewingProduct(product);
    setViewModalOpen(true);
  };

  const handleDuplicate = (product: Product) => {
    // Duplicate by opening create modal with pre-filled data
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleRename = (product: Product) => {
    setRenamingProduct(product);
    setNewName(product.name);
    setRenameModalOpen(true);
  };

  const handleChangeCategory = (product: Product) => {
    setChangingCategoryProduct(product);
    setSelectedCategoryId(product.category_id);
    setCategoryModalOpen(true);
  };

  const handleRemoveImage = async (product: Product) => {
    try {
      await updateProduct(product.id, {
        name: product.name,
        brand_id: product.brand_id,
        category_id: product.category_id,
        cost_price: Number(product.cost_price),
        selling_price: Number(product.selling_price),
        is_active: product.is_active,
        image_url: null,
        is_archived: product.is_archived,
        base_unit: product.base_unit,
        packaging_levels: []
      });
      toast.success("Product image removed.");
      await reload();
    } catch (error) {
      toast.error(formatApiError(error instanceof Error ? error.message : ""));
    }
  };

  const saveRename = async () => {
    if (!renamingProduct || !newName.trim()) return;
    try {
      await updateProduct(renamingProduct.id, {
        name: newName,
        brand_id: renamingProduct.brand_id,
        category_id: renamingProduct.category_id,
        cost_price: Number(renamingProduct.cost_price),
        selling_price: Number(renamingProduct.selling_price),
        is_active: renamingProduct.is_active,
        image_url: renamingProduct.image_url,
        is_archived: renamingProduct.is_archived,
        base_unit: renamingProduct.base_unit,
        packaging_levels: []
      });
      toast.success("Product renamed.");
      setRenameModalOpen(false);
      await reload();
    } catch (error) {
      toast.error(formatApiError(error instanceof Error ? error.message : ""));
    }
  };

  const saveCategoryChange = async () => {
    if (!changingCategoryProduct || !selectedCategoryId) return;
    try {
      await updateProduct(changingCategoryProduct.id, {
        name: changingCategoryProduct.name,
        brand_id: changingCategoryProduct.brand_id,
        category_id: selectedCategoryId,
        cost_price: Number(changingCategoryProduct.cost_price),
        selling_price: Number(changingCategoryProduct.selling_price),
        is_active: changingCategoryProduct.is_active,
        image_url: changingCategoryProduct.image_url,
        is_archived: changingCategoryProduct.is_archived,
        base_unit: changingCategoryProduct.base_unit,
        packaging_levels: []
      });
      toast.success("Category updated.");
      setCategoryModalOpen(false);
      await reload();
    } catch (error) {
      toast.error(formatApiError(error instanceof Error ? error.message : ""));
    }
  };

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        if (!search.trim()) return true;
        const needle = search.toLowerCase();
        return product.name.toLowerCase().includes(needle) || product.brand_name.toLowerCase().includes(needle);
      }),
    [products, search]
  );

  const onArchiveToggle = async (product: Product) => {
    try {
      await updateArchiveStatus(product.id, !product.is_archived);
      toast.success(product.is_archived ? "Product restored." : "Product archived.");
      await reload();
    } catch (archiveError) {
      toast.error(formatApiError(archiveError instanceof Error ? archiveError.message : ""));
    }
  };

  return (
    <>
      <Navbar />
      <ProductsHeader
        search={search}
        includeArchived={includeArchived}
        selectedBrandId={selectedBrandId}
        selectedCategoryId={selectedCategoryId}
        brands={brands}
        categories={categories}
        onSearchChange={setSearch}
        onBrandChange={async (value) => {
          setSelectedBrandId(value);
          const response = await fetchProducts({ brand_id: value ?? undefined });
          setProducts(response.items);
        }}
        onCategoryChange={async (value) => {
          setSelectedCategoryId(value);
          const response = await fetchProducts({ category_id: value ?? undefined });
          setProducts(response.items);
        }}
        onToggleArchived={async () => {
          const next = !includeArchived;
          setIncludeArchived(next);
          const response = await fetchProducts({ include_archived: next });
          setProducts(response.items);
        }}
        onOpenCreate={openCreate}
      />

      {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <p className="text-zinc-300">No products found.</p>
          <p className="mt-1 text-sm text-zinc-500">Try a different search or create a new product.</p>
        </div>
      ) : (
        <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={openEdit}
              onArchiveToggle={onArchiveToggle}
              onView={openView}
              onDuplicate={handleDuplicate}
              onRename={handleRename}
              onChangeCategory={handleChangeCategory}
              onRemoveImage={handleRemoveImage}
            />
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      <AnimatePresence>
        {viewModalOpen && viewingProduct && (
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
              aria-labelledby="product-view-title"
              tabIndex={-1}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D12] shadow-2xl"
            >
              <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-300">Product Preview</p>
                  <h2 id="product-view-title" className="text-lg font-semibold text-zinc-100">
                    {viewingProduct.name}
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
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                <div className="relative h-48 w-full rounded-xl border border-white/10 overflow-hidden">
                  <ProductImage
                    src={viewingProduct.image_url}
                    alt={viewingProduct.name}
                    containerClassName="h-full w-full"
                    showFallbackLabel={false}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Name</p>
                    <p className="text-sm text-zinc-100">{viewingProduct.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Brand</p>
                    <p className="text-sm text-zinc-100">{viewingProduct.brand_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Category</p>
                    <p className="text-sm text-zinc-100">{viewingProduct.category_name || "Uncategorized"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Status</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      viewingProduct.is_archived ? "bg-zinc-800/90 text-zinc-300" :
                      viewingProduct.is_active ? "bg-emerald-500/20 text-emerald-300" :
                      "bg-amber-500/20 text-amber-300"
                    }`}>
                      {viewingProduct.is_archived ? "Archived" : viewingProduct.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Buying Price</p>
                    <p className="text-sm text-zinc-100 font-semibold">{formatLkr(viewingProduct.cost_price)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Selling Price</p>
                    <p className="text-sm text-violet-200 font-semibold">{formatLkr(viewingProduct.selling_price)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Created</p>
                    <p className="text-sm text-zinc-100">{new Date(viewingProduct.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Updated</p>
                    <p className="text-sm text-zinc-100">{new Date(viewingProduct.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <footer className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
                <button
                  type="button"
                  onClick={() => { setViewModalOpen(false); openEdit(viewingProduct); }}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
                >
                  Edit Product
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

      {/* Quick Rename Modal */}
      <AnimatePresence>
        {renameModalOpen && renamingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setRenameModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0D0D12] p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Rename Product</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Enter new name"
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => setRenameModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRename}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm text-white transition hover:bg-violet-500"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Category Modal */}
      <AnimatePresence>
        {categoryModalOpen && changingCategoryProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCategoryModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0D0D12] p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Change Category</h3>
              <select
                value={selectedCategoryId || ""}
                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => setCategoryModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCategoryChange}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm text-white transition hover:bg-violet-500"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProductFormModal
        isOpen={modalOpen}
        product={editingProduct}
        brands={brands}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
        onBrandCreated={(brand) => setBrands((prev) => [...prev, brand].sort((a, b) => a.name.localeCompare(b.name)))}
        onCategoryCreated={(category) =>
          setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))
        }
      />
    </>
  );
}

export function ProductsPageClient(props: ProductsPageClientProps) {
  return (
    <ToastProvider>
      <ProductsPageContent {...props} />
    </ToastProvider>
  );
}