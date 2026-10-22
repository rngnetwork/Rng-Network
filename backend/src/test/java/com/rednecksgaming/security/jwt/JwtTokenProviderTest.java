package com.rednecksgaming.security.jwt;

import com.rednecksgaming.common.security.SecurityConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtTokenProviderTest {

    private static final String SECRET = "veryLongSecretKeyForJwtSigningMustBeAtLeast32BytesForHmacSha256!";

    @Mock
    private RedisTokenStore redisTokenStore;

    private JwtTokenProvider tokenProviderWithRedis;
    private JwtTokenProvider tokenProviderStandalone;

    @BeforeEach
    void setUp() {
        tokenProviderWithRedis = new JwtTokenProvider(SECRET, redisTokenStore);
        tokenProviderStandalone = new JwtTokenProvider(SECRET);
    }

    @Test
    @DisplayName("generatePre2FaToken generates valid JWT with PRE_2FA scope and UUID jti")
    void generatePre2FaToken_createsValidToken() {
        String token = tokenProviderWithRedis.generatePre2FaToken(42L, "commander@rednecksgaming.com");

        assertThat(token).isNotBlank();
        assertThat(tokenProviderWithRedis.validateToken(token)).isTrue();
        assertThat(tokenProviderWithRedis.getUserIdFromToken(token)).isEqualTo(42L);
        assertThat(tokenProviderWithRedis.getEmailFromToken(token)).isEqualTo("commander@rednecksgaming.com");
        assertThat(tokenProviderWithRedis.getScopeFromToken(token)).isEqualTo(SecurityConstants.SCOPE_PRE_2FA);
        assertThat(tokenProviderWithRedis.getJtiFromToken(token)).isNotBlank();
    }

    @Test
    @DisplayName("generateAccessToken generates valid JWT with FULLY_AUTHENTICATED scope and role")
    void generateAccessToken_createsValidToken() {
        String token = tokenProviderWithRedis.generateAccessToken(42L, "commander@rednecksgaming.com", "ROLE_HIGH_COMMAND");

        assertThat(token).isNotBlank();
        assertThat(tokenProviderWithRedis.validateToken(token)).isTrue();
        assertThat(tokenProviderWithRedis.getUserIdFromToken(token)).isEqualTo(42L);
        assertThat(tokenProviderWithRedis.getEmailFromToken(token)).isEqualTo("commander@rednecksgaming.com");
        assertThat(tokenProviderWithRedis.getRoleFromToken(token)).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(tokenProviderWithRedis.getScopeFromToken(token)).isEqualTo(SecurityConstants.SCOPE_FULLY_AUTHENTICATED);
    }

    @Test
    @DisplayName("generateRefreshToken generates valid JWT with subject")
    void generateRefreshToken_createsValidToken() {
        String token = tokenProviderWithRedis.generateRefreshToken(99L);

        assertThat(token).isNotBlank();
        assertThat(tokenProviderWithRedis.validateToken(token)).isTrue();
        assertThat(tokenProviderWithRedis.getUserIdFromToken(token)).isEqualTo(99L);
    }

    @Test
    @DisplayName("generateResetRequestToken generates valid JWT with RESET_REQUEST scope")
    void generateResetRequestToken_createsValidToken() {
        String token = tokenProviderWithRedis.generateResetRequestToken(10L, "lost@rednecksgaming.com");

        assertThat(token).isNotBlank();
        assertThat(tokenProviderWithRedis.validateToken(token)).isTrue();
        assertThat(tokenProviderWithRedis.getUserIdFromToken(token)).isEqualTo(10L);
        assertThat(tokenProviderWithRedis.getEmailFromToken(token)).isEqualTo("lost@rednecksgaming.com");
        assertThat(tokenProviderWithRedis.getScopeFromToken(token)).isEqualTo(SecurityConstants.SCOPE_RESET_REQUEST);
        assertThat(tokenProviderWithRedis.getJtiFromToken(token)).isNotBlank();
    }

    @Test
    @DisplayName("generateResetPasswordToken generates valid JWT with RESET_PASSWORD scope")
    void generateResetPasswordToken_createsValidToken() {
        String token = tokenProviderWithRedis.generateResetPasswordToken(10L, "lost@rednecksgaming.com");

        assertThat(token).isNotBlank();
        assertThat(tokenProviderWithRedis.validateToken(token)).isTrue();
        assertThat(tokenProviderWithRedis.getUserIdFromToken(token)).isEqualTo(10L);
        assertThat(tokenProviderWithRedis.getEmailFromToken(token)).isEqualTo("lost@rednecksgaming.com");
        assertThat(tokenProviderWithRedis.getScopeFromToken(token)).isEqualTo(SecurityConstants.SCOPE_RESET_PASSWORD);
        assertThat(tokenProviderWithRedis.getJtiFromToken(token)).isNotBlank();
    }

    @Test
    @DisplayName("validateToken returns false for malformed or invalid tokens")
    void validateToken_invalidTokens_returnsFalse() {
        assertThat(tokenProviderWithRedis.validateToken("")).isFalse();
        assertThat(tokenProviderWithRedis.validateToken("not-a-valid-jwt")).isFalse();
        assertThat(tokenProviderWithRedis.validateToken("eyJhbGciOiJIUzI1NiJ9.invalid.signature")).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false when jti is revoked in local store")
    void validateToken_revokedInLocalStore_returnsFalse() {
        String token = tokenProviderStandalone.generatePre2FaToken(1L, "local@rednecksgaming.com");
        String jti = tokenProviderStandalone.getJtiFromToken(token);

        assertThat(tokenProviderStandalone.validateToken(token)).isTrue();

        tokenProviderStandalone.revokeJti(jti);

        assertThat(tokenProviderStandalone.validateToken(token)).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false when jti is revoked in Redis store")
    void validateToken_revokedInRedisStore_returnsFalse() {
        String token = tokenProviderWithRedis.generateResetPasswordToken(1L, "redis@rednecksgaming.com");
        String jti = tokenProviderWithRedis.getJtiFromToken(token);

        when(redisTokenStore.isJtiRevoked(jti)).thenReturn(true);

        assertThat(tokenProviderWithRedis.validateToken(token)).isFalse();
    }

    @Test
    @DisplayName("revokeJti delegates to redisTokenStore and handles null safely")
    void revokeJti_delegatesAndHandlesNull() {
        tokenProviderWithRedis.revokeJti(null);
        verifyNoInteractions(redisTokenStore);

        tokenProviderWithRedis.revokeJti("jti-uuid-777");
        verify(redisTokenStore).revokeJti(eq("jti-uuid-777"), eq(SecurityConstants.RESET_PASSWORD_TOKEN_EXPIRATION_MS));
    }
}
