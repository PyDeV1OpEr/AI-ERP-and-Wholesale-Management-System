"use client";

import { motion } from "framer-motion";
import { Boxes, LayoutDashboard, Package, Sparkles, Truck } from "lucide-react";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Orders", icon: Truck, active: false },
  { label: "Inventory", icon: Boxes, active: false },
  { label: "Products", icon: Package, active: false },
  { label: "AI Center", icon: Sparkles, active: false }
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0D0D12]/80 p-6 lg:block">
      <div className="mb-8 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-violet-500 shadow-[0_0_20px_#A855F7]" />
        <p className="text-sm font-semibold tracking-[0.2em] text-violet-200">RIBBON LINE</p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.02, x: 4 }}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
              item.active
                ? "bg-violet-500/20 text-violet-100"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </motion.button>
        ))}
      </nav>
    </aside>
  );
}
