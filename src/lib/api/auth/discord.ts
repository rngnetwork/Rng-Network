import { API_BASE_URL, httpClient } from '../core/client';
import type { ApiResponse } from '../core/types';
import type { AuthResponse, ForgotPasswordVerifyResponse } from '../../model/auth';
import { getDiscordAvatarUrl } from '../../model/common';
import { verifyDiscord2FA } from './2fa';

export { getDiscordAvatarUrl };

export function getDiscordOAuthUrl(state?: string): string {
  const base = `${API_BASE_URL}/auth/discord/authorize`;
  if (!state) return base;
  return `${base}?state=${encodeURIComponent(state)}`;
}

export async function handleDiscordCallback(
  code: string,
  state?: string,
  pre2FaToken?: string
): Promise<ApiResponse<AuthResponse | ForgotPasswordVerifyResponse>> {
  if (state && state.startsWith('pwd_reset')) {
    return httpClient.post<ForgotPasswordVerifyResponse>(
      '/auth/forgot-password/verify-discord',
      { code, state }
    );
  }
  return verifyDiscord2FA(code, pre2FaToken || '');
}
