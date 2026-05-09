"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import type { DashboardInsight } from "@/types/dashboard";

interface AiInsightsProps {
  insights: DashboardInsight[];
}

export function AiInsights({ insights }: AiInsightsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-4 w-4 text-violet-300" />
        <h3 className="text-base font-semibold text-zinc-100">AI Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.id} className="rounded-xl border border-white/10 bg-[#101017]/60 p-3">
            <p className="text-sm font-medium text-zinc-100">{insight.headline}</p>
            <p className="mt-1 text-xs text-zinc-400">{insight.detail}</p>
            <p className="mt-2 text-xs text-violet-300">Confidence: {(insight.confidence * 100).toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
