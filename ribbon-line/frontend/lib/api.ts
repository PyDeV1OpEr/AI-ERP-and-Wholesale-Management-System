import { dashboardDemoData } from "@/lib/dashboard-data";
import type {
  DashboardActivity,
  DashboardDataBundle,
  DashboardInsight,
  DashboardOrder,
  DashboardStat,
  DashboardStockItem
} from "@/types/dashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function fetchFromApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${endpoint}`);
  }
  return response.json() as Promise<T>;
}

export async function getDashboardData(): Promise<DashboardDataBundle> {
  try {
    const [stats, orders, activities, insights, stock] = await Promise.all([
      fetchFromApi<DashboardStat[]>("/dashboard/stats"),
      fetchFromApi<DashboardOrder[]>("/dashboard/orders"),
      fetchFromApi<DashboardActivity[]>("/dashboard/activities"),
      fetchFromApi<DashboardInsight[]>("/dashboard/insights"),
      fetchFromApi<DashboardStockItem[]>("/dashboard/stock")
    ]);

    return { stats, orders, activities, insights, stock };
  } catch {
    // Offline/public demo fallback to preserve UX even when API is unavailable.
    return dashboardDemoData;
  }
}
