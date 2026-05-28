import { formatApiError } from "@/lib/format-api-error";
import type {
  InventoryAnalyticsResponse,
  InventoryDetailResponse,
  InventoryItem,
  InventoryListResponse,
  InventoryMovementPageResponse,
  InventorySettingsPayload,
  InventoryStockOperationPayload,
  InventoryStockOperationResponse,
} from "@/types/inventory";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(formatApiError(message || `Request failed: ${endpoint}`));
  }

  return (await response.json()) as T;
}

export async function getInventoryItems(params?: {
  search?: string;
  category_id?: number;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<InventoryListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.category_id) query.set("category_id", String(params.category_id));
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  const qs = query.size ? `?${query.toString()}` : "";
  return request<InventoryListResponse>(`/inventory${qs}`);
}

export async function getInventoryDetail(productId: number): Promise<InventoryDetailResponse> {
  return request<InventoryDetailResponse>(`/inventory/${productId}`);
}

export async function getInventoryAnalytics(productId: number): Promise<InventoryAnalyticsResponse> {
  return request<InventoryAnalyticsResponse>(`/inventory/${productId}/analytics`);
}

export async function getInventoryMovements(
  productId: number,
  params?: { page?: number; page_size?: number }
): Promise<InventoryMovementPageResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  const qs = query.size ? `?${query.toString()}` : "";
  return request<InventoryMovementPageResponse>(`/inventory/${productId}/movements${qs}`);
}

export async function updateInventorySettings(
  productId: number,
  payload: InventorySettingsPayload
): Promise<InventoryItem> {
  return request<InventoryItem>(`/inventory/${productId}/settings`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function applyInventoryStockOperation(
  productId: number,
  payload: InventoryStockOperationPayload
): Promise<InventoryStockOperationResponse> {
  return request<InventoryStockOperationResponse>(`/inventory/${productId}/stock-operations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

