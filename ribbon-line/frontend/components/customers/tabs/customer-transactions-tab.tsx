import { useEffect, useState } from "react";
import { getCustomerTransactions, CustomerTransaction } from "@/lib/customers-api";
import { formatLkr } from "@/lib/currency";
import { AddTransactionModal } from "../modals/add-transaction-modal";
import { Plus } from "lucide-react";

export function CustomerTransactionsTab({ customerId, onUpdated }: { customerId: number, onUpdated: () => void }) {
  const [txs, setTxs] = useState<CustomerTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = async () => {
    const res = await getCustomerTransactions(customerId);
    setTxs(res.items);
  };

  useEffect(() => { load(); }, [customerId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-zinc-100">Transactions</h3>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-white/[0.02] text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#0D0D12]">
            {txs.map((tx) => (
              <tr key={tx.id}>
                <td className="px-4 py-3">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${tx.transaction_type === 'CREDIT' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {tx.transaction_type}
                  </span>
                </td>
                <td className="px-4 py-3">{tx.payment_method || '-'}</td>
                <td className="px-4 py-3">{tx.reference_number || '-'}</td>
                <td className="px-4 py-3 text-right font-medium text-zinc-200">{formatLkr(tx.amount)}</td>
              </tr>
            ))}
            {txs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} customerId={customerId} onSaved={() => { load(); onUpdated(); }} />
    </div>
  );
}
