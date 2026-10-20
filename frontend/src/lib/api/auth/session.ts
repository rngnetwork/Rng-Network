import {
  httpClient,
  refreshClient,
  API_ROOT_URL,
  withTokenConfig,
  clearStoredAccessToken,
  setStoredAccessToken,
} from '../core/client';
import type { ApiResponse } from '../core/types';
import type { LoginRequest, Pre2FaResponse, AuthResponse } from '../../model/auth';
import type { UserProfileData } from '../../model/user';

export async function login(req: LoginRequest): Promise<ApiResponse<Pre2FaResponse>> {
  return httpClient.post<Pre2FaResponse>('/auth/login', req);
}

export async function submitEmailLogin(
  email: string,
  password?: string
): Promise<ApiResponse<Pre2FaResponse>> {
  return login({ email, password });
}

export function redirectToGoogle(): void {
  if (typeof window !== 'undefined') {
    window.open(`${API_ROOT_URL}/oauth2/authorization/google`, '_self');
  }
}

export async function refreshToken(): Promise<ApiResponse<AuthResponse>> {
  const res = await refreshClient.post<ApiResponse<AuthResponse>>('/auth/refresh');
  const accessToken = res.data?.data?.accessToken;
  if (accessToken) {
    setStoredAccessToken(accessToken);
  }
  return res.data;
}

export async function logout(): Promise<ApiResponse<null>> {
  try {
    const res = await httpClient.post<null>('/auth/logout');
    clearStoredAccessToken();
    return res;
  } catch {
    clearStoredAccessToken();
    return {
      success: true,
      message: 'Session cleared',
      data: null,
    };
  }
}

export async function fetchCurrentUser(accessToken?: string): Promise<ApiResponse<UserProfileData>> {
  return httpClient.get<UserProfileData>('/users/me', withTokenConfig(accessToken));
}
