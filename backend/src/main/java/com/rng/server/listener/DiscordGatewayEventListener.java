package com.rng.server.listener;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.events.channel.ChannelCreateEvent;
import net.dv8tion.jda.api.events.channel.ChannelDeleteEvent;
import net.dv8tion.jda.api.events.channel.update.GenericChannelUpdateEvent;
import net.dv8tion.jda.api.events.guild.GuildLeaveEvent;
import net.dv8tion.jda.api.events.guild.GuildReadyEvent;
import net.dv8tion.jda.api.events.guild.update.GenericGuildUpdateEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
public class DiscordGatewayEventListener extends ListenerAdapter {

    private final Optional<CacheManager> cacheManager;

    public DiscordGatewayEventListener(@Autowired(required = false) CacheManager cacheManager) {
        this.cacheManager = Optional.ofNullable(cacheManager);
    }

    @Override
    @SuppressWarnings("rawtypes")
    public void onGenericGuildUpdate(@NotNull GenericGuildUpdateEvent event) {
        String guildId = event.getGuild().getId();
        log.info("Discord Gateway Event: Guild {} updated", guildId);
        evictGuildCaches(guildId);
    }

    @Override
    public void onGuildLeave(@NotNull GuildLeaveEvent event) {
        String guildId = event.getGuild().getId();
        log.info("Discord Gateway Event: Left guild {}", guildId);
        evictGuildCaches(guildId);
    }

    @Override
    public void onGuildReady(@NotNull GuildReadyEvent event) {
        String guildId = event.getGuild().getId();
        log.info("Discord Gateway Event: Guild {} ready with {} members", guildId, event.getGuild().getMemberCount());
        evictGuildCaches(guildId);
    }

    @Override
    public void onChannelCreate(@NotNull ChannelCreateEvent event) {
        if (event.isFromGuild()) {
            String guildId = event.getGuild().getId();
            log.debug("Discord Gateway Event: Channel created in guild {}", guildId);
            evictGuildChannelsCache(guildId);
        }
    }

    @Override
    public void onChannelDelete(@NotNull ChannelDeleteEvent event) {
        if (event.isFromGuild()) {
            String guildId = event.getGuild().getId();
            log.debug("Discord Gateway Event: Channel deleted in guild {}", guildId);
            evictGuildChannelsCache(guildId);
        }
    }

    @Override
    @SuppressWarnings("rawtypes")
    public void onGenericChannelUpdate(@NotNull GenericChannelUpdateEvent event) {
        if (event.isFromGuild()) {
            String guildId = event.getGuild().getId();
            log.debug("Discord Gateway Event: Channel updated in guild {}", guildId);
            evictGuildChannelsCache(guildId);
        }
    }

    public void evictGuildCaches(String guildId) {
        cacheManager.ifPresent(cm -> {
            Cache summaryCache = cm.getCache("guilds:summary");
            if (summaryCache != null) {
                summaryCache.clear();
            }
            Cache detailsCache = cm.getCache("guild:details");
            if (detailsCache != null && guildId != null) {
                detailsCache.evict(guildId);
            }
        });
    }

    public void evictGuildChannelsCache(String guildId) {
        cacheManager.ifPresent(cm -> {
            Cache channelsCache = cm.getCache("guild:channels");
            if (channelsCache != null && guildId != null) {
                channelsCache.evict(guildId);
            }
        });
    }
}
