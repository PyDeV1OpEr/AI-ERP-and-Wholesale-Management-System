export interface ProductFormValues {
  name: string;
  brandId: number;
  categoryId: number | null;
  buyingPrice: number;
  sellingPrice: number;
  imageUrl: string | null;
  isActive: boolean;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues | "brandId", string>>;

export function validateProductForm(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Product name is required.";
  }

  if (!values.brandId) {
    errors.brandId = "Please select a brand.";
  }

  if (values.buyingPrice < 0) {
    errors.buyingPrice = "Buying price cannot be negative.";
  }

  if (values.sellingPrice < 0) {
    errors.sellingPrice = "Selling price cannot be negative.";
  }

  if (values.sellingPrice === 0 && values.buyingPrice > 0) {
    errors.sellingPrice = "Default selling price is required.";
  }

  return errors;
}

export function hasFormErrors(errors: ProductFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
