import { formatLkr } from "@/lib/currency";
import { CustomerKpis } from "@/types/customers";
import { 
  Wallet, 
  CreditCard, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  TrendingUp,
  Receipt,
  Clock,
  CalendarDays
} from "lucide-react";

interface CustomerKpiWidgetsProps {
  kpis: CustomerKpis;
}

export function CustomerKpiWidgets({ kpis }: CustomerKpiWidgetsProps) {
  const widgets = [
    {
      title: "Outstanding Balance",
      value: formatLkr(kpis.outstanding_balance),
      icon: Wallet,
      color: "text-rose-400",
      bgColor: "bg-rose-400/10",
      borderColor: "border-rose-400/20",
    },
    {
      title: "Available Credit",
      value: formatLkr(kpis.available_credit),
      icon: CreditCard,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20",
    },
    {
      title: "Credit Limit",
      value: formatLkr(kpis.credit_limit),
      icon: TrendingUp,
      color: "text-violet-400",
      bgColor: "bg-violet-400/10",
      borderColor: "border-violet-400/20",
    },
    {
      title: "Total Credit Added",
      value: formatLkr(kpis.total_credit_added),
      icon: ArrowUpFromLine,
      color: "text-sky-400",
      bgColor: "bg-sky-400/10",
      borderColor: "border-sky-400/20",
    },
    {
      title: "Payments Received",
      value: formatLkr(kpis.total_payments_received),
      icon: ArrowDownToLine,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20",
    },
    {
      title: "Total Transactions",
      value: kpis.total_transactions.toString(),
      icon: Receipt,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/20",
    },
    {
      title: "Last Transaction",
      value: kpis.last_transaction_date ? new Date(kpis.last_transaction_date).toLocaleDateString() : "Never",
      icon: Clock,
      color: "text-zinc-400",
      bgColor: "bg-white/5",
      borderColor: "border-white/10",
    },
    {
      title: "Customer Since",
      value: new Date(kpis.customer_since).toLocaleDateString(),
      icon: CalendarDays,
      color: "text-zinc-400",
      bgColor: "bg-white/5",
      borderColor: "border-white/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {widgets.map((widget, i) => (
        <div 
          key={i} 
          className={`rounded-2xl border bg-[#0D0D12] p-5 ${widget.borderColor}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{widget.title}</p>
              <p className="mt-2 text-xl font-semibold text-zinc-100">{widget.value}</p>
            </div>
            <div className={`rounded-lg p-2 ${widget.bgColor}`}>
              <widget.icon className={`h-5 w-5 ${widget.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
