"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BarChart3, Settings, PenTool } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Overview", href: "/", icon: Home },
  { name: "Embed Builder", href: "/embeds", icon: PenTool },
  { name: "Staff Directory", href: "/staff", icon: Users },
  { name: "Finance Analytics", href: "/finance", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 flex-shrink-0 border-r border-border bg-black/40 backdrop-blur-xl h-screen sticky top-0 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white font-bold tracking-tighter text-sm shadow-[0_0_15px_rgba(229,9,20,0.5)]">
          RNG
        </div>
        <span className="ml-3 font-semibold text-sm tracking-wide">Control Center</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 mb-4 mt-2 px-3">
          Menu
        </div>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group ${
                isActive ? "text-white" : "text-white/60 hover:text-white hover:bg-surface"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-surface border border-border rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(229,9,20,0.8)] z-10" />
              )}
              
              <item.icon className={`w-4 h-4 relative z-10 ${isActive ? "text-primary" : "group-hover:text-white"}`} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">Admin</span>
            <span className="text-[10px] text-white/40 mt-1">Lead Developer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
