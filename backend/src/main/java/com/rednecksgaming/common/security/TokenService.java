package com.rednecksgaming.common.security;

import java.util.Map;

public interface TokenService {

    String generatePre2FaToken(Long userId, String email);

    String generateAccessToken(Long userId, String email, String role);

    String generateRefreshToken(Long userId);

    String generateResetRequestToken(Long userId, String email);

    String generateResetPasswordToken(Long userId, String email);

    boolean validateToken(String token);

    void revokeJti(String jti);

    Long getUserIdFromToken(String token);

    String getScopeFromToken(String token);

    String getRoleFromToken(String token);

    String getJtiFromToken(String token);

    String getEmailFromToken(String token);
}
