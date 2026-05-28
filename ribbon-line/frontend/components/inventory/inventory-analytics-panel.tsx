"use client";

import { memo, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { getInventoryAnalytics } from "@/lib/inventory-api";
import { formatLkr } from "@/lib/currency";
import type { InventoryAnalyticsResponse, InventoryIntelligenceSignal } from "@/types/inventory";

interface InventoryAnalyticsPanelProps {
  productId: number;
  refreshKey: number;
}

const SIGNAL_ICON: Record<InventoryIntelligenceSignal["severity"], typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertTriangle,
  positive: CheckCircle2,
};

const SIGNAL_CLASSES: Record<InventoryIntelligenceSignal["severity"], string> = {
  info: "border-sky-500/20 bg-sky-500/10 text-sky-200",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  critical: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  positive: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}

function InventoryAnalyticsPanelComponent({ productId, refreshKey }: InventoryAnalyticsPanelProps) {
  const [data, setData] = useState<InventoryAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getInventoryAnalytics(productId)
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, refreshKey]);

  if (loading) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading analytics
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-zinc-400">Analytics are unavailable right now.</p>
      </section>
    );
  }

  const summary = data.movement_summary;
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Stock Intelligence</p>
          <h3 className="mt-1 text-base font-semibold text-zinc-100">Movement-Based Signals</h3>
        </div>
        {summary.average_weekly_units_sold && summary.average_weekly_units_sold > 0 ? (
          <TrendingUp className="h-5 w-5 text-emerald-300" />
        ) : (
          <TrendingDown className="h-5 w-5 text-zinc-500" />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Metric label="Movements" value={summary.movement_count.toLocaleString()} />
        <Metric label="Units Reduced" value={summary.total_units_sold.toLocaleString()} />
        <Metric
          label="Avg Weekly Reduction"
          value={summary.average_weekly_units_sold == null ? "Not enough data" : summary.average_weekly_units_sold.toLocaleString()}
        />
        <Metric
          label="Turnover Rate"
          value={summary.inventory_turnover_rate == null ? "Not enough data" : `${summary.inventory_turnover_rate.toFixed(2)}x`}
        />
        <Metric
          label="Estimated Duration"
          value={summary.estimated_stock_duration_days == null ? "Not enough data" : `${summary.estimated_stock_duration_days.toLocaleString()} days`}
        />
        <Metric label="Reduction Revenue" value={formatLkr(summary.revenue_from_stock_reductions)} />
      </div>

      {!summary.has_enough_activity ? (
        <div className="mt-5 rounded-lg border border-dashed border-white/10 p-4">
          <p className="text-sm font-medium text-zinc-200">Not enough inventory activity yet</p>
          <p className="mt-1 text-sm text-zinc-500">Movement analytics will appear after stock reductions and restocks are recorded.</p>
        </div>
      ) : null}

      {data.intelligence.length > 0 ? (
        <div className="mt-5 space-y-3">
          {data.intelligence.map((signal) => {
            const Icon = SIGNAL_ICON[signal.severity];
            return (
              <div key={`${signal.category}-${signal.title}`} className={`rounded-lg border p-3 ${SIGNAL_CLASSES[signal.severity]}`}>
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{signal.title}</p>
                    <p className="mt-1 text-sm leading-5 text-zinc-300">{signal.reason}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export const InventoryAnalyticsPanel = memo(InventoryAnalyticsPanelComponent);

