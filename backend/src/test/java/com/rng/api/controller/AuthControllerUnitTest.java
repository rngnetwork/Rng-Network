package com.rng.api.controller;

import com.rng.common.dto.ApiResponse;
import com.rng.common.security.SecurityConstants;
import com.rng.common.security.TokenService;
import com.rng.identity.dto.*;
import com.rng.identity.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerUnitTest {

    @Mock
    private AuthService authService;

    @Mock
    private TokenService tokenService;

    @Mock
    private HttpServletRequest httpRequest;

    @Mock
    private HttpServletResponse httpResponse;

    @InjectMocks
    private AuthController authController;

    @Test
    @DisplayName("login delegates to AuthService and returns 200 OK with Pre2FaResponse")
    void login_success() {
        LoginRequest request = new LoginRequest("user@rng.com", "Password123!");
        Pre2FaResponse pre2Fa = Pre2FaResponse.builder()
                .token("mock-pre2fa-jwt")
                .userEmail("user@rng.com")
                .discordLinked(true)
                .build();

        when(authService.authenticateEmailPassword(request)).thenReturn(pre2Fa);

        ResponseEntity<ApiResponse<Pre2FaResponse>> response = authController.login(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().getToken()).isEqualTo("mock-pre2fa-jwt");
    }

    @Test
    @DisplayName("discord2Fa extracts Bearer token, userId, jti, and delegates to AuthService")
    void discord2Fa_success() {
        Discord2FaRequest request = new Discord2FaRequest("oauth-code-123");
        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("access-token-jwt")
                .role("ROLE_HIGH_COMMAND")
                .build();

        when(httpRequest.getHeader(SecurityConstants.AUTHORIZATION_HEADER)).thenReturn("Bearer pre2fa-jwt");
        when(tokenService.getUserIdFromToken("pre2fa-jwt")).thenReturn(10L);
        when(tokenService.getJtiFromToken("pre2fa-jwt")).thenReturn("jti-uuid");
        when(authService.processDiscord2Fa(10L, "jti-uuid", "oauth-code-123", httpResponse)).thenReturn(authResponse);

        ResponseEntity<ApiResponse<AuthResponse>> response = authController.discord2Fa(request, httpRequest, httpResponse);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getAccessToken()).isEqualTo("access-token-jwt");
    }

    @Test
    @DisplayName("initiateForgotPassword delegates to AuthService")
    void initiateForgotPassword_success() {
        ForgotPasswordInitiateRequest request = new ForgotPasswordInitiateRequest("user@rng.com");
        ForgotPasswordInitiateResponse initResponse = ForgotPasswordInitiateResponse.builder()
                .discordAuthUrl("https://discord.com/oauth2/authorize?state=xyz")
                .build();

        when(authService.initiateForgotPassword(request)).thenReturn(initResponse);

        ResponseEntity<ApiResponse<ForgotPasswordInitiateResponse>> response = authController.initiateForgotPassword(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getDiscordAuthUrl()).contains("discord.com");
    }

    @Test
    @DisplayName("verifyForgotPasswordDiscord delegates to AuthService")
    void verifyForgotPasswordDiscord_success() {
        ForgotPasswordVerifyRequest request = new ForgotPasswordVerifyRequest("code", "state");
        ForgotPasswordVerifyResponse verifyResponse = ForgotPasswordVerifyResponse.builder()
                .resetToken("reset-token-xyz")
                .email("user@rng.com")
                .build();

        when(authService.verifyForgotPasswordDiscord(request)).thenReturn(verifyResponse);

        ResponseEntity<ApiResponse<ForgotPasswordVerifyResponse>> response = authController.verifyForgotPasswordDiscord(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getResetToken()).isEqualTo("reset-token-xyz");
    }

    @Test
    @DisplayName("resetPassword extracts Bearer token and delegates to AuthService")
    void resetPassword_success() {
        ResetPasswordRequest request = new ResetPasswordRequest("NewSecretPassword#2026!");
        when(httpRequest.getHeader(SecurityConstants.AUTHORIZATION_HEADER)).thenReturn("Bearer reset-jwt-token");
        when(tokenService.getUserIdFromToken("reset-jwt-token")).thenReturn(25L);

        ResponseEntity<ApiResponse<Void>> response = authController.resetPassword(httpRequest, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(authService).resetPassword(25L, "reset-jwt-token", request);
    }

    @Test
    @DisplayName("refresh delegates refresh token to AuthService")
    void refresh_success() {
        AuthResponse authResponse = AuthResponse.builder().accessToken("new-access-jwt").build();
        when(authService.refreshAccessToken("refresh-cookie-value")).thenReturn(authResponse);

        ResponseEntity<ApiResponse<AuthResponse>> response = authController.refresh("refresh-cookie-value");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getAccessToken()).isEqualTo("new-access-jwt");
    }

    @Test
    @DisplayName("logout clears refresh cookie and returns 200 OK")
    void logout_success() {
        ResponseEntity<ApiResponse<Void>> response = authController.logout(httpResponse);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(authService).logout(httpResponse);
    }
}
