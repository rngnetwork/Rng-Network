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

    private String cleanToken(String raw) {
        if (raw == null) return "";
        String t = raw.trim();
        if ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'"))) {
            t = t.substring(1, t.length() - 1).trim();
        }
        if (t.toLowerCase().startsWith("bot ")) {
            t = t.substring(4).trim();
        }
        return t;
    }

    @Bean
    public JDA jda(DiscordGatewayEventListener eventListener) {
        String token = cleanToken(botToken);
        if (token.isBlank() || "test-bot-token".equalsIgnoreCase(token) || "your-discord-bot-token".equalsIgnoreCase(token) || "discord-bot-token-placeholder".equalsIgnoreCase(token)) {
            log.warn("Discord bot token not configured or in test/placeholder mode (raw value='{}'). JDA Gateway will be disabled.", botToken);
            return null;
        }

        String preview = token.length() > 8 ? token.substring(0, 4) + "..." + token.substring(token.length() - 4) : "***";
        log.info("DISCORD_BOT_TOKEN detected (length={}, preview={}). Initializing JDA 5 Gateway connection...", token.length(), preview);

        try {
            this.jdaInstance = JDABuilder.createDefault(token)
                    .enableIntents(
                            GatewayIntent.GUILD_EXPRESSIONS
                    )
                    .setMemberCachePolicy(MemberCachePolicy.DEFAULT)
                    .setChunkingFilter(ChunkingFilter.NONE)
                    .disableCache(
                            CacheFlag.ACTIVITY,
                            CacheFlag.VOICE_STATE,
                            CacheFlag.CLIENT_STATUS,
                            CacheFlag.ONLINE_STATUS,
                            CacheFlag.SCHEDULED_EVENTS
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
