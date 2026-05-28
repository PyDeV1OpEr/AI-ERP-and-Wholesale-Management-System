import { InventoryPageClient } from "@/components/inventory/inventory-page-client";
import { getInventoryItems } from "@/lib/inventory-api";
import { getCategories } from "@/lib/products-api";
import type { InventoryKpiData } from "@/types/inventory";

const EMPTY_KPI: InventoryKpiData = {
  total_items: 0,
  total_value: 0,
  low_stock_count: 0,
  critical_count: 0,
  out_of_stock_count: 0,
  overstocked_count: 0,
  fast_moving_count: 0,
  dead_stock_count: 0,
};

export default async function InventoryPage() {
  const [data, categories] = await Promise.all([
    getInventoryItems({ page: 1, page_size: 24 }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      page_size: 24,
      total_pages: 0,
      kpi: EMPTY_KPI,
    })),
    getCategories().catch(() => []),
  ]);

  return (
    <InventoryPageClient
      initialItems={data.items}
      initialKpi={data.kpi}
      initialCategories={categories}
      initialPage={data.page}
      initialPageSize={data.page_size}
      initialTotal={data.total}
      initialTotalPages={data.total_pages}
    />
  );
}
