"use client";

import { motion } from "framer-motion";
import { Activity, Server, Users, ShieldAlert } from "lucide-react";

const stats = [
  { label: "Active Servers", value: "24", icon: Server, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Total Members", value: "142,509", icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "System Alerts", value: "0", icon: ShieldAlert, color: "text-primary", bg: "bg-primary/10" },
  { label: "API Uptime", value: "99.9%", icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">System Overview</h1>
        <p className="text-white/60">Monitor and manage all RNG infrastructure globally.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
            className="p-6 rounded-2xl bg-surface border border-border backdrop-blur-sm relative overflow-hidden group hover:border-white/20 transition-colors"
          >
            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-sm font-medium text-white/60 mb-2">{stat.label}</div>
            <div className="text-3xl font-bold font-mono">{stat.value}</div>
          </motion.div>
        ))}
      </div>
      
      <div className="h-96 rounded-2xl bg-surface border border-border flex items-center justify-center text-white/40 border-dashed">
        <p>Charts and Analytics Dashboard Placeholder</p>
      </div>
    </div>
  );
}
