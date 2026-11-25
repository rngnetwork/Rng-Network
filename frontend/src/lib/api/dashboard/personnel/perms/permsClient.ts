import { httpClient, withTokenConfig } from '@/lib/api/core/client';
import type { ApiResponse } from '@/lib/api/core/types';
import type {
  EffectivePermissions,
  PermsExplorerResponse,
  PermsObject,
  PreviewRoleOption,
  RolePermissionsDto,
} from '@/lib/model/personnel/perms';

export async function fetchPermsExplorer(
  token?: string
): Promise<ApiResponse<PermsExplorerResponse>> {
  return httpClient.get<PermsExplorerResponse>(
    '/personnel/perms/explorer',
    withTokenConfig(token)
  );
}

export async function fetchAllRolePermissions(
  token?: string
): Promise<ApiResponse<RolePermissionsDto[]>> {
  return httpClient.get<RolePermissionsDto[]>(
    '/personnel/perms',
    withTokenConfig(token)
  );
}

export async function fetchRolePermissions(
  roleId: string,
  token?: string
): Promise<ApiResponse<RolePermissionsDto>> {
  return httpClient.get<RolePermissionsDto>(
    `/personnel/perms/${encodeURIComponent(roleId)}`,
    withTokenConfig(token)
  );
}

export async function updateRolePermissions(
  roleId: string,
  permissions: PermsObject,
  version: number,
  token?: string
): Promise<ApiResponse<RolePermissionsDto>> {
  return httpClient.put<RolePermissionsDto>(
    `/personnel/perms/${encodeURIComponent(roleId)}`,
    { permissions, version },
    withTokenConfig(token)
  );
}

export async function resetRolePermissions(
  roleId: string,
  token?: string
): Promise<ApiResponse<RolePermissionsDto>> {
  return httpClient.post<RolePermissionsDto>(
    `/personnel/perms/reset/${encodeURIComponent(roleId)}`,
    {},
    withTokenConfig(token)
  );
}

export async function fetchMyEffectivePermissions(
  previewRoleId?: string | null,
  token?: string
): Promise<ApiResponse<EffectivePermissions>> {
  const headers: Record<string, string> = {};
  if (previewRoleId) {
    headers['X-Preview-Role-Id'] = previewRoleId;
  }
  return httpClient.get<EffectivePermissions>(
    '/personnel/perms/me',
    withTokenConfig(token, { headers })
  );
}

export async function fetchPreviewRoleOptions(
  token?: string
): Promise<ApiResponse<PreviewRoleOption[]>> {
  return httpClient.get<PreviewRoleOption[]>(
    '/personnel/perms/preview-options',
    withTokenConfig(token)
  );
}
