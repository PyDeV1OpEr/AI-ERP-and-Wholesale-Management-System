import { useEffect, useState } from "react";
import { getCustomerLedger, LedgerEntry } from "@/lib/customers-api";
import { formatLkr } from "@/lib/currency";

export function CustomerLedgerTab({ customerId }: { customerId: number }) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    getCustomerLedger(customerId).then(res => setEntries(res.entries));
  }, [customerId]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-zinc-100">Ledger</h3>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-white/[0.02] text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Debit (-)</th>
              <th className="px-4 py-3 text-right">Credit (+)</th>
              <th className="px-4 py-3 text-right text-violet-300">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#0D0D12]">
            {entries.map((entry, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{entry.description}</td>
                <td className="px-4 py-3 text-right text-emerald-400">{entry.debit > 0 ? formatLkr(entry.debit) : '-'}</td>
                <td className="px-4 py-3 text-right text-rose-400">{entry.credit > 0 ? formatLkr(entry.credit) : '-'}</td>
                <td className="px-4 py-3 text-right font-medium text-violet-200">{formatLkr(entry.balance)}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No ledger entries.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
