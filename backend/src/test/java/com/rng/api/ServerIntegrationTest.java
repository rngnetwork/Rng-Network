package com.rng.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.exception.ConflictException;
import com.rng.common.exception.ServiceUnavailableException;
import com.rng.common.security.SecurityConstants;
import com.rng.common.security.TokenService;
import com.rng.identity.domain.AuthProvider;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import com.rng.server.client.DiscordServerClient;
import com.rng.server.domain.Server;
import com.rng.server.dto.UpdateServerSettingsRequest;
import com.rng.server.dto.discord.DiscordChannelDto;
import com.rng.server.dto.discord.DiscordGuildDetailDto;
import com.rng.server.dto.discord.DiscordGuildDto;
import com.rng.server.repository.ServerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ServerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServerRepository serverRepository;

    @Autowired
    private TokenService tokenService;

    @MockBean
    private DiscordServerClient discordClient;

    private User operatorUser;
    private String fullyAuthenticatedToken;
    private String pre2FaToken;
    private Server testServer;
    private DiscordGuildDetailDto testGuildDetail;

    @BeforeEach
    void setUp() {
        serverRepository.deleteAll();
        userRepository.deleteAll();

        operatorUser = userRepository.save(User.builder()
                .email("arzenic@rednecksgaming.com")
                .fullName("Arzenic Operator")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .status("ACTIVE")
                .build());

        fullyAuthenticatedToken = tokenService.generateAccessToken(operatorUser.getId(), operatorUser.getEmail(), operatorUser.getRole());
        pre2FaToken = tokenService.generatePre2FaToken(operatorUser.getId(), operatorUser.getEmail());

        testServer = serverRepository.save(Server.builder()
                .id("100000000000000001")
                .slug("rednecks-gaming")
                .name("Rednecks Gaming")
                .iconHash("sample_icon")
                .bannerHash("sample_banner")
                .premiumTier(3)
                .premiumSubscriptionCount(30)
                .build());

        testGuildDetail = DiscordGuildDetailDto.builder()
                .id("100000000000000001")
                .name("Rednecks Gaming")
                .description("Official Hub")
                .icon("sample_icon")
                .banner("sample_banner")
                .premiumTier(3)
                .premiumSubscriptionCount(30)
                .features(List.of("BANNER", "ANIMATED_BANNER", "ANIMATED_ICON", "VANITY_URL"))
                .systemChannelId("200000000000000001")
                .systemChannelFlags(0)
                .afkChannelId("200000000000000002")
                .afkTimeout(900)
                .defaultMessageNotifications(1)
                .vanityUrlCode("rednecks")
                .widgetEnabled(true)
                .widgetChannelId("200000000000000001")
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/servers should return 401 Unauthorized without token")
    void testGetAllServersUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/servers"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/servers should return 403 Forbidden with PRE_2FA token")
    void testGetAllServersPre2FaForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/servers")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + pre2FaToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/servers should return 200 and list of servers with valid token")
    void testGetAllServersSuccess() throws Exception {
        DiscordGuildDto guildDto = DiscordGuildDto.builder()
                .id("100000000000000001")
                .name("Rednecks Gaming")
                .icon("sample_icon")
                .banner("sample_banner")
                .approximateMemberCount(5000)
                .approximatePresenceCount(1500)
                .build();

        when(discordClient.getBotGuilds()).thenReturn(List.of(guildDto));

        mockMvc.perform(get("/api/v1/servers")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + fullyAuthenticatedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is("100000000000000001")))
                .andExpect(jsonPath("$.data[0].slug", is("rednecks-gaming")))
                .andExpect(jsonPath("$.data[0].name", is("Rednecks Gaming")))
                .andExpect(jsonPath("$.data[0].onlineCount", is(1500)))
                .andExpect(jsonPath("$.data[0].totalCount", is(5000)));
    }

    @Test
    @DisplayName("GET /api/v1/servers/{idOrSlug} should resolve via slug")
    void testGetServerDetailsBySlug() throws Exception {
        when(discordClient.getGuildDetails(testServer.getId())).thenReturn(testGuildDetail);

        mockMvc.perform(get("/api/v1/servers/rednecks-gaming")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + fullyAuthenticatedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.slug", is("rednecks-gaming")))
                .andExpect(jsonPath("$.data.description", is("Official Hub")))
                .andExpect(jsonPath("$.data.sendWelcome", is(true)))
                .andExpect(jsonPath("$.data.boostLevel", is(3)))
                .andExpect(jsonPath("$.data.vanityUrl", is("rednecks")));
    }

    @Test
    @DisplayName("GET /api/v1/servers/{idOrSlug} should resolve via Snowflake ID")
    void testGetServerDetailsById() throws Exception {
        when(discordClient.getGuildDetails(testServer.getId())).thenReturn(testGuildDetail);

        mockMvc.perform(get("/api/v1/servers/100000000000000001")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + fullyAuthenticatedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is("100000000000000001")));
    }

    @Test
    @DisplayName("GET /api/v1/servers/{idOrSlug} should return 404 for unknown server")
    void testGetServerDetailsNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/servers/unknown-server")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + fullyAuthenticatedToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/v1/servers/{idOrSlug}/channels should return channel list")
    void testGetServerChannels() throws Exception {
        when(discordClient.getGuildChannels(testServer.getId())).thenReturn(List.of(
                DiscordChannelDto.builder().id("c1").name("announcements").type(0).position(1).build(),
                DiscordChannelDto.builder().id("c2").name("Voice Lounge").type(2).position(2).build()
        ));

        mockMvc.perform(get("/api/v1/servers/rednecks-gaming/channels")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + fullyAuthenticatedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].name", is("announcements")))
                .andExpect(jsonPath("$.data[1].name", is("Voice Lounge")));
    }

    @Test
    @DisplayName("PUT /api/v1/servers/{idOrSlug} should update settings successfully")
    void testUpdateServerSettingsSuccess() throws Exception {
        when(discordClient.getGuildDetails(testServer.getId())).thenReturn(testGuildDetail);

        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                .name("Rednecks Gaming Pro")
                .description("Pro Gaming Community Hub")
                .sendWelcome(true)
                .boostMessage(true)
                .setupTips(true)
                .stickerPrompt(true)
                .afkChannelId("200000000000000002")
                .afkTimeout(900)
                .systemChannelId("200000000000000001")
                .defaultMessageNotifications(1)
                .build();

        mockMvc.perform(put("/api/v1/servers/rednecks-gaming")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + fullyAuthenticatedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("updated successfully")));

        verify(discordClient).updateGuildSettings(eq(testServer.getId()), any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/servers/{idOrSlug} should return 400 on blank name validation failure")
    void testUpdateServerSettingsValidationFailure() throws Exception {
        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                .name("") // Blank name violates @NotBlank and @Size(min=2)
                .build();

        mockMvc.perform(put("/api/v1/servers/rednecks-gaming")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + fullyAuthenticatedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("PUT /api/v1/servers/{idOrSlug} should return 503 Service Unavailable when Discord API is unreachable")
    void testUpdateServerSettingsServiceUnavailable() throws Exception {
        when(discordClient.getGuildDetails(testServer.getId())).thenReturn(testGuildDetail);
        doThrow(new ServiceUnavailableException("Discord API is currently unreachable. Please try again later."))
                .when(discordClient).updateGuildSettings(eq(testServer.getId()), any(), any());

        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder()
                .name("Rednecks Gaming")
                .build();

        mockMvc.perform(put("/api/v1/servers/rednecks-gaming")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + fullyAuthenticatedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("unreachable")));
    }
}
