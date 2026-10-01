package com.rng.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.exception.ServiceUnavailableException;
import com.rng.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscordDispatchServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private RestClient restClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private DiscordDispatchServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new DiscordDispatchServiceImpl(restClient, objectMapper, redisTemplate, "Bot test-secret-token");
    }

    @Test
    @DisplayName("Blank bot token throws UnauthorizedException")
    void dispatchToChannel_blankTokenThrows() {
        DiscordDispatchServiceImpl invalidTokenService = new DiscordDispatchServiceImpl(
                restClient, objectMapper, redisTemplate, "   "
        );

        assertThatThrownBy(() -> invalidTokenService.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Discord Bot Token (DISCORD_BOT_TOKEN) is not configured");
    }

    @Test
    @DisplayName("Active Cloudflare 1015 Edge Ban circuit breaker blocks dispatch")
    void dispatchToChannel_edgeBanEngaged() {
        when(redisTemplate.hasKey("discord:circuit:edge_ban")).thenReturn(true);

        assertThatThrownBy(() -> service.dispatchToChannel("12345", Map.of(), null))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("Discord Gateway temporarily throttled under Cloudflare edge protection");
    }
}
