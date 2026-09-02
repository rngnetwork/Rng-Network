package com.rng.server.config;

import com.rng.server.listener.DiscordGatewayEventListener;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.requests.GatewayIntent;
import net.dv8tion.jda.api.utils.ChunkingFilter;
import net.dv8tion.jda.api.utils.MemberCachePolicy;
import net.dv8tion.jda.api.utils.cache.CacheFlag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Optional;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DiscordGatewayConfig {

    @Value("${app.discord.bot-token:}")
    private String botToken;

    private JDA jdaInstance;

    @Bean
    public JDA jda(DiscordGatewayEventListener eventListener) {
        if (botToken == null || botToken.isBlank() || "test-bot-token".equalsIgnoreCase(botToken.trim())) {
            log.warn("Discord bot token not configured or in test mode. JDA Gateway will be disabled.");
            return null;
        }

        try {
            log.info("Initializing JDA 5 Gateway connection...");
            this.jdaInstance = JDABuilder.createDefault(botToken.trim())
                    .enableIntents(
                            GatewayIntent.GUILD_MEMBERS,
                            GatewayIntent.GUILD_PRESENCES,
                            GatewayIntent.GUILD_EMOJIS_AND_STICKERS
                    )
                    .setMemberCachePolicy(MemberCachePolicy.ONLINE)
                    .setChunkingFilter(ChunkingFilter.NONE)
                    .disableCache(
                            CacheFlag.VOICE_STATE,
                            CacheFlag.CLIENT_STATUS,
                            CacheFlag.ACTIVITY
                    )
                    .addEventListeners(eventListener)
                    .build();

            log.info("JDA 5 Gateway initialization dispatched asynchronously.");
            return jdaInstance;
        } catch (Exception e) {
            log.error("Failed to initialize JDA 5 Gateway connection: {}", e.getMessage(), e);
            return null;
        }
    }

    @PreDestroy
    public void shutdown() {
        if (jdaInstance != null) {
            log.info("Gracefully shutting down JDA 5 Gateway connection...");
            jdaInstance.shutdown();
        }
    }
}
