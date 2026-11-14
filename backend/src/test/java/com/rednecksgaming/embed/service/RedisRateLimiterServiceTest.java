// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.service;

import com.rednecksgaming.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisRateLimiterServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    private RedisRateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        rateLimiterService = new RedisRateLimiterService(redisTemplate);
    }

    @Test
    @DisplayName("Allowed dispatch when Lua script returns 1 for channel, user, and server")
    void checkRateLimits_allowed() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(), any(), any(), any()))
                .thenReturn(1L);

        rateLimiterService.checkRateLimits("server_1", "chan_1", "usr_1");

        verify(redisTemplate, times(3)).execute(any(RedisScript.class), anyList(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Throttles channel when Lua script returns 0 for channel key")
    void checkRateLimits_channelThrottled() {
        when(redisTemplate.execute(any(RedisScript.class), eq(List.of("ratelimit:channel:chan_1")), any(), any(), any(), any()))
                .thenReturn(0L);

        assertThatThrownBy(() -> rateLimiterService.checkRateLimits("server_1", "chan_1", "usr_1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Channel rate limit exceeded");
    }

    @Test
    @DisplayName("Throttles user when Lua script returns 0 for user key")
    void checkRateLimits_userThrottled() {
        when(redisTemplate.execute(any(RedisScript.class), eq(List.of("ratelimit:channel:chan_1")), any(), any(), any(), any()))
                .thenReturn(1L);
        when(redisTemplate.execute(any(RedisScript.class), eq(List.of("ratelimit:user:usr_1")), any(), any(), any(), any()))
                .thenReturn(0L);

        assertThatThrownBy(() -> rateLimiterService.checkRateLimits("server_1", "chan_1", "usr_1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("User dispatch rate limit exceeded");
    }

    @Test
    @DisplayName("Throttles server when Lua script returns 0 for server key")
    void checkRateLimits_serverThrottled() {
        when(redisTemplate.execute(any(RedisScript.class), eq(List.of("ratelimit:channel:chan_1")), any(), any(), any(), any()))
                .thenReturn(1L);
        when(redisTemplate.execute(any(RedisScript.class), eq(List.of("ratelimit:user:usr_1")), any(), any(), any(), any()))
                .thenReturn(1L);
        when(redisTemplate.execute(any(RedisScript.class), eq(List.of("ratelimit:server:server_1")), any(), any(), any(), any()))
                .thenReturn(0L);

        assertThatThrownBy(() -> rateLimiterService.checkRateLimits("server_1", "chan_1", "usr_1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Server dispatch rate limit exceeded");
    }

    @Test
    @DisplayName("Null or blank keys are safely skipped during checkRateLimits")
    void checkRateLimits_nullOrBlankSkipped() {
        rateLimiterService.checkRateLimits(null, "", "   ");
        verifyNoInteractions(redisTemplate);
    }

    @Test
    @DisplayName("tryAcquire returns true fallback when redisTemplate is null")
    void tryAcquire_nullRedisTemplateReturnsTrue() {
        RedisRateLimiterService noRedisService = new RedisRateLimiterService(null);
        boolean acquired = noRedisService.tryAcquire("test_key", 5, 5000L);
        assertThat(acquired).isTrue();
    }

    @Test
    @DisplayName("tryAcquire returns false when script returns null or 0")
    void tryAcquire_falseWhenNullOrZero() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(), any(), any(), any()))
                .thenReturn(null)
                .thenReturn(0L);

        assertThat(rateLimiterService.tryAcquire("key1", 5, 5000L)).isFalse();
        assertThat(rateLimiterService.tryAcquire("key2", 5, 5000L)).isFalse();
    }

    @Test
    @DisplayName("Fallback allows request when Redis throws exception")
    void checkRateLimits_fallbackOnRedisFailure() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Redis connection refused"));

        boolean acquired = rateLimiterService.tryAcquire("test_key", 5, 5000L);
        assertThat(acquired).isTrue();

        rateLimiterService.checkRateLimits("server_1", "chan_1", "usr_1");
    }

    @Test
    @DisplayName("reset deletes key in Redis or handles null and exceptions gracefully")
    void reset_variations() {
        rateLimiterService.reset("ratelimit:user:123");
        verify(redisTemplate).delete("ratelimit:user:123");

        // Null redis no-op
        RedisRateLimiterService noRedis = new RedisRateLimiterService(null);
        noRedis.reset("any_key");

        // Exception caught and ignored
        doThrow(new RuntimeException("Redis timeout")).when(redisTemplate).delete("error_key");
        rateLimiterService.reset("error_key");
    }

    @Test
    @DisplayName("checkRateLimits and reset test null vs blank branches")
    void checkRateLimits_nullVsBlankBranches() {
        // null channelId, blank userId, non-blank serverId
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(), any(), any(), any()))
                .thenReturn(1L);

        rateLimiterService.checkRateLimits("srv1", null, "   ");
        verify(redisTemplate, times(1)).execute(any(RedisScript.class), anyList(), any(), any(), any(), any());

        // reset with null key
        rateLimiterService.reset(null);
    }
}
