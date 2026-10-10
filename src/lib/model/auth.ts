import type { UserProfileData } from './user';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface Pre2FaData {
  token: string;
  requiresDiscord2Fa: boolean;
  userEmail: string;
}

export type Pre2FaResponse = Pre2FaData;

export interface FullAuthData {
  accessToken: string;
  tokenType: string;
  user: UserProfileData;
}

export type AuthResponse = FullAuthData;

export interface ForgotPasswordInitiateResponse {
  discordAuthUrl: string;
}

export interface ForgotPasswordVerifyResponse {
  resetToken: string;
  email: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

export interface TwoFactorStatus {
  discordLinked: boolean;
  discordId?: string;
  discordUsername?: string;
  verifiedAt?: string;
}
