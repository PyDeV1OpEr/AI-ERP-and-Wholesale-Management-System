const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export interface Customer {
  id: number;
  full_name: string;
  email: string | null;
  phone_number: string;
  address: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  total_orders_count: number;
  total_spent: string;
  last_order_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  offset: number;
  limit: number;
}

export interface CustomerCreate {
  full_name: string;
  email?: string | null;
  phone_number: string;
  address?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
}

export interface CustomerUpdate {
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED" | null;
}

async function fetchFromApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${endpoint}`);
  }
  return response.json() as Promise<T>;
}

export async function getCustomers(
  search?: string,
  status?: string,
  offset: number = 0,
  limit: number = 50
): Promise<CustomerListResponse> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  params.set("offset", offset.toString());
  params.set("limit", limit.toString());

  return fetchFromApi<CustomerListResponse>(
    `/customers?${params.toString()}`
  );
}

export async function getCustomer(customerId: number): Promise<Customer> {
  return fetchFromApi<Customer>(`/customers/${customerId}`);
}

export async function createCustomer(data: CustomerCreate): Promise<Customer> {
  return fetchFromApi<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(
  customerId: number,
  data: CustomerUpdate
): Promise<Customer> {
  return fetchFromApi<Customer>(`/customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(customerId: number): Promise<void> {
  return fetchFromApi(`/customers/${customerId}`, {
    method: "DELETE",
  });
}
