import { formatApiError } from "@/lib/format-api-error";
import { resolveProductImageUrl } from "@/lib/product-image";
import type { Brand, Category, Product, ProductPayload, ProductsListResponse } from "@/types/products";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(formatApiError(message || `Request failed: ${endpoint}`));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getProducts(params?: {
  search?: string;
  brand_id?: number;
  category_id?: number;
}): Promise<ProductsListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.brand_id) query.set("brand_id", String(params.brand_id));
  if (params?.category_id) query.set("category_id", String(params.category_id));
  const qs = query.size ? `?${query.toString()}` : "";
  return request<ProductsListResponse>(`/products${qs}`);
}

export async function getArchivedProducts(params?: {
  search?: string;
  brand_id?: number;
  category_id?: number;
}): Promise<ProductsListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.brand_id) query.set("brand_id", String(params.brand_id));
  if (params?.category_id) query.set("category_id", String(params.category_id));
  const qs = query.size ? `?${query.toString()}` : "";
  return request<ProductsListResponse>(`/products/archived${qs}`);
}

export async function getBrands(): Promise<Brand[]> {
  return request<Brand[]>("/products/brands");
}

export async function createBrand(name: string): Promise<Brand> {
  return request<Brand>("/products/brands", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export async function getCategories(): Promise<Category[]> {
  return request<Category[]>("/products/categories");
}

export async function createCategory(name: string): Promise<Category> {
  return request<Category>("/products/categories", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  return request<Product>("/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateProduct(productId: number, payload: ProductPayload): Promise<Product> {
  return request<Product>(`/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function archiveProduct(productId: number): Promise<Product> {
  return request<Product>(`/products/${productId}/archive`, {
    method: "POST"
  });
}

export async function restoreProduct(productId: number): Promise<Product> {
  return request<Product>(`/products/${productId}/restore`, {
    method: "POST"
  });
}

export async function permanentlyDeleteProduct(productId: number): Promise<void> {
  await request<void>(`/products/${productId}`, {
    method: "DELETE"
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/products/upload-image`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Image upload failed");
  }
  const data = (await response.json()) as { image_url: string };
  return resolveProductImageUrl(data.image_url) ?? data.image_url;
}
