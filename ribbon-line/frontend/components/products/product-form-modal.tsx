"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { ProductInformationSection } from "@/components/products/form/product-information-section";
import { ProductPricingSection } from "@/components/products/form/product-pricing-section";
import { ProductStatusSection } from "@/components/products/form/product-status-section";
import { useProductForm } from "@/components/products/form/use-product-form";
import { useToast } from "@/components/ui/toast";
import { ValidationMessage } from "@/components/ui/validation-message";
import { formatApiError } from "@/lib/format-api-error";
import {
  createBrand,
  createCategory,
  createProduct,
  updateProduct,
  uploadProductImage
} from "@/lib/products-api";
import type { Brand, Category, Product } from "@/types/products";

interface ProductFormModalProps {
  isOpen: boolean;
  product: Product | null;
  brands: Brand[];
  categories: Category[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  onBrandCreated: (brand: Brand) => void;
  onCategoryCreated: (category: Category) => void;
}

export function ProductFormModal({
  isOpen,
  product,
  brands,
  categories,
  onClose,
  onSaved,
  onBrandCreated,
  onCategoryCreated
}: ProductFormModalProps) {
  const toast = useToast();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultBrandId = brands[0]?.id ?? 0;
  const { values, errors, patch, validate, toPayload, setTouched } = useProductForm(
    product,
    isOpen,
    defaultBrandId
  );

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
    setTouched(true);
    setSubmitError(null);
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = toPayload();
      if (product) {
        await updateProduct(product.id, payload);
        toast.success("Product updated successfully.");
      } else {
        await createProduct(payload);
        toast.success("Product created successfully.");
      }
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

  const handleImageSelect = async (file: File) => {
    setUploadingImage(true);
    try {
      const url = await uploadProductImage(file);
      patch("imageUrl", url);
      toast.success("Image uploaded.");
    } catch (error) {
      toast.error(formatApiError(error instanceof Error ? error.message : "Image upload failed"));
    } finally {
      setUploadingImage(false);
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
            aria-labelledby="product-form-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D12] shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-violet-300">Product Master</p>
                <h2 id="product-form-title" className="text-lg font-semibold text-zinc-100">
                  {product ? "Edit Product" : "Add Product"}
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

              <ProductInformationSection
                name={values.name}
                brandId={values.brandId}
                categoryId={values.categoryId}
                mainUnitName={values.mainUnitName}
                baseUnitName={values.baseUnitName}
                conversionFactor={values.conversionFactor}
                imageUrl={values.imageUrl}
                brands={brands}
                categories={categories}
                errors={{
                  name: errors.name,
                  brandId: errors.brandId,
                  mainUnitName: errors.mainUnitName,
                  baseUnitName: errors.baseUnitName,
                  conversionFactor: errors.conversionFactor,
                }}
                uploadingImage={uploadingImage}
                onNameChange={(v) => patch("name", v)}
                onBrandChange={(v) => patch("brandId", v)}
                onCategoryChange={(v) => patch("categoryId", v)}
                onMainUnitChange={(v) => patch("mainUnitName", v)}
                onBaseUnitChange={(v) => patch("baseUnitName", v)}
                onConversionFactorChange={(v) => patch("conversionFactor", v)}
                onImageUrlChange={(v) => patch("imageUrl", v)}
                onImageSelect={handleImageSelect}
                onCreateBrand={async (name) => {
                  const brand = await createBrand(name);
                  onBrandCreated(brand);
                  patch("brandId", brand.id);
                }}
                onCreateCategory={async (name) => {
                  const category = await createCategory(name);
                  onCategoryCreated(category);
                  patch("categoryId", category.id);
                }}
              />

              <ProductPricingSection
                buyingPrice={values.buyingPrice}
                sellingPrice={values.sellingPrice}
                errors={{ buyingPrice: errors.buyingPrice, sellingPrice: errors.sellingPrice }}
                onBuyingPriceChange={(v) => patch("buyingPrice", v)}
                onSellingPriceChange={(v) => patch("sellingPrice", v)}
              />

              <ProductStatusSection
                isActive={values.isActive}
                onActiveChange={(v) => patch("isActive", v)}
              />
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
                {saving ? "Saving..." : product ? "Save Changes" : "Create Product"}
              </button>
            </footer>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
