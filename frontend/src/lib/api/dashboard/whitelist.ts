import { httpClient, withTokenConfig } from '../core/client';
import type { ApiResponse, PaginationParams, PaginatedResult } from '../core/types';
import type {
  WhitelistedUser,
  CreateWhitelistPayload,
  UpdateWhitelistPayload,
  PersonnelHierarchyMap,
} from '../../model/whitelist';

export async function fetchWhitelistedUsers(
  accessToken?: string
): Promise<ApiResponse<WhitelistedUser[]>> {
  return httpClient.get<WhitelistedUser[]>('/whitelist', withTokenConfig(accessToken));
}

export async function fetchWhitelistPersonnel(
  params: PaginationParams & { search?: string; rank?: string },
  accessToken?: string
): Promise<ApiResponse<PaginatedResult<WhitelistedUser>>> {
  const response = await fetchWhitelistedUsers(accessToken);
  const allUsers = response.data || [];

  const searchQuery = params.search?.trim().toLowerCase() || '';
  const rankFilter = params.rank?.trim() || '';

  const filtered = allUsers.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.email.toLowerCase().includes(searchQuery) ||
      user.userName.toLowerCase().includes(searchQuery) ||
      (user.discordUsername && user.discordUsername.toLowerCase().includes(searchQuery));
    const matchesRank = !rankFilter || user.role === rankFilter || user.roles?.includes(rankFilter);
    return matchesSearch && matchesRank;
  });

  const pageSize = Math.max(1, params.size || 20);
  const currentPage = Math.max(0, params.page || 0);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIdx = currentPage * pageSize;
  const items = filtered.slice(startIdx, startIdx + pageSize);

  return {
    success: response.success,
    message: response.message,
    data: {
      items,
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    },
  };
}

export async function createWhitelistedUser(
  accessToken: string,
  payload: CreateWhitelistPayload
): Promise<ApiResponse<WhitelistedUser>> {
  return httpClient.post<WhitelistedUser>('/whitelist', payload, withTokenConfig(accessToken));
}

export async function addWhitelistPersonnel(
  payload: CreateWhitelistPayload,
  accessToken?: string
): Promise<ApiResponse<WhitelistedUser>> {
  return httpClient.post<WhitelistedUser>('/whitelist', payload, withTokenConfig(accessToken));
}

export async function updateWhitelistedUser(
  accessToken: string,
  id: number,
  payload: UpdateWhitelistPayload
): Promise<ApiResponse<WhitelistedUser>> {
  return httpClient.put<WhitelistedUser>(
    `/whitelist/${id}`,
    payload,
    withTokenConfig(accessToken)
  );
}

export async function updatePersonnelRank(
  id: number,
  payload: UpdateWhitelistPayload,
  accessToken?: string
): Promise<ApiResponse<WhitelistedUser>> {
  return httpClient.put<WhitelistedUser>(
    `/whitelist/${id}`,
    payload,
    withTokenConfig(accessToken)
  );
}

export async function deleteWhitelistedUser(
  accessToken: string,
  id: number
): Promise<ApiResponse<null>> {
  return httpClient.delete<null>(`/whitelist/${id}`, withTokenConfig(accessToken));
}

export async function revokePersonnel(
  id: number,
  accessToken?: string
): Promise<ApiResponse<null>> {
  return httpClient.delete<null>(`/whitelist/${id}`, withTokenConfig(accessToken));
}

export async function fetchPersonnelHierarchy(
  accessToken?: string
): Promise<ApiResponse<PersonnelHierarchyMap>> {
  return httpClient.get<PersonnelHierarchyMap>(
    '/whitelist/hierarchy',
    withTokenConfig(accessToken)
  );
}
