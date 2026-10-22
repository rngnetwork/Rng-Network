import { httpClient, withTokenConfig } from '../core/client';
import type { ApiResponse } from '../core/types';
import type { DashboardStats } from '../../model/analytics';
import type { ServerItem } from '../../model/server';
import type { WhitelistedUser } from '../../model/whitelist';
import type { PageData } from '../../model/common';
import type { TemplateData } from '../../model/embed';
import type { DispatchLogData } from '../../model/dispatch';

export async function fetchDashboardOverviewStats(
  accessToken?: string
): Promise<ApiResponse<DashboardStats>> {
  const config = withTokenConfig(accessToken);
  const [serversRes, whitelistRes, templatesRes, logsRes] = await Promise.all([
    httpClient.get<ServerItem[]>('/servers', config),
    httpClient.get<WhitelistedUser[]>('/whitelist', config),
    httpClient.get<PageData<TemplateData>>('/embeds/templates?page=0&size=1', config),
    httpClient.get<PageData<DispatchLogData>>('/embeds/logs?page=0&size=20', config),
  ]);

  const servers = serversRes.data || [];
  const whitelist = whitelistRes.data || [];
  const totalTemplates = templatesRes.data?.totalElements ?? 0;
  const logs = logsRes.data?.content || [];
  const totalDispatches = logsRes.data?.totalElements ?? logs.length;

  const latencySamples = logs
    .map((item) => item.latencyMs)
    .filter((ms): ms is number => typeof ms === 'number' && ms > 0);
  const averageLatencyMs =
    latencySamples.length > 0
      ? Math.round(latencySamples.reduce((acc, val) => acc + val, 0) / latencySamples.length)
      : 0;

  return {
    success: true,
    message: 'Dashboard overview statistics retrieved',
    data: {
      totalManagedServers: servers.length,
      totalWhitelistedPersonnel: whitelist.length,
      totalTemplatesSaved: totalTemplates,
      totalDispatches24h: totalDispatches,
      gatewayStatus: servers.length > 0 ? 'CONNECTED' : 'DISCONNECTED',
      averageLatencyMs,
    },
  };
}
