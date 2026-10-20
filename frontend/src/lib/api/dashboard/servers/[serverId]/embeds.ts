import { httpClient, withTokenConfig } from '../../../core/client';
import type { ApiResponse, PaginationParams } from '../../../core/types';
import type {
  EmbedAction,
  CreateActionPayload,
  UpdateActionPayload,
} from '../../../../model/action';
import type { DiscordEmojiData } from '../../../../model/common';

export async function fetchServerActions(
  idOrSlug: string,
  pageOrParams?: number | PaginationParams,
  size?: number,
  token?: string
): Promise<ApiResponse<EmbedAction[]>> {
  const pageNum =
    typeof pageOrParams === 'object' ? pageOrParams.page : pageOrParams;
  const sizeNum =
    typeof pageOrParams === 'object' ? pageOrParams.size : size;
  const queryParams =
    pageNum !== undefined ? `?page=${pageNum}&size=${sizeNum ?? 50}` : '';

  const response = await httpClient.get<EmbedAction[] | { content: EmbedAction[] }>(
    `/servers/${encodeURIComponent(idOrSlug)}/actions${queryParams}`,
    withTokenConfig(token)
  );

  const rawData = response.data;
  const list: EmbedAction[] = Array.isArray(rawData)
    ? rawData
    : rawData && Array.isArray(rawData.content)
      ? rawData.content
      : [];

  return {
    ...response,
    data: list,
  };
}

export async function createServerAction(
  serverIdOrSlug: string,
  payload: CreateActionPayload,
  token?: string
): Promise<ApiResponse<EmbedAction>> {
  return httpClient.post<EmbedAction>(
    `/servers/${encodeURIComponent(serverIdOrSlug)}/actions`,
    payload,
    withTokenConfig(token)
  );
}

export async function updateServerAction(
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

export async function deleteServerAction(
  actionId: string,
  token?: string
): Promise<ApiResponse<boolean>> {
  return httpClient.delete<boolean>(
    `/embeds/actions/${encodeURIComponent(actionId)}`,
    withTokenConfig(token)
  );
}

export async function fetchServerEmojis(
  idOrSlug: string,
  token?: string
): Promise<ApiResponse<DiscordEmojiData[]>> {
  return httpClient.get<DiscordEmojiData[]>(
    `/servers/${encodeURIComponent(idOrSlug)}/emojis`,
    withTokenConfig(token)
  );
}

export async function fetchServerGuildEmojis(
  serverId: string,
  token?: string
): Promise<ApiResponse<DiscordEmojiData[]>> {
  return fetchServerEmojis(serverId, token);
}
