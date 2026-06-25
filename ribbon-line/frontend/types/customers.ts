export interface Customer {
  id: number;
  customer_code: string | null;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone_number: string;
  whatsapp_number: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  customer_type: "RETAIL" | "WHOLESALE" | "VIP" | "DISTRIBUTOR";
  status: "ACTIVE" | "INACTIVE" | "BLOCKED" | "VIP" | "CREDIT_HOLD";
  credit_limit: number;
  total_orders_count: number;
  total_spent: number;
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

export interface CustomerSummary {
  id: number;
  customer_code: string | null;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone_number: string;
  status: string;
  customer_type: string;
  total_orders_count: number;
  total_spent: number;
  last_order_date: string | null;
}

export interface CustomerCreate {
  full_name: string;
  company_name?: string | null;
  email?: string | null;
  phone_number: string;
  whatsapp_number?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;
  customer_type?: "RETAIL" | "WHOLESALE" | "VIP" | "DISTRIBUTOR";
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED" | "VIP" | "CREDIT_HOLD";
  credit_limit?: number;
}

export interface CustomerUpdate {
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  whatsapp_number?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;
  customer_type?: "RETAIL" | "WHOLESALE" | "VIP" | "DISTRIBUTOR" | null;
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED" | "VIP" | "CREDIT_HOLD" | null;
  credit_limit?: number | null;
}

export interface CustomerTransaction {
  id: number;
  customer_id: number;
  transaction_type: "CREDIT" | "DEBIT";
  amount: number;
  payment_method: "CASH" | "BANK_TRANSFER" | "CHEQUE" | null;
  reference_number: string | null;
  transaction_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CustomerTransactionCreate {
  transaction_type: "CREDIT" | "DEBIT";
  amount: number;
  payment_method?: "CASH" | "BANK_TRANSFER" | "CHEQUE" | null;
  reference_number?: string | null;
  transaction_date?: string | null;
  notes?: string | null;
  created_by?: string | null;
}

export interface CustomerTransactionListResponse {
  items: CustomerTransaction[];
  total: number;
  offset: number;
  limit: number;
}

export interface CustomerNote {
  id: number;
  customer_id: number;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerNoteCreate {
  content: string;
  created_by?: string | null;
}

export interface CustomerNoteUpdate {
  content: string;
}

export interface CustomerCheque {
  id: number;
  customer_id: number;
  cheque_number: string;
  bank_name: string | null;
  cheque_date: string;
  amount: number;
  status: "PENDING" | "CLEARED" | "BOUNCED" | "CANCELLED";
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerChequeCreate {
  cheque_number: string;
  bank_name?: string | null;
  cheque_date: string;
  amount: number;
  reference?: string | null;
  notes?: string | null;
}

export interface CustomerChequeUpdate {
  status: "PENDING" | "CLEARED" | "BOUNCED" | "CANCELLED";
  notes?: string | null;
}

export interface CustomerActivityLog {
  id: number;
  customer_id: number;
  event_type: string;
  description: string;
  metadata_json: string | null;
  created_at: string;
}

export interface CustomerKpis {
  outstanding_balance: number;
  credit_limit: number;
  available_credit: number;
  total_credit_added: number;
  total_payments_received: number;
  total_transactions: number;
  last_transaction_date: string | null;
  customer_since: string;
}

export interface LedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  transaction_id: number | null;
}

export interface CustomerLedgerResponse {
  entries: LedgerEntry[];
  opening_balance: number;
  closing_balance: number;
}

export interface CustomerProfile {
  customer: Customer;
  kpis: CustomerKpis;
  recent_transactions: CustomerTransaction[];
  recent_notes: CustomerNote[];
  recent_activity: CustomerActivityLog[];
}
