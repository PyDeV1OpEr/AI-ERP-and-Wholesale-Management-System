import { ArchivedProductsPageClient } from "@/components/products/archived-products-page-client";
import { getArchivedProducts } from "@/lib/products-api";

export default async function ArchivedProductsPage() {
  const products = await getArchivedProducts().catch(() => ({ items: [], total: 0 }));

  return <ArchivedProductsPageClient initialProducts={products.items} />;
}
