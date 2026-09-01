package com.rng.server;

import com.rng.common.exception.ResourceNotFoundException;
import com.rng.server.client.DiscordServerClient;
import com.rng.server.domain.Server;
import com.rng.server.dto.ChannelDto;
import com.rng.server.dto.ServerDetailDto;
import com.rng.server.dto.ServerDto;
import com.rng.server.dto.UpdateServerSettingsRequest;
import com.rng.server.dto.discord.DiscordChannelDto;
import com.rng.server.dto.discord.DiscordGuildDetailDto;
import com.rng.server.dto.discord.DiscordGuildDto;
import com.rng.server.dto.discord.DiscordGuildPatchRequest;
import com.rng.server.repository.ServerRepository;
import com.rng.server.service.ServerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
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
class ServerServiceUnitTest {

    @Mock
    private ServerRepository serverRepository;

    @Mock
    private DiscordServerClient discordClient;

    @InjectMocks
    private ServerService serverService;

    @Nested
    @DisplayName("Slug Generation & Collision Handling")
    class SlugGeneration {

        @Test
        @DisplayName("Generates clean kebab-case slug for standard server name")
        void generateUniqueSlug_standardName_generatesKebab() {
            when(serverRepository.existsBySlug("rng-headquarters")).thenReturn(false);

            String slug = serverService.generateUniqueSlug("RNG Headquarters!", "109823471928374650");
            assertThat(slug).isEqualTo("rng-headquarters");
        }

        @Test
        @DisplayName("Handles multi-hop slug collisions by suffixing -2, -3")
        void generateUniqueSlug_multiHopCollision_suffixesCorrectly() {
            when(serverRepository.existsBySlug("rivals-esports")).thenReturn(true);
            when(serverRepository.findBySlug("rivals-esports"))
                    .thenReturn(Optional.of(Server.builder().id("guild-1").slug("rivals-esports").build()));
            when(serverRepository.existsBySlug("rivals-esports-2")).thenReturn(true);
            when(serverRepository.findBySlug("rivals-esports-2"))
                    .thenReturn(Optional.of(Server.builder().id("guild-2").slug("rivals-esports-2").build()));
            when(serverRepository.existsBySlug("rivals-esports-3")).thenReturn(false);

            String slug = serverService.generateUniqueSlug("Rivals Esports", "guild-3");
            assertThat(slug).isEqualTo("rivals-esports-3");
        }

        @Test
        @DisplayName("Preserves existing slug if candidate belongs to the same guild ID")
        void generateUniqueSlug_sameGuild_preservesSlug() {
            when(serverRepository.existsBySlug("roughnuts-hq")).thenReturn(true);
            when(serverRepository.findBySlug("roughnuts-hq"))
                    .thenReturn(Optional.of(Server.builder().id("guild-100").slug("roughnuts-hq").build()));

            String slug = serverService.generateUniqueSlug("Roughnuts HQ", "guild-100");
            assertThat(slug).isEqualTo("roughnuts-hq");
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "   ", "---", "###", "!!!"})
        @DisplayName("Falls back to server-<guildId> when name contains no alphanumeric characters")
        void generateUniqueSlug_emptyOrSpecialChars_fallsBackToGuildId(String emptyName) {
            when(serverRepository.existsBySlug("server-999000111")).thenReturn(false);

            String slug = serverService.generateUniqueSlug(emptyName, "999000111");
            assertThat(slug).isEqualTo("server-999000111");
        }
    }

    @Nested
    @DisplayName("Bitwise System Channel Flag Inversion")
    class SystemChannelFlagInversion {

        @ParameterizedTest
        @CsvSource({
                "0, true, true, true, true",       // 0 suppression -> all positive booleans true
                "1, false, true, true, true",      // bit 0 suppressed (welcome)
                "2, true, false, true, true",      // bit 1 suppressed (boost)
                "4, true, true, false, true",      // bit 2 suppressed (tips)
                "8, true, true, true, false",      // bit 3 suppressed (stickers)
                "15, false, false, false, false"   // all 4 bits suppressed
        })
        @DisplayName("Inverts Discord negative bitmask suppression flags to positive UI booleans")
        void getServerDetails_invertsSuppressionFlags(int flags, boolean welcome, boolean boost, boolean tips, boolean stickers) {
            Server server = Server.builder().id("guild-1").slug("test-server").name("Test").build();
            DiscordGuildDetailDto detailDto = DiscordGuildDetailDto.builder()
                    .id("guild-1")
                    .name("Test")
                    .systemChannelFlags(flags)
                    .build();

            when(serverRepository.findByIdOrSlug("guild-1")).thenReturn(Optional.of(server));
            when(discordClient.getGuildDetails("guild-1")).thenReturn(detailDto);
            when(discordClient.getBotGuilds()).thenReturn(List.of());

            ServerDetailDto result = serverService.getServerDetails("guild-1");

            assertThat(result.getSendWelcome()).isEqualTo(welcome);
            assertThat(result.getBoostMessage()).isEqualTo(boost);
            assertThat(result.getSetupTips()).isEqualTo(tips);
            assertThat(result.getStickerPrompt()).isEqualTo(stickers);
        }

        @Test
        @DisplayName("Mutation re-inverts positive booleans into Discord bitwise suppression mask")
        void updateServerSettings_reInvertsToBitwiseMask() {
            Server server = Server.builder().id("guild-1").slug("test-server").name("Test").build();
            DiscordGuildDetailDto liveDto = DiscordGuildDetailDto.builder().id("guild-1").name("Test").premiumTier(0).build();

            when(serverRepository.findByIdOrSlug("guild-1")).thenReturn(Optional.of(server));
            when(discordClient.getGuildDetails("guild-1")).thenReturn(liveDto);
            when(discordClient.getBotGuilds()).thenReturn(List.of());

            UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                    .name("Updated Name")
                    .sendWelcome(false)   // suppress bit 0 (1)
                    .boostMessage(true)   // keep enabled (0)
                    .setupTips(false)     // suppress bit 2 (4)
                    .stickerPrompt(true)  // keep enabled (0)
                    .build();

            serverService.updateServerSettings("guild-1", request, "operator@rng.com");

            ArgumentCaptor<DiscordGuildPatchRequest> patchCaptor = ArgumentCaptor.forClass(DiscordGuildPatchRequest.class);
            verify(discordClient).updateGuildSettings(eq("guild-1"), patchCaptor.capture(), any());

            // Suppression mask should be bit 0 (1) + bit 2 (4) = 5
            assertThat(patchCaptor.getValue().getSystemChannelFlags()).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("Boost Tier Boundary & Perk Gating")
    class BoostTierValidation {

        @Test
        @DisplayName("Level 0: Rejects animated GIF icon with IllegalArgumentException")
        void validateBoostPerks_tier0_rejectsAnimatedIcon() {
            DiscordGuildDetailDto live = DiscordGuildDetailDto.builder().premiumTier(0).features(List.of()).build();
            UpdateServerSettingsRequest req = UpdateServerSettingsRequest.builder().icon("data:image/gif;base64,R0lGODlh").build();

            assertThatThrownBy(() -> serverService.validateBoostPerks(req, live))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Animated GIF icons require Server Boost Level 1");
        }

        @Test
        @DisplayName("Level 1: Allows animated GIF icon")
        void validateBoostPerks_tier1_allowsAnimatedIcon() {
            DiscordGuildDetailDto live = DiscordGuildDetailDto.builder().premiumTier(1).features(List.of()).build();
            UpdateServerSettingsRequest req = UpdateServerSettingsRequest.builder().icon("data:image/gif;base64,R0lGODlh").build();

            serverService.validateBoostPerks(req, live);
        }

        @Test
        @DisplayName("Level 1: Rejects banner")
        void validateBoostPerks_tier1_rejectsBanner() {
            DiscordGuildDetailDto live = DiscordGuildDetailDto.builder().premiumTier(1).features(List.of()).build();
            UpdateServerSettingsRequest req = UpdateServerSettingsRequest.builder().banner("data:image/png;base64,iVBORw0").build();

            assertThatThrownBy(() -> serverService.validateBoostPerks(req, live))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Server banners require Server Boost Level 2");
        }

        @Test
        @DisplayName("Level 2: Allows static banner but rejects animated banner")
        void validateBoostPerks_tier2_allowsStaticBannerRejectsAnimated() {
            DiscordGuildDetailDto live = DiscordGuildDetailDto.builder().premiumTier(2).features(List.of()).build();
            UpdateServerSettingsRequest staticReq = UpdateServerSettingsRequest.builder().banner("data:image/png;base64,iVBORw0").build();
            serverService.validateBoostPerks(staticReq, live);

            UpdateServerSettingsRequest animatedReq = UpdateServerSettingsRequest.builder().banner("data:image/gif;base64,R0lGODlh").build();
            assertThatThrownBy(() -> serverService.validateBoostPerks(animatedReq, live))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Animated GIF banners require Server Boost Level 3");
        }

        @Test
        @DisplayName("Level 2: Rejects custom vanity URL")
        void validateBoostPerks_tier2_rejectsVanityUrl() {
            DiscordGuildDetailDto live = DiscordGuildDetailDto.builder().premiumTier(2).vanityUrlCode("old").features(List.of()).build();
            UpdateServerSettingsRequest req = UpdateServerSettingsRequest.builder().vanityUrl("new-vanity").build();

            assertThatThrownBy(() -> serverService.validateBoostPerks(req, live))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Custom vanity URLs require Server Boost Level 3");
        }

        @Test
        @DisplayName("Level 3: Allows animated banners and custom vanity URLs")
        void validateBoostPerks_tier3_allowsAllPerks() {
            DiscordGuildDetailDto live = DiscordGuildDetailDto.builder().premiumTier(3).vanityUrlCode("old").features(List.of()).build();
            UpdateServerSettingsRequest req = UpdateServerSettingsRequest.builder()
                    .icon("data:image/gif;base64,R0lGODlh")
                    .banner("data:image/gif;base64,R0lGODlh")
                    .vanityUrl("elite-rng")
                    .build();

            serverService.validateBoostPerks(req, live);
        }
    }

    @Nested
    @DisplayName("Guild Channel Listing & Server Queries")
    class ChannelAndServerQueries {

        @Test
        @DisplayName("getAllServers synchronizes new guilds from Discord client")
        void getAllServers_synchronizesGuilds() {
            DiscordGuildDto guild1 = DiscordGuildDto.builder().id("g1").name("Guild 1").icon("icon1").approximateMemberCount(100).approximatePresenceCount(30).build();
            when(discordClient.getBotGuilds()).thenReturn(List.of(guild1));
            when(serverRepository.findById("g1")).thenReturn(Optional.empty());
            when(serverRepository.existsBySlug("guild-1")).thenReturn(false);
            when(serverRepository.save(any(Server.class))).thenAnswer(i -> i.getArgument(0));

            List<ServerDto> servers = serverService.getAllServers();

            assertThat(servers).hasSize(1);
            assertThat(servers.getFirst().getName()).isEqualTo("Guild 1");
            assertThat(servers.getFirst().getTotalCount()).isEqualTo(100);
            assertThat(servers.getFirst().getOnlineCount()).isEqualTo(30);
        }

        @Test
        @DisplayName("getServerChannels maps Discord channel descriptors")
        void getServerChannels_mapsChannels() {
            Server server = Server.builder().id("g1").slug("guild-1").name("Guild 1").build();
            DiscordChannelDto chan1 = DiscordChannelDto.builder().id("c1").name("general").type(0).position(1).build();
            DiscordChannelDto chan2 = DiscordChannelDto.builder().id("c2").name("Voice Lounge").type(2).position(2).build();

            when(serverRepository.findByIdOrSlug("guild-1")).thenReturn(Optional.of(server));
            when(discordClient.getGuildChannels("g1")).thenReturn(List.of(chan1, chan2));

            List<ChannelDto> channels = serverService.getServerChannels("guild-1");

            assertThat(channels).hasSize(2);
            assertThat(channels.get(0).getName()).isEqualTo("general");
            assertThat(channels.get(1).getName()).isEqualTo("Voice Lounge");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when querying non-existent server")
        void getServerDetails_notFound_throwsResourceNotFound() {
            when(serverRepository.findByIdOrSlug("unknown")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> serverService.getServerDetails("unknown"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Server not found");
        }
    }
}
