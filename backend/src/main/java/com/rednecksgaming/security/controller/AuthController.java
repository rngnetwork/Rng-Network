// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.security.controller;

import com.rednecksgaming.common.dto.ApiResponse;
import com.rednecksgaming.common.security.SecurityConstants;
import com.rednecksgaming.common.security.TokenService;
import com.rednecksgaming.identity.dto.*;
import com.rednecksgaming.identity.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Pre2FaResponse>> login(@Valid @RequestBody LoginRequest request) {
        Pre2FaResponse response = authService.authenticateEmailPassword(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Step 1 Authentication successful. Mandatory Discord 2FA required."));
    }

    @PostMapping("/discord/2fa")
    public ResponseEntity<ApiResponse<AuthResponse>> discord2Fa(
            @Valid @RequestBody Discord2FaRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        
        String bearerToken = httpRequest.getHeader(SecurityConstants.AUTHORIZATION_HEADER);
        String jwt = (StringUtils.hasText(bearerToken) && bearerToken.startsWith(SecurityConstants.TOKEN_TYPE_HEADER))
                ? bearerToken.substring(7) : null;

        Long userId = tokenService.getUserIdFromToken(jwt);
        String jti = tokenService.getJtiFromToken(jwt);

        AuthResponse response = authService.processDiscord2Fa(userId, jti, request.getCode(), request.getRedirectUri(), httpResponse);
        return ResponseEntity.ok(ApiResponse.success(response, "Discord 2FA verification successful. Access credentials issued."));
    }

    @PostMapping("/forgot-password/initiate")
    public ResponseEntity<ApiResponse<ForgotPasswordInitiateResponse>> initiateForgotPassword(
            @Valid @RequestBody ForgotPasswordInitiateRequest request) {
        ForgotPasswordInitiateResponse response = authService.initiateForgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Discord verification initiated."));
    }

    @PostMapping("/forgot-password/verify-discord")
    public ResponseEntity<ApiResponse<ForgotPasswordVerifyResponse>> verifyForgotPasswordDiscord(
            @Valid @RequestBody ForgotPasswordVerifyRequest request) {
        ForgotPasswordVerifyResponse response = authService.verifyForgotPasswordDiscord(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Discord identity verified successfully."));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            HttpServletRequest httpRequest,
            @Valid @RequestBody ResetPasswordRequest request) {
        String bearerToken = httpRequest.getHeader(SecurityConstants.AUTHORIZATION_HEADER);
        String jwt = (StringUtils.hasText(bearerToken) && bearerToken.startsWith(SecurityConstants.TOKEN_TYPE_HEADER))
                ? bearerToken.substring(7) : null;

        Long userId = tokenService.getUserIdFromToken(jwt);
        authService.resetPassword(userId, jwt, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password has been reset successfully. Please log in with your new password."));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@CookieValue(name = SecurityConstants.REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken) {
        AuthResponse response = authService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success(response, "Access token refreshed successfully."));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully."));
    }
}
