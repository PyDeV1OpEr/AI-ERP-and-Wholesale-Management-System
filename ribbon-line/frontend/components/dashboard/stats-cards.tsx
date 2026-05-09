"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStat } from "@/types/dashboard";

interface StatsCardsProps {
  stats: DashboardStat[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const isUp = stat.trend_direction === "up";
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -4 }}
          >
            <Card>
              <CardContent>
                <p className="text-sm text-zinc-400">{stat.title}</p>
                <p className="mt-3 text-2xl font-semibold text-zinc-100">{stat.value}</p>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className={`flex items-center gap-1 ${isUp ? "text-emerald-400" : "text-amber-400"}`}>
                    {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {stat.trend_percent}%
                  </span>
                  <span className="text-zinc-500">{stat.subtitle}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </section>
  );
}
