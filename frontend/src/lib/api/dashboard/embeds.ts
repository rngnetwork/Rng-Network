import { httpClient, withTokenConfig } from '../core/client';
import type { ApiResponse } from '../core/types';
import type { PageData, DiscordEmojiData } from '../../model/common';
import type {
  TemplateData,
  CreateTemplatePayload,
  UpdateTemplatePayload,
} from '../../model/embed';
import type {
  DispatchType,
  DispatchEmbedPayload,
  DispatchResponseData,
  DispatchLogData,
  DryRunPayload,
  DryRunValidationReportData,
} from '../../model/dispatch';
import type { ChannelItem } from '../../model/channel';
import type {
  EmbedAction,
  CreateActionPayload,
  UpdateActionPayload,
  InteractionLogItem,
} from '../../model/action';

export async function dispatchEmbedJson(
  payload: DispatchEmbedPayload,
  token?: string
): Promise<ApiResponse<DispatchResponseData>> {
  const scheduleTimestamp = payload.scheduledFor || payload.scheduledTime;
  const inferredType: DispatchType =
    payload.dispatchType || (scheduleTimestamp ? 'SCHEDULED_BOT' : 'IMMEDIATE_BOT');
  const normalizedPayload = {
    ...payload,
    dispatchType: inferredType,
    ...(scheduleTimestamp
      ? { scheduledFor: scheduleTimestamp, scheduledTime: scheduleTimestamp }
      : {}),
  };
  return httpClient.post<DispatchResponseData>(
    '/embeds/dispatch',
    normalizedPayload,
    withTokenConfig(token)
  );
}

export async function dispatchEmbed(
  payload: DispatchEmbedPayload,
  token?: string
): Promise<ApiResponse<DispatchResponseData>> {
  return dispatchEmbedJson(payload, token);
}

export async function dispatchEmbedMultipart(
  formData: FormData,
  token?: string
): Promise<ApiResponse<DispatchResponseData>> {
  const baseConfig = withTokenConfig(token);
  return httpClient.post<DispatchResponseData>('/embeds/dispatch/multipart', formData, {
    ...baseConfig,
    headers: {
      ...(baseConfig.headers || {}),
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function scheduleEmbedDispatch(
  payload: DispatchEmbedPayload,
  token?: string
): Promise<ApiResponse<DispatchResponseData>> {
  const scheduleTimestamp = payload.scheduledFor || payload.scheduledTime;
  const normalizedPayload = {
    ...payload,
    dispatchType: payload.dispatchType || 'SCHEDULED_BOT',
    ...(scheduleTimestamp
      ? { scheduledFor: scheduleTimestamp, scheduledTime: scheduleTimestamp }
      : {}),
  };
  return httpClient.post<DispatchResponseData>(
    '/embeds/dispatch/schedule',
    normalizedPayload,
    withTokenConfig(token)
  );
}

export async function scheduleDispatch(
  payload: DispatchEmbedPayload,
  token?: string
): Promise<ApiResponse<DispatchResponseData>> {
  return scheduleEmbedDispatch(payload, token);
}

export async function cancelScheduledEmbedDispatch(
  dispatchId: string,
  token?: string
): Promise<ApiResponse<boolean>> {
  return httpClient.delete<boolean>(
    `/embeds/dispatch/schedule/${encodeURIComponent(dispatchId)}`,
    withTokenConfig(token)
  );
}

export async function cancelScheduledDispatch(
  dispatchId: string,
  token?: string
): Promise<ApiResponse<boolean>> {
  return cancelScheduledEmbedDispatch(dispatchId, token);
}

export async function testDryRun(
  payload: DryRunPayload,
  token?: string
): Promise<ApiResponse<DryRunValidationReportData>> {
  return httpClient.post<DryRunValidationReportData>(
    '/embeds/dispatch/test',
    payload,
    withTokenConfig(token)
  );
}

export async function validateDryRun(
  payload: DryRunPayload,
  token?: string
): Promise<ApiResponse<DryRunValidationReportData>> {
  return testDryRun(payload, token);
}

export async function validatePreflight(
  payload: DryRunPayload,
  token?: string
): Promise<ApiResponse<DryRunValidationReportData>> {
  return testDryRun(payload, token);
}

export async function fetchDispatchLogs(
  params?: { serverId?: string; status?: string; page?: number; size?: number },
  token?: string
): Promise<ApiResponse<PageData<DispatchLogData>>> {
  const query = new URLSearchParams();
  if (params?.serverId) query.set('serverId', params.serverId);
  if (params?.status) query.set('status', params.status);
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));
  const queryStr = query.toString();
  return httpClient.get<PageData<DispatchLogData>>(
    `/embeds/logs${queryStr ? `?${queryStr}` : ''}`,
    withTokenConfig(token)
  );
}

export async function fetchDispatchChannels(
  serverId: string,
  token?: string
): Promise<ApiResponse<ChannelItem[]>> {
  const config = withTokenConfig(token);
  try {
    const res = await httpClient.get<ChannelItem[]>(
      `/embeds/channels?serverId=${encodeURIComponent(serverId)}`,
      config
    );
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res;
    }
  } catch {
    // Fall through to server channels endpoint
  }
  return httpClient.get<ChannelItem[]>(
    `/servers/${encodeURIComponent(serverId)}/channels`,
    config
  );
}

export async function fetchDispatchableChannels(
  serverId: string,
  token?: string
): Promise<ApiResponse<ChannelItem[]>> {
  return fetchDispatchChannels(serverId, token);
}

export async function fetchEmbedTemplates(
  params?: { serverId?: string; category?: string; tag?: string; page?: number; size?: number },
  token?: string
): Promise<ApiResponse<PageData<TemplateData>>> {
  const query = new URLSearchParams();
  if (params?.serverId) query.set('serverId', params.serverId);
  if (params?.category) query.set('category', params.category);
  if (params?.tag) query.set('tag', params.tag);
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));
  const queryStr = query.toString();
  return httpClient.get<PageData<TemplateData>>(
    `/embeds/templates${queryStr ? `?${queryStr}` : ''}`,
    withTokenConfig(token)
  );
}

export async function fetchGlobalTemplates(
  params?: { serverId?: string; category?: string; tag?: string; page?: number; size?: number },
  token?: string
): Promise<ApiResponse<PageData<TemplateData>>> {
  return fetchEmbedTemplates(params, token);
}

export async function fetchTemplates(
  params?: { serverId?: string; category?: string; tag?: string; page?: number; size?: number },
  token?: string
): Promise<ApiResponse<PageData<TemplateData>>> {
  return fetchEmbedTemplates(params, token);
}

export async function fetchEmbedTemplateById(
  id: string,
  token?: string
): Promise<ApiResponse<TemplateData>> {
  return httpClient.get<TemplateData>(
    `/embeds/templates/${encodeURIComponent(id)}`,
    withTokenConfig(token)
  );
}

export async function createEmbedTemplate(
  payload: CreateTemplatePayload,
  token?: string
): Promise<ApiResponse<TemplateData>> {
  const targetPayload = payload.payload || payload.payloadJson || {};
  const isPublicVal = payload.isPublic ?? payload.publicTemplate ?? false;
  const normalizedBody = {
    ...payload,
    payload: targetPayload,
    payloadJson: targetPayload,
    isPublic: isPublicVal,
    publicTemplate: isPublicVal,
  };
  return httpClient.post<TemplateData>('/embeds/templates', normalizedBody, withTokenConfig(token));
}

export async function createTemplate(
  payload: CreateTemplatePayload,
  token?: string
): Promise<ApiResponse<TemplateData>> {
  return createEmbedTemplate(payload, token);
}

export async function updateEmbedTemplate(
  id: string,
  payload: UpdateTemplatePayload,
  token?: string
): Promise<ApiResponse<TemplateData>> {
  const targetPayload = payload.payload || payload.payloadJson;
  const isPublicVal = payload.isPublic ?? payload.publicTemplate;
  const normalizedBody = {
    ...payload,
    ...(targetPayload ? { payload: targetPayload, payloadJson: targetPayload } : {}),
    ...(isPublicVal !== undefined ? { isPublic: isPublicVal, publicTemplate: isPublicVal } : {}),
  };
  return httpClient.put<TemplateData>(
    `/embeds/templates/${encodeURIComponent(id)}`,
    normalizedBody,
    withTokenConfig(token)
  );
}

export async function updateTemplate(
  id: string,
  payload: UpdateTemplatePayload,
  token?: string
): Promise<ApiResponse<TemplateData>> {
  return updateEmbedTemplate(id, payload, token);
}

export async function saveTemplate(
  payload: CreateTemplatePayload & { id?: string },
  token?: string
): Promise<ApiResponse<TemplateData>> {
  return payload.id
    ? updateEmbedTemplate(payload.id, payload, token)
    : createEmbedTemplate(payload, token);
}

export async function deleteEmbedTemplate(
  id: string,
  token?: string
): Promise<ApiResponse<boolean>> {
  return httpClient.delete<boolean>(
    `/embeds/templates/${encodeURIComponent(id)}`,
    withTokenConfig(token)
  );
}

export async function deleteTemplate(id: string, token?: string): Promise<ApiResponse<boolean>> {
  return deleteEmbedTemplate(id, token);
}

export async function exportEmbedTemplate(
  id: string,
  token?: string
): Promise<ApiResponse<Record<string, unknown>>> {
  return httpClient.get<Record<string, unknown>>(
    `/embeds/templates/${encodeURIComponent(id)}/export`,
    withTokenConfig(token)
  );
}

export async function importEmbedTemplate(
  templateJson: Record<string, unknown>,
  token?: string
): Promise<ApiResponse<TemplateData>> {
  return httpClient.post<TemplateData>(
    '/embeds/templates/import',
    templateJson,
    withTokenConfig(token)
  );
}

export async function fetchBotEmojis(token?: string): Promise<ApiResponse<DiscordEmojiData[]>> {
  return httpClient.get<DiscordEmojiData[]>('/bot/emojis', withTokenConfig(token));
}

export async function fetchActionTemplates(
  serverId?: string,
  token?: string
): Promise<ApiResponse<EmbedAction[]>> {
  const url = serverId
    ? `/embeds/actions?serverId=${encodeURIComponent(serverId)}`
    : '/embeds/actions';
  return httpClient.get<EmbedAction[]>(url, withTokenConfig(token));
}

export async function fetchActions(
  serverId?: string,
  token?: string
): Promise<ApiResponse<EmbedAction[]>> {
  return fetchActionTemplates(serverId, token);
}

export async function getActionTemplate(
  actionId: string,
  token?: string
): Promise<ApiResponse<EmbedAction>> {
  return httpClient.get<EmbedAction>(
    `/embeds/actions/${encodeURIComponent(actionId)}`,
    withTokenConfig(token)
  );
}

export async function createActionTemplate(
  payload: CreateActionPayload,
  tokenOrServerId?: string,
  token?: string
): Promise<ApiResponse<EmbedAction>> {
  let actualServerId: string | undefined = undefined;
  let actualToken = token;
  if (token === undefined) {
    actualToken = tokenOrServerId;
  } else {
    actualServerId = tokenOrServerId;
  }

  if (
    actualServerId &&
    (actualServerId.startsWith('eyJ') || actualServerId.split('.').length === 3)
  ) {
    actualToken = actualServerId;
    actualServerId = undefined;
  }

  const endpoint = actualServerId
    ? `/servers/${encodeURIComponent(actualServerId)}/actions`
    : '/embeds/actions';
  return httpClient.post<EmbedAction>(endpoint, payload, withTokenConfig(actualToken));
}

export async function createAction(
  payload: CreateActionPayload,
  serverIdOrSlug?: string,
  token?: string
): Promise<ApiResponse<EmbedAction>> {
  return createActionTemplate(payload, serverIdOrSlug, token);
}

export async function updateActionTemplate(
  actionId: string,
  payload: UpdateActionPayload,
  token?: string
): Promise<ApiResponse<EmbedAction>> {
  return httpClient.put<EmbedAction>(
    `/embeds/actions/${encodeURIComponent(actionId)}`,
    payload,
    withTokenConfig(token)
  );
}

export async function updateAction(
  actionId: string,
  payload: UpdateActionPayload,
  token?: string
): Promise<ApiResponse<EmbedAction>> {
  return updateActionTemplate(actionId, payload, token);
}

export async function deleteActionTemplate(
  actionId: string,
  token?: string
): Promise<ApiResponse<boolean>> {
  return httpClient.delete<boolean>(
    `/embeds/actions/${encodeURIComponent(actionId)}`,
    withTokenConfig(token)
  );
}

export async function deleteAction(
  actionId: string,
  token?: string
): Promise<ApiResponse<boolean>> {
  return deleteActionTemplate(actionId, token);
}

export async function fetchGlobalInteractionLogs(
  params?: { guildId?: string; serverIdOrSlug?: string; page?: number; size?: number },
  token?: string
): Promise<
  ApiResponse<{ content: InteractionLogItem[]; totalElements?: number; totalPages?: number }>
> {
  const page = params?.page ?? 0;
  const size = params?.size ?? 20;
  let url = `/embeds/actions/logs?page=${page}&size=${size}`;
  if (params?.serverIdOrSlug) {
    url = `/servers/${encodeURIComponent(params.serverIdOrSlug)}/interactions/logs?page=${page}&size=${size}`;
  } else if (params?.guildId) {
    url += `&guildId=${encodeURIComponent(params.guildId)}`;
  }
  return httpClient.get<{
    content: InteractionLogItem[];
    totalElements?: number;
    totalPages?: number;
  }>(url, withTokenConfig(token));
}
