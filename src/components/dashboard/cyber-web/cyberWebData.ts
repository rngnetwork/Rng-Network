import type { LucideIcon } from 'lucide-react';
import {
  KeyRound,
  ShieldCheck,
  Server,
  Boxes,
  Bot,
  Coins,
  Users,
  Activity,
  Cpu,
} from 'lucide-react';

export interface CyberNode {
  id: string;
  name: string;
  subtitle: string;
  status: 'active' | 'locked';
  route?: string;
  icon: LucideIcon;
  x: number; // Percentage 0 - 100
  y: number; // Percentage 0 - 100
}

export interface CyberLink {
  from: string;
  to: string;
  status: 'active' | 'inactive';
}

export const CYBER_NODES: CyberNode[] = [
  {
    id: 'auth-security',
    name: 'Authentication & Authorization',
    subtitle: 'Cryptographic Session & Account Clearance',
    status: 'active',
    route: '/dashboard/account',
    icon: KeyRound,
    x: 24,
    y: 30,
  },
  {
    id: 'whitelist-management',
    name: 'Whitelist Management',
    subtitle: 'Personnel Registry & Ministry Boundaries',
    status: 'active',
    route: '/dashboard/whitelist',
    icon: ShieldCheck,
    x: 80,
    y: 30,
  },
  {
    id: 'discord-server-module',
    name: 'Discord Server Module',
    subtitle: 'JDA 5 Reactive Gateway & Mutual Guilds',
    status: 'active',
    route: '/dashboard/servers',
    icon: Server,
    x: 20,
    y: 58,
  },
  {
    id: 'embed-builder',
    name: 'Embed Builder',
    subtitle: 'Components V2 Visual Message Engine',
    status: 'active',
    route: '/dashboard/embeds',
    icon: Boxes,
    x: 80,
    y: 58,
  },
  {
    id: 'bot-module',
    name: 'Bot Module Configuration',
    subtitle: 'Autonomous Daemons & Event Sharding',
    status: 'locked',
    icon: Bot,
    x: 52,
    y: 22,
  },
  {
    id: 'rng-finance',
    name: 'RNG Finance System',
    subtitle: 'Treasury & Ministry Commerce Vault',
    status: 'locked',
    icon: Coins,
    x: 50,
    y: 48,
  },
  {
    id: 'staff-management',
    name: 'Staff Database & Management',
    subtitle: 'Ministry Roster & Chain of Command',
    status: 'locked',
    icon: Users,
    x: 22,
    y: 84,
  },
  {
    id: 'analytics-audit',
    name: 'Analytics and Audit',
    subtitle: '90-Day Telemetry Logs & Dispatch Rate Limits',
    status: 'locked',
    icon: Activity,
    x: 50,
    y: 76,
  },
  {
    id: 'infrastructure-dashboard',
    name: 'Infrastructure Dashboard',
    subtitle: 'Virtual Threads & Redis Cluster Health',
    status: 'locked',
    icon: Cpu,
    x: 78,
    y: 84,
  },
];

export const CYBER_LINKS: CyberLink[] = [
  // Core active laser links
  { from: 'auth-security', to: 'whitelist-management', status: 'active' },
  { from: 'auth-security', to: 'discord-server-module', status: 'active' },
  { from: 'whitelist-management', to: 'embed-builder', status: 'active' },
  { from: 'discord-server-module', to: 'embed-builder', status: 'active' },
  { from: 'auth-security', to: 'embed-builder', status: 'active' },
  { from: 'whitelist-management', to: 'discord-server-module', status: 'active' },

  // Secondary network connections
  { from: 'auth-security', to: 'bot-module', status: 'inactive' },
  { from: 'whitelist-management', to: 'bot-module', status: 'inactive' },
  { from: 'bot-module', to: 'rng-finance', status: 'inactive' },
  { from: 'discord-server-module', to: 'rng-finance', status: 'inactive' },
  { from: 'embed-builder', to: 'rng-finance', status: 'inactive' },
  { from: 'discord-server-module', to: 'staff-management', status: 'inactive' },
  { from: 'staff-management', to: 'analytics-audit', status: 'inactive' },
  { from: 'rng-finance', to: 'analytics-audit', status: 'inactive' },
  { from: 'analytics-audit', to: 'infrastructure-dashboard', status: 'inactive' },
  { from: 'embed-builder', to: 'infrastructure-dashboard', status: 'inactive' },
];
