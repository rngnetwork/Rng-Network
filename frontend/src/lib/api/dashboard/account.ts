import { httpClient, withTokenConfig } from '../core/client';
import type { ApiResponse } from '../core/types';
import type { UserProfileData, AccountPreferences, ActiveSessionItem } from '../../model/user';

export async function fetchUserProfile(
  accessToken?: string
): Promise<ApiResponse<UserProfileData>> {
  return httpClient.get<UserProfileData>('/users/me', withTokenConfig(accessToken));
}

export async function updateAccountPreferences(
  preferences: Partial<AccountPreferences>,
  accessToken?: string
): Promise<ApiResponse<AccountPreferences>> {
  return httpClient.put<AccountPreferences>(
    '/users/me/preferences',
    preferences,
    withTokenConfig(accessToken)
  );
}

export async function fetchActiveSessions(
  accessToken?: string
): Promise<ApiResponse<ActiveSessionItem[]>> {
  return httpClient.get<ActiveSessionItem[]>('/users/me/sessions', withTokenConfig(accessToken));
}

export async function revokeSession(
  sessionId: string,
  accessToken?: string
): Promise<ApiResponse<null>> {
  return httpClient.delete<null>(
    `/users/me/sessions/${encodeURIComponent(sessionId)}`,
    withTokenConfig(accessToken)
  );
}
