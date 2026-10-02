package com.rng.server;

import com.rng.identity.repository.UserRepository;
import com.rng.server.client.DiscordServerClient;
import com.rng.server.domain.Server;
import com.rng.server.dto.DiscordEmojiDto;
import com.rng.server.dto.discord.DiscordEmojiResponseDto;
import com.rng.server.repository.ServerRepository;
import com.rng.server.service.ServerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscordEmojiTest {

    @Mock
    private ServerRepository serverRepository;

    @Mock
    private DiscordServerClient discordClient;

    @Mock
    private UserRepository userRepository;

    private ServerService serverService;

    @BeforeEach
    void setUp() {
        serverService = new ServerService(serverRepository, discordClient, userRepository, null);
    }

    @Test
    @DisplayName("getServerEmojis falls back to Discord REST when JDA is not present")
    void testGetServerEmojisRestFallback() {
        String guildId = "123456789";
        Server server = Server.builder().id(guildId).slug("test-guild").name("Test Guild").build();
        when(serverRepository.findByIdOrSlug("test-guild")).thenReturn(Optional.of(server));

        DiscordEmojiResponseDto emojiResp = new DiscordEmojiResponseDto("987654321", "custom_fire", false, true, true);
        when(discordClient.getGuildEmojis(guildId)).thenReturn(List.of(emojiResp));

        List<DiscordEmojiDto> emojis = serverService.getServerEmojis("test-guild");
        assertThat(emojis).hasSize(1);
        assertThat(emojis.get(0).name()).isEqualTo("custom_fire");
        assertThat(emojis.get(0).url()).isEqualTo("https://cdn.discordapp.com/emojis/987654321.webp?size=64");
        assertThat(emojis.get(0).formatted()).isEqualTo("<:custom_fire:987654321>");
    }

    @Test
    @DisplayName("getBotEmojis resolves application emojis via REST")
    void testGetBotEmojisRest() {
        when(discordClient.getApplicationId()).thenReturn("app_111222");
        DiscordEmojiResponseDto appEmoji = new DiscordEmojiResponseDto("555666777", "bot_shield", true, true, true);
        when(discordClient.getApplicationEmojis("app_111222")).thenReturn(List.of(appEmoji));

        List<DiscordEmojiDto> emojis = serverService.getBotEmojis();
        assertThat(emojis).hasSize(1);
        assertThat(emojis.get(0).name()).isEqualTo("bot_shield");
        assertThat(emojis.get(0).animated()).isTrue();
        assertThat(emojis.get(0).url()).isEqualTo("https://cdn.discordapp.com/emojis/555666777.gif?size=64");
        assertThat(emojis.get(0).formatted()).isEqualTo("<a:bot_shield:555666777>");
    }
}
