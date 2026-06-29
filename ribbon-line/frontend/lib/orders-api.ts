import {
  Order,
  OrderListResponse,
  OrderCreate,
  OrderUpdate,
  OrderItemUpdate,
} from "@/types/orders";

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
    throw new Error(message || `Request failed: ${endpoint}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getOrders(params?: {
  customerId?: number;
  status?: string;
  search?: string;
  offset?: number;
  limit?: number;
}): Promise<OrderListResponse> {
  const query = new URLSearchParams();
  if (params?.customerId) query.set("customer_id", String(params.customerId));
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.offset) query.set("offset", String(params.offset));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.size ? `?${query.toString()}` : "";
  return request<OrderListResponse>(`/orders${qs}`);
}

export async function getOrder(orderId: number): Promise<Order> {
  return request<Order>(`/orders/${orderId}`);
}

export async function createOrder(data: OrderCreate): Promise<Order> {
  return request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOrder(
  orderId: number,
  data: OrderUpdate
): Promise<Order> {
  return request<Order>(`/orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateOrderItem(
  orderId: number,
  itemId: number,
  data: OrderItemUpdate
): Promise<any> {
  return request<any>(`/orders/${orderId}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function reserveOrderItem(
  orderId: number,
  itemId: number
): Promise<Order> {
  return request<Order>(`/orders/${orderId}/items/${itemId}/reserve`, {
    method: "POST",
  });
}

export async function deliverOrderItem(
  orderId: number,
  itemId: number,
  deliveredQuantity: number
): Promise<Order> {
  return request<Order>(`/orders/${orderId}/items/${itemId}/deliver`, {
    method: "POST",
    body: JSON.stringify({ deliveredQuantity }),
  });
}

export async function completeOrder(orderId: number): Promise<Order> {
  return request<Order>(`/orders/${orderId}/complete`, {
    method: "POST",
  });
}

export function getOrderExportUrl(orderId: number): string {
  return `${API_BASE_URL}/orders/${orderId}/export`;
}

export async function deleteOrder(orderId: number): Promise<void> {
  return request<void>(`/orders/${orderId}`, {
    method: "DELETE",
  });
}
