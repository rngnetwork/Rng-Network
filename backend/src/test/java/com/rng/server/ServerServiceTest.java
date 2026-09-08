package com.rng.server;

import com.rng.common.exception.ResourceNotFoundException;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import com.rng.server.client.DiscordServerClient;
import com.rng.server.domain.Server;
import com.rng.server.dto.ServerDetailDto;
import com.rng.server.dto.ServerDto;
import com.rng.server.dto.UpdateServerSettingsRequest;
import com.rng.server.dto.discord.DiscordChannelDto;
import com.rng.server.dto.discord.DiscordGuildDetailDto;
import com.rng.server.dto.discord.DiscordGuildDto;
import com.rng.server.dto.discord.DiscordGuildPatchRequest;
import com.rng.server.repository.ServerRepository;
import com.rng.server.service.ServerService;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.OnlineStatus;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServerServiceTest {

    @Mock
    private ServerRepository serverRepository;

    @Mock
    private DiscordServerClient discordClient;

    @Mock
    private UserRepository userRepository;

    private ServerService serverService;

    private Server sampleServer;
    private DiscordGuildDetailDto sampleGuildDetail;

    @BeforeEach
    void setUp() {
        serverService = new ServerService(serverRepository, discordClient, userRepository, null);

        sampleServer = Server.builder()
                .id("100000000000000001")
                .slug("rednecks-gaming")
                .name("Rednecks Gaming")
                .iconHash("sample_icon_hash")
                .bannerHash("sample_banner_hash")
                .premiumTier(2)
                .premiumSubscriptionCount(14)
                .build();

        sampleGuildDetail = DiscordGuildDetailDto.builder()
                .id("100000000000000001")
                .name("Rednecks Gaming")
                .description("Main Community Operations Hub")
                .icon("sample_icon_hash")
                .banner("sample_banner_hash")
                .premiumTier(2)
                .premiumSubscriptionCount(14)
                .features(List.of("BANNER", "ANIMATED_ICON"))
                .systemChannelId("200000000000000001")
                .systemChannelFlags(0)
                .afkChannelId("200000000000000002")
                .afkTimeout(900)
                .defaultMessageNotifications(1)
                .vanityUrlCode(null)
                .build();
    }

    @Test
    @DisplayName("generateUniqueSlug should create kebab-case slug and append increment on conflict")
    void testSlugGenerationAndConflictResolution() {
        when(serverRepository.existsBySlug("rednecks-gaming")).thenReturn(false);

        String slug1 = serverService.generateUniqueSlug("Rednecks Gaming", "1001");
        assertThat(slug1).isEqualTo("rednecks-gaming");

        // When slug exists for different guild
        when(serverRepository.existsBySlug("rednecks-gaming")).thenReturn(true);
        when(serverRepository.findBySlug("rednecks-gaming"))
                .thenReturn(Optional.of(Server.builder().id("9999").slug("rednecks-gaming").build()));
        when(serverRepository.existsBySlug("rednecks-gaming-2")).thenReturn(false);

        String slug2 = serverService.generateUniqueSlug("Rednecks Gaming", "1002");
        assertThat(slug2).isEqualTo("rednecks-gaming-2");
    }

    @Test
    @DisplayName("getAllServers should discover guilds and persist new servers with permanent slugs")
    void testGetAllServersDiscovery() {
        DiscordGuildDto guildDto = DiscordGuildDto.builder()
                .id("100000000000000001")
                .name("Rednecks Gaming")
                .icon("icon1")
                .banner("banner1")
                .approximateMemberCount(4500)
                .approximatePresenceCount(1200)
                .build();

        when(discordClient.getBotGuilds()).thenReturn(List.of(guildDto));
        when(serverRepository.findById("100000000000000001")).thenReturn(Optional.of(sampleServer));

        List<ServerDto> servers = serverService.getAllServers();

        assertThat(servers).hasSize(1);
        ServerDto dto = servers.get(0);
        assertThat(dto.getId()).isEqualTo("100000000000000001");
        assertThat(dto.getSlug()).isEqualTo("rednecks-gaming");
        assertThat(dto.getName()).isEqualTo("Rednecks Gaming");
        assertThat(dto.getOnlineCount()).isEqualTo(1200);
        assertThat(dto.getTotalCount()).isEqualTo(4500);
    }

    @Test
    @DisplayName("getServerDetails should invert suppression flags correctly into positive booleans")
    void testSuppressionBitmaskInversion() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        // Flag with bit 0 (suppress welcome) and bit 2 (suppress tips) set
        int flags = (1 << 0) | (1 << 2);
        sampleGuildDetail.setSystemChannelFlags(flags);

        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(sampleGuildDetail);

        ServerDetailDto details = serverService.getServerDetails("rednecks-gaming");

        assertThat(details.getSendWelcome()).isFalse();
        assertThat(details.getSetupTips()).isFalse();
        assertThat(details.getBoostMessage()).isTrue();
        assertThat(details.getStickerPrompt()).isTrue();
    }

    @Test
    @DisplayName("validateBoostPerks should reject animated GIF banner when server is below Boost Level 3")
    void testBannerBoostGating() {
        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                .name("Rednecks Gaming")
                .banner("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
                .build();

        // Server is at Level 2 (has static BANNER, but lacks ANIMATED_BANNER)
        assertThatThrownBy(() -> serverService.validateBoostPerks(request, sampleGuildDetail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Animated GIF banners require Server Boost Level 3");
    }

    @Test
    @DisplayName("validateBoostPerks should reject static banner when server is at Boost Level 0")
    void testStaticBannerBelowLevel2() {
        sampleGuildDetail.setPremiumTier(0);
        sampleGuildDetail.setFeatures(List.of());

        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                .name("Rednecks Gaming")
                .banner("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
                .build();

        assertThatThrownBy(() -> serverService.validateBoostPerks(request, sampleGuildDetail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Server banners require Server Boost Level 2");
    }

    @Test
    @DisplayName("updateServerSettings should compute correct suppression flags and audit reason")
    void testUpdateServerSettingsSuccess() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        when(serverRepository.findByIdOrSlug("100000000000000001")).thenReturn(Optional.of(sampleServer));
        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(sampleGuildDetail);
        when(userRepository.findByEmail("admin@rng.com")).thenReturn(Optional.of(
                User.builder().email("admin@rng.com").fullName("Arzenic Operator").build()
        ));

        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                .name("Rednecks Gaming Updated")
                .description("New updated description")
                .sendWelcome(true)
                .boostMessage(false)
                .setupTips(false)
                .stickerPrompt(true)
                .afkChannelId("200000000000000002")
                .afkTimeout(900)
                .systemChannelId("200000000000000001")
                .defaultMessageNotifications(1)
                .build();

        serverService.updateServerSettings("rednecks-gaming", request, "admin@rng.com");

        ArgumentCaptor<DiscordGuildPatchRequest> patchCaptor = ArgumentCaptor.forClass(DiscordGuildPatchRequest.class);
        ArgumentCaptor<String> reasonCaptor = ArgumentCaptor.forClass(String.class);

        verify(discordClient).updateGuildSettings(eq(sampleServer.getId()), patchCaptor.capture(), reasonCaptor.capture());

        DiscordGuildPatchRequest capturedPatch = patchCaptor.getValue();
        assertThat(capturedPatch.getName()).isEqualTo("Rednecks Gaming Updated");
        assertThat(capturedPatch.getDescription()).isEqualTo("New updated description");
        // sendWelcome is true -> bit 0 is 0. boostMessage is false -> bit 1 is 1. setupTips is false -> bit 2 is 1. stickerPrompt is true -> bit 3 is 0.
        int expectedFlags = (1 << 1) | (1 << 2);
        assertThat(capturedPatch.getSystemChannelFlags()).isEqualTo(expectedFlags);

        assertThat(reasonCaptor.getValue()).isEqualTo("Updated via RNG Control Center by Arzenic Operator (admin@rng.com)");
        verify(serverRepository).save(any(Server.class));
    }

    @Test
    @DisplayName("getServerChannels should return mapped channel DTOs")
    void testGetServerChannels() {
        when(serverRepository.findByIdOrSlug("100000000000000001")).thenReturn(Optional.of(sampleServer));
        when(discordClient.getGuildChannels(sampleServer.getId())).thenReturn(List.of(
                DiscordChannelDto.builder().id("c1").name("general").type(0).position(1).build(),
                DiscordChannelDto.builder().id("c2").name("Voice Lounge").type(2).position(2).build()
        ));

        var channels = serverService.getServerChannels("100000000000000001");
        assertThat(channels).hasSize(2);
        assertThat(channels.get(0).getName()).isEqualTo("general");
        assertThat(channels.get(0).getType()).isEqualTo(0);
        assertThat(channels.get(1).getName()).isEqualTo("Voice Lounge");
        assertThat(channels.get(1).getType()).isEqualTo(2);
    }

    @Test
    @DisplayName("getAllServers with JDA connected should compute distinct onlineCount and totalCount")
    void testGetAllServersWithJdaPresences() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);

        Guild guild = mock(Guild.class);
        when(guild.getId()).thenReturn("100000000000000001");
        when(guild.getName()).thenReturn("Rednecks Gaming");
        when(guild.getMemberCount()).thenReturn(50);
        when(guild.getBoostTier()).thenReturn(net.dv8tion.jda.api.entities.Guild.BoostTier.TIER_2);
        when(guild.getBoostCount()).thenReturn(14);

        Member m1 = mock(Member.class);
        when(m1.getOnlineStatus()).thenReturn(OnlineStatus.ONLINE);
        Member m2 = mock(Member.class);
        when(m2.getOnlineStatus()).thenReturn(OnlineStatus.IDLE);
        Member m3 = mock(Member.class);
        when(m3.getOnlineStatus()).thenReturn(OnlineStatus.DO_NOT_DISTURB);
        Member m4 = mock(Member.class);
        when(m4.getOnlineStatus()).thenReturn(OnlineStatus.OFFLINE);

        when(guild.getMembers()).thenReturn(List.of(m1, m2, m3, m4));
        when(jda.getGuilds()).thenReturn(List.of(guild));

        when(serverRepository.findById("100000000000000001")).thenReturn(Optional.of(sampleServer));

        ServerService jdaServerService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<ServerDto> servers = jdaServerService.getAllServers();

        assertThat(servers).hasSize(1);
        ServerDto dto = servers.get(0);
        assertThat(dto.getOnlineCount()).isEqualTo(3);
        assertThat(dto.getTotalCount()).isEqualTo(50);
    }

    @Test
    @DisplayName("getServerDetails should use approximate counts directly from DiscordGuildDetailDto if present")
    void testGetServerDetailsWithCountsFromDetailDto() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        sampleGuildDetail.setApproximatePresenceCount(123);
        sampleGuildDetail.setApproximateMemberCount(456);
        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(sampleGuildDetail);

        ServerDetailDto details = serverService.getServerDetails("rednecks-gaming");

        assertThat(details.getOnlineCount()).isEqualTo(123);
        assertThat(details.getTotalCount()).isEqualTo(456);
        verify(discordClient, never()).getBotGuilds();
    }
}
