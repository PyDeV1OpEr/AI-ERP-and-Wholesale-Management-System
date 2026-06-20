import { CustomersPageClient } from "@/components/customers/customers-page-client";
import { getCustomers } from "@/lib/customers-api";

export default async function CustomersPage() {
  const customers = await getCustomers().catch(() => ({
    items: [],
    total: 0,
    offset: 0,
    limit: 50,
  }));

  return <CustomersPageClient initialCustomers={customers.items} />;
}
