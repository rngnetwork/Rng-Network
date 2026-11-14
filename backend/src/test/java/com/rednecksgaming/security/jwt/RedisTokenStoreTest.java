// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.security.jwt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisTokenStoreTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Test
    @DisplayName("revokeJti stores key in Redis with duration")
    void revokeJti_storesInRedis() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        RedisTokenStore tokenStore = new RedisTokenStore(redisTemplate);

        tokenStore.revokeJti("test-jti-123", 60000L);

        verify(valueOperations).set(eq("token:jti:revoked:test-jti-123"), eq("1"), eq(Duration.ofMillis(60000L)));
    }

    @Test
    @DisplayName("isJtiRevoked checks Redis key existence")
    void isJtiRevoked_checksRedis() {
        when(redisTemplate.hasKey("token:jti:revoked:test-jti-123")).thenReturn(true);
        RedisTokenStore tokenStore = new RedisTokenStore(redisTemplate);

        assertThat(tokenStore.isJtiRevoked("test-jti-123")).isTrue();
        assertThat(tokenStore.isJtiRevoked(null)).isTrue();
        assertThat(tokenStore.isJtiRevoked("")).isTrue();
    }

    @Test
    @DisplayName("revokeJti handles null and blank jti safely")
    void revokeJti_nullOrBlank_returnsEarly() {
        RedisTokenStore tokenStore = new RedisTokenStore(redisTemplate);

        tokenStore.revokeJti(null, 60000L);
        tokenStore.revokeJti("", 60000L);
        tokenStore.revokeJti("   ", 60000L);

        verifyNoInteractions(redisTemplate);
    }

    @Test
    @DisplayName("revokeJti clamps expirationMs to at least 1000ms")
    void revokeJti_clampsSmallExpiration() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        RedisTokenStore tokenStore = new RedisTokenStore(redisTemplate);

        tokenStore.revokeJti("small-exp-jti", 100L);

        verify(valueOperations).set(eq("token:jti:revoked:small-exp-jti"), eq("1"), eq(Duration.ofMillis(1000L)));
    }

    @Test
    @DisplayName("revokeJti catches Redis exception and falls back to in-memory store")
    void revokeJti_whenRedisThrows_fallsBackToInMemory() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        doThrow(new RuntimeException("Redis connection refused"))
                .when(valueOperations).set(any(String.class), any(String.class), any(Duration.class));

        RedisTokenStore tokenStore = new RedisTokenStore(redisTemplate);
        tokenStore.revokeJti("fallback-jti-1", 60000L);

        // When checking, if redis also throws, in-memory store confirms revocation
        when(redisTemplate.hasKey("token:jti:revoked:fallback-jti-1"))
                .thenThrow(new RuntimeException("Redis still down"));

        assertThat(tokenStore.isJtiRevoked("fallback-jti-1")).isTrue();
    }

    @Test
    @DisplayName("isJtiRevoked returns false when redis hasKey returns false or null")
    void isJtiRevoked_whenRedisReturnsFalseOrNull() {
        RedisTokenStore tokenStore = new RedisTokenStore(redisTemplate);

        when(redisTemplate.hasKey("token:jti:revoked:not-revoked")).thenReturn(false);
        assertThat(tokenStore.isJtiRevoked("not-revoked")).isFalse();

        when(redisTemplate.hasKey("token:jti:revoked:null-key")).thenReturn(null);
        assertThat(tokenStore.isJtiRevoked("null-key")).isFalse();
    }

    @Test
    @DisplayName("fallback to in-memory set when Redis is not configured")
    void fallbackToInMemory_whenNoRedis() {
        RedisTokenStore tokenStore = new RedisTokenStore(null);

        assertThat(tokenStore.isJtiRevoked("local-jti")).isFalse();
        tokenStore.revokeJti("local-jti", 60000L);
        assertThat(tokenStore.isJtiRevoked("local-jti")).isTrue();
    }
}
