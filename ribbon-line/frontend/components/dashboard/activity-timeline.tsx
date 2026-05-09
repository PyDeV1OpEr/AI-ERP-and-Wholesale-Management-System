"use client";

import { motion } from "framer-motion";
import type { DashboardActivity } from "@/types/dashboard";

interface ActivityTimelineProps {
  activities: DashboardActivity[];
}

const dotColor: Record<DashboardActivity["level"], string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  info: "bg-violet-400"
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <h3 className="mb-4 text-base font-semibold text-zinc-100">Activity Timeline</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${dotColor[activity.level]}`} />
            <div>
              <p className="text-sm text-zinc-100">{activity.title}</p>
              <p className="text-xs text-zinc-400">{activity.description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
