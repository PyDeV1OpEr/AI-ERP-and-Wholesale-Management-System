import { useState } from "react";
import { addTransaction } from "@/lib/customers-api";

export function AddTransactionModal({ isOpen, onClose, customerId, onSaved }: { isOpen: boolean, onClose: () => void, customerId: number, onSaved: () => void }) {
  const [data, setData] = useState({ type: "CREDIT" as "CREDIT" | "DEBIT", amount: "", method: "CASH" as any, ref: "", notes: "" });

  if (!isOpen) return null;

  const submit = async () => {
    if (!data.amount) return;
    await addTransaction(customerId, {
      transaction_type: data.type,
      amount: parseFloat(data.amount),
      payment_method: data.method,
      reference_number: data.ref,
      notes: data.notes
    });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0D0D12] rounded-2xl w-full max-w-md border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add Transaction</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400">Type</label>
            <select value={data.type} onChange={e => setData({...data, type: e.target.value as any})} className="w-full mt-1 rounded bg-white/5 border border-white/10 px-3 py-2 text-white">
              <option value="CREDIT">Credit (Increase Balance)</option>
              <option value="DEBIT">Debit (Payment Received)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Amount</label>
            <input type="number" step="0.01" value={data.amount} onChange={e => setData({...data, amount: e.target.value})} className="w-full mt-1 rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Payment Method</label>
            <select value={data.method} onChange={e => setData({...data, method: e.target.value as any})} className="w-full mt-1 rounded bg-white/5 border border-white/10 px-3 py-2 text-white">
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Reference Number</label>
            <input type="text" value={data.ref} onChange={e => setData({...data, ref: e.target.value})} className="w-full mt-1 rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Notes</label>
            <textarea value={data.notes} onChange={e => setData({...data, notes: e.target.value})} className="w-full mt-1 rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded text-zinc-400 hover:text-white">Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-500">Save</button>
        </div>
      </div>
    </div>
  );
}
