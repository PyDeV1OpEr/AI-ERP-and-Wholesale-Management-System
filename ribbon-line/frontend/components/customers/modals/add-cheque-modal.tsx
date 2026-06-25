import { useState } from "react";
import { addCheque } from "@/lib/customers-api";

export function AddChequeModal({ isOpen, onClose, customerId, onSaved }: { isOpen: boolean, onClose: () => void, customerId: number, onSaved: () => void }) {
  const [data, setData] = useState({ cheque_number: "", bank_name: "", cheque_date: "", amount: "", reference: "", notes: "" });

  if (!isOpen) return null;

  const submit = async () => {
    if (!data.amount || !data.cheque_number || !data.cheque_date) return;
    await addCheque(customerId, {
      cheque_number: data.cheque_number,
      bank_name: data.bank_name,
      cheque_date: data.cheque_date,
      amount: parseFloat(data.amount),
      reference: data.reference,
      notes: data.notes
    });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0D0D12] rounded-2xl w-full max-w-md border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add Cheque</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400">Cheque Number *</label>
            <input type="text" value={data.cheque_number} onChange={e => setData({...data, cheque_number: e.target.value})} className="w-full mt-1 rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Date *</label>
            <input type="date" value={data.cheque_date} onChange={e => setData({...data, cheque_date: e.target.value})} className="w-full mt-1 rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Amount *</label>
            <input type="number" step="0.01" value={data.amount} onChange={e => setData({...data, amount: e.target.value})} className="w-full mt-1 rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Bank Name</label>
            <input type="text" value={data.bank_name} onChange={e => setData({...data, bank_name: e.target.value})} className="w-full mt-1 rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
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
