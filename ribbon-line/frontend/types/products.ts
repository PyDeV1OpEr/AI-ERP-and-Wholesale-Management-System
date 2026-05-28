export interface Brand {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface ProductPackagingLevelInput {
  unit_name: string;
  contains: number;
}

export interface ProductUnit {
  id: number;
  name: string;
  is_base: boolean;
  level: number;
}

export interface ProductConversion {
  id: number;
  parent_unit_id: number;
  child_unit_id: number;
  parent_unit_name: string;
  child_unit_name: string;
  quantity: number;
}

export interface Product {
  id: number;
  name: string;
  brand_id: number;
  brand_name: string;
  category_id: number | null;
  category_name: string | null;
  base_unit: string;
  selling_price: string;
  cost_price: string;
  image_url: string | null;
  is_active: boolean;
  is_archived: boolean;
  packaging_summary: string;
  units: ProductUnit[];
  conversions: ProductConversion[];
  created_at: string;
  updated_at: string;
}

export interface ProductsListResponse {
  items: Product[];
  total: number;
}

export interface ProductPayload {
  name: string;
  brand_id: number;
  category_id: number | null;
  base_unit: string;
  selling_price: number;
  cost_price: number;
  image_url: string | null;
  is_active: boolean;
  is_archived?: boolean;
  packaging_levels: ProductPackagingLevelInput[];
}
