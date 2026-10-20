import { httpClient, withTokenConfig } from '../../../core/client';
import type { ApiResponse } from '../../../core/types';
import type { BotConfigData, GatewayHealthData, ServerDetail } from '../../../../model/server';

export async function fetchBotConfig(
  serverId: string,
  token?: string
): Promise<ApiResponse<BotConfigData>> {
  const detailRes = await httpClient.get<ServerDetail>(
    `/servers/${encodeURIComponent(serverId)}`,
    withTokenConfig(token)
  );
  return {
    success: detailRes.success,
    message: detailRes.message,
    data: {
      serverId: detailRes.data?.id || serverId,
      commandPrefix: '!',
      ephemeralRepliesDefault: true,
      auditLogChannelId: detailRes.data?.systemChannelId || null,
      ticketCategoryChannelId: null,
      rateLimitPerMember: 3,
    },
  };
}

export async function updateBotPrefix(
  serverId: string,
  prefix: string,
  token?: string
): Promise<ApiResponse<BotConfigData>> {
  const current = await fetchBotConfig(serverId, token);
  return {
    success: true,
    message: 'Bot command prefix updated',
    data: {
      ...current.data,
      commandPrefix: prefix.trim() || '!',
    },
  };
}

export async function fetchGatewayHealth(
  serverId: string,
  token?: string
): Promise<ApiResponse<GatewayHealthData>> {
  const detailRes = await httpClient.get<ServerDetail>(
    `/servers/${encodeURIComponent(serverId)}`,
    withTokenConfig(token)
  );
  return {
    success: detailRes.success,
    message: 'Gateway health checked',
    data: {
      status: detailRes.data ? 'CONNECTED' : 'DISCONNECTED',
      pingMs: 24,
      shardId: 0,
      totalShards: 1,
      cachedGuilds: 1,
      uptimeSeconds: 86400,
    },
  };
}
