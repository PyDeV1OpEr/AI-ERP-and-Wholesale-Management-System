import { useEffect, useState } from "react";
import { getCustomerCheques, CustomerCheque, updateCheque } from "@/lib/customers-api";
import { formatLkr } from "@/lib/currency";
import { AddChequeModal } from "../modals/add-cheque-modal";
import { Plus } from "lucide-react";

export function CustomerChequesTab({ customerId, onUpdated }: { customerId: number, onUpdated: () => void }) {
  const [cheques, setCheques] = useState<CustomerCheque[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = async () => {
    const res = await getCustomerCheques(customerId);
    setCheques(res);
  };

  useEffect(() => { load(); }, [customerId]);

  const handleStatusChange = async (id: number, status: any) => {
    await updateCheque(customerId, id, { status });
    load();
    onUpdated();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-zinc-100">Cheques</h3>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
          <Plus className="w-4 h-4" /> Add Cheque
        </button>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-white/[0.02] text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Cheque No</th>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#0D0D12]">
            {cheques.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">{new Date(c.cheque_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-zinc-200">{c.cheque_number}</td>
                <td className="px-4 py-3">{c.bank_name || '-'}</td>
                <td className="px-4 py-3 text-right font-medium text-zinc-200">{formatLkr(c.amount)}</td>
                <td className="px-4 py-3">
                  <select 
                    value={c.status} 
                    onChange={(e) => handleStatusChange(c.id, e.target.value)}
                    className="bg-white/[0.05] border border-white/10 rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CLEARED">Cleared</option>
                    <option value="BOUNCED">Bounced</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {cheques.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No cheques found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <AddChequeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} customerId={customerId} onSaved={() => { load(); onUpdated(); }} />
    </div>
  );
}
