import { ProductsPageClient } from "@/components/products/products-page-client";
import { getBrands, getCategories, getProducts } from "@/lib/products-api";

export default async function ProductsPage() {
  const [products, brands, categories] = await Promise.all([
    getProducts().catch(() => ({ items: [], total: 0 })),
    getBrands().catch(() => []),
    getCategories().catch(() => [])
  ]);

  return (
    <ProductsPageClient
      initialProducts={products.items}
      initialBrands={brands}
      initialCategories={categories}
    />
  );
}
