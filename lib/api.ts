const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
  role: string;
  discordId?: string;
  discordUsername?: string;
  discordLinked: boolean;
}

export interface FullAuthData {
  accessToken: string;
  tokenType: string;
  user: UserProfileData;
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
  // Mock Fallbacks for Unbuilt APIs (Forgot Password & Registration Request)
  // ---------------------------------------------------------------------------
  async submitRegister(email: string, username: string, password?: string): Promise<{ success: boolean; message?: string }> {
    console.log('Mock Registration Request:', email, username, !!password);
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, message: 'Access request submitted for review.' };
  },

  async submitForgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    console.log('Mock Forgot Password:', email);
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, message: `Password reset instructions sent to ${email}.` };
  },
};
