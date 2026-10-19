package com.rng.server;

import com.rng.server.listener.DiscordGatewayEventListener;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.events.channel.ChannelCreateEvent;
import net.dv8tion.jda.api.events.channel.ChannelDeleteEvent;
import net.dv8tion.jda.api.events.guild.GuildLeaveEvent;
import net.dv8tion.jda.api.events.guild.GuildReadyEvent;
import net.dv8tion.jda.api.events.guild.update.GenericGuildUpdateEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Optional;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscordGatewayEventListenerTest {

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache summaryCache;

    @Mock
    private Cache detailsCache;

    @Mock
    private Cache channelsCache;

    private DiscordGatewayEventListener listener;

    @BeforeEach
    void setUp() {
        lenient().when(cacheManager.getCache("guilds:summary")).thenReturn(summaryCache);
        lenient().when(cacheManager.getCache("guild:details")).thenReturn(detailsCache);
        lenient().when(cacheManager.getCache("guild:channels")).thenReturn(channelsCache);
        listener = new DiscordGatewayEventListener(cacheManager);
    }

    @Test
    @DisplayName("onGenericGuildUpdate evicts guilds:summary and guild:details caches")
    void onGenericGuildUpdate_evictsCaches() {
        Guild guild = mock(Guild.class);
        when(guild.getId()).thenReturn("123456");
        GenericGuildUpdateEvent<?> event = mock(GenericGuildUpdateEvent.class);
        when(event.getGuild()).thenReturn(guild);

        listener.onGenericGuildUpdate(event);

        verify(summaryCache).clear();
        verify(detailsCache).evict("123456");
    }

    @Test
    @DisplayName("onGuildLeave evicts caches")
    void onGuildLeave_evictsCaches() {
        Guild guild = mock(Guild.class);
        when(guild.getId()).thenReturn("123456");
        GuildLeaveEvent event = mock(GuildLeaveEvent.class);
        when(event.getGuild()).thenReturn(guild);

        listener.onGuildLeave(event);

        verify(summaryCache).clear();
        verify(detailsCache).evict("123456");
    }

    @Test
    @DisplayName("onChannelCreate evicts guild:channels cache")
    void onChannelCreate_evictsChannelCache() {
        Guild guild = mock(Guild.class);
        when(guild.getId()).thenReturn("123456");
        ChannelCreateEvent event = mock(ChannelCreateEvent.class);
        when(event.isFromGuild()).thenReturn(true);
        when(event.getGuild()).thenReturn(guild);

        listener.onChannelCreate(event);

        verify(channelsCache).evict("123456");
    }
}
