export interface ServerItem {
  id: string;
  slug: string;
  name: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  onlineCount: number;
  totalCount: number;
  boostLevel: number;
  boostCount: number;
  status: string;
}

export interface ServerDetail {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  description: string | null;
  icon?: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  onlineCount: number;
  totalCount: number;
  boostLevel: number;
  boostCount: number;
  features: string[];
  afkChannelId: string | null;
  afkTimeout: number | null;
  systemChannelId: string | null;
  sendWelcome: boolean;
  stickerPrompt: boolean;
  boostMessage: boolean;
  setupTips: boolean;
  defaultMessageNotifications: number | null;
  vanityUrl: string | null;
  widgetEnabled: boolean | null;
  widgetChannelId: string | null;
}

export interface UpdateServerSettingsPayload {
  name: string;
  description?: string | null;
  icon?: string | null;
  banner?: string | null;
  afkChannelId?: string | null;
  afkTimeout?: number | null;
  systemChannelId?: string | null;
  sendWelcome?: boolean;
  stickerPrompt?: boolean;
  boostMessage?: boolean;
  setupTips?: boolean;
  defaultMessageNotifications?: number | null;
  widgetEnabled?: boolean | null;
  widgetChannelId?: string | null;
}

export interface BotConfigData {
  serverId: string;
  commandPrefix: string;
  ephemeralRepliesDefault: boolean;
  auditLogChannelId: string | null;
  ticketCategoryChannelId: string | null;
  rateLimitPerMember: number;
}

export interface GatewayHealthData {
  status: 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';
  pingMs: number;
  shardId: number;
  totalShards: number;
  cachedGuilds: number;
  uptimeSeconds: number;
}
