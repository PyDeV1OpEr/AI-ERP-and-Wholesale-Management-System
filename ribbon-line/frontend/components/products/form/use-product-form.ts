"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hasFormErrors,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues
} from "@/lib/product-form-validation";
import type { Product } from "@/types/products";

const DEFAULT_MAIN_UNIT = "Box";
const DEFAULT_BASE_UNIT = "Unit";

export function useProductForm(product: Product | null, isOpen: boolean, defaultBrandId: number) {
  const [values, setValues] = useState<ProductFormValues>({
      name: "",
      brandId: defaultBrandId,
      categoryId: null,
      mainUnitName: DEFAULT_MAIN_UNIT,
      baseUnitName: DEFAULT_BASE_UNIT,
      conversionFactor: 1,
      buyingPrice: 0,
    sellingPrice: 0,
    imageUrl: null,
    isActive: true
  });
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValues({
      name: product?.name ?? "",
      brandId: product?.brand_id ?? defaultBrandId,
      categoryId: product?.category_id ?? null,
      mainUnitName: product?.main_unit_name ?? DEFAULT_MAIN_UNIT,
      baseUnitName: product?.base_unit_name ?? product?.base_unit ?? DEFAULT_BASE_UNIT,
      conversionFactor: product?.conversion_factor ?? 1,
      buyingPrice: Number(product?.cost_price ?? 0),
      sellingPrice: Number(product?.selling_price ?? 0),
      imageUrl: product?.image_url ?? null,
      isActive: product?.is_active ?? true
    });
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
      base_unit: values.baseUnitName.trim(),
      main_unit_name: values.mainUnitName.trim(),
      base_unit_name: values.baseUnitName.trim(),
      conversion_factor: values.conversionFactor,
      selling_price: values.sellingPrice,
      cost_price: values.buyingPrice,
      image_url: values.imageUrl,
      is_active: values.isActive,
      packaging_levels: [] as { unit_name: string; contains: number }[]
    }),
    [values]
  );

  return {
    values,
    errors,
    touched,
    setTouched,
    patch,
    validate,
    toPayload
  };
}
