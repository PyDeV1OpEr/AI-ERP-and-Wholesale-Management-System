"use client";

import { motion } from "framer-motion";
import { Bell, Search } from "lucide-react";

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-violet-300">Operations Command</p>
        <h1 className="text-xl font-semibold text-zinc-100">Wholesale Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#111118] px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-400">Search orders, stock, customers</span>
        </div>
        <button className="rounded-xl border border-white/10 bg-[#111118] p-2 text-zinc-300 hover:text-zinc-100">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </motion.header>
  );
}
