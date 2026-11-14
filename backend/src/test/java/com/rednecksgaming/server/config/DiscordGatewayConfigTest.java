// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.server.config;

import com.rednecksgaming.server.listener.DiscordGatewayEventListener;
import net.dv8tion.jda.api.JDA;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class DiscordGatewayConfigTest {

    @Mock
    private DiscordGatewayEventListener eventListener;

    @Test
    @DisplayName("jda returns null when botToken is blank, null, or placeholder")
    void testJdaDisabledConditions() {
        DiscordGatewayConfig config = new DiscordGatewayConfig();

        ReflectionTestUtils.setField(config, "botToken", null);
        assertThat(config.jda(eventListener)).isNull();

        ReflectionTestUtils.setField(config, "botToken", "   ");
        assertThat(config.jda(eventListener)).isNull();

        ReflectionTestUtils.setField(config, "botToken", "\"test-bot-token\"");
        assertThat(config.jda(eventListener)).isNull();

        ReflectionTestUtils.setField(config, "botToken", "'your-discord-bot-token'");
        assertThat(config.jda(eventListener)).isNull();

        ReflectionTestUtils.setField(config, "botToken", "discord-bot-token-placeholder");
        assertThat(config.jda(eventListener)).isNull();
    }

    @Test
    @DisplayName("jda handles short and long tokens, attempting JDABuilder initialization and catching errors")
    void testJdaAttemptInitialization() {
        DiscordGatewayConfig config = new DiscordGatewayConfig();

        // Short token <= 8 chars triggers preview = "***"
        ReflectionTestUtils.setField(config, "botToken", "Bot short");
        JDA resultShort = config.jda(eventListener);
        assertThat(resultShort).isNull();

        // Long token > 8 chars triggers preview substring
        ReflectionTestUtils.setField(config, "botToken", "\"Bot long-invalid-token-1234567890\"");
        JDA resultLong = config.jda(eventListener);
        assertThat(resultLong).isNull();
    }

    @Test
    @DisplayName("shutdown gracefully terminates JDA instance if present")
    void testShutdown() {
        DiscordGatewayConfig config = new DiscordGatewayConfig();

        // When jdaInstance is null, shutdown is a no-op
        config.shutdown();

        // When jdaInstance is non-null
        JDA mockJda = mock(JDA.class);
        ReflectionTestUtils.setField(config, "jdaInstance", mockJda);

        config.shutdown();
        verify(mockJda).shutdown();
    }
}
