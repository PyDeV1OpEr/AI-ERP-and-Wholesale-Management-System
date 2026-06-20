export interface InventoryKpiData {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  critical_count: number;
  out_of_stock_count: number;
  overstocked_count: number;
  fast_moving_count: number;
  dead_stock_count: number;
}

export interface InventoryUnitInfo {
  unit_name: string;
  is_base: boolean;
  level: number;
  conversion_quantity: number | null;
  parent_unit_name: string | null;
}

export interface StockMovement {
  id: number;
  movement_type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "OPENING_STOCK" | string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export type InventoryStatus =
  | "out_of_stock"
  | "critical"
  | "low_stock"
  | "healthy"
  | "overstocked"
  | "not_configured";

export interface StockHealth {
  percentage: number | null;
  status: InventoryStatus;
  current_quantity: number;
  max_capacity: number;
  reorder_level: number;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  sku: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  brand_name: string;
  category_name: string | null;
  supplier_name: string | null;
  image_url: string | null;
  main_unit_name: string;
  base_unit_name: string;
  conversion_factor: number;
  stock_location: string | null;
  base_unit: string;
  quantity_base_unit: number;
  stock_quantity: number;
  main_units: number;
  remaining_base_units: number;
  quantity_display: string;
  max_capacity: number;
  reorder_level: number;
  standard_pack_size: number;
  unit_cost: string;
  selling_price: string;
  inventory_value: string;
  status: InventoryStatus;
  stock_health_percentage: number | null;
  stock_health_status: InventoryStatus;
  inventory_turnover_rate: number | null;
  estimated_stock_duration_days: number | null;
  stock_intelligence_category: string | null;
  total_units_sold: number;
  total_income_generated: string;
  last_movement_date: string | null;
  units: InventoryUnitInfo[];
  created_at: string | null;
  updated_at: string | null;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  kpi: InventoryKpiData;
}

export interface InventoryDetailResponse {
  item: InventoryItem;
  stock_health: StockHealth;
}

export interface InventorySettingsPayload {
  max_capacity?: number;
  reorder_level?: number;
  standard_pack_size?: number;
  stock_location?: string | null;
}

export interface InventoryStockOperationPayload {
  operation: "add" | "remove" | "adjust";
  quantity: number;
  reference?: string | null;
  notes?: string | null;
}

export interface InventoryStockOperationResponse {
  item: InventoryItem;
  movement: StockMovement;
}

export interface InventoryMovementPageResponse {
  items: StockMovement[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface InventoryMovementSummary {
  movement_count: number;
  total_units_received: number;
  total_units_sold: number;
  net_quantity_change: number;
  average_weekly_units_sold: number | null;
  inventory_turnover_rate: number | null;
  estimated_stock_duration_days: number | null;
  revenue_from_stock_reductions: number;
  last_movement_date: string | null;
  has_enough_activity: boolean;
}

export interface InventoryIntelligenceSignal {
  category:
    | "fast_moving"
    | "slow_moving"
    | "dead_stock"
    | "high_value_item"
    | "low_stock_risk"
    | "restock_recommended";
  title: string;
  reason: string;
  severity: "info" | "warning" | "critical" | "positive";
}

export interface InventoryAnalyticsResponse {
  stock_health: StockHealth;
  movement_summary: InventoryMovementSummary;
  intelligence: InventoryIntelligenceSignal[];
}
