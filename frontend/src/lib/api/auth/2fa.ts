import { httpClient, withTokenConfig, setStoredAccessToken } from '../core/client';
import type { ApiResponse } from '../core/types';
import type { AuthResponse, TwoFactorStatus } from '../../model/auth';

export async function verifyDiscord2FA(
  code: string,
  pre2FaToken: string
): Promise<ApiResponse<AuthResponse>> {
  const res = await httpClient.post<AuthResponse>(
    '/auth/discord/2fa',
    { code },
    withTokenConfig(pre2FaToken)
  );
  if (res.data?.accessToken) {
    setStoredAccessToken(res.data.accessToken);
  }
  return res;
}

export async function submitDiscord2Fa(
  pre2FaToken: string,
  code: string
): Promise<ApiResponse<AuthResponse>> {
  return verifyDiscord2FA(code, pre2FaToken);
}

export async function get2FAStatus(accessToken?: string): Promise<ApiResponse<TwoFactorStatus>> {
  const userRes = await httpClient.get<{
    discordLinked: boolean;
    discordId?: string;
    discordUsername?: string;
  }>('/users/me', withTokenConfig(accessToken));
  return {
    success: userRes.success,
    message: userRes.message,
    data: {
      discordLinked: Boolean(userRes.data?.discordLinked),
      discordId: userRes.data?.discordId,
      discordUsername: userRes.data?.discordUsername,
    },
  };
}
