"use client";

import { useState } from "react";
import { Navbar } from "@/components/dashboard/navbar";
import { ToastProvider } from "@/components/ui/toast";
import { CustomerProfileHeader } from "./customer-profile-header";
import { CustomerKpiWidgets } from "./customer-kpi-widgets";
import { CustomerProfile } from "@/types/customers";

import { CustomerOverviewTab } from "./tabs/customer-overview-tab";
import { CustomerFinancialTab } from "./tabs/customer-financial-tab";
import { CustomerTransactionsTab } from "./tabs/customer-transactions-tab";
import { CustomerLedgerTab } from "./tabs/customer-ledger-tab";
import { CustomerChequesTab } from "./tabs/customer-cheques-tab";
import { CustomerNotesTab } from "./tabs/customer-notes-tab";
import { CustomerTimelineTab } from "./tabs/customer-timeline-tab";
import { CustomerOrdersTab } from "./tabs/customer-orders-tab";
import { CustomerPaymentsTab } from "./tabs/customer-payments-tab";
import { CustomerInvoicesTab } from "./tabs/customer-invoices-tab";
import { CustomerContactTab } from "./tabs/customer-contact-tab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "financials", label: "Financials" },
  { id: "transactions", label: "Transactions" },
  { id: "ledger", label: "Ledger" },
  { id: "cheques", label: "Cheques" },
  { id: "orders", label: "Orders" },
  { id: "invoices", label: "Invoices" },
  { id: "payments", label: "Payments" },
  { id: "notes", label: "Notes" },
  { id: "timeline", label: "Timeline" },
  { id: "contact", label: "Contact Info" },
] as const;

type TabId = typeof TABS[number]["id"];

interface CustomerProfileClientProps {
  initialProfile: CustomerProfile;
}

function CustomerProfileContent({ initialProfile }: CustomerProfileClientProps) {
  const [profile, setProfile] = useState<CustomerProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // A method to trigger a full profile reload if we modify nested resources
  const refreshProfile = async () => {
    try {
      const response = await fetch(`/customers/${profile.customer.id}/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (e) {
      console.error("Failed to refresh profile", e);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col space-y-6">
        <CustomerProfileHeader profile={profile} onUpdated={refreshProfile} />
        <CustomerKpiWidgets kpis={profile.kpis} />

        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0D0D12] overflow-hidden">
          <div className="flex overflow-x-auto border-b border-white/10 bg-white/[0.02] scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-violet-500 text-violet-300 bg-white/[0.03]"
                    : "border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.01]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "overview" && <CustomerOverviewTab profile={profile} />}
            {activeTab === "financials" && <CustomerFinancialTab profile={profile} />}
            {activeTab === "transactions" && <CustomerTransactionsTab customerId={profile.customer.id} onUpdated={refreshProfile} />}
            {activeTab === "ledger" && <CustomerLedgerTab customerId={profile.customer.id} />}
            {activeTab === "cheques" && <CustomerChequesTab customerId={profile.customer.id} onUpdated={refreshProfile} />}
            {activeTab === "orders" && <CustomerOrdersTab customerId={profile.customer.id} />}
            {activeTab === "invoices" && <CustomerInvoicesTab />}
            {activeTab === "payments" && <CustomerPaymentsTab />}
            {activeTab === "notes" && <CustomerNotesTab customerId={profile.customer.id} onUpdated={refreshProfile} />}
            {activeTab === "timeline" && <CustomerTimelineTab customerId={profile.customer.id} />}
            {activeTab === "contact" && <CustomerContactTab customer={profile.customer} />}
          </div>
        </div>
      </div>
    </>
  );
}

export function CustomerProfileClient(props: CustomerProfileClientProps) {
  return (
    <ToastProvider>
      <CustomerProfileContent {...props} />
    </ToastProvider>
  );
}
