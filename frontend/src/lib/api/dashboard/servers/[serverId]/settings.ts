import { httpClient, withTokenConfig } from '../../../core/client';
import type { ApiResponse } from '../../../core/types';
import type { ServerDetail, UpdateServerSettingsPayload } from '../../../../model/server';
import type { ChannelItem } from '../../../../model/channel';
import type { ServerRole } from '../../../../model/role';

export async function updateServerSettings(
  accessToken: string,
  idOrSlug: string,
  payload: UpdateServerSettingsPayload
): Promise<ApiResponse<ServerDetail>> {
  return httpClient.put<ServerDetail>(
    `/servers/${encodeURIComponent(idOrSlug)}`,
    payload,
    withTokenConfig(accessToken)
  );
}

export async function fetchServerChannels(
  accessToken?: string,
  idOrSlug?: string
): Promise<ApiResponse<ChannelItem[]>> {
  const targetId = idOrSlug !== undefined ? idOrSlug : accessToken || '';
  const effectiveToken = idOrSlug !== undefined ? accessToken : undefined;
  return httpClient.get<ChannelItem[]>(
    `/servers/${encodeURIComponent(targetId)}/channels`,
    withTokenConfig(effectiveToken)
  );
}

export async function fetchServerRoles(
  idOrSlug: string,
  token?: string
): Promise<ApiResponse<ServerRole[]>> {
  return httpClient.get<ServerRole[]>(
    `/servers/${encodeURIComponent(idOrSlug)}/roles`,
    withTokenConfig(token)
  );
}
