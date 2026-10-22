package com.rednecksgaming.server.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class RedisCacheConfigTest {

    @Mock
    private RedisConnectionFactory connectionFactory;

    @Test
    @DisplayName("redisCacheManager initializes RedisCacheManager with proper TTLs and cache configurations")
    void testRedisCacheManager() {
        RedisCacheConfig config = new RedisCacheConfig();
        RedisCacheManager cacheManager = config.redisCacheManager(connectionFactory);

        assertThat(cacheManager).isNotNull();
        assertThat(cacheManager.getCache("guilds:summary")).isNotNull();
        assertThat(cacheManager.getCache("guild:details")).isNotNull();
        assertThat(cacheManager.getCache("guild:channels")).isNotNull();
        assertThat(cacheManager.getCache("emojis:server")).isNotNull();
        assertThat(cacheManager.getCache("emojis:bot")).isNotNull();
    }

    @Test
    @DisplayName("fallbackCacheManager initializes ConcurrentMapCacheManager without null values")
    void testFallbackCacheManager() {
        RedisCacheConfig config = new RedisCacheConfig();
        CacheManager cacheManager = config.fallbackCacheManager();

        assertThat(cacheManager).isInstanceOf(ConcurrentMapCacheManager.class);
        ConcurrentMapCacheManager cm = (ConcurrentMapCacheManager) cacheManager;
        assertThat(cm.isAllowNullValues()).isFalse();
    }
}
