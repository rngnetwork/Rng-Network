const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE = rawBase.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface Pre2FaData {
  token: string;
  requiresDiscord2Fa: boolean;
  userEmail: string;
}

export interface UserProfileData {
  id: number;
  email: string;
  fullName?: string;
  provider?: string;
  role: string;
  designations?: string;
  roles?: string;
  designationList?: string[];
  roleList?: string[];
  status?: string;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  discordLinked: boolean;
}

export interface WhitelistedUser {
  id: number;
  email: string;
  userName: string;
  provider: string;
  role: string;
  designations: string[];
  roles: string[];
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  discordLinked: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWhitelistPayload {
  email: string;
  userName: string;
  provider?: string;
  designations: string[];
  roles: string[];
}

export interface UpdateWhitelistPayload {
  userName?: string;
  designations: string[];
  roles: string[];
}

export type PersonnelHierarchyMap = Record<string, string[]>;

export function getDiscordAvatarUrl(discordId?: string | null, avatarHash?: string | null): string {
  if (!discordId || !avatarHash || discordId === 'UNLINKED') {
    return '/visuals/staff.png';
  }
  const ext = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}`;
}

export interface FullAuthData {
  accessToken: string;
  tokenType: string;
  user: UserProfileData;
}

export interface ServerItem {
  id: string;
  slug: string;
  name: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  onlineCount: number;
  totalCount: number;
  boostLevel: number;
  boostCount: number;
  status: string;
}

export interface ServerDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  onlineCount: number;
  totalCount: number;
  boostLevel: number;
  boostCount: number;
  features: string[];
  afkChannelId: string | null;
  afkTimeout: number | null;
  systemChannelId: string | null;
  sendWelcome: boolean;
  stickerPrompt: boolean;
  boostMessage: boolean;
  setupTips: boolean;
  defaultMessageNotifications: number | null;
  vanityUrl: string | null;
  widgetEnabled: boolean | null;
  widgetChannelId: string | null;
}

export interface ChannelItem {
  id: string;
  name: string;
  type: number;
  position: number;
  parentId: string | null;
}

export interface UpdateServerSettingsPayload {
  name: string;
  description?: string | null;
  icon?: string | null;
  banner?: string | null;
  afkChannelId?: string | null;
  afkTimeout?: number | null;
  systemChannelId?: string | null;
  sendWelcome?: boolean;
  stickerPrompt?: boolean;
  boostMessage?: boolean;
  setupTips?: boolean;
  defaultMessageNotifications?: number | null;
  widgetEnabled?: boolean | null;
  widgetChannelId?: string | null;
}

export interface ForgotPasswordInitiateResponse {
  discordAuthUrl: string;
}

export interface ForgotPasswordVerifyResponse {
  resetToken: string;
  email: string;
}

export const api = {
  // ---------------------------------------------------------------------------
  // Step 1: Email / Password Login -> Returns Pre-2FA JWT
  // ---------------------------------------------------------------------------
  async submitEmailLogin(email: string, password?: string): Promise<ApiResponseEnvelope<Pre2FaData>> {
    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed. Invalid email or password.');
    }
    return data;
  },

  // ---------------------------------------------------------------------------
  // Step 1: Google OAuth2 Sign-In Redirect
  // ---------------------------------------------------------------------------
  redirectToGoogle(): void {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  },

  // ---------------------------------------------------------------------------
  // Step 2: Mandatory Discord 2FA Upgrade & Account Linking
  // ---------------------------------------------------------------------------
  async submitDiscord2Fa(pre2FaToken: string, code: string): Promise<ApiResponseEnvelope<FullAuthData>> {
    const response = await fetch(`${API_BASE}/api/v1/auth/discord/2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pre2FaToken}`,
      },
      credentials: 'include', // Receives HttpOnly rng_refresh_token cookie
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Discord 2FA verification failed.');
    }
    return data;
  },

  // ---------------------------------------------------------------------------
  // Refresh Full Access Token via HttpOnly Cookie
  // ---------------------------------------------------------------------------
  async refreshToken(): Promise<ApiResponseEnvelope<FullAuthData>> {
    const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to refresh authentication session.');
    }
    return data;
  },

  // ---------------------------------------------------------------------------
  // Fetch Current User Profile (GET /api/v1/users/me)
  // ---------------------------------------------------------------------------
  async fetchCurrentUser(accessToken: string): Promise<ApiResponseEnvelope<UserProfileData>> {
    const response = await fetch(`${API_BASE}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user profile.');
    }
    return data;
  },

  // ---------------------------------------------------------------------------
  // Logout (Clears HttpOnly Cookie)
  // ---------------------------------------------------------------------------
  async logout(): Promise<ApiResponseEnvelope<null>> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return await response.json();
    } catch {
      return { success: true, message: 'Logged out locally' };
    }
  },

  // ---------------------------------------------------------------------------
  // Whitelist Management APIs (GET, POST, PUT, DELETE /api/v1/whitelist)
  // ---------------------------------------------------------------------------
  async fetchWhitelistedUsers(accessToken: string): Promise<ApiResponseEnvelope<WhitelistedUser[]>> {
    const response = await fetch(`${API_BASE}/api/v1/whitelist`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch whitelisted users.');
    }
    return data;
  },

  async createWhitelistedUser(
    accessToken: string,
    payload: CreateWhitelistPayload
  ): Promise<ApiResponseEnvelope<WhitelistedUser>> {
    const response = await fetch(`${API_BASE}/api/v1/whitelist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to whitelist user.');
    }
    return data;
  },

  async updateWhitelistedUser(
    accessToken: string,
    id: number,
    payload: UpdateWhitelistPayload
  ): Promise<ApiResponseEnvelope<WhitelistedUser>> {
    const response = await fetch(`${API_BASE}/api/v1/whitelist/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update whitelisted user.');
    }
    return data;
  },

  async deleteWhitelistedUser(accessToken: string, id: number): Promise<ApiResponseEnvelope<null>> {
    const response = await fetch(`${API_BASE}/api/v1/whitelist/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete whitelisted user.');
    }
    return data;
  },

  async fetchPersonnelHierarchy(accessToken: string): Promise<ApiResponseEnvelope<PersonnelHierarchyMap>> {
    const response = await fetch(`${API_BASE}/api/v1/whitelist/hierarchy`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch personnel hierarchy.');
    }
    return data;
  },

  // ---------------------------------------------------------------------------
  // Discord Server Management Endpoints
  // ---------------------------------------------------------------------------
  async fetchServers(accessToken: string): Promise<ApiResponseEnvelope<ServerItem[]>> {
    const response = await fetch(`${API_BASE}/api/v1/servers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch Discord servers.');
    }
    return data;
  },

  async fetchServerDetails(accessToken: string, idOrSlug: string): Promise<ApiResponseEnvelope<ServerDetail>> {
    const response = await fetch(`${API_BASE}/api/v1/servers/${encodeURIComponent(idOrSlug)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch server details.');
    }
    return data;
  },

  async fetchServerChannels(accessToken: string, idOrSlug: string): Promise<ApiResponseEnvelope<ChannelItem[]>> {
    const response = await fetch(`${API_BASE}/api/v1/servers/${encodeURIComponent(idOrSlug)}/channels`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch server channels.');
    }
    return data;
  },

  async updateServerSettings(
    accessToken: string,
    idOrSlug: string,
    payload: UpdateServerSettingsPayload
  ): Promise<ApiResponseEnvelope<ServerDetail>> {
    const response = await fetch(`${API_BASE}/api/v1/servers/${encodeURIComponent(idOrSlug)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update server settings.');
    }
    return data;
  },

  // ---------------------------------------------------------------------------
  // Discord-Verified Forgot Password APIs
  // ---------------------------------------------------------------------------
  async initiateForgotPassword(email: string): Promise<ApiResponseEnvelope<ForgotPasswordInitiateResponse>> {
    const response = await fetch(`${API_BASE}/api/v1/auth/forgot-password/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to initiate password reset.');
    }
    return data;
  },

  async verifyForgotPasswordDiscord(code: string, state: string): Promise<ApiResponseEnvelope<ForgotPasswordVerifyResponse>> {
    const response = await fetch(`${API_BASE}/api/v1/auth/forgot-password/verify-discord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify Discord identity for password reset.');
    }
    return data;
  },

  async resetPassword(resetToken: string, newPassword: string): Promise<ApiResponseEnvelope<null>> {
    const response = await fetch(`${API_BASE}/api/v1/auth/forgot-password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resetToken}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password.');
    }
    return data;
  },

  // ---------------------------------------------------------------------------
  // Registration Access Request Fallback
  // ---------------------------------------------------------------------------
  async submitRegister(email: string, username: string, password?: string): Promise<{ success: boolean; message?: string }> {
    console.log('Registration Request:', email, username, !!password);
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, message: 'Access request submitted for review.' };
  },
};
