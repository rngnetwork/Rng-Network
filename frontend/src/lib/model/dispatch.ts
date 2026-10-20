export type DispatchType = 'IMMEDIATE_BOT' | 'SCHEDULED_BOT' | 'IMMEDIATE' | 'SCHEDULED';

export interface DispatchEmbedPayload {
  serverId: string;
  channelId?: string;
  dispatchType?: DispatchType;
  payload: Record<string, unknown>;
  dryRun?: boolean;
  scheduledTime?: string;
  scheduledFor?: string;
}

export interface DispatchResponseData {
  dispatchId: string;
  status: string;
  timestamp: string;
  channelId?: string;
  discordMessageId?: string;
  isScheduled?: boolean;
  errorMessage?: string;
  latencyMs?: number;
}

export interface DispatchLogData {
  id: string;
  dispatchId: string;
  type: string;
  status: string;
  serverId: string;
  channelId: string;
  operatorId: number;
  operatorUsername?: string;
  discordMessageId?: string;
  errorMessage?: string;
  latencyMs?: number;
  timestamp: string;
}

export type BackendDispatchLog = DispatchLogData;

export interface DryRunPayload {
  serverId: string;
  channelId?: string;
  payload: Record<string, unknown>;
}

export interface BotPermissionCheck {
  viewChannel: boolean;
  sendMessages: boolean;
  embedLinks: boolean;
  attachFiles: boolean;
}

export interface DryRunValidationReportData {
  valid: boolean;
  errors: string[];
  warnings: string[];
  containerCount: number;
  totalComponentCount: number;
  totalActionRows: number;
  cumulativeCharCount: number;
  actionRowCount?: number;
  characterCount?: number;
  permissions?: BotPermissionCheck;
  resolvedBotPermissions?: string[];
}
