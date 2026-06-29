import { OrdersPageClient } from "@/components/orders/orders-page-client";
import { getOrders } from "@/lib/orders-api";

export default async function OrdersPage() {
  const orders = await getOrders().catch(() => ({
    items: [],
    total: 0,
    offset: 0,
    limit: 50,
  }));

  return <OrdersPageClient initialOrders={orders.items} />;
}
