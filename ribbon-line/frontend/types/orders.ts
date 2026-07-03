export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productCode: string | null;
  unit: string;
  requestedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  unitPrice: string;
  totalPrice: string;
  status: "PENDING" | "DELIVERED" | "OUT_OF_STOCK";
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string | null;
  status: "PENDING" | "COMPLETED";
  totalAmount: string;
  notes: string | null;
  createdBy: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  offset: number;
  limit: number;
}

export interface OrderItemCreate {
  productId: number;
  unit: string;
  requestedQuantity: number;
}

export interface OrderCreate {
  customerId: number;
  items: OrderItemCreate[];
  notes?: string | null;
  createdBy?: string | null;
}

export interface OrderUpdate {
  status?: string;
  notes?: string | null;
}

export interface OrderItemUpdate {
  deliveredQuantity?: number;
  status?: string;
  unit?: string;
  requestedQuantity?: number;
}
