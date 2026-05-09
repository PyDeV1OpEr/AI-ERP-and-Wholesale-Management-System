"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function HeroStrip() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-fuchsia-500/10 p-6"
    >
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -bottom-12 left-24 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-violet-200">AI Operations Pulse</p>
          <h2 className="text-2xl font-semibold text-white">Your supply chain is stable and forecast-positive.</h2>
          <p className="mt-2 text-sm text-zinc-300">
            No critical stockouts predicted in the next 7 days. Suggested actions are queued below.
          </p>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/10 p-3">
          <Sparkles className="h-5 w-5 text-violet-100" />
        </div>
      </div>
    </motion.section>
  );
}
