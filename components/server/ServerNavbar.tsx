"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings,
  Bot,
  FileCode,
  LineChart
} from 'lucide-react';

interface ServerNavbarProps {
  serverId: string;
}

export function ServerNavbar({ serverId }: ServerNavbarProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'settings',
      label: 'Server Settings',
      href: `/dashboard/servers/${serverId}/settings`,
      icon: Settings,
    },
    {
      id: 'botconfig',
      label: 'Bot Modules',
      href: `/dashboard/servers/${serverId}/botconfig`,
      icon: Bot,
    },
    {
      id: 'embeds',
      label: 'Embed Builder',
      href: `/dashboard/servers/${serverId}/embeds`,
      icon: FileCode,
    },
    {
      id: 'analytics',
      label: 'Analytics & Audit',
      href: `/dashboard/servers/${serverId}/analytics`,
      icon: LineChart,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Custom Red-Glowing Scrollbar Styling */}
      <style dangerouslySetInnerHTML={{__html: `
        .red-navbar-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .red-navbar-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 999px;
        }
        .red-navbar-scroll::-webkit-scrollbar-thumb {
          background: #E11D2E;
          border-radius: 999px;
          box-shadow: 0 0 10px rgba(225, 29, 46, 0.8);
        }
        .red-navbar-scroll::-webkit-scrollbar-thumb:hover {
          background: #FF3B4D;
          box-shadow: 0 0 15px rgba(255, 59, 77, 1);
        }
      `}} />

      <nav
        aria-label="Server settings navigation"
        className="relative border-b border-white/10 flex items-center gap-2 overflow-x-auto pb-2.5 red-navbar-scroll"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.id === 'settings' && pathname === `/dashboard/servers/${serverId}`);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-white bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(225,29,46,0.2)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-red-400' : 'text-zinc-500'} />
              <span>{tab.label}</span>

              {isActive && (
                <motion.div
                  layoutId="serverActiveTabIndicator"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute -bottom-2.5 left-2 right-2 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-[0_0_10px_#ef4444]"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
