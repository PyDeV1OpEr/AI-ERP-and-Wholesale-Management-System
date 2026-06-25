import {
  Customer,
  CustomerListResponse,
  CustomerCreate,
  CustomerUpdate,
  CustomerSummary,
  CustomerProfile,
  CustomerKpis,
  CustomerTransactionListResponse,
  CustomerTransactionCreate,
  CustomerTransaction,
  CustomerLedgerResponse,
  CustomerNote,
  CustomerNoteCreate,
  CustomerNoteUpdate,
  CustomerCheque,
  CustomerChequeCreate,
  CustomerChequeUpdate,
  CustomerActivityLog,
} from "@/types/customers";

export * from "@/types/customers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

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

// --- Customers ---

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

export async function getCustomerSummary(customerId: number): Promise<CustomerSummary> {
  return fetchFromApi<CustomerSummary>(`/customers/${customerId}/summary`);
}

export async function getCustomerProfile(customerId: number): Promise<CustomerProfile> {
  return fetchFromApi<CustomerProfile>(`/customers/${customerId}/profile`);
}

export async function getCustomerKpis(customerId: number): Promise<CustomerKpis> {
  return fetchFromApi<CustomerKpis>(`/customers/${customerId}/kpis`);
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

// --- Transactions ---

export async function getCustomerTransactions(
  customerId: number,
  offset: number = 0,
  limit: number = 50
): Promise<CustomerTransactionListResponse> {
  const params = new URLSearchParams();
  params.set("offset", offset.toString());
  params.set("limit", limit.toString());
  return fetchFromApi<CustomerTransactionListResponse>(`/customers/${customerId}/transactions?${params.toString()}`);
}

export async function addTransaction(customerId: number, data: CustomerTransactionCreate): Promise<CustomerTransaction> {
  return fetchFromApi<CustomerTransaction>(`/customers/${customerId}/transactions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Ledger ---

export async function getCustomerLedger(customerId: number): Promise<CustomerLedgerResponse> {
  return fetchFromApi<CustomerLedgerResponse>(`/customers/${customerId}/ledger`);
}

// --- Notes ---

export async function getCustomerNotes(customerId: number): Promise<CustomerNote[]> {
  return fetchFromApi<CustomerNote[]>(`/customers/${customerId}/notes`);
}

export async function addNote(customerId: number, data: CustomerNoteCreate): Promise<CustomerNote> {
  return fetchFromApi<CustomerNote>(`/customers/${customerId}/notes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateNote(customerId: number, noteId: number, data: CustomerNoteUpdate): Promise<CustomerNote> {
  return fetchFromApi<CustomerNote>(`/customers/${customerId}/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(customerId: number, noteId: number): Promise<void> {
  return fetchFromApi(`/customers/${customerId}/notes/${noteId}`, {
    method: "DELETE",
  });
}

// --- Cheques ---

export async function getCustomerCheques(customerId: number): Promise<CustomerCheque[]> {
  return fetchFromApi<CustomerCheque[]>(`/customers/${customerId}/cheques`);
}

export async function addCheque(customerId: number, data: CustomerChequeCreate): Promise<CustomerCheque> {
  return fetchFromApi<CustomerCheque>(`/customers/${customerId}/cheques`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCheque(customerId: number, chequeId: number, data: CustomerChequeUpdate): Promise<CustomerCheque> {
  return fetchFromApi<CustomerCheque>(`/customers/${customerId}/cheques/${chequeId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// --- Activity Logs ---

export async function getCustomerActivity(customerId: number, limit: number = 20): Promise<CustomerActivityLog[]> {
  return fetchFromApi<CustomerActivityLog[]>(`/customers/${customerId}/activity?limit=${limit}`);
}
