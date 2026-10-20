package com.rednecksgaming.embed.service;

import com.rednecksgaming.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Sliding-window atomic rate limiter service enforcing channel, user, and server dispatch quotas
 * via Redis sorted sets and Lua scripts.
 */
@Slf4j
@Service
public class RedisRateLimiterService {

    private static final String CHANNEL_KEY_PREFIX = "ratelimit:channel:";
    private static final String USER_KEY_PREFIX = "ratelimit:user:";
    private static final String SERVER_KEY_PREFIX = "ratelimit:server:";

    private static final int CHANNEL_LIMIT = 5;
    private static final long CHANNEL_WINDOW_MS = 5000L;

    private static final int USER_LIMIT = 10;
    private static final long USER_WINDOW_MS = 60000L;

    private static final int SERVER_LIMIT = 30;
    private static final long SERVER_WINDOW_MS = 60000L;

    private static final String SLIDING_WINDOW_LUA =
            "local key = KEYS[1]\n" +
            "local now = tonumber(ARGV[1])\n" +
            "local window = tonumber(ARGV[2])\n" +
            "local limit = tonumber(ARGV[3])\n" +
            "local member = ARGV[4]\n" +
            "redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)\n" +
            "local current = redis.call('ZCARD', key)\n" +
            "if current < limit then\n" +
            "    redis.call('ZADD', key, now, member)\n" +
            "    redis.call('EXPIRE', key, math.ceil(window / 1000) + 10)\n" +
            "    return 1\n" +
            "else\n" +
            "    return 0\n" +
            "end";

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<Long> redisScript;

    public RedisRateLimiterService(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.redisScript = new DefaultRedisScript<>();
        this.redisScript.setScriptText(SLIDING_WINDOW_LUA);
        this.redisScript.setResultType(Long.class);
    }

    /**
     * Atomically check all applicable rate limits for channel, user, and server.
     * Throws BadRequestException if any quota is exceeded.
     */
    public void checkRateLimits(String serverId, String channelId, String userId) {
        if (channelId != null && !channelId.isBlank()) {
            boolean allowed = tryAcquire(CHANNEL_KEY_PREFIX + channelId, CHANNEL_LIMIT, CHANNEL_WINDOW_MS);
            if (!allowed) {
                throw new BadRequestException("Channel rate limit exceeded (maximum 5 messages per 5 seconds). Please try again shortly.");
            }
        }

        if (userId != null && !userId.isBlank()) {
            boolean allowed = tryAcquire(USER_KEY_PREFIX + userId, USER_LIMIT, USER_WINDOW_MS);
            if (!allowed) {
                throw new BadRequestException("User dispatch rate limit exceeded (maximum 10 messages per 60 seconds). Please slow down.");
            }
        }

        if (serverId != null && !serverId.isBlank()) {
            boolean allowed = tryAcquire(SERVER_KEY_PREFIX + serverId, SERVER_LIMIT, SERVER_WINDOW_MS);
            if (!allowed) {
                throw new BadRequestException("Server dispatch rate limit exceeded (maximum 30 messages per 60 seconds). Please try again shortly.");
            }
        }
    }

    /**
     * Executes atomic sliding window check using Redis Lua script.
     */
    public boolean tryAcquire(String key, int limit, long windowMs) {
        if (redisTemplate == null) {
            log.warn("Redis unavailable; rate limiting check skipped as fallback.");
            return true;
        }

        try {
            long now = System.currentTimeMillis();
            String member = now + ":" + UUID.randomUUID().toString().substring(0, 8);
            Long result = redisTemplate.execute(
                    redisScript,
                    List.of(key),
                    String.valueOf(now),
                    String.valueOf(windowMs),
                    String.valueOf(limit),
                    member
            );
            return result != null && result == 1L;
        } catch (Exception e) {
            log.warn("Rate limiter failed to connect to Redis. Allowing request as fallback: {}", e.getMessage());
            return true;
        }
    }

    public void reset(String key) {
        if (redisTemplate != null) {
            try {
                redisTemplate.delete(key);
            } catch (Exception ignored) {
            }
        }
    }
}
