import { ChevronLeft, Edit, Plus, FileText, FileSearch } from "lucide-react";
import Link from "next/link";
import { CustomerProfile } from "@/types/customers";
import { useState } from "react";
import { CustomerFormModal } from "./customer-form-modal";

interface CustomerProfileHeaderProps {
  profile: CustomerProfile;
  onUpdated: () => Promise<void>;
}

export function CustomerProfileHeader({ profile, onUpdated }: CustomerProfileHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const statusLabel = {
    ACTIVE: "Active",
    VIP: "VIP",
    CREDIT_HOLD: "Credit Hold",
    INACTIVE: "Inactive",
    BLOCKED: "Blocked",
  }[profile.customer.status] || profile.customer.status;

  const statusClass = {
    ACTIVE: "bg-emerald-500/20 text-emerald-300",
    VIP: "bg-fuchsia-500/20 text-fuchsia-300",
    CREDIT_HOLD: "bg-orange-500/20 text-orange-300",
    INACTIVE: "bg-amber-500/20 text-amber-300",
    BLOCKED: "bg-red-500/20 text-red-300",
  }[profile.customer.status] || "bg-zinc-500/20 text-zinc-300";

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between rounded-2xl border border-white/10 bg-[#0D0D12] p-6">
        <div className="flex flex-col gap-4">
          <Link 
            href="/customers" 
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors w-fit"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Customers
          </Link>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-zinc-100">{profile.customer.full_name}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
              {profile.customer.customer_code && (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-300">{profile.customer.customer_code}</span>
                </div>
              )}
              {profile.customer.customer_type && (
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold tracking-wider text-zinc-300">
                    {profile.customer.customer_type}
                  </span>
                </div>
              )}
              {profile.customer.company_name && (
                <div className="flex items-center gap-1.5">
                  <span>{profile.customer.company_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span>{profile.customer.phone_number}</span>
              </div>
              {profile.customer.email && (
                <div className="flex items-center gap-1.5">
                  <span>{profile.customer.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </button>
        </div>
      </div>

      <CustomerFormModal
        isOpen={isEditModalOpen}
        customer={profile.customer}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={onUpdated}
      />
    </>
  );
}
