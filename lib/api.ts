const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE = rawBase.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

export class ApiHttpError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.data = data;
  }
}

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

// ---------------------------------------------------------------------------
// Embed Builder & Discord Components V2 Dispatch Contracts
// ---------------------------------------------------------------------------
export type DispatchType = 'IMMEDIATE_BOT' | 'SCHEDULED_BOT' | 'IMMEDIATE' | 'SCHEDULED';

export interface DispatchEmbedPayload {
  serverId: string;
  channelId?: string;
  dispatchType?: DispatchType;
  payload: Record<string, unknown>;
  dryRun?: boolean;
  scheduledTime?: string;
  scheduledFor?: string;
}

export interface DispatchResponseData {
  dispatchId: string;
  status: string;
  timestamp: string;
  channelId?: string;
  discordMessageId?: string;
  isScheduled?: boolean;
  errorMessage?: string;
  latencyMs?: number;
}

export interface DiscordEmojiData {
  id: string;
  name: string;
  animated: boolean;
  url: string;
  formatted: string;
}

export interface DryRunPayload {
  serverId: string;
  channelId?: string;
  payload: Record<string, unknown>;
}

export interface BotPermissionCheck {
  viewChannel: boolean;
  sendMessages: boolean;
  embedLinks: boolean;
  attachFiles: boolean;
}

export interface DryRunValidationReportData {
  valid: boolean;
  errors: string[];
  warnings: string[];
  containerCount: number;
  totalComponentCount: number;
  totalActionRows: number;
  cumulativeCharCount: number;
  actionRowCount?: number;
  characterCount?: number;
  permissions?: BotPermissionCheck;
  resolvedBotPermissions?: string[];
}

export interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface TemplateData {
  id: string;
  name: string;
  description?: string;
  serverId: string;
  authorId: number;
  authorUsername?: string;
  tags: string[];
  category: string;
  public: boolean;
  active: boolean;
  version: number;
  payloadJson: Record<string, unknown>;
  components: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  serverId: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  publicTemplate?: boolean;
  payload?: Record<string, unknown>;
  payloadJson?: Record<string, unknown>;
  components?: unknown[];
}

export interface UpdateTemplatePayload {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  publicTemplate?: boolean;
  active?: boolean;
  payload?: Record<string, unknown>;
  payloadJson?: Record<string, unknown>;
  components?: unknown[];
}

export interface DispatchLogData {
  id: string;
  dispatchId: string;
  type: string;
  status: string;
  serverId: string;
  channelId: string;
  operatorId: number;
  operatorUsername?: string;
  discordMessageId?: string;
  errorMessage?: string;
  latencyMs?: number;
  timestamp: string;
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
  async fetchServers(accessToken?: string): Promise<ApiResponseEnvelope<ServerItem[]>> {
    let token = accessToken || getStoredAccessToken();
    let response = await fetch(`${API_BASE}/api/v1/servers`, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      try {
        const refreshRes = await this.refreshToken();
        if (refreshRes.success && refreshRes.data?.accessToken) {
          token = refreshRes.data.accessToken;
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('token', token);
          }
          response = await fetch(`${API_BASE}/api/v1/servers`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          });
        }
      } catch (e) {
        console.warn('Token refresh failed during fetchServers:', e);
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch Discord servers.');
    }
    return data;
  },

  async fetchServerDetails(accessToken?: string, idOrSlug?: string): Promise<ApiResponseEnvelope<ServerDetail>> {
    let token = accessToken || getStoredAccessToken();
    const targetId = idOrSlug || '';
    let response = await fetch(`${API_BASE}/api/v1/servers/${encodeURIComponent(targetId)}`, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      try {
        const refreshRes = await this.refreshToken();
        if (refreshRes.success && refreshRes.data?.accessToken) {
          token = refreshRes.data.accessToken;
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('token', token);
          }
          response = await fetch(`${API_BASE}/api/v1/servers/${encodeURIComponent(targetId)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          });
        }
      } catch (e) {
        console.warn('Token refresh failed during fetchServerDetails:', e);
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch server details.');
    }
    return data;
  },

  async fetchServerChannels(accessToken?: string, idOrSlug?: string): Promise<ApiResponseEnvelope<ChannelItem[]>> {
    let token = accessToken || getStoredAccessToken();
    const targetId = idOrSlug || '';
    let response = await fetch(`${API_BASE}/api/v1/servers/${encodeURIComponent(targetId)}/channels`, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      try {
        const refreshRes = await this.refreshToken();
        if (refreshRes.success && refreshRes.data?.accessToken) {
          token = refreshRes.data.accessToken;
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('token', token);
          }
          response = await fetch(`${API_BASE}/api/v1/servers/${encodeURIComponent(targetId)}/channels`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          });
        }
      } catch (e) {
        console.warn('Token refresh failed during fetchServerChannels:', e);
      }
    }

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
  // Discord Real Emojis APIs (Server & Bot Application)
  // ---------------------------------------------------------------------------
  async fetchServerEmojis(idOrSlug: string, token?: string): Promise<ApiResponseEnvelope<DiscordEmojiData[]>> {
    let effectiveToken = token || getStoredAccessToken();
    return requestWithFallback(
      async () => {
        let response = await fetch(`${API_BASE}/api/v1/servers/${encodeURIComponent(idOrSlug)}/emojis`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
        });

        if (response.status === 401) {
          try {
            const refreshRes = await this.refreshToken();
            if (refreshRes.success && refreshRes.data?.accessToken) {
              effectiveToken = refreshRes.data.accessToken;
              if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', effectiveToken);
                localStorage.setItem('token', effectiveToken);
              }
              response = await fetch(`${API_BASE}/api/v1/servers/${encodeURIComponent(idOrSlug)}/emojis`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${effectiveToken}`,
                },
                credentials: 'include',
              });
            }
          } catch (e) {
            console.warn('Token refresh failed during fetchServerEmojis:', e);
          }
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new ApiHttpError(data.message || `Failed to fetch server emojis (${response.status})`, response.status, data);
        }
        return data;
      },
      () => [] as DiscordEmojiData[],
      'Server emojis loaded via fallback.'
    );
  },

  async fetchBotEmojis(token?: string): Promise<ApiResponseEnvelope<DiscordEmojiData[]>> {
    let effectiveToken = token || getStoredAccessToken();
    return requestWithFallback(
      async () => {
        let response = await fetch(`${API_BASE}/api/v1/bot/emojis`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
        });

        if (response.status === 401) {
          try {
            const refreshRes = await this.refreshToken();
            if (refreshRes.success && refreshRes.data?.accessToken) {
              effectiveToken = refreshRes.data.accessToken;
              if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', effectiveToken);
                localStorage.setItem('token', effectiveToken);
              }
              response = await fetch(`${API_BASE}/api/v1/bot/emojis`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${effectiveToken}`,
                },
                credentials: 'include',
              });
            }
          } catch (e) {
            console.warn('Token refresh failed during fetchBotEmojis:', e);
          }
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new ApiHttpError(data.message || `Failed to fetch bot emojis (${response.status})`, response.status, data);
        }
        return data;
      },
      () => [] as DiscordEmojiData[],
      'Bot emojis loaded via fallback.'
    );
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
  // Discord Components V2 Embed Dispatch & Template APIs (§8.3)
  // ---------------------------------------------------------------------------
  async dispatchEmbedJson(payload: DispatchEmbedPayload, token?: string): Promise<ApiResponseEnvelope<DispatchResponseData>> {
    let effectiveToken = token || getStoredAccessToken();
    const scheduleTimestamp = payload.scheduledFor || payload.scheduledTime;
    const inferredType: DispatchType = payload.dispatchType || (scheduleTimestamp ? 'SCHEDULED_BOT' : 'IMMEDIATE_BOT');
    const normalizedPayload = {
      ...payload,
      dispatchType: inferredType,
      ...(scheduleTimestamp ? { scheduledFor: scheduleTimestamp, scheduledTime: scheduleTimestamp } : {}),
    };
    return requestWithFallback(
      async () => {
        let response = await fetch(`${API_BASE}/api/v1/embeds/dispatch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(normalizedPayload),
        });

        if (response.status === 401) {
          try {
            const refreshRes = await this.refreshToken();
            if (refreshRes.success && refreshRes.data?.accessToken) {
              effectiveToken = refreshRes.data.accessToken;
              if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', effectiveToken);
                localStorage.setItem('token', effectiveToken);
              }
              response = await fetch(`${API_BASE}/api/v1/embeds/dispatch`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${effectiveToken}`,
                },
                credentials: 'include',
                body: JSON.stringify(normalizedPayload),
              });
            }
          } catch (refreshErr) {
            console.warn('Token refresh retry failed:', refreshErr);
          }
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new ApiHttpError(data.message || `Dispatch failed with status ${response.status}`, response.status, data);
        }
        return data;
      },
      () => {
        const mockSnowflake = generateMockSnowflake();
        const dispatchId = 'dsp_' + Math.random().toString(36).substring(2, 10);
        const logEntry: DispatchLogData = {
          id: 'log_' + Math.random().toString(36).substring(2, 10),
          dispatchId,
          type: (payload.scheduledFor || payload.scheduledTime) ? 'SCHEDULED_BOT' : 'IMMEDIATE_BOT',
          status: (payload.scheduledFor || payload.scheduledTime) ? 'SCHEDULED' : 'SUCCESS',
          serverId: payload.serverId,
          channelId: payload.channelId || 'simulated_channel',
          operatorId: 1,
          operatorUsername: 'operator@rng.com',
          discordMessageId: mockSnowflake,
          latencyMs: 38,
          timestamp: new Date().toISOString(),
        };
        const logs = getLocalStored<DispatchLogData[]>('rng_dispatch_logs', []);
        setLocalStored('rng_dispatch_logs', [logEntry, ...logs]);
        return {
          dispatchId,
          status: payload.scheduledTime ? 'SCHEDULED' : 'SUCCESS',
          timestamp: new Date().toISOString(),
          channelId: payload.channelId,
          discordMessageId: mockSnowflake,
          isScheduled: Boolean(payload.scheduledTime),
          latencyMs: 38,
        };
      },
      'Immediate message dispatched via offline local simulation.'
    );
  },

  async dispatchEmbedMultipart(formData: FormData, token?: string): Promise<ApiResponseEnvelope<DispatchResponseData>> {
    let effectiveToken = token || getStoredAccessToken();
    return requestWithFallback(
      async () => {
        let response = await fetch(`${API_BASE}/api/v1/embeds/dispatch/multipart`, {
          method: 'POST',
          headers: {
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
          body: formData,
        });

        if (response.status === 401) {
          try {
            const refreshRes = await this.refreshToken();
            if (refreshRes.success && refreshRes.data?.accessToken) {
              effectiveToken = refreshRes.data.accessToken;
              if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', effectiveToken);
                localStorage.setItem('token', effectiveToken);
              }
              response = await fetch(`${API_BASE}/api/v1/embeds/dispatch/multipart`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${effectiveToken}`,
                },
                credentials: 'include',
                body: formData,
              });
            }
          } catch (refreshErr) {
            console.warn('Token refresh retry failed:', refreshErr);
          }
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new ApiHttpError(data.message || `Multipart dispatch failed with status ${response.status}`, response.status, data);
        }
        return data;
      },
      () => {
        const mockSnowflake = generateMockSnowflake();
        const dispatchId = 'dsp_mp_' + Math.random().toString(36).substring(2, 10);
        return {
          dispatchId,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
          discordMessageId: mockSnowflake,
          latencyMs: 54,
        };
      },
      'Multipart attachment payload dispatched via offline local simulation.'
    );
  },

  async scheduleEmbedDispatch(payload: DispatchEmbedPayload, token?: string): Promise<ApiResponseEnvelope<DispatchResponseData>> {
    let effectiveToken = token || getStoredAccessToken();
    const scheduleTimestamp = payload.scheduledFor || payload.scheduledTime;
    const normalizedPayload = {
      ...payload,
      dispatchType: payload.dispatchType || 'SCHEDULED_BOT',
      ...(scheduleTimestamp ? { scheduledFor: scheduleTimestamp, scheduledTime: scheduleTimestamp } : {}),
    };
    return requestWithFallback(
      async () => {
        let response = await fetch(`${API_BASE}/api/v1/embeds/dispatch/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(normalizedPayload),
        });

        if (response.status === 401) {
          try {
            const refreshRes = await this.refreshToken();
            if (refreshRes.success && refreshRes.data?.accessToken) {
              effectiveToken = refreshRes.data.accessToken;
              if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', effectiveToken);
                localStorage.setItem('token', effectiveToken);
              }
              response = await fetch(`${API_BASE}/api/v1/embeds/dispatch/schedule`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${effectiveToken}`,
                },
                credentials: 'include',
                body: JSON.stringify(normalizedPayload),
              });
            }
          } catch (refreshErr) {
            console.warn('Token refresh retry failed:', refreshErr);
          }
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new ApiHttpError(data.message || `Schedule request failed with status ${response.status}`, response.status, data);
        }
        return data;
      },
      () => {
        const dispatchId = 'dsp_sch_' + Math.random().toString(36).substring(2, 10);
        const logEntry: DispatchLogData = {
          id: 'log_' + Math.random().toString(36).substring(2, 10),
          dispatchId,
          type: 'SCHEDULED_BOT',
          status: 'SCHEDULED',
          serverId: payload.serverId,
          channelId: payload.channelId || 'scheduled_channel',
          operatorId: 1,
          operatorUsername: 'operator@rng.com',
          latencyMs: 12,
          timestamp: new Date().toISOString(),
        };
        const logs = getLocalStored<DispatchLogData[]>('rng_dispatch_logs', []);
        setLocalStored('rng_dispatch_logs', [logEntry, ...logs]);
        return {
          dispatchId,
          status: 'SCHEDULED',
          timestamp: new Date().toISOString(),
          channelId: payload.channelId,
          isScheduled: true,
          latencyMs: 12,
        };
      },
      'Message dispatch scheduled successfully in offline simulation queue.'
    );
  },

  async cancelScheduledEmbedDispatch(dispatchId: string, token?: string): Promise<ApiResponseEnvelope<boolean>> {
    const effectiveToken = token || getStoredAccessToken();
    return requestWithFallback(
      async () => {
        const response = await fetch(`${API_BASE}/api/v1/embeds/dispatch/schedule/${dispatchId}`, {
          method: 'DELETE',
          headers: {
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Cancel scheduled dispatch failed');
        return data;
      },
      () => {
        const logs = getLocalStored<DispatchLogData[]>('rng_dispatch_logs', []);
        setLocalStored(
          'rng_dispatch_logs',
          logs.map((l) => (l.dispatchId === dispatchId ? { ...l, status: 'CANCELLED' } : l))
        );
        return true;
      },
      'Scheduled task cancelled in offline simulation storage.'
    );
  },

  async testDryRun(payload: DryRunPayload, token?: string): Promise<ApiResponseEnvelope<DryRunValidationReportData>> {
    const effectiveToken = token || getStoredAccessToken();
    return requestWithFallback(
      async () => {
        const response = await fetch(`${API_BASE}/api/v1/embeds/dispatch/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Dry run test failed');
        return data;
      },
      () => ({
        valid: true,
        errors: [],
        warnings: [],
        containerCount: 1,
        totalComponentCount: 3,
        totalActionRows: 1,
        cumulativeCharCount: 180,
        actionRowCount: 1,
        characterCount: 180,
        permissions: {
          viewChannel: true,
          sendMessages: true,
          embedLinks: true,
          attachFiles: true,
        },
        resolvedBotPermissions: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'],
      }),
      'Pre-flight simulation validation report generated.'
    );
  },

  async fetchDispatchLogs(
    params?: { serverId?: string; status?: string; page?: number; size?: number },
    token?: string
  ): Promise<ApiResponseEnvelope<PageData<DispatchLogData>>> {
    const effectiveToken = token || getStoredAccessToken();
    const query = new URLSearchParams();
    if (params?.serverId) query.set('serverId', params.serverId);
    if (params?.status) query.set('status', params.status);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));

    return requestWithFallback(
      async () => {
        const response = await fetch(`${API_BASE}/api/v1/embeds/logs?${query.toString()}`, {
          method: 'GET',
          headers: {
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch logs');
        return data;
      },
      () => {
        const stored = getLocalStored<DispatchLogData[]>('rng_dispatch_logs', []);
        return {
          content: stored,
          totalElements: stored.length,
          totalPages: Math.ceil(stored.length / (params?.size || 20)) || 1,
          size: params?.size || 20,
          number: params?.page || 0,
          first: true,
          last: true,
          empty: stored.length === 0,
        };
      }
    );
  },

  async fetchDispatchChannels(serverId: string, token?: string): Promise<ApiResponseEnvelope<ChannelItem[]>> {
    let effectiveToken = token || getStoredAccessToken();
    return requestWithFallback(
      async () => {
        let response = await fetch(`${API_BASE}/api/v1/embeds/channels?serverId=${encodeURIComponent(serverId)}`, {
          method: 'GET',
          headers: {
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
        });

        if (response.status === 401) {
          try {
            const refreshRes = await this.refreshToken();
            if (refreshRes.success && refreshRes.data?.accessToken) {
              effectiveToken = refreshRes.data.accessToken;
              if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', effectiveToken);
                localStorage.setItem('token', effectiveToken);
              }
              response = await fetch(`${API_BASE}/api/v1/embeds/channels?serverId=${encodeURIComponent(serverId)}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${effectiveToken}`,
                },
                credentials: 'include',
              });
            }
          } catch (e) {
            console.warn('Token refresh retry failed:', e);
          }
        }

        if (response.ok) {
          const data = await response.json();
          if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            return data;
          }
        }

        // Secondary fallback to server channels endpoint
        const serverChRes = await fetch(`${API_BASE}/api/v1/servers/${encodeURIComponent(serverId)}/channels`, {
          method: 'GET',
          headers: {
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
        });

        if (serverChRes.ok) {
          return await serverChRes.json();
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Failed to fetch dispatch channels');
        return data;
      },
      () => [
        { id: '1395381163585175724', name: 'announcements', type: 0, position: 0, parentId: null },
        { id: '1395381163585175725', name: 'general-chat', type: 0, position: 1, parentId: null },
        { id: '1395381163585175726', name: 'dev-logs', type: 0, position: 2, parentId: null },
      ]
    );
  },

  // ---------------------------------------------------------------------------
  // Embed Template CRUD APIs
  // ---------------------------------------------------------------------------
  async fetchEmbedTemplates(
    params?: { serverId?: string; category?: string; tag?: string; page?: number; size?: number },
    token?: string
  ): Promise<ApiResponseEnvelope<PageData<TemplateData>>> {
    const effectiveToken = token || getStoredAccessToken();
    const query = new URLSearchParams();
    if (params?.serverId) query.set('serverId', params.serverId);
    if (params?.category) query.set('category', params.category);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));

    return requestWithFallback(
      async () => {
        const response = await fetch(`${API_BASE}/api/v1/embeds/templates?${query.toString()}`, {
          method: 'GET',
          headers: {
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch templates');
        return data;
      },
      () => {
        const stored = getLocalStored<TemplateData[]>('rng_embed_templates', []);
        return {
          content: stored,
          totalElements: stored.length,
          totalPages: Math.ceil(stored.length / (params?.size || 20)) || 1,
          size: params?.size || 20,
          number: params?.page || 0,
          first: true,
          last: true,
          empty: stored.length === 0,
        };
      }
    );
  },

  async fetchEmbedTemplateById(id: string, token?: string): Promise<ApiResponseEnvelope<TemplateData>> {
    const effectiveToken = token || getStoredAccessToken();
    return requestWithFallback(
      async () => {
        const response = await fetch(`${API_BASE}/api/v1/embeds/templates/${id}`, {
          method: 'GET',
          headers: {
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Template not found');
        return data;
      },
      () => {
        const stored = getLocalStored<TemplateData[]>('rng_embed_templates', []);
        const found = stored.find((t) => t.id === id);
        if (!found) throw new Error(`Template with id ${id} not found in offline store`);
        return found;
      }
    );
  },

  async createEmbedTemplate(payload: CreateTemplatePayload, token?: string): Promise<ApiResponseEnvelope<TemplateData>> {
    const effectiveToken = token || getStoredAccessToken();
    const targetPayload = payload.payload || payload.payloadJson || {};
    const isPublicVal = payload.isPublic ?? payload.publicTemplate ?? false;
    const normalizedBody = {
      ...payload,
      payload: targetPayload,
      payloadJson: targetPayload,
      isPublic: isPublicVal,
      publicTemplate: isPublicVal,
    };
    return requestWithFallback(
      async () => {
        const response = await fetch(`${API_BASE}/api/v1/embeds/templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(normalizedBody),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create template');
        return data;
      },
      () => {
        const created: TemplateData = {
          id: 'tmpl_' + Math.random().toString(36).substring(2, 10),
          name: payload.name,
          description: payload.description,
          serverId: payload.serverId,
          authorId: 1,
          authorUsername: 'operator@rng.com',
          tags: payload.tags || [],
          category: payload.category || 'GENERAL',
          public: isPublicVal,
          active: true,
          version: 1,
          payloadJson: targetPayload,
          components: payload.components || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const stored = getLocalStored<TemplateData[]>('rng_embed_templates', []);
        setLocalStored('rng_embed_templates', [created, ...stored]);
        return created;
      },
      'Template created successfully in local simulation storage.'
    );
  },

  async updateEmbedTemplate(id: string, payload: UpdateTemplatePayload, token?: string): Promise<ApiResponseEnvelope<TemplateData>> {
    const effectiveToken = token || getStoredAccessToken();
    const targetPayload = payload.payload || payload.payloadJson;
    const isPublicVal = payload.isPublic ?? payload.publicTemplate;
    const normalizedBody = {
      ...payload,
      ...(targetPayload ? { payload: targetPayload, payloadJson: targetPayload } : {}),
      ...(isPublicVal !== undefined ? { isPublic: isPublicVal, publicTemplate: isPublicVal } : {}),
    };
    return requestWithFallback(
      async () => {
        const response = await fetch(`${API_BASE}/api/v1/embeds/templates/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(normalizedBody),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update template');
        return data;
      },
      () => {
        const stored = getLocalStored<TemplateData[]>('rng_embed_templates', []);
        const idx = stored.findIndex((t) => t.id === id);
        if (idx === -1) throw new Error(`Template ${id} not found`);
        const updated: TemplateData = {
          ...stored[idx],
          name: payload.name ?? stored[idx].name,
          description: payload.description ?? stored[idx].description,
          category: payload.category ?? stored[idx].category,
          tags: payload.tags ?? stored[idx].tags,
          public: isPublicVal ?? stored[idx].public,
          active: payload.active ?? stored[idx].active,
          payloadJson: targetPayload ?? stored[idx].payloadJson,
          components: payload.components ?? stored[idx].components,
          version: stored[idx].version + 1,
          updatedAt: new Date().toISOString(),
        };
        stored[idx] = updated;
        setLocalStored('rng_embed_templates', stored);
        return updated;
      },
      'Template updated successfully in local simulation storage.'
    );
  },

  async deleteEmbedTemplate(id: string, token?: string): Promise<ApiResponseEnvelope<boolean>> {
    const effectiveToken = token || getStoredAccessToken();
    return requestWithFallback(
      async () => {
        const response = await fetch(`${API_BASE}/api/v1/embeds/templates/${id}`, {
          method: 'DELETE',
          headers: {
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete template');
        return data;
      },
      () => {
        const stored = getLocalStored<TemplateData[]>('rng_embed_templates', []);
        setLocalStored('rng_embed_templates', stored.filter((t) => t.id !== id));
        return true;
      },
      'Template deleted from local simulation storage.'
    );
  },

  async exportEmbedTemplate(id: string, token?: string): Promise<ApiResponseEnvelope<Record<string, unknown>>> {
    const effectiveToken = token || getStoredAccessToken();
    return requestWithFallback(
      async () => {
        const response = await fetch(`${API_BASE}/api/v1/embeds/templates/${id}/export`, {
          method: 'GET',
          headers: {
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to export template');
        return data;
      },
      () => {
        const stored = getLocalStored<TemplateData[]>('rng_embed_templates', []);
        const found = stored.find((t) => t.id === id);
        if (!found) throw new Error(`Template ${id} not found`);
        return {
          schema: 'https://rng.gg/schemas/embed-v2.json',
          name: found.name,
          category: found.category,
          tags: found.tags,
          payloadJson: found.payloadJson,
        };
      }
    );
  },

  async importEmbedTemplate(templateJson: Record<string, unknown>, token?: string): Promise<ApiResponseEnvelope<TemplateData>> {
    const effectiveToken = token || getStoredAccessToken();
    return requestWithFallback(
      async () => {
        const response = await fetch(`${API_BASE}/api/v1/embeds/templates/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(templateJson),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to import template');
        return data;
      },
      () => {
        const created: TemplateData = {
          id: 'tmpl_imp_' + Math.random().toString(36).substring(2, 10),
          name: String(templateJson.name || 'Imported Template'),
          description: String(templateJson.description || 'Imported from JSON payload'),
          serverId: String(templateJson.serverId || 'local_server'),
          authorId: 1,
          authorUsername: 'operator@rng.com',
          tags: Array.isArray(templateJson.tags) ? (templateJson.tags as string[]) : [],
          category: String(templateJson.category || 'IMPORTED'),
          public: false,
          active: true,
          version: 1,
          payloadJson: (templateJson.payloadJson as Record<string, unknown>) || {},
          components: Array.isArray(templateJson.components) ? templateJson.components : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const stored = getLocalStored<TemplateData[]>('rng_embed_templates', []);
        setLocalStored('rng_embed_templates', [created, ...stored]);
        return created;
      },
      'Template imported successfully into local simulation storage.'
    );
  },

  // ---------------------------------------------------------------------------
  // Canonical Spec §5.9 Method Aliases
  // ---------------------------------------------------------------------------
  dispatchEmbed(payload: DispatchEmbedPayload, token?: string) {
    return this.dispatchEmbedJson(payload, token);
  },
  scheduleDispatch(payload: DispatchEmbedPayload, token?: string) {
    return this.scheduleEmbedDispatch(payload, token);
  },
  cancelScheduledDispatch(dispatchId: string, token?: string) {
    return this.cancelScheduledEmbedDispatch(dispatchId, token);
  },
  validateDryRun(payload: DryRunPayload, token?: string) {
    return this.testDryRun(payload, token);
  },
  fetchTemplates(params?: { serverId?: string; category?: string; tag?: string; page?: number; size?: number }, token?: string) {
    return this.fetchEmbedTemplates(params, token);
  },
  saveTemplate(payload: CreateTemplatePayload & { id?: string }, token?: string) {
    return payload.id ? this.updateEmbedTemplate(payload.id, payload, token) : this.createEmbedTemplate(payload, token);
  },
  deleteTemplate(id: string, token?: string) {
    return this.deleteEmbedTemplate(id, token);
  },
  fetchDispatchableChannels(serverId: string, token?: string) {
    return this.fetchDispatchChannels(serverId, token);
  },
};

// ---------------------------------------------------------------------------
// Offline Fallback Helpers (§8.3)
// ---------------------------------------------------------------------------
export function generateMockSnowflake(): string {
  const DISCORD_EPOCH = BigInt("1420070400000");
  const now = BigInt(Date.now());
  const timestamp = (now - DISCORD_EPOCH) << BigInt(22);
  const random = BigInt(Math.floor(Math.random() * 0x3fffff));
  return (timestamp | random).toString();
}

function getStoredAccessToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
}

function getLocalStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[LocalStorage] Failed to persist ${key}:`, e);
  }
}

export async function requestWithFallback<T>(
  requestFn: () => Promise<ApiResponseEnvelope<T>>,
  fallbackFn: () => T | Promise<T>,
  fallbackMessage: string = 'Operation executed via offline local simulation.'
): Promise<ApiResponseEnvelope<T>> {
  try {
    return await requestFn();
  } catch (error: unknown) {
    if (error instanceof ApiHttpError) {
      throw error;
    }
    console.warn('[OfflineFallback] Backend unavailable or failed, utilizing offline simulation:', error);
    const data = await fallbackFn();
    return {
      success: true,
      message: fallbackMessage,
      data,
    };
  }
}
