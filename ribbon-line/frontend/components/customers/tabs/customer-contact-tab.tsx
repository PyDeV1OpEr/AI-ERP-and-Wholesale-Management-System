import { Customer } from "@/types/customers";

export function CustomerContactTab({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="text-lg font-medium text-zinc-100">Contact Information</h3>
      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
        <div><p className="text-xs text-zinc-500 mb-1">Full Name</p><p className="text-sm text-zinc-200">{customer.full_name}</p></div>
        <div><p className="text-xs text-zinc-500 mb-1">Company</p><p className="text-sm text-zinc-200">{customer.company_name || '-'}</p></div>
        <div><p className="text-xs text-zinc-500 mb-1">Email</p><p className="text-sm text-zinc-200">{customer.email || '-'}</p></div>
        <div><p className="text-xs text-zinc-500 mb-1">Phone</p><p className="text-sm text-zinc-200">{customer.phone_number}</p></div>
        <div><p className="text-xs text-zinc-500 mb-1">WhatsApp</p><p className="text-sm text-zinc-200">{customer.whatsapp_number || '-'}</p></div>
        <div className="col-span-2"><p className="text-xs text-zinc-500 mb-1">Address</p><p className="text-sm text-zinc-200">{customer.address || '-'}</p></div>
        <div><p className="text-xs text-zinc-500 mb-1">City</p><p className="text-sm text-zinc-200">{customer.city || '-'}</p></div>
        <div><p className="text-xs text-zinc-500 mb-1">Country</p><p className="text-sm text-zinc-200">{customer.country || '-'}</p></div>
        <div><p className="text-xs text-zinc-500 mb-1">Postal Code</p><p className="text-sm text-zinc-200">{customer.postal_code || '-'}</p></div>
      </div>
    </div>
  );
}
