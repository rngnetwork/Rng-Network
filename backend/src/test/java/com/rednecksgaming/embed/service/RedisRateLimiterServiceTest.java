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
    @DisplayName("Allowed dispatch when Lua script returns 1")
    void checkRateLimits_allowed() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(), any(), any(), any()))
                .thenReturn(1L);

        rateLimiterService.checkRateLimits("server_1", "chan_1", "usr_1");

        verify(redisTemplate, times(3)).execute(any(RedisScript.class), anyList(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Throttles channel when Lua script returns 0")
    void checkRateLimits_channelThrottled() {
        when(redisTemplate.execute(any(RedisScript.class), eq(List.of("ratelimit:channel:chan_1")), any(), any(), any(), any()))
                .thenReturn(0L);

        assertThatThrownBy(() -> rateLimiterService.checkRateLimits("server_1", "chan_1", "usr_1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Channel rate limit exceeded");
    }

    @Test
    @DisplayName("Throttles user when Lua script returns 0")
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
    @DisplayName("Fallback allows request when Redis is null or throws exception")
    void checkRateLimits_fallbackOnRedisFailure() {
        RedisRateLimiterService fallbackService = new RedisRateLimiterService(null);
        fallbackService.checkRateLimits("server_1", "chan_1", "usr_1");

        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Redis connection refused"));
        rateLimiterService.checkRateLimits("server_1", "chan_1", "usr_1");
    }
}
