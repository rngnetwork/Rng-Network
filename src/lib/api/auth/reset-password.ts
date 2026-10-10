import { httpClient, withTokenConfig } from '../core/client';
import type { ApiResponse } from '../core/types';
import type {
  ForgotPasswordInitiateResponse,
  ForgotPasswordVerifyResponse,
  ResetPasswordRequest,
} from '../../model/auth';

export async function requestPasswordReset(
  email: string
): Promise<ApiResponse<ForgotPasswordInitiateResponse>> {
  return httpClient.post<ForgotPasswordInitiateResponse>('/auth/forgot-password/initiate', {
    email,
  });
}

export async function initiateForgotPassword(
  email: string
): Promise<ApiResponse<ForgotPasswordInitiateResponse>> {
  return requestPasswordReset(email);
}

export async function verifyForgotPasswordDiscord(
  code: string,
  state: string
): Promise<ApiResponse<ForgotPasswordVerifyResponse>> {
  return httpClient.post<ForgotPasswordVerifyResponse>('/auth/forgot-password/verify-discord', {
    code,
    state,
  });
}

export async function confirmPasswordReset(
  req: ResetPasswordRequest
): Promise<ApiResponse<null>> {
  return httpClient.post<null>(
    '/auth/forgot-password/reset',
    { newPassword: req.newPassword },
    withTokenConfig(req.resetToken)
  );
}

export async function resetPassword(
  resetToken: string,
  newPassword: string
): Promise<ApiResponse<null>> {
  return confirmPasswordReset({ resetToken, newPassword });
}
