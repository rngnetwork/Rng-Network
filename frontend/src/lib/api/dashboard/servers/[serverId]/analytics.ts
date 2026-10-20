import { httpClient, withTokenConfig } from '../../../core/client';
import type { ApiResponse, PaginationParams, PaginatedResult } from '../../../core/types';
import type { ServerAnalyticsData, AnalyticsMetricPoint } from '../../../../model/analytics';
import type { InteractionLogItem } from '../../../../model/action';
import type { PageData } from '../../../../model/common';
import type { DispatchLogData } from '../../../../model/dispatch';
import type { EmbedAction } from '../../../../model/action';

export async function fetchInteractionLogs(
  serverId: string,
  params: PaginationParams & { startDate?: string; endDate?: string } = { page: 0, size: 20 },
  token?: string
): Promise<ApiResponse<PaginatedResult<InteractionLogItem>>> {
  const page = params.page ?? 0;
  const size = params.size ?? 20;
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (params.sort) query.set('sort', params.sort);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const response = await httpClient.get<{
    content?: InteractionLogItem[];
    items?: InteractionLogItem[];
    totalElements?: number;
    totalItems?: number;
    totalPages?: number;
  }>(
    `/servers/${encodeURIComponent(serverId)}/interactions/logs?${query.toString()}`,
    withTokenConfig(token)
  );

  const items = response.data?.content || response.data?.items || [];
  const totalItems = response.data?.totalElements ?? response.data?.totalItems ?? items.length;
  const totalPages = response.data?.totalPages ?? (Math.ceil(totalItems / size) || 1);

  return {
    success: response.success,
    message: response.message,
    data: {
      items,
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: size,
    },
  };
}

export async function fetchServerAnalytics(
  serverId: string,
  token?: string
): Promise<ApiResponse<ServerAnalyticsData>> {
  const config = withTokenConfig(token);
  const [dispatchRes, interactionsRes, actionsRes] = await Promise.all([
    httpClient.get<PageData<DispatchLogData>>(
      `/embeds/logs?serverId=${encodeURIComponent(serverId)}&page=0&size=50`,
      config
    ),
    fetchInteractionLogs(serverId, { page: 0, size: 50 }, token),
    httpClient.get<EmbedAction[] | { content: EmbedAction[] }>(
      `/servers/${encodeURIComponent(serverId)}/actions?page=0&size=50`,
      config
    ),
  ]);

  const dispatches = dispatchRes.data?.content || [];
  const totalDispatches = dispatchRes.data?.totalElements ?? dispatches.length;
  const interactions = interactionsRes.data?.items || [];
  const totalInteractions = interactionsRes.data?.totalItems ?? interactions.length;

  const actionsRaw = actionsRes.data;
  const actionsList = Array.isArray(actionsRaw)
    ? actionsRaw
    : actionsRaw && Array.isArray(actionsRaw.content)
      ? actionsRaw.content
      : [];

  const successCount = dispatches.filter((d) => d.status === 'SUCCESS').length;
  const successRatePercent =
    dispatches.length > 0 ? Math.round((successCount / dispatches.length) * 100) : 100;

  const latencies = dispatches
    .map((d) => d.latencyMs)
    .filter((ms): ms is number => typeof ms === 'number' && ms > 0);
  const averageLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((acc, v) => acc + v, 0) / latencies.length)
      : 0;

  const byDay = new Map<string, AnalyticsMetricPoint>();
  for (const log of dispatches) {
    const dayKey = (log.timestamp || '').slice(0, 10) || 'today';
    const current = byDay.get(dayKey) || {
      date: dayKey,
      dispatches: 0,
      interactions: 0,
      errors: 0,
    };
    current.dispatches += 1;
    if (log.status === 'FAILED') {
      current.errors += 1;
    }
    byDay.set(dayKey, current);
  }

  for (const item of interactions) {
    const dayKey = (item.createdAt || '').slice(0, 10) || 'today';
    const current = byDay.get(dayKey) || {
      date: dayKey,
      dispatches: 0,
      interactions: 0,
      errors: 0,
    };
    current.interactions += 1;
    if (item.status === 'FAILED') {
      current.errors += 1;
    }
    byDay.set(dayKey, current);
  }

  return {
    success: true,
    message: 'Server analytics retrieved',
    data: {
      serverId,
      totalDispatches,
      totalInteractions,
      successRatePercent,
      averageLatencyMs,
      activeActionTemplates: actionsList.length,
      series: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
    },
  };
}
