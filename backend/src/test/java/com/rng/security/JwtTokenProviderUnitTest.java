package com.rng.security;

import com.rng.common.security.SecurityConstants;
import com.rng.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderUnitTest {

    private static final String TEST_SECRET = "superSecretKeyForUnitTestingMustBeLongerThan32BytesForHmacSha256!";
    private JwtTokenProvider tokenProvider;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(TEST_SECRET);
    }

    @Nested
    @DisplayName("Token Generation & Claims Extraction")
    class TokenGenerationAndClaims {

        @Test
        @DisplayName("generateAccessToken embeds correct subject, email, role, and SCOPE_FULLY_AUTHENTICATED")
        void generateAccessToken_embedsCorrectClaims() {
            String token = tokenProvider.generateAccessToken(123L, "commander@rng.com", "ROLE_HIGH_COMMAND");

            assertThat(tokenProvider.validateToken(token)).isTrue();
            assertThat(tokenProvider.getUserIdFromToken(token)).isEqualTo(123L);
            assertThat(tokenProvider.getEmailFromToken(token)).isEqualTo("commander@rng.com");
            assertThat(tokenProvider.getRoleFromToken(token)).isEqualTo("ROLE_HIGH_COMMAND");
            assertThat(tokenProvider.getScopeFromToken(token)).isEqualTo(SecurityConstants.SCOPE_FULLY_AUTHENTICATED);
        }

        @Test
        @DisplayName("generatePre2FaToken embeds SCOPE_PRE_2FA and unique JTI")
        void generatePre2FaToken_embedsPre2FaScopeAndJti() {
            String token = tokenProvider.generatePre2FaToken(456L, "cadet@rng.com");

            assertThat(tokenProvider.validateToken(token)).isTrue();
            assertThat(tokenProvider.getUserIdFromToken(token)).isEqualTo(456L);
            assertThat(tokenProvider.getEmailFromToken(token)).isEqualTo("cadet@rng.com");
            assertThat(tokenProvider.getScopeFromToken(token)).isEqualTo(SecurityConstants.SCOPE_PRE_2FA);
            assertThat(tokenProvider.getJtiFromToken(token)).isNotNull().isNotBlank();
        }

        @Test
        @DisplayName("generateRefreshToken embeds user subject and type=refresh")
        void generateRefreshToken_embedsUserSubject() {
            String token = tokenProvider.generateRefreshToken(789L);

            assertThat(tokenProvider.validateToken(token)).isTrue();
            assertThat(tokenProvider.getUserIdFromToken(token)).isEqualTo(789L);
        }

        @Test
        @DisplayName("generateResetRequestToken embeds SCOPE_RESET_REQUEST")
        void generateResetRequestToken_embedsResetRequestScope() {
            String token = tokenProvider.generateResetRequestToken(101L, "recovery@rng.com");

            assertThat(tokenProvider.validateToken(token)).isTrue();
            assertThat(tokenProvider.getUserIdFromToken(token)).isEqualTo(101L);
            assertThat(tokenProvider.getEmailFromToken(token)).isEqualTo("recovery@rng.com");
            assertThat(tokenProvider.getScopeFromToken(token)).isEqualTo(SecurityConstants.SCOPE_RESET_REQUEST);
            assertThat(tokenProvider.getJtiFromToken(token)).isNotNull().isNotBlank();
        }

        @Test
        @DisplayName("generateResetPasswordToken embeds SCOPE_RESET_PASSWORD")
        void generateResetPasswordToken_embedsResetPasswordScope() {
            String token = tokenProvider.generateResetPasswordToken(102L, "recovery@rng.com");

            assertThat(tokenProvider.validateToken(token)).isTrue();
            assertThat(tokenProvider.getUserIdFromToken(token)).isEqualTo(102L);
            assertThat(tokenProvider.getEmailFromToken(token)).isEqualTo("recovery@rng.com");
            assertThat(tokenProvider.getScopeFromToken(token)).isEqualTo(SecurityConstants.SCOPE_RESET_PASSWORD);
            assertThat(tokenProvider.getJtiFromToken(token)).isNotNull().isNotBlank();
        }
    }

    @Nested
    @DisplayName("Validation, Tampering & Invalidation")
    class ValidationAndTampering {

        @Test
        @DisplayName("validateToken rejects tampered JWT signature")
        void validateToken_tamperedSignature_returnsFalse() {
            String token = tokenProvider.generateAccessToken(1L, "test@rng.com", "ROLE_USER");
            String tampered = token.substring(0, token.length() - 5) + "abcde";

            assertThat(tokenProvider.validateToken(tampered)).isFalse();
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "   ", "not-a-jwt", "header.payload", "a.b.c.d"})
        @DisplayName("validateToken rejects malformed token strings")
        void validateToken_malformedStrings_returnsFalse(String malformed) {
            assertThat(tokenProvider.validateToken(malformed)).isFalse();
        }

        @Test
        @DisplayName("validateToken rejects null token")
        void validateToken_null_returnsFalse() {
            assertThat(tokenProvider.validateToken(null)).isFalse();
        }

        @Test
        @DisplayName("validateToken rejects token signed with different key")
        void validateToken_differentKey_returnsFalse() {
            JwtTokenProvider foreignProvider = new JwtTokenProvider("completelyDifferentKeyForForeignTokenProviderWith32Bytes!");
            String foreignToken = foreignProvider.generateAccessToken(1L, "foreign@rng.com", "ROLE_USER");

            assertThat(tokenProvider.validateToken(foreignToken)).isFalse();
        }
    }

    @Nested
    @DisplayName("Single-Use JTI Revocation & Thread Safety")
    class JtiRevocation {

        @Test
        @DisplayName("Revoking JTI causes validateToken to immediately return false")
        void revokeJti_revokesTokenImmediately() {
            String pre2FaToken = tokenProvider.generatePre2FaToken(1L, "user@rng.com");
            String jti = tokenProvider.getJtiFromToken(pre2FaToken);

            assertThat(tokenProvider.validateToken(pre2FaToken)).isTrue();

            tokenProvider.revokeJti(jti);

            assertThat(tokenProvider.validateToken(pre2FaToken)).isFalse();
        }

        @Test
        @DisplayName("Revoking one JTI does not affect other issued tokens")
        void revokeJti_isolatedToTargetJti() {
            String token1 = tokenProvider.generatePre2FaToken(1L, "user1@rng.com");
            String token2 = tokenProvider.generatePre2FaToken(2L, "user2@rng.com");

            String jti1 = tokenProvider.getJtiFromToken(token1);
            tokenProvider.revokeJti(jti1);

            assertThat(tokenProvider.validateToken(token1)).isFalse();
            assertThat(tokenProvider.validateToken(token2)).isTrue();
        }

        @Test
        @DisplayName("Concurrent multi-threaded JTI revocation operates safely without exceptions")
        void revokeJti_concurrentAccess_threadSafe() throws InterruptedException {
            int threadCount = 20;
            ExecutorService executor = Executors.newFixedThreadPool(threadCount);
            CountDownLatch latch = new CountDownLatch(threadCount);
            AtomicInteger validatedCount = new AtomicInteger(0);

            for (int i = 0; i < threadCount; i++) {
                final int idx = i;
                executor.submit(() -> {
                    try {
                        String token = tokenProvider.generatePre2FaToken((long) idx, "user" + idx + "@rng.com");
                        String jti = tokenProvider.getJtiFromToken(token);
                        tokenProvider.revokeJti(jti);
                        if (!tokenProvider.validateToken(token)) {
                            validatedCount.incrementAndGet();
                        }
                    } finally {
                        latch.countDown();
                    }
                });
            }

            assertThat(latch.await(5, TimeUnit.SECONDS)).isTrue();
            executor.shutdown();

            assertThat(validatedCount.get()).isEqualTo(threadCount);
        }

        @Test
        @DisplayName("Passing null or blank JTI to revokeJti does not throw exception")
        void revokeJti_nullOrBlank_safe() {
            tokenProvider.revokeJti(null);
            tokenProvider.revokeJti("");
            tokenProvider.revokeJti("   ");
        }
    }
}
