import { useEffect, useState } from "react";
import { getCustomerActivity, CustomerActivityLog } from "@/lib/customers-api";

export function CustomerTimelineTab({ customerId }: { customerId: number }) {
  const [logs, setLogs] = useState<CustomerActivityLog[]>([]);

  useEffect(() => { getCustomerActivity(customerId, 50).then(setLogs); }, [customerId]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-zinc-100">Activity Timeline</h3>
      <div className="relative border-l border-white/10 ml-4 space-y-6">
        {logs.map(log => (
          <div key={log.id} className="relative pl-6">
            <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-violet-500 border-2 border-[#0D0D12]" />
            <p className="text-sm font-medium text-zinc-200">{log.event_type.replace(/_/g, ' ')}</p>
            <p className="text-sm text-zinc-400 mt-1">{log.description}</p>
            <p className="text-xs text-zinc-500 mt-1">{new Date(log.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
