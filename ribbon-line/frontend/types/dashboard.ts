export type TrendDirection = "up" | "down";

export interface DashboardStat {
  id: string;
  title: string;
  value: string;
  trend_percent: number;
  trend_direction: TrendDirection;
  subtitle: string;
}

export interface DashboardOrder {
  id: string;
  customer_name: string;
  sku: string;
  quantity: number;
  total_amount: number;
  status: string;
  ordered_at: string;
}

export interface DashboardActivity {
  id: string;
  title: string;
  description: string;
  level: "success" | "warning" | "info";
  happened_at: string;
}

export interface DashboardInsight {
  id: string;
  headline: string;
  detail: string;
  confidence: number;
  impact: "high" | "medium" | "low";
}

export interface DashboardStockItem {
  id: string;
  item_name: string;
  sku: string;
  available_units: number;
  reorder_level: number;
}

export interface DashboardDataBundle {
  stats: DashboardStat[];
  orders: DashboardOrder[];
  activities: DashboardActivity[];
  insights: DashboardInsight[];
  stock: DashboardStockItem[];
}
