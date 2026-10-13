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
  clearanceLevel: string;
  category: 'core' | 'security' | 'operations' | 'finance' | 'telemetry';
  tags: string[];
  // Relative grid position coordinates (x: 0-100%, y: 0-100%) for neural web canvas
  x: number;
  y: number;
}

export interface CyberLink {
  from: string;
  to: string;
  status: 'active' | 'inactive';
}

export const CYBER_NODES: CyberNode[] = [
  {
    id: 'auth-security',
    name: 'Authentication and Authorization *',
    subtitle: 'Cryptographic Session & Account Clearance',
    status: 'active',
    route: '/dashboard/account',
    icon: KeyRound,
    clearanceLevel: 'LEVEL 1 CLEARANCE',
    category: 'security',
    tags: ['OAuth2', 'Discord 2FA', 'HMAC JWT'],
    x: 20,
    y: 20,
  },
  {
    id: 'whitelist-management',
    name: 'Whitelist Management *',
    subtitle: 'Personnel Registry & Ministry Boundaries',
    status: 'active',
    route: '/dashboard/whitelist',
    icon: ShieldCheck,
    clearanceLevel: 'HIGH COMMAND',
    category: 'security',
    tags: ['Snowflake Link', 'Role Hierarchy', 'Ministry Access'],
    x: 80,
    y: 20,
  },
  {
    id: 'discord-server-module',
    name: 'Discord Server Module *',
    subtitle: 'JDA 5 Reactive Gateway & Mutual Guilds',
    status: 'active',
    route: '/dashboard/servers',
    icon: Server,
    clearanceLevel: 'COMMAND DISPATCH',
    category: 'core',
    tags: ['JDA 5 Gateway', 'Redis Cache', 'Nitro Gating'],
    x: 20,
    y: 50,
  },
  {
    id: 'embed-builder',
    name: 'Embed Builder *',
    subtitle: 'Components V2 Visual Message Engine',
    status: 'active',
    route: '/dashboard/embeds',
    icon: Boxes,
    clearanceLevel: 'OPERATIONS',
    category: 'core',
    tags: ['Type 17 Containers', 'Action Rows', 'Bi-directional JSON'],
    x: 80,
    y: 50,
  },
  {
    id: 'bot-module',
    name: 'Bot Module Configuration',
    subtitle: 'Autonomous Daemons & Event Sharding',
    status: 'locked',
    icon: Bot,
    clearanceLevel: 'SYSTEM OFFLINE',
    category: 'operations',
    tags: ['Daemon Cluster', 'Sharded Gateway'],
    x: 50,
    y: 22,
  },
  {
    id: 'rng-finance',
    name: 'RNG Finance System',
    subtitle: 'Treasury & Ministry Commerce Vault',
    status: 'locked',
    icon: Coins,
    clearanceLevel: 'SYSTEM OFFLINE',
    category: 'finance',
    tags: ['Ledger V2', 'Multi-sig Wallet'],
    x: 50,
    y: 50,
  },
  {
    id: 'staff-management',
    name: 'Staff Database and Management',
    subtitle: 'Ministry Roster & Chain of Command',
    status: 'locked',
    icon: Users,
    clearanceLevel: 'SYSTEM OFFLINE',
    category: 'operations',
    tags: ['Dossiers', 'Rank Progression'],
    x: 20,
    y: 82,
  },
  {
    id: 'analytics-audit',
    name: 'Analytics and Audit',
    subtitle: '90-Day Telemetry Logs & Dispatch Rate Limits',
    status: 'locked',
    icon: Activity,
    clearanceLevel: 'SYSTEM OFFLINE',
    category: 'telemetry',
    tags: ['Sliding Window', 'DLQ Queue'],
    x: 50,
    y: 80,
  },
  {
    id: 'infrastructure-dashboard',
    name: 'Infrastructure Dashboard',
    subtitle: 'Virtual Threads & Redis Cluster Health',
    status: 'locked',
    icon: Cpu,
    clearanceLevel: 'SYSTEM OFFLINE',
    category: 'telemetry',
    tags: ['JVM 21', 'Redis 7.2', 'Postgres 16'],
    x: 80,
    y: 82,
  },
];

export const CYBER_LINKS: CyberLink[] = [
  // Active links interconnecting the 4 live nodes
  { from: 'auth-security', to: 'whitelist-management', status: 'active' },
  { from: 'auth-security', to: 'discord-server-module', status: 'active' },
  { from: 'whitelist-management', to: 'embed-builder', status: 'active' },
  { from: 'discord-server-module', to: 'embed-builder', status: 'active' },
  { from: 'discord-server-module', to: 'auth-security', status: 'active' },
  { from: 'embed-builder', to: 'whitelist-management', status: 'active' },

  // Secondary connections linking active and upcoming nodes
  { from: 'auth-security', to: 'bot-module', status: 'inactive' },
  { from: 'whitelist-management', to: 'bot-module', status: 'inactive' },
  { from: 'discord-server-module', to: 'rng-finance', status: 'inactive' },
  { from: 'embed-builder', to: 'rng-finance', status: 'inactive' },
  { from: 'discord-server-module', to: 'staff-management', status: 'inactive' },
  { from: 'rng-finance', to: 'analytics-audit', status: 'inactive' },
  { from: 'embed-builder', to: 'infrastructure-dashboard', status: 'inactive' },
  { from: 'analytics-audit', to: 'infrastructure-dashboard', status: 'inactive' },
  { from: 'staff-management', to: 'analytics-audit', status: 'inactive' },
];
