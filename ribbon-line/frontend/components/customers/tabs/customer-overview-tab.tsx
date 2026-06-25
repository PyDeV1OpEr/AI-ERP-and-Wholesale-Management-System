import { CustomerProfile } from "@/types/customers";
import { formatLkr } from "@/lib/currency";

interface CustomerOverviewTabProps {
  profile: CustomerProfile;
}

export function CustomerOverviewTab({ profile }: CustomerOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-zinc-100 mb-4">Recent Transactions</h3>
        {profile.recent_transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent transactions.</p>
        ) : (
          <div className="space-y-3">
            {profile.recent_transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <div>
                  <p className="text-zinc-200">{tx.transaction_type} - {tx.payment_method}</p>
                  <p className="text-xs text-zinc-500">{new Date(tx.transaction_date).toLocaleDateString()}</p>
                </div>
                <p className={`font-medium ${tx.transaction_type === 'CREDIT' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {tx.transaction_type === 'CREDIT' ? '+' : '-'}{formatLkr(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-zinc-100 mb-4">Recent Notes</h3>
        {profile.recent_notes.length === 0 ? (
          <p className="text-sm text-zinc-500">No notes found.</p>
        ) : (
          <div className="space-y-3">
            {profile.recent_notes.map((note) => (
              <div key={note.id} className="text-sm border-b border-white/5 pb-2">
                <p className="text-zinc-300">{note.content}</p>
                <p className="text-xs text-zinc-500 mt-1">{new Date(note.created_at).toLocaleDateString()} by {note.created_by || "System"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
