package com.rednecksgaming.security.jwt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class RedisTokenStore {

    private final Optional<StringRedisTemplate> redisTemplate;
    private final Set<String> fallbackRevokedJtis = ConcurrentHashMap.newKeySet();

    private static final String REVOKED_KEY_PREFIX = "token:jti:revoked:";

    public RedisTokenStore(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = Optional.ofNullable(redisTemplate);
    }

    public void revokeJti(String jti, long expirationMs) {
        if (jti == null || jti.isBlank()) {
            return;
        }

        if (redisTemplate.isPresent()) {
            try {
                redisTemplate.get().opsForValue().set(
                        REVOKED_KEY_PREFIX + jti,
                        "1",
                        Duration.ofMillis(Math.max(expirationMs, 1000L))
                );
                return;
            } catch (Exception e) {
                log.warn("Redis unavailable during JTI revocation, falling back to in-memory store: {}", e.getMessage());
            }
        }

        fallbackRevokedJtis.add(jti);
    }

    public boolean isJtiRevoked(String jti) {
        if (jti == null || jti.isBlank()) {
            return true;
        }

        if (redisTemplate.isPresent()) {
            try {
                return Boolean.TRUE.equals(redisTemplate.get().hasKey(REVOKED_KEY_PREFIX + jti));
            } catch (Exception e) {
                log.warn("Redis unavailable during JTI check, falling back to in-memory store: {}", e.getMessage());
            }
        }

        return fallbackRevokedJtis.contains(jti);
    }
}
