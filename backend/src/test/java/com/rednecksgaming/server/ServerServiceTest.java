package com.rednecksgaming.server;

import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.server.client.DiscordServerClient;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.dto.ServerDetailDto;
import com.rednecksgaming.server.dto.ServerDto;
import com.rednecksgaming.server.dto.ServerRoleDto;
import com.rednecksgaming.server.dto.UpdateServerSettingsRequest;
import com.rednecksgaming.server.dto.discord.DiscordChannelDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildDetailDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildPatchRequest;
import com.rednecksgaming.server.mapper.DiscordServerMapper;
import com.rednecksgaming.server.repository.ServerRepository;
import com.rednecksgaming.server.service.ServerService;
import com.rednecksgaming.server.dto.ChannelDto;
import com.rednecksgaming.server.dto.DiscordEmojiDto;
import com.rednecksgaming.server.dto.discord.DiscordEmojiResponseDto;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.OnlineStatus;
import net.dv8tion.jda.api.entities.ApplicationInfo;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.SelfUser;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.channel.middleman.GuildChannel;
import net.dv8tion.jda.api.entities.emoji.RichCustomEmoji;
import net.dv8tion.jda.api.requests.RestAction;
import net.dv8tion.jda.api.requests.restaction.CacheRestAction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.awt.Color;

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

    @Test
    @DisplayName("getServerRoles should return roles with bot assignability and filter out @everyone")
    void testGetServerRolesWithJdaConnected() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);

        Guild guild = mock(Guild.class);
        when(jda.getGuildById("100000000000000001")).thenReturn(guild);

        net.dv8tion.jda.api.entities.SelfMember botMember = mock(net.dv8tion.jda.api.entities.SelfMember.class);
        when(guild.getSelfMember()).thenReturn(botMember);

        Role publicRole = mock(Role.class);
        when(publicRole.isPublicRole()).thenReturn(true);

        Role highRole = mock(Role.class);
        when(highRole.isPublicRole()).thenReturn(false);
        when(highRole.getId()).thenReturn("role_high");
        when(highRole.getName()).thenReturn("Marshal");
        when(highRole.getPosition()).thenReturn(10);
        when(highRole.getColor()).thenReturn(Color.RED);
        when(highRole.isManaged()).thenReturn(false);
        when(botMember.canInteract(highRole)).thenReturn(false);

        Role memberRole = mock(Role.class);
        when(memberRole.isPublicRole()).thenReturn(false);
        when(memberRole.getId()).thenReturn("role_member");
        when(memberRole.getName()).thenReturn("Member");
        when(memberRole.getPosition()).thenReturn(5);
        when(memberRole.getColor()).thenReturn(null);
        when(memberRole.isManaged()).thenReturn(false);
        when(botMember.canInteract(memberRole)).thenReturn(true);

        when(guild.getRoles()).thenReturn(List.of(publicRole, memberRole, highRole));
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));

        ServerService jdaServerService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<ServerRoleDto> roles = jdaServerService.getServerRoles("rednecks-gaming");

        assertThat(roles).hasSize(2);
        // Sorted descending by position: highRole (10) then memberRole (5)
        assertThat(roles.get(0).getId()).isEqualTo("role_high");
        assertThat(roles.get(0).isAssignableByBot()).isFalse();
        assertThat(roles.get(0).getColorHex()).isEqualTo("#FF0000");

        assertThat(roles.get(1).getId()).isEqualTo("role_member");
        assertThat(roles.get(1).isAssignableByBot()).isTrue();
        assertThat(roles.get(1).getColorHex()).isNull();
    }

    @Test
    @DisplayName("getServerRoles should mark managed bot integration role as not assignable by bot")
    void testGetServerRolesManagedRoleNotAssignable() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);

        Guild guild = mock(Guild.class);
        when(jda.getGuildById("100000000000000001")).thenReturn(guild);

        net.dv8tion.jda.api.entities.SelfMember botMember = mock(net.dv8tion.jda.api.entities.SelfMember.class);
        when(guild.getSelfMember()).thenReturn(botMember);

        Role managedRole = mock(Role.class);
        when(managedRole.isPublicRole()).thenReturn(false);
        when(managedRole.getId()).thenReturn("role_managed");
        when(managedRole.getName()).thenReturn("Bot Integration");
        when(managedRole.getPosition()).thenReturn(8);
        when(managedRole.getColor()).thenReturn(null);
        when(managedRole.isManaged()).thenReturn(true);
        lenient().when(botMember.canInteract(managedRole)).thenReturn(true);

        when(guild.getRoles()).thenReturn(List.of(managedRole));
        when(serverRepository.findByIdOrSlug("100000000000000001")).thenReturn(Optional.of(sampleServer));

        ServerService jdaServerService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<ServerRoleDto> roles = jdaServerService.getServerRoles("100000000000000001");

        assertThat(roles).hasSize(1);
        assertThat(roles.get(0).isManaged()).isTrue();
        assertThat(roles.get(0).isAssignableByBot()).isFalse();
    }

    @Test
    @DisplayName("getServerRoles should throw ResourceNotFoundException when server does not exist")
    void testGetServerRolesNotFound() {
        when(serverRepository.findByIdOrSlug("non-existent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> serverService.getServerRoles("non-existent"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Server not found");
    }

    @Test
    @DisplayName("ServerService should support custom DiscordServerMapper injection via 5-arg constructor")
    void testConstructorWithCustomDiscordServerMapper() {
        DiscordServerMapper customMapper = new DiscordServerMapper();
        ServerService customService = new ServerService(serverRepository, discordClient, userRepository, null, customMapper);
        assertThat(customService).isNotNull();
    }

    @Test
    @DisplayName("getAllServers falls back to JDA when REST client throws exception")
    void testGetAllServersRestExceptionFallsBackToJda() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);

        Guild guild = mock(Guild.class);
        when(guild.getId()).thenReturn("100000000000000001");
        when(guild.getName()).thenReturn("Rednecks Gaming");
        when(guild.getMemberCount()).thenReturn(20);
        when(guild.getBoostTier()).thenReturn(Guild.BoostTier.TIER_1);
        when(guild.getBoostCount()).thenReturn(2);
        when(guild.getMembers()).thenReturn(List.of());

        when(jda.getGuilds()).thenReturn(List.of(guild));
        when(discordClient.getBotGuilds()).thenThrow(new RuntimeException("Discord REST down"));
        when(serverRepository.findById("100000000000000001")).thenReturn(Optional.of(sampleServer));

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<ServerDto> servers = jdaService.getAllServers();

        assertThat(servers).hasSize(1);
        assertThat(servers.get(0).getName()).isEqualTo("Rednecks Gaming");
    }

    @Test
    @DisplayName("getAllServers falls back to database records when REST returns empty and JDA is disconnected")
    void testGetAllServersEmptyRestAndJdaFallsBackToDatabase() {
        when(discordClient.getBotGuilds()).thenReturn(List.of());
        when(serverRepository.findAll()).thenReturn(List.of(sampleServer));

        List<ServerDto> servers = serverService.getAllServers();

        assertThat(servers).hasSize(1);
        assertThat(servers.get(0).getId()).isEqualTo(sampleServer.getId());
    }

    @Test
    @DisplayName("syncAndMapRestGuilds persists new servers and updates changed attributes")
    void testSyncAndMapRestGuildsPersistsAndUpdates() {
        DiscordGuildDto newGuild = DiscordGuildDto.builder()
                .id("200000000000000001")
                .name("New Outpost")
                .icon("icon_new")
                .banner("banner_new")
                .approximateMemberCount(100)
                .approximatePresenceCount(30)
                .build();

        DiscordGuildDto updatedGuild = DiscordGuildDto.builder()
                .id(sampleServer.getId())
                .name("Rednecks Gaming Updated")
                .icon("icon_updated")
                .banner("banner_updated")
                .build();

        when(discordClient.getBotGuilds()).thenReturn(List.of(newGuild, updatedGuild));
        when(serverRepository.findById("200000000000000001")).thenReturn(Optional.empty());
        when(serverRepository.existsBySlug("new-outpost")).thenReturn(false);
        when(serverRepository.save(any(Server.class))).thenAnswer(inv -> inv.getArgument(0));
        when(serverRepository.findById(sampleServer.getId())).thenReturn(Optional.of(sampleServer));

        List<ServerDto> result = serverService.getAllServers();

        assertThat(result).hasSize(2);
        verify(serverRepository, atLeast(2)).save(any(Server.class));
    }

    @Test
    @DisplayName("syncAndMapRestGuilds overrides server details with connected JDA guild data")
    void testSyncAndMapRestGuildsWithJdaConnected() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);

        Guild jdaGuild = mock(Guild.class);
        when(jda.getGuildById(sampleServer.getId())).thenReturn(jdaGuild);
        when(jdaGuild.getBoostTier()).thenReturn(Guild.BoostTier.TIER_3);
        when(jdaGuild.getBoostCount()).thenReturn(28);
        when(jdaGuild.getIconUrl()).thenReturn("https://cdn.discordapp.com/icons/sample/jda_icon.png");
        when(jdaGuild.getBannerUrl()).thenReturn("https://cdn.discordapp.com/banners/sample/jda_banner.png");
        when(jdaGuild.getName()).thenReturn("JDA Overridden Name");

        DiscordGuildDto restGuild = DiscordGuildDto.builder()
                .id(sampleServer.getId())
                .name(sampleServer.getName())
                .icon(sampleServer.getIconHash())
                .banner(sampleServer.getBannerHash())
                .build();

        when(discordClient.getBotGuilds()).thenReturn(List.of(restGuild));
        when(serverRepository.findById(sampleServer.getId())).thenReturn(Optional.of(sampleServer));

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<ServerDto> servers = jdaService.getAllServers();

        assertThat(servers).hasSize(1);
        assertThat(servers.get(0).getName()).isEqualTo("JDA Overridden Name");
        assertThat(servers.get(0).getBoostLevel()).isEqualTo(3);
        assertThat(servers.get(0).getBoostCount()).isEqualTo(28);
    }

    @Test
    @DisplayName("syncAndMapJdaGuilds handles new server persistence and presence mapping")
    void testSyncAndMapJdaGuildsBranches() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);

        Guild guild = mock(Guild.class);
        when(guild.getId()).thenReturn("300000000000000001");
        when(guild.getName()).thenReturn("JDA Pure Server");
        when(guild.getBoostTier()).thenReturn(Guild.BoostTier.TIER_1);
        when(guild.getBoostCount()).thenReturn(2);
        when(guild.getMemberCount()).thenReturn(0);


        when(jda.getGuilds()).thenReturn(List.of(guild));
        when(discordClient.getBotGuilds()).thenReturn(List.of(), List.of(
                DiscordGuildDto.builder()
                        .id("300000000000000001")
                        .approximatePresenceCount(15)
                        .approximateMemberCount(80)
                        .build()
        ));

        when(serverRepository.findById("300000000000000001")).thenReturn(Optional.empty());

        when(serverRepository.existsBySlug("jda-pure-server")).thenReturn(false);
        when(serverRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<ServerDto> servers = jdaService.getAllServers();

        assertThat(servers).hasSize(1);
        assertThat(servers.get(0).getOnlineCount()).isEqualTo(15);
        assertThat(servers.get(0).getTotalCount()).isEqualTo(80);
    }

    @Test
    @DisplayName("getServerDetails falls back to getBotGuilds when counts are absent from detail DTO")
    void testGetServerDetailsFallbackToBotGuildsCounts() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        sampleGuildDetail.setApproximatePresenceCount(null);
        sampleGuildDetail.setApproximateMemberCount(null);
        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(sampleGuildDetail);

        DiscordGuildDto countGuild = DiscordGuildDto.builder()
                .id(sampleServer.getId())
                .approximatePresenceCount(44)
                .approximateMemberCount(180)
                .build();
        when(discordClient.getBotGuilds()).thenReturn(List.of(countGuild));

        ServerDetailDto details = serverService.getServerDetails("rednecks-gaming");
        assertThat(details.getOnlineCount()).isEqualTo(44);
        assertThat(details.getTotalCount()).isEqualTo(180);

        // When getBotGuilds throws
        when(discordClient.getBotGuilds()).thenThrow(new RuntimeException("Bot guilds error"));
        ServerDetailDto detailsException = serverService.getServerDetails("rednecks-gaming");
        assertThat(detailsException.getOnlineCount()).isZero();
    }

    @Test
    @DisplayName("getServerDetails falls back to JDA when REST call fails")
    void testGetServerDetailsFallbackToJda() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);

        Guild jdaGuild = mock(Guild.class);
        when(jdaGuild.getName()).thenReturn("JDA Server");
        when(jdaGuild.getBoostTier()).thenReturn(Guild.BoostTier.TIER_2);
        when(jdaGuild.getBoostCount()).thenReturn(14);
        when(jdaGuild.getMemberCount()).thenReturn(350);
        when(jdaGuild.getMembers()).thenReturn(List.of());
        when(jda.getGuildById(sampleServer.getId())).thenReturn(jdaGuild);

        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        when(discordClient.getGuildDetails(sampleServer.getId())).thenThrow(new RuntimeException("REST unavailable"));

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        ServerDetailDto details = jdaService.getServerDetails("rednecks-gaming");

        assertThat(details).isNotNull();
        assertThat(details.getName()).isEqualTo("JDA Server");
        assertThat(details.getTotalCount()).isEqualTo(350);
    }

    @Test
    @DisplayName("getServerDetails throws ResourceNotFoundException when both REST and JDA fail")
    void testGetServerDetailsThrowsWhenBothUnavailable() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        when(discordClient.getGuildDetails(sampleServer.getId())).thenThrow(new RuntimeException("REST fail"));

        assertThatThrownBy(() -> serverService.getServerDetails("rednecks-gaming"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Discord guild details unavailable");
    }

    @Test
    @DisplayName("getServerChannels falls back to JDA Gateway when REST client fails")
    void testGetServerChannelsJdaFallback() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        when(discordClient.getGuildChannels(sampleServer.getId())).thenThrow(new RuntimeException("REST error"));

        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        Guild jdaGuild = mock(Guild.class);
        GuildChannel jdaChannel = mock(GuildChannel.class);
        when(jdaChannel.getId()).thenReturn("chan-1");
        when(jdaChannel.getName()).thenReturn("general");
        when(jdaChannel.getType()).thenReturn(net.dv8tion.jda.api.entities.channel.ChannelType.TEXT);
        when(jdaGuild.getChannels()).thenReturn(List.of(jdaChannel));
        when(jda.getGuildById(sampleServer.getId())).thenReturn(jdaGuild);

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<ChannelDto> channels = jdaService.getServerChannels("rednecks-gaming");

        assertThat(channels).hasSize(1);
        assertThat(channels.get(0).getName()).isEqualTo("general");
    }

    @Test
    @DisplayName("getServerChannels returns empty list when both REST and JDA return no channels")
    void testGetServerChannelsReturnsEmptyListWhenUnavailable() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        when(discordClient.getGuildChannels(sampleServer.getId())).thenReturn(List.of());

        List<ChannelDto> channels = serverService.getServerChannels("rednecks-gaming");
        assertThat(channels).isEmpty();
    }

    @Test
    @DisplayName("getServerRoles falls back to retrieveMember when getSelfMember throws, and handles retrieval failure")
    void testGetServerRolesRetrieveMemberFallback() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));

        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        Guild jdaGuild = mock(Guild.class);
        when(jda.getGuildById(sampleServer.getId())).thenReturn(jdaGuild);

        when(jdaGuild.getSelfMember()).thenThrow(new RuntimeException("getSelfMember failed"));
        SelfUser selfUser = mock(SelfUser.class);
        when(jda.getSelfUser()).thenReturn(selfUser);

        Member botMember = mock(Member.class);
        CacheRestAction<Member> restAction = mock(CacheRestAction.class);
        when(restAction.complete()).thenReturn(botMember);
        when(jdaGuild.retrieveMember(selfUser)).thenReturn(restAction);

        Role role = mock(Role.class);
        when(role.isPublicRole()).thenReturn(false);
        when(role.getId()).thenReturn("role-member");
        when(role.getName()).thenReturn("Member");
        when(role.getPosition()).thenReturn(1);
        when(role.isManaged()).thenReturn(false);
        when(botMember.canInteract(role)).thenReturn(true);

        when(jdaGuild.getRoles()).thenReturn(List.of(role));

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<ServerRoleDto> roles = jdaService.getServerRoles("rednecks-gaming");

        assertThat(roles).hasSize(1);
        assertThat(roles.get(0).isAssignableByBot()).isTrue();

        // Sub-case: when retrieveMember throws exception, resolvedBotMember is null -> assignableByBot is false
        when(restAction.complete()).thenThrow(new RuntimeException("retrieveMember failed"));
        List<ServerRoleDto> rolesFallbackFail = jdaService.getServerRoles("rednecks-gaming");
        assertThat(rolesFallbackFail).hasSize(1);
        assertThat(rolesFallbackFail.get(0).isAssignableByBot()).isFalse();
    }

    @Test
    @DisplayName("getServerRoles returns empty list when JDA is not connected")
    void testGetServerRolesWhenJdaUnavailable() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));

        List<ServerRoleDto> roles = serverService.getServerRoles("rednecks-gaming");
        assertThat(roles).isEmpty();
    }

    @Test
    @DisplayName("validateBoostPerks verifies boost requirements for animated icons and banners")
    void testValidateBoostPerksAllBranches() {
        DiscordGuildDetailDto lowTierGuild = DiscordGuildDetailDto.builder()
                .premiumTier(0)
                .features(List.of())
                .build();

        // 1. Animated icon fails on tier 0 without feature
        UpdateServerSettingsRequest reqAnimatedIcon = UpdateServerSettingsRequest.builder()
                .name("Server")
                .icon("data:image/gif;base64,xxxx")
                .build();
        assertThatThrownBy(() -> serverService.validateBoostPerks(reqAnimatedIcon, lowTierGuild))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Animated GIF icons require Server Boost Level 1");

        // 2. Animated icon passes with tier 1
        DiscordGuildDetailDto tier1Guild = DiscordGuildDetailDto.builder()
                .premiumTier(1)
                .features(List.of())
                .build();
        serverService.validateBoostPerks(reqAnimatedIcon, tier1Guild);

        // 3. Animated icon passes with ANIMATED_ICON feature on tier 0
        DiscordGuildDetailDto featureIconGuild = DiscordGuildDetailDto.builder()
                .premiumTier(0)
                .features(List.of("ANIMATED_ICON"))
                .build();
        serverService.validateBoostPerks(reqAnimatedIcon, featureIconGuild);

        // 4. Banner fails on tier 0/1 without feature
        UpdateServerSettingsRequest reqBanner = UpdateServerSettingsRequest.builder()
                .name("Server")
                .banner("data:image/png;base64,xxxx")
                .build();
        assertThatThrownBy(() -> serverService.validateBoostPerks(reqBanner, tier1Guild))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Server banners require Server Boost Level 2");

        // 5. Banner passes with tier 2
        DiscordGuildDetailDto tier2Guild = DiscordGuildDetailDto.builder()
                .premiumTier(2)
                .features(List.of())
                .build();
        serverService.validateBoostPerks(reqBanner, tier2Guild);

        // 6. Banner passes with BANNER feature on tier 0
        DiscordGuildDetailDto featureBannerGuild = DiscordGuildDetailDto.builder()
                .premiumTier(0)
                .features(List.of("BANNER"))
                .build();
        serverService.validateBoostPerks(reqBanner, featureBannerGuild);

        // 7. Animated banner fails on tier 2 without feature
        UpdateServerSettingsRequest reqAnimatedBanner = UpdateServerSettingsRequest.builder()
                .name("Server")
                .banner("data:image/gif;base64,xxxx")
                .build();
        assertThatThrownBy(() -> serverService.validateBoostPerks(reqAnimatedBanner, tier2Guild))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Animated GIF banners require Server Boost Level 3");

        // 8. Animated banner passes with tier 3
        DiscordGuildDetailDto tier3Guild = DiscordGuildDetailDto.builder()
                .premiumTier(3)
                .features(List.of())
                .build();
        serverService.validateBoostPerks(reqAnimatedBanner, tier3Guild);

        // 9. Animated banner passes with ANIMATED_BANNER feature
        DiscordGuildDetailDto featureAnimatedBannerGuild = DiscordGuildDetailDto.builder()
                .premiumTier(2)
                .features(List.of("BANNER", "ANIMATED_BANNER"))
                .build();
        serverService.validateBoostPerks(reqAnimatedBanner, featureAnimatedBannerGuild);

        // 10. Non-data URL or blank banner passes without error
        UpdateServerSettingsRequest reqNormalBanner = UpdateServerSettingsRequest.builder()
                .name("Server")
                .banner("https://example.com/banner.png")
                .build();
        serverService.validateBoostPerks(reqNormalBanner, lowTierGuild);
    }

    @Test
    @DisplayName("updateServerSettings constructs patch request, updates widget and audit reason")
    void testUpdateServerSettingsWidgetAndAuditEdges() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        when(serverRepository.findByIdOrSlug(sampleServer.getId())).thenReturn(Optional.of(sampleServer));

        DiscordGuildDetailDto liveDetails = DiscordGuildDetailDto.builder()
                .id(sampleServer.getId())
                .name(sampleServer.getName())
                .premiumTier(2)
                .features(List.of())
                .approximatePresenceCount(50)
                .approximateMemberCount(200)
                .build();
        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(liveDetails);

        User opUser = User.builder()
                .email("admin@rng.gg")
                .fullName("Commander Jane")
                .build();
        when(userRepository.findByEmail("admin@rng.gg")).thenReturn(Optional.of(opUser));

        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                .name("Updated Server Name  ")
                .description("New Description")
                .icon("data:image/png;base64,iconData")
                .banner("data:image/png;base64,bannerData")
                .afkChannelId("afk-123")
                .afkTimeout(300)
                .systemChannelId("sys-123")
                .defaultMessageNotifications(1)
                .sendWelcome(false)
                .boostMessage(true)
                .setupTips(false)
                .stickerPrompt(true)
                .widgetEnabled(true)
                .widgetChannelId("widget-chan")
                .build();

        serverService.updateServerSettings("rednecks-gaming", request, "admin@rng.gg");

        ArgumentCaptor<DiscordGuildPatchRequest> patchCaptor = ArgumentCaptor.forClass(DiscordGuildPatchRequest.class);
        ArgumentCaptor<String> auditCaptor = ArgumentCaptor.forClass(String.class);
        verify(discordClient).updateGuildSettings(eq(sampleServer.getId()), patchCaptor.capture(), auditCaptor.capture());

        DiscordGuildPatchRequest patch = patchCaptor.getValue();
        assertThat(patch.getName()).isEqualTo("Updated Server Name");
        assertThat(patch.getDescription()).isEqualTo("New Description");
        assertThat(patch.getIcon()).isEqualTo("data:image/png;base64,iconData");
        assertThat(patch.getBanner()).isEqualTo("data:image/png;base64,bannerData");
        // suppressionFlags: welcome false (bit 0=1), boost true (bit 1=0), setup false (bit 2=1), sticker true (bit 3=0) => 1 + 4 = 5
        assertThat(patch.getSystemChannelFlags()).isEqualTo(5);

        assertThat(auditCaptor.getValue()).contains("Commander Jane (admin@rng.gg)");
        verify(discordClient).updateGuildWidget(eq(sampleServer.getId()), eq(true), eq("widget-chan"), eq(auditCaptor.getValue()));
        verify(serverRepository).save(sampleServer);
        assertThat(sampleServer.getName()).isEqualTo("Updated Server Name");
    }

    @Test
    @DisplayName("updateServerSettings handles operator with null or blank full name")
    void testUpdateServerSettingsBlankFullNameAuditReason() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        when(serverRepository.findByIdOrSlug(sampleServer.getId())).thenReturn(Optional.of(sampleServer));

        DiscordGuildDetailDto liveDetails = DiscordGuildDetailDto.builder()
                .id(sampleServer.getId())
                .name(sampleServer.getName())
                .premiumTier(0)
                .approximatePresenceCount(10)
                .approximateMemberCount(50)
                .build();
        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(liveDetails);

        User opUser = User.builder().email("anon@rng.gg").fullName("  ").build();
        when(userRepository.findByEmail("anon@rng.gg")).thenReturn(Optional.of(opUser));

        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                .name("Server")
                .build();

        serverService.updateServerSettings("rednecks-gaming", request, "anon@rng.gg");

        ArgumentCaptor<String> auditCaptor = ArgumentCaptor.forClass(String.class);
        verify(discordClient).updateGuildSettings(eq(sampleServer.getId()), any(), auditCaptor.capture());
        assertThat(auditCaptor.getValue()).contains("anon@rng.gg (anon@rng.gg)");
    }

    @Test
    @DisplayName("updateServerSettings throws ResourceNotFoundException when liveDetails is null")
    void testUpdateServerSettingsThrowsWhenDetailsNull() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(null);

        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder().name("Server").build();
        assertThatThrownBy(() -> serverService.updateServerSettings("rednecks-gaming", request, "admin@rng.gg"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Discord guild details unavailable");
    }

    @Test
    @DisplayName("generateUniqueSlug generates base from name and handles collisions and blank names")
    void testGenerateUniqueSlugCollisions() {
        // 1. Blank name falls back to "server-" + guildId
        when(serverRepository.existsBySlug("server-12345")).thenReturn(false);
        String slugBlank = serverService.generateUniqueSlug("   ", "12345");
        assertThat(slugBlank).isEqualTo("server-12345");

        // 2. Collision with another server increments counter
        when(serverRepository.existsBySlug("my-server")).thenReturn(true);
        Server otherServer = Server.builder().id("99999").slug("my-server").build();
        when(serverRepository.findBySlug("my-server")).thenReturn(Optional.of(otherServer));
        when(serverRepository.existsBySlug("my-server-2")).thenReturn(false);

        String slug = serverService.generateUniqueSlug("My Server!", "12345");
        assertThat(slug).isEqualTo("my-server-2");

        // 3. Collision with SAME server retains candidate
        when(serverRepository.existsBySlug("existing-server")).thenReturn(true);
        Server sameServer = Server.builder().id("12345").slug("existing-server").build();
        when(serverRepository.findBySlug("existing-server")).thenReturn(Optional.of(sameServer));

        String slugSame = serverService.generateUniqueSlug("Existing Server", "12345");
        assertThat(slugSame).isEqualTo("existing-server");
    }

    @Test
    @DisplayName("resolveGuildId resolves via snowflake, repository, JDA, or REST bot guilds")
    void testResolveGuildIdBranches() {
        // 1. null or blank
        assertThat(serverService.resolveGuildId(null)).isNull();
        assertThat(serverService.resolveGuildId("  ")).isEqualTo("  ");

        // 2. Snowflake digits directly
        assertThat(serverService.resolveGuildId("123456789012345678")).isEqualTo("123456789012345678");

        // 3. Found in repository
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        assertThat(serverService.resolveGuildId("rednecks-gaming")).isEqualTo(sampleServer.getId());

        // 4. Not in repository, but in JDA
        when(serverRepository.findByIdOrSlug("jda-server")).thenReturn(Optional.empty());
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        Guild jdaGuild = mock(Guild.class);
        when(jdaGuild.getName()).thenReturn("JDA Server");
        when(jdaGuild.getId()).thenReturn("888888");
        when(jda.getGuilds()).thenReturn(List.of(jdaGuild));

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        assertThat(jdaService.resolveGuildId("jda-server")).isEqualTo("888888");

        // 5. Not in repo or JDA, but in REST bot guilds
        when(serverRepository.findByIdOrSlug("rest-server")).thenReturn(Optional.empty());
        DiscordGuildDto restGuild = DiscordGuildDto.builder()
                .id("777777")
                .name("Rest Server")
                .build();
        when(discordClient.getBotGuilds()).thenReturn(List.of(restGuild));
        assertThat(serverService.resolveGuildId("rest-server")).isEqualTo("777777");

        // 6. Not anywhere -> returns input idOrSlug
        when(serverRepository.findByIdOrSlug("unknown-server")).thenReturn(Optional.empty());
        when(discordClient.getBotGuilds()).thenReturn(List.of());
        assertThat(serverService.resolveGuildId("unknown-server")).isEqualTo("unknown-server");
    }

    @Test
    @DisplayName("getServerEmojis returns emojis from REST or falls back to JDA")
    void testGetServerEmojisRestAndJdaFallback() {
        // Invalid guild ID returns empty
        assertThat(serverService.getServerEmojis("non-snowflake")).isEmpty();

        // REST success
        DiscordEmojiResponseDto emojiResp = new DiscordEmojiResponseDto("emoji-1", "pepe", false, true, true);
        when(discordClient.getGuildEmojis(sampleServer.getId())).thenReturn(List.of(emojiResp));

        List<DiscordEmojiDto> emojis = serverService.getServerEmojis(sampleServer.getId());
        assertThat(emojis).hasSize(1);
        assertThat(emojis.get(0).name()).isEqualTo("pepe");

        // REST fails, fallback to JDA
        when(discordClient.getGuildEmojis(sampleServer.getId())).thenThrow(new RuntimeException("REST error"));
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        Guild jdaGuild = mock(Guild.class);
        RichCustomEmoji jdaEmoji = mock(RichCustomEmoji.class);
        when(jdaEmoji.getId()).thenReturn("emoji-2");
        when(jdaEmoji.getName()).thenReturn("pepe_animated");
        when(jdaEmoji.isAnimated()).thenReturn(true);
        when(jdaGuild.getEmojis()).thenReturn(List.of(jdaEmoji));
        when(jda.getGuildById(sampleServer.getId())).thenReturn(jdaGuild);

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<DiscordEmojiDto> jdaEmojis = jdaService.getServerEmojis(sampleServer.getId());
        assertThat(jdaEmojis).hasSize(1);
        assertThat(jdaEmojis.get(0).animated()).isTrue();
    }

    @Test
    @DisplayName("getBotEmojis resolves application ID from JDA or REST and fetches emojis")
    void testGetBotEmojisResolution() {
        // Priority 1: JDA application info
        JDA jda = mock(JDA.class);
        ApplicationInfo appInfo = mock(ApplicationInfo.class);
        when(appInfo.getId()).thenReturn("app-12345");
        RestAction<ApplicationInfo> restAction = mock(RestAction.class);
        when(restAction.complete()).thenReturn(appInfo);
        when(jda.retrieveApplicationInfo()).thenReturn(restAction);

        DiscordEmojiResponseDto botEmoji = new DiscordEmojiResponseDto("bot-emoji-1", "bot_fire", false, true, true);
        when(discordClient.getApplicationEmojis("app-12345")).thenReturn(List.of(botEmoji));

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<DiscordEmojiDto> emojis = jdaService.getBotEmojis();
        assertThat(emojis).hasSize(1);
        assertThat(emojis.get(0).name()).isEqualTo("bot_fire");

        // Priority 2: JDA throws, fallback to discordClient.getApplicationId()
        when(restAction.complete()).thenThrow(new RuntimeException("app info failed"));
        when(discordClient.getApplicationId()).thenReturn("app-67890");
        when(discordClient.getApplicationEmojis("app-67890")).thenReturn(List.of(botEmoji));

        List<DiscordEmojiDto> fallbackEmojis = jdaService.getBotEmojis();
        assertThat(fallbackEmojis).hasSize(1);

        // When discordClient throws in getApplicationEmojis, returns empty list
        when(discordClient.getApplicationEmojis("app-67890")).thenThrow(new RuntimeException("app emojis failed"));
        List<DiscordEmojiDto> emptyEmojis = jdaService.getBotEmojis();
        assertThat(emptyEmojis).isEmpty();

        // When appId is null, returns empty list
        when(discordClient.getApplicationId()).thenReturn(null);
        List<DiscordEmojiDto> nullAppEmojis = jdaService.getBotEmojis();
        assertThat(nullAppEmojis).isEmpty();
    }

    @Test
    @DisplayName("getServerDetails overrides boost level and count with connected JDA guild data")
    void testGetServerDetailsWithJdaConnectedOverridesBoost() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(sampleGuildDetail);

        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        Guild jdaGuild = mock(Guild.class);
        when(jdaGuild.getBoostTier()).thenReturn(Guild.BoostTier.TIER_3);
        when(jdaGuild.getBoostCount()).thenReturn(30);
        when(jda.getGuildById(sampleServer.getId())).thenReturn(jdaGuild);

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        ServerDetailDto details = jdaService.getServerDetails("rednecks-gaming");

        assertThat(details.getBoostLevel()).isEqualTo(3);
        assertThat(details.getBoostCount()).isEqualTo(30);
    }

    @Test
    @DisplayName("getServerDetails handles asymmetric presence counts and multi-guild search in bot guilds")
    void testGetServerDetailsAsymmetricCountsAndMultiGuildSearch() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        sampleGuildDetail.setApproximatePresenceCount(10);
        sampleGuildDetail.setApproximateMemberCount(null);
        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(sampleGuildDetail);

        DiscordGuildDto otherGuild = DiscordGuildDto.builder().id("other-id").build();
        DiscordGuildDto matchingGuild = DiscordGuildDto.builder()
                .id(sampleServer.getId())
                .approximatePresenceCount(null)
                .approximateMemberCount(null)
                .build();
        when(discordClient.getBotGuilds()).thenReturn(List.of(otherGuild, matchingGuild));

        ServerDetailDto details = serverService.getServerDetails("rednecks-gaming");
        assertThat(details.getOnlineCount()).isZero();
        assertThat(details.getTotalCount()).isZero();
    }

    @Test
    @DisplayName("updateServerSettings handles non-data URLs and null icon/banner payloads")
    void testUpdateServerSettingsNonDataUrlsAndNulls() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        when(serverRepository.findByIdOrSlug(sampleServer.getId())).thenReturn(Optional.of(sampleServer));
        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(sampleGuildDetail);

        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                .name("Clean Server")
                .icon("https://cdn.example.com/icon.png")
                .banner("https://cdn.example.com/banner.png")
                .sendWelcome(null)
                .boostMessage(null)
                .setupTips(null)
                .stickerPrompt(null)
                .build();

        // Testing with null operatorEmail
        serverService.updateServerSettings("rednecks-gaming", request, null);

        ArgumentCaptor<DiscordGuildPatchRequest> patchCaptor = ArgumentCaptor.forClass(DiscordGuildPatchRequest.class);
        verify(discordClient, atLeastOnce()).updateGuildSettings(eq(sampleServer.getId()), patchCaptor.capture(), any());
        DiscordGuildPatchRequest patch = patchCaptor.getValue();
        assertThat(patch.getIcon()).isNull();
        assertThat(patch.getBanner()).isNull();
        // When all booleans are null, !Boolean.TRUE.equals(null) is true for all 4 flags: (1|2|4|8) = 15
        assertThat(patch.getSystemChannelFlags()).isEqualTo(15);
    }

    @Test
    @DisplayName("validateBoostPerks handles null premium tier and null features gracefully")
    void testValidateBoostPerksNullTierAndNullFeatures() {
        DiscordGuildDetailDto nullTierDetails = DiscordGuildDetailDto.builder()
                .premiumTier(null)
                .features(null)
                .build();

        UpdateServerSettingsRequest reqNormal = UpdateServerSettingsRequest.builder()
                .name("Server")
                .banner("")
                .build();
        // Should not throw
        serverService.validateBoostPerks(reqNormal, nullTierDetails);
    }

    @Test
    @DisplayName("calculateOnlineCount filters various online statuses and handles member retrieval exceptions")
    void testCalculateOnlineCountFilteringAndException() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);

        Guild guild = mock(Guild.class);
        when(guild.getId()).thenReturn("400000000000000001");
        when(guild.getName()).thenReturn("Presence Test Guild");
        when(guild.getBoostTier()).thenReturn(Guild.BoostTier.NONE);
        when(guild.getBoostCount()).thenReturn(0);
        when(guild.getMemberCount()).thenReturn(10);

        Member mOnline = mock(Member.class);
        when(mOnline.getOnlineStatus()).thenReturn(OnlineStatus.ONLINE);
        Member mIdle = mock(Member.class);
        when(mIdle.getOnlineStatus()).thenReturn(OnlineStatus.IDLE);
        Member mDnd = mock(Member.class);
        when(mDnd.getOnlineStatus()).thenReturn(OnlineStatus.DO_NOT_DISTURB);
        Member mInvisible = mock(Member.class);
        when(mInvisible.getOnlineStatus()).thenReturn(OnlineStatus.INVISIBLE);

        // Include null member and various statuses
        java.util.List<Member> members = new java.util.ArrayList<>();
        members.add(null);
        members.add(mOnline);
        members.add(mIdle);
        members.add(mDnd);
        members.add(mInvisible);

        when(guild.getMembers()).thenReturn(members);
        when(jda.getGuilds()).thenReturn(List.of(guild));

        when(discordClient.getBotGuilds()).thenReturn(List.of(), List.of());
        when(serverRepository.findById("400000000000000001")).thenReturn(Optional.empty());
        when(serverRepository.existsBySlug("presence-test-guild")).thenReturn(false);
        when(serverRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<ServerDto> servers = jdaService.getAllServers();

        assertThat(servers).hasSize(1);
        assertThat(servers.get(0).getOnlineCount()).isEqualTo(3);

        // When guild.getMembers() throws exception
        when(guild.getMembers()).thenThrow(new RuntimeException("Gateway closed"));
        List<ServerDto> errorServers = jdaService.getAllServers();
        assertThat(errorServers).hasSize(1);
        assertThat(errorServers.get(0).getOnlineCount()).isZero();
    }

    @Test
    @DisplayName("mapJdaGuildToDetailDto uses presence count from REST detail if available")
    void testMapJdaGuildToDetailDtoUsesRestPresenceCount() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);

        Guild jdaGuild = mock(Guild.class);
        when(jdaGuild.getName()).thenReturn("JDA Server");
        when(jdaGuild.getBoostTier()).thenReturn(Guild.BoostTier.NONE);
        when(jdaGuild.getBoostCount()).thenReturn(0);
        when(jdaGuild.getMemberCount()).thenReturn(50);
        when(jda.getGuildById(sampleServer.getId())).thenReturn(jdaGuild);

        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        // First getGuildDetails call in getServerDetails throws
        // Second getGuildDetails call inside mapJdaGuildToDetailDto returns detail with presence count
        DiscordGuildDetailDto countDetail = DiscordGuildDetailDto.builder()
                .approximatePresenceCount(25)
                .build();
        when(discordClient.getGuildDetails(sampleServer.getId()))
                .thenThrow(new RuntimeException("REST unavailable"))
                .thenReturn(countDetail);

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        ServerDetailDto details = jdaService.getServerDetails("rednecks-gaming");

        assertThat(details.getOnlineCount()).isEqualTo(25);
        assertThat(details.getTotalCount()).isEqualTo(50);
    }

    @Test
    @DisplayName("resolveGuildId iterates over multiple JDA and bot guilds and catches botGuilds exceptions")
    void testResolveGuildIdLoopsAndExceptions() {
        // JDA search loops past non-matching guilds
        when(serverRepository.findByIdOrSlug("matching-slug")).thenReturn(Optional.empty());
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);

        Guild g1 = mock(Guild.class);
        when(g1.getName()).thenReturn("Guild One");
        when(g1.getId()).thenReturn("111");
        Guild g2 = mock(Guild.class);
        when(g2.getName()).thenReturn("Matching Slug");
        when(g2.getId()).thenReturn("222");
        when(jda.getGuilds()).thenReturn(List.of(g1, g2));

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        assertThat(jdaService.resolveGuildId("matching-slug")).isEqualTo("222");

        // REST search loops past non-matching bot guilds
        when(serverRepository.findByIdOrSlug("target-bot")).thenReturn(Optional.empty());
        DiscordGuildDto bg1 = DiscordGuildDto.builder().id("333").name("Bot One").build();
        DiscordGuildDto bg2 = DiscordGuildDto.builder().id("444").name("Target Bot").build();
        when(discordClient.getBotGuilds()).thenReturn(List.of(bg1, bg2));
        assertThat(serverService.resolveGuildId("target-bot")).isEqualTo("444");

        // REST search catches exception from getBotGuilds
        when(serverRepository.findByIdOrSlug("error-slug")).thenReturn(Optional.empty());
        when(discordClient.getBotGuilds()).thenThrow(new RuntimeException("REST timeout"));
        assertThat(serverService.resolveGuildId("error-slug")).isEqualTo("error-slug");
    }

    @Test
    @DisplayName("getServerChannels handles null channel position and empty REST list")
    void testGetServerChannelsNullPosition() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        DiscordChannelDto chanNullPos = DiscordChannelDto.builder()
                .id("c-null")
                .name("no-pos")
                .type(0)
                .position(null)
                .build();
        when(discordClient.getGuildChannels(sampleServer.getId())).thenReturn(List.of(chanNullPos));

        List<ChannelDto> channels = serverService.getServerChannels("rednecks-gaming");
        assertThat(channels).hasSize(1);
        assertThat(channels.get(0).getPosition()).isZero();
    }

    @Test
    @DisplayName("getServerEmojis and getBotEmojis handle empty lists gracefully")
    void testGetServerAndBotEmojisEmptyLists() {
        // getServerEmojis: REST returns empty, JDA returns empty
        when(discordClient.getGuildEmojis(sampleServer.getId())).thenReturn(List.of());
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        Guild jdaGuild = mock(Guild.class);
        when(jdaGuild.getEmojis()).thenReturn(List.of());
        when(jda.getGuildById(sampleServer.getId())).thenReturn(jdaGuild);

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        assertThat(jdaService.getServerEmojis(sampleServer.getId())).isEmpty();

        // getBotEmojis: REST returns empty list
        when(discordClient.getApplicationId()).thenReturn("app-123");
        when(discordClient.getApplicationEmojis("app-123")).thenReturn(List.of());
        assertThat(serverService.getBotEmojis()).isEmpty();
    }

    @Test
    @DisplayName("syncAndMapRestGuilds tests matching names, icon and banner diffs, and null JDA URLs")
    void testSyncAndMapRestGuildsIconBannerBranches() {
        Server existingServer = Server.builder()
                .id("500000000000000001")
                .name("Same Name")
                .iconHash("same_icon")
                .bannerHash("same_banner")
                .premiumTier(1)
                .premiumSubscriptionCount(2)
                .build();
        when(serverRepository.findById("500000000000000001")).thenReturn(Optional.of(existingServer));

        // 1. Same name, same icon, same banner -> no save
        DiscordGuildDto sameGuild = DiscordGuildDto.builder()
                .id("500000000000000001")
                .name("Same Name")
                .icon("same_icon")
                .banner("same_banner")
                .build();
        when(discordClient.getBotGuilds()).thenReturn(List.of(sameGuild));
        serverService.getAllServers();

        // 2. Same name, different icon -> triggers save
        DiscordGuildDto diffIconGuild = DiscordGuildDto.builder()
                .id("500000000000000001")
                .name("Same Name")
                .icon("new_icon")
                .banner("same_banner")
                .build();
        when(discordClient.getBotGuilds()).thenReturn(List.of(diffIconGuild));
        serverService.getAllServers();

        // 3. Same name, same icon, different banner -> triggers save
        DiscordGuildDto diffBannerGuild = DiscordGuildDto.builder()
                .id("500000000000000001")
                .name("Same Name")
                .icon("same_icon")
                .banner("new_banner")
                .build();
        when(discordClient.getBotGuilds()).thenReturn(List.of(diffBannerGuild));
        serverService.getAllServers();

        // 4. JDA connected with guild having null iconUrl and null bannerUrl
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        Guild jdaGuild = mock(Guild.class);
        when(jdaGuild.getName()).thenReturn("JDA Overridden");
        when(jdaGuild.getBoostTier()).thenReturn(Guild.BoostTier.NONE);
        when(jdaGuild.getBoostCount()).thenReturn(0);
        when(jdaGuild.getIconUrl()).thenReturn(null);
        when(jdaGuild.getBannerUrl()).thenReturn(null);
        when(jda.getGuildById("500000000000000001")).thenReturn(jdaGuild);

        ServerService jdaService = new ServerService(serverRepository, discordClient, userRepository, jda);
        when(discordClient.getBotGuilds()).thenReturn(List.of(sameGuild));
        jdaService.getAllServers();

        // 5. JDA connected but jdaGuild is null
        when(jda.getGuildById("500000000000000001")).thenReturn(null);
        jdaService.getAllServers();
    }

    @Test
    @DisplayName("getServerDetails should handle boost and sticker suppression flags, null boost counts, and fallback counts")
    void testSuppressionBitmaskBoostAndSticker() {
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));
        // Flag with bit 1 (suppress boost) and bit 3 (suppress sticker prompt) set
        int flags = (1 << 1) | (1 << 3);
        sampleGuildDetail.setSystemChannelFlags(flags);
        sampleGuildDetail.setPremiumTier(null);
        sampleGuildDetail.setPremiumSubscriptionCount(null);
        sampleGuildDetail.setApproximatePresenceCount(null);
        sampleGuildDetail.setApproximateMemberCount(null);

        DiscordGuildDto matchingGuild = DiscordGuildDto.builder()
                .id(sampleServer.getId())
                .approximatePresenceCount(null)
                .approximateMemberCount(null)
                .build();
        DiscordGuildDto nonMatchingGuild = DiscordGuildDto.builder()
                .id("999999999999999999")
                .build();
        when(discordClient.getBotGuilds()).thenReturn(List.of(nonMatchingGuild, matchingGuild));
        when(discordClient.getGuildDetails(sampleServer.getId())).thenReturn(sampleGuildDetail);

        ServerDetailDto details = serverService.getServerDetails("rednecks-gaming");

        assertThat(details.getSendWelcome()).isTrue();
        assertThat(details.getSetupTips()).isTrue();
        assertThat(details.getBoostMessage()).isFalse();
        assertThat(details.getStickerPrompt()).isFalse();
        assertThat(details.getBoostLevel()).isEqualTo(0);
        assertThat(details.getBoostCount()).isEqualTo(0);
        assertThat(details.getOnlineCount()).isEqualTo(0);
        assertThat(details.getTotalCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("ServerService null discordClient should gracefully return empty lists")
    void testNullDiscordClientBranches() {
        ServerService serviceWithNulls = new ServerService(serverRepository, null, userRepository, null, null);
        when(serverRepository.findByIdOrSlug("100000000000000001")).thenReturn(Optional.of(sampleServer));

        List<ChannelDto> channels = serviceWithNulls.getServerChannels("100000000000000001");
        assertThat(channels).isEmpty();

        List<DiscordEmojiDto> emojis = serviceWithNulls.getServerEmojis("100000000000000001");
        assertThat(emojis).isEmpty();
    }

    @Test
    @DisplayName("getServerRoles should return empty list when JDA status is not CONNECTED")
    void testGetServerRolesJdaDisconnected() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.SHUTDOWN);
        ServerService serviceWithJda = new ServerService(serverRepository, discordClient, userRepository, jda);
        when(serverRepository.findByIdOrSlug("rednecks-gaming")).thenReturn(Optional.of(sampleServer));

        List<ServerRoleDto> roles = serviceWithJda.getServerRoles("rednecks-gaming");
        assertThat(roles).isEmpty();
    }

    @Test
    @DisplayName("validateBoostPerks feature bypass branches when boost levels are lower")
    void testValidateBoostPerksFeatureBypasses() {
        // Boost level 0 with ANIMATED_ICON feature bypasses level 1 requirement
        sampleGuildDetail.setPremiumTier(0);
        sampleGuildDetail.setFeatures(List.of("ANIMATED_ICON", "BANNER", "ANIMATED_BANNER"));

        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                .name("Rednecks Gaming")
                .icon("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
                .banner("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
                .build();

        // Should not throw because features list contains ANIMATED_ICON, BANNER, and ANIMATED_BANNER
        serverService.validateBoostPerks(request, sampleGuildDetail);

        // Banner non-data URL is ignored
        UpdateServerSettingsRequest nonDataBanner = UpdateServerSettingsRequest.builder()
                .name("Rednecks Gaming")
                .banner("https://example.com/banner.png")
                .build();
        serverService.validateBoostPerks(nonDataBanner, sampleGuildDetail);
    }

    @Test
    @DisplayName("resolveGuildId handles null, blank, snowflake digits, DB lookup, JDA cache, REST client, and fallback")
    void testResolveGuildIdAllBranches() {
        // 1. null or blank
        assertThat(serverService.resolveGuildId(null)).isNull();
        assertThat(serverService.resolveGuildId("   ")).isEqualTo("   ");

        // 2. Numeric snowflake digits
        assertThat(serverService.resolveGuildId("100000000000000001")).isEqualTo("100000000000000001");

        // 3. Database repository match
        when(serverRepository.findByIdOrSlug("db-slug")).thenReturn(Optional.of(sampleServer));
        assertThat(serverService.resolveGuildId("db-slug")).isEqualTo(sampleServer.getId());

        // 4. JDA Gateway connected match
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        Guild jdaGuild = mock(Guild.class);
        when(jdaGuild.getId()).thenReturn("900000000000000001");
        when(jdaGuild.getName()).thenReturn("JDA Operations");
        when(jda.getGuilds()).thenReturn(List.of(jdaGuild));

        ServerService serviceWithJda = new ServerService(serverRepository, discordClient, userRepository, jda);
        when(serverRepository.findByIdOrSlug("jda-operations")).thenReturn(Optional.empty());
        when(serverRepository.existsBySlug("jda-operations")).thenReturn(false);

        assertThat(serviceWithJda.resolveGuildId("jda-operations")).isEqualTo("900000000000000001");

        // 5. REST bot guilds match
        when(serverRepository.findByIdOrSlug("rest-operations")).thenReturn(Optional.empty());
        when(serverRepository.existsBySlug("rest-operations")).thenReturn(false);
        DiscordGuildDto restGuild = DiscordGuildDto.builder().id("900000000000000002").name("REST Operations").build();
        when(discordClient.getBotGuilds()).thenReturn(List.of(restGuild));

        assertThat(serverService.resolveGuildId("rest-operations")).isEqualTo("900000000000000002");

        // 6. Unmatched fallback and REST exception fallback
        when(serverRepository.findByIdOrSlug("unmatched-slug")).thenReturn(Optional.empty());
        when(discordClient.getBotGuilds()).thenThrow(new RuntimeException("REST error"));

        assertThat(serverService.resolveGuildId("unmatched-slug")).isEqualTo("unmatched-slug");
    }

    @Test
    @DisplayName("getServerEmojis resolves snowflake and queries REST, falling back to JDA cache")
    void testGetServerEmojisAllBranches() {
        // 1. Unresolvable identifier returns empty list
        when(serverRepository.findByIdOrSlug("invalid-id")).thenReturn(Optional.empty());
        when(discordClient.getBotGuilds()).thenReturn(List.of());
        assertThat(serverService.getServerEmojis("invalid-id")).isEmpty();

        // 2. REST API returns emojis
        DiscordEmojiResponseDto restEmoji = new DiscordEmojiResponseDto("e1", "happy", false, true, true);
        when(discordClient.getGuildEmojis("100000000000000001")).thenReturn(List.of(restEmoji));

        List<DiscordEmojiDto> emojis = serverService.getServerEmojis("100000000000000001");
        assertThat(emojis).hasSize(1);
        assertThat(emojis.get(0).name()).isEqualTo("happy");

        // 3. REST API throws, falls back to JDA Gateway cache
        when(discordClient.getGuildEmojis("100000000000000001")).thenThrow(new RuntimeException("REST 500"));
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        Guild guild = mock(Guild.class);
        when(jda.getGuildById("100000000000000001")).thenReturn(guild);
        RichCustomEmoji richEmoji = mock(RichCustomEmoji.class);
        when(richEmoji.getId()).thenReturn("e2");
        when(richEmoji.getName()).thenReturn("blob");
        when(richEmoji.isAnimated()).thenReturn(false);
        when(guild.getEmojis()).thenReturn(List.of(richEmoji));

        ServerService serviceWithJda = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<DiscordEmojiDto> jdaEmojis = serviceWithJda.getServerEmojis("100000000000000001");
        assertThat(jdaEmojis).hasSize(1);
        assertThat(jdaEmojis.get(0).name()).isEqualTo("blob");

        // 4. JDA cache has guild but empty emojis
        when(guild.getEmojis()).thenReturn(List.of());
        assertThat(serviceWithJda.getServerEmojis("100000000000000001")).isEmpty();

        // 5. JDA throws exception
        when(guild.getEmojis()).thenThrow(new RuntimeException("JDA error"));
        assertThat(serviceWithJda.getServerEmojis("100000000000000001")).isEmpty();
    }

    @Test
    @DisplayName("getBotEmojis resolves appId via JDA or REST and fetches application emojis")
    void testGetBotEmojisAllBranches() {
        // 1. JDA retrieveApplicationInfo succeeds
        JDA jda = mock(JDA.class);
        ApplicationInfo appInfo = mock(ApplicationInfo.class);
        when(appInfo.getId()).thenReturn("app_111");
        RestAction restAction = mock(RestAction.class);
        when(restAction.complete()).thenReturn(appInfo);
        when(jda.retrieveApplicationInfo()).thenReturn(restAction);

        DiscordEmojiResponseDto appEmoji = new DiscordEmojiResponseDto("e_app_1", "badge", false, true, true);
        when(discordClient.getApplicationEmojis("app_111")).thenReturn(List.of(appEmoji));

        ServerService serviceWithJda = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<DiscordEmojiDto> emojis = serviceWithJda.getBotEmojis();
        assertThat(emojis).hasSize(1);
        assertThat(emojis.get(0).name()).isEqualTo("badge");

        // 2. JDA retrieveApplicationInfo throws, falls back to discordClient.getApplicationId()
        when(jda.retrieveApplicationInfo()).thenThrow(new RuntimeException("JDA app error"));
        when(discordClient.getApplicationId()).thenReturn("app_222");
        when(discordClient.getApplicationEmojis("app_222")).thenReturn(List.of(appEmoji));

        List<DiscordEmojiDto> fallbackEmojis = serviceWithJda.getBotEmojis();
        assertThat(fallbackEmojis).hasSize(1);

        // 3. Without JDA, discordClient.getApplicationId() is null -> returns empty
        when(discordClient.getApplicationId()).thenReturn(null);
        assertThat(serverService.getBotEmojis()).isEmpty();

        // 4. getApplicationEmojis throws exception -> returns empty
        when(discordClient.getApplicationId()).thenReturn("app_333");
        when(discordClient.getApplicationEmojis("app_333")).thenThrow(new RuntimeException("REST emoji error"));
        assertThat(serverService.getBotEmojis()).isEmpty();
    }

    @Test
    @DisplayName("getServerRoles handles selfMember exception with retrieveMember fallback")
    void testServerRolesSelfMemberExceptionWithRetrieveMember() {
        JDA jda = mock(JDA.class);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        SelfUser selfUser = mock(SelfUser.class);
        when(jda.getSelfUser()).thenReturn(selfUser);

        Guild guild = mock(Guild.class);
        when(jda.getGuildById("100000000000000001")).thenReturn(guild);
        when(guild.getSelfMember()).thenThrow(new RuntimeException("Self member not cached"));

        Member botMember = mock(Member.class);
        CacheRestAction cacheRestAction = mock(CacheRestAction.class);
        when(cacheRestAction.complete()).thenReturn(botMember);
        when(guild.retrieveMember(selfUser)).thenReturn(cacheRestAction);

        Role role = mock(Role.class);
        when(role.isPublicRole()).thenReturn(false);
        when(role.getId()).thenReturn("r_fallback");
        when(role.getName()).thenReturn("Fallback Officer");
        when(role.getPosition()).thenReturn(5);
        when(role.isManaged()).thenReturn(false);
        when(botMember.canInteract(role)).thenReturn(true);
        when(guild.getRoles()).thenReturn(List.of(role));

        when(serverRepository.findByIdOrSlug("100000000000000001")).thenReturn(Optional.of(sampleServer));

        ServerService serviceWithJda = new ServerService(serverRepository, discordClient, userRepository, jda);
        List<ServerRoleDto> roles = serviceWithJda.getServerRoles("100000000000000001");
        assertThat(roles).hasSize(1);
        assertThat(roles.get(0).isAssignableByBot()).isTrue();

        // When retrieveMember throws exception
        when(cacheRestAction.complete()).thenThrow(new RuntimeException("Retrieve member failed"));
        List<ServerRoleDto> rolesFail = serviceWithJda.getServerRoles("100000000000000001");
        assertThat(rolesFail).hasSize(1);
        assertThat(rolesFail.get(0).isAssignableByBot()).isFalse();
    }

    @Test
    @DisplayName("ServerService 5-arg constructor and generateUniqueSlug with blank name")
    void testConstructorsAndSlugWithBlankName() {
        DiscordServerMapper customMapper = new DiscordServerMapper();
        ServerService customService = new ServerService(serverRepository, discordClient, userRepository, null, customMapper);
        assertThat(customService).isNotNull();

        // Blank name results in server-guildId slug
        when(serverRepository.existsBySlug("server-777")).thenReturn(false);
        String blankSlug = customService.generateUniqueSlug(null, "777");
        assertThat(blankSlug).isEqualTo("server-777");

        when(serverRepository.existsBySlug("server-888")).thenReturn(false);
        String whitespaceSlug = customService.generateUniqueSlug("   ", "888");
        assertThat(whitespaceSlug).isEqualTo("server-888");
    }
}
