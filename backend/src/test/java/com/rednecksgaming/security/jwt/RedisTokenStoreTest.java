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
    @DisplayName("fallback to in-memory set when Redis is not configured")
    void fallbackToInMemory_whenNoRedis() {
        RedisTokenStore tokenStore = new RedisTokenStore(null);

        assertThat(tokenStore.isJtiRevoked("local-jti")).isFalse();
        tokenStore.revokeJti("local-jti", 60000L);
        assertThat(tokenStore.isJtiRevoked("local-jti")).isTrue();
    }
}
