"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hasFormErrors,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues
} from "@/lib/product-form-validation";
import type { Product } from "@/types/products";

const DEFAULT_BASE_UNIT = "Unit";

export function useProductForm(product: Product | null, isOpen: boolean, defaultBrandId: number) {
  const [values, setValues] = useState<ProductFormValues>({
    name: "",
    brandId: defaultBrandId,
    categoryId: null,
    buyingPrice: 0,
    sellingPrice: 0,
    imageUrl: null,
    isActive: true
  });
  const [isArchived, setIsArchived] = useState(false);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValues({
      name: product?.name ?? "",
      brandId: product?.brand_id ?? defaultBrandId,
      categoryId: product?.category_id ?? null,
      buyingPrice: Number(product?.cost_price ?? 0),
      sellingPrice: Number(product?.selling_price ?? 0),
      imageUrl: product?.image_url ?? null,
      isActive: product?.is_active ?? true
    });
    setIsArchived(product?.is_archived ?? false);
    setErrors({});
    setTouched(false);
  }, [isOpen, product, defaultBrandId]);

  const patch = useCallback(<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const validate = useCallback((): boolean => {
    const nextErrors = validateProductForm(values);
    setErrors(nextErrors);
    return !hasFormErrors(nextErrors);
  }, [values]);

  const toPayload = useCallback(
    () => ({
      name: values.name.trim(),
      brand_id: values.brandId,
      category_id: values.categoryId,
      base_unit: product?.base_unit ?? DEFAULT_BASE_UNIT,
      selling_price: values.sellingPrice,
      cost_price: values.buyingPrice,
      image_url: values.imageUrl,
      is_active: values.isActive,
      is_archived: isArchived,
      packaging_levels: [] as { unit_name: string; contains: number }[]
    }),
    [values, isArchived, product?.base_unit]
  );

  return {
    values,
    isArchived,
    errors,
    touched,
    setTouched,
    patch,
    setIsArchived,
    validate,
    toPayload
  };
}
