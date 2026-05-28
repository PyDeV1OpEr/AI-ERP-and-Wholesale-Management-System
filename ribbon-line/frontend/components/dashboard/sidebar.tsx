"use client";

import { motion } from "framer-motion";
import { Boxes, LayoutDashboard, Package, Sparkles, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Orders", icon: Truck, href: "#" },
  { label: "Inventory", icon: Boxes, href: "/inventory" },
  { label: "Products", icon: Package, href: "/products" },
  { label: "AI Center", icon: Sparkles, href: "#" }
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto p-6">
      <div className="mb-8 hidden items-center gap-2 lg:flex">
        <div className="h-3 w-3 rounded-full bg-violet-500 shadow-[0_0_20px_#A855F7]" />
        <p className="text-sm font-semibold tracking-[0.2em] text-violet-200">RIBBON LINE</p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== "#";
          return (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.02, x: 4 }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                isActive ? "bg-violet-500/20 text-violet-100" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <Link href={item.href} onClick={onNavigate} className="flex w-full items-center gap-3">
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
}
