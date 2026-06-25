import { CustomerProfile } from "@/types/customers";
import { formatLkr } from "@/lib/currency";

export function CustomerFinancialTab({ profile }: { profile: CustomerProfile }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-zinc-100">Financial Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs text-zinc-500 uppercase">Credit Limit</p>
          <p className="text-lg font-semibold text-violet-300 mt-1">{formatLkr(profile.kpis.credit_limit)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs text-zinc-500 uppercase">Available Credit</p>
          <p className="text-lg font-semibold text-emerald-300 mt-1">{formatLkr(profile.kpis.available_credit)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs text-zinc-500 uppercase">Outstanding Balance</p>
          <p className="text-lg font-semibold text-rose-300 mt-1">{formatLkr(profile.kpis.outstanding_balance)}</p>
        </div>
      </div>
    </div>
  );
}
