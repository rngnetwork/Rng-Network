import { httpClient, withTokenConfig } from './core/client';
import type { ApiResponse } from './core/types';
import type {
  NetworkModulesData,
  ServerEffectiveModulesData,
  BotModulePatchRequest,
} from '../model/bot-module';

export async function getNetworkDefaultModules(
  token?: string
): Promise<ApiResponse<NetworkModulesData>> {
  return httpClient.get<NetworkModulesData>(
    '/bot-modules/network',
    withTokenConfig(token)
  );
}

export async function patchNetworkDefaultModules(
  modules: Record<string, Record<string, unknown>>,
  token?: string
): Promise<ApiResponse<NetworkModulesData>> {
  const payload: BotModulePatchRequest = { modules };
  return httpClient.patch<NetworkModulesData>(
    '/bot-modules/network',
    payload,
    withTokenConfig(token)
  );
}

export async function getServerEffectiveModules(
  serverSlug: string,
  token?: string
): Promise<ApiResponse<ServerEffectiveModulesData>> {
  return httpClient.get<ServerEffectiveModulesData>(
    `/servers/${encodeURIComponent(serverSlug)}/bot-modules`,
    withTokenConfig(token)
  );
}

export async function patchServerModules(
  serverSlug: string,
  modules: Record<string, Record<string, unknown>>,
  token?: string
): Promise<ApiResponse<ServerEffectiveModulesData>> {
  const payload: BotModulePatchRequest = { modules };
  return httpClient.patch<ServerEffectiveModulesData>(
    `/servers/${encodeURIComponent(serverSlug)}/bot-modules`,
    payload,
    withTokenConfig(token)
  );
}

export async function resetServerModule(
  serverSlug: string,
  moduleName: string,
  token?: string
): Promise<ApiResponse<Record<string, unknown>>> {
  return httpClient.delete<Record<string, unknown>>(
    `/servers/${encodeURIComponent(serverSlug)}/bot-modules/${encodeURIComponent(moduleName)}`,
    withTokenConfig(token)
  );
}
