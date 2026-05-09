"use client";

import { motion } from "framer-motion";
import { Plus, ReceiptText, Send, ShoppingCart } from "lucide-react";

const actions = [
  { label: "Create Order", icon: ShoppingCart },
  { label: "New Product", icon: Plus },
  { label: "Generate Invoice", icon: ReceiptText },
  { label: "Notify Vendor", icon: Send }
];

export function QuickActions() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <h3 className="mb-4 text-base font-semibold text-zinc-100">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-3 text-sm text-violet-100"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
