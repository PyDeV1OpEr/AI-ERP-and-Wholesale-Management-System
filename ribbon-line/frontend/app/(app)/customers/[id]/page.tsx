import { notFound } from "next/navigation";
import { CustomerProfileClient } from "@/components/customers/customer-profile-client";
import { getCustomerProfile } from "@/lib/customers-api";

interface CustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const resolvedParams = await params;
  const customerId = parseInt(resolvedParams.id, 10);

  if (isNaN(customerId)) {
    notFound();
  }

  try {
    const profile = await getCustomerProfile(customerId);
    return <CustomerProfileClient initialProfile={profile} />;
  } catch (error) {
    notFound();
  }
}
