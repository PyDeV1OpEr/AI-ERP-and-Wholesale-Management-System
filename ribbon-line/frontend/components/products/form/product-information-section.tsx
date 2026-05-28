"use client";

import { useState } from "react";
import { FormField, fieldInputClass } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { ImageUploader } from "@/components/ui/image-uploader";
import type { Brand, Category } from "@/types/products";

interface ProductInformationSectionProps {
  name: string;
  brandId: number;
  categoryId: number | null;
  imageUrl: string | null;
  brands: Brand[];
  categories: Category[];
  errors: { name?: string; brandId?: string };
  uploadingImage: boolean;
  onNameChange: (value: string) => void;
  onBrandChange: (value: number) => void;
  onCategoryChange: (value: number | null) => void;
  onImageSelect: (file: File) => void;
  onCreateBrand: (name: string) => Promise<void>;
  onCreateCategory: (name: string) => Promise<void>;
}

export function ProductInformationSection({
  name,
  brandId,
  categoryId,
  imageUrl,
  brands,
  categories,
  errors,
  uploadingImage,
  onNameChange,
  onBrandChange,
  onCategoryChange,
  onImageSelect,
  onCreateBrand,
  onCreateCategory
}: ProductInformationSectionProps) {
  return (
    <FormSection
      title="Product Information"
      description="Define what this product is. This is the master record used across the ERP."
    >
      <FormField
        label="Product Name"
        htmlFor="product-name"
        required
        helper="Use a clear name your team will recognize instantly."
        error={errors.name}
      >
        <input
          id="product-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={fieldInputClass}
          aria-invalid={!!errors.name}
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Brand" htmlFor="product-brand" required error={errors.brandId}>
          <select
            id="product-brand"
            value={brandId || ""}
            onChange={(e) => onBrandChange(Number(e.target.value))}
            className={fieldInputClass}
            aria-invalid={!!errors.brandId}
          >
            <option value="" disabled>
              Select brand
            </option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <QuickAdd placeholder="New brand name" onAdd={onCreateBrand} />
        </FormField>

        <FormField
          label="Category"
          htmlFor="product-category"
          helper="Optional. Helps organize your product catalog."
        >
          <select
            id="product-category"
            value={categoryId ?? ""}
            onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : null)}
            className={fieldInputClass}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <QuickAdd placeholder="New category name" onAdd={onCreateCategory} />
        </FormField>
      </div>

      <FormField label="Product Image" helper="Optional. Helps your team identify products quickly.">
        <ImageUploader imageUrl={imageUrl} uploading={uploadingImage} onSelect={onImageSelect} />
      </FormField>
    </FormSection>
  );
}

function QuickAdd({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => Promise<void> }) {
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!value.trim()) return;
    setAdding(true);
    try {
      await onAdd(value.trim());
      setValue("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mt-2 flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-white/10 bg-[#0E0E15] px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-violet-500/40"
      />
      <button
        type="button"
        disabled={adding || !value.trim()}
        onClick={handleAdd}
        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50"
      >
        {adding ? "..." : "Add"}
      </button>
    </div>
  );
}
