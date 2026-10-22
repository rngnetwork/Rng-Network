import { httpClient, withTokenConfig } from '../../core/client';
import type { ApiResponse } from '../../core/types';
import type { ServerItem } from '../../../model/server';

export async function fetchServers(accessToken?: string): Promise<ApiResponse<ServerItem[]>> {
  return httpClient.get<ServerItem[]>('/servers', withTokenConfig(accessToken));
}

export async function fetchUserManagedServers(
  accessToken?: string
): Promise<ApiResponse<ServerItem[]>> {
  return fetchServers(accessToken);
}

export async function fetchRegisteredServers(
  accessToken?: string
): Promise<ApiResponse<ServerItem[]>> {
  return fetchServers(accessToken);
}
