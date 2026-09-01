package com.rng.server.client;

import com.github.tomakehurst.wiremock.junit5.WireMockExtension;
import com.rng.common.exception.ConflictException;
import com.rng.common.exception.ForbiddenException;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.common.exception.ServiceUnavailableException;
import com.rng.server.dto.discord.DiscordChannelDto;
import com.rng.server.dto.discord.DiscordGuildDetailDto;
import com.rng.server.dto.discord.DiscordGuildDto;
import com.rng.server.dto.discord.DiscordGuildPatchRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DiscordServerClientContractTest {

    @RegisterExtension
    static WireMockExtension wireMockServer = WireMockExtension.newInstance()
            .options(wireMockConfig().dynamicPort())
            .build();

    private DiscordServerClientImpl discordClient;

    @BeforeEach
    void setUp() {
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder()
                        .version(HttpClient.Version.HTTP_1_1)
                        .connectTimeout(Duration.ofMillis(500))
                        .build()
        );
        requestFactory.setReadTimeout(Duration.ofMillis(1000));
        RestTemplate restTemplate = new RestTemplate(requestFactory);

        discordClient = new DiscordServerClientImpl(
                restTemplate,
                "test-bot-token-12345",
                wireMockServer.baseUrl() + "/api/v10"
        );
    }

    @Nested
    @DisplayName("Protocol Header Compliance & Audit Reason Percent-Encoding")
    class ProtocolHeaders {

        @Test
        @DisplayName("Transmits Authorization Bot token header and RFC 3986 percent-encoded audit reason")
        void updateGuildSettings_verifiesBotAuthAndAuditReasonEncoding() {
            String rawAuditReason = "Updated via RNG Control Center by Arzenic (arzenic@rng.com)";
            String expectedEncodedReason = "Updated%20via%20RNG%20Control%20Center%20by%20Arzenic%20%28arzenic%40rng.com%29";

            wireMockServer.stubFor(patch(urlEqualTo("/api/v10/guilds/109823471928374650"))
                    .withHeader("Authorization", equalTo("Bot test-bot-token-12345"))
                    .withHeader("Content-Type", containing("application/json"))
                    .withHeader("X-Audit-Log-Reason", equalTo(expectedEncodedReason))
                    .willReturn(aResponse().withStatus(200)));

            DiscordGuildPatchRequest request = DiscordGuildPatchRequest.builder()
                    .name("Updated HQ")
                    .build();

            discordClient.updateGuildSettings(
                    "109823471928374650",
                    request,
                    rawAuditReason
            );

            wireMockServer.verify(patchRequestedFor(urlEqualTo("/api/v10/guilds/109823471928374650"))
                    .withHeader("Authorization", equalTo("Bot test-bot-token-12345"))
                    .withHeader("X-Audit-Log-Reason", equalTo(expectedEncodedReason)));
        }
    }

    @Nested
    @DisplayName("Payload Deserialization & Gateway Queries")
    class PayloadQueries {

        @Test
        @DisplayName("getBotGuilds parses guild summaries and approximate member counts")
        void getBotGuilds_success() {
            wireMockServer.stubFor(get(urlEqualTo("/api/v10/users/@me/guilds?with_counts=true"))
                    .willReturn(aResponse()
                            .withStatus(200)
                            .withHeader("Content-Type", "application/json")
                            .withBody("""
                                    [
                                      {
                                        "id": "109823471928374650",
                                        "name": "RNG HQ",
                                        "icon": "a_iconhash",
                                        "banner": "bannerhash",
                                        "approximate_member_count": 1250,
                                        "approximate_presence_count": 480
                                      }
                                    ]
                                    """)));

            List<DiscordGuildDto> guilds = discordClient.getBotGuilds();

            assertThat(guilds).hasSize(1);
            assertThat(guilds.getFirst().getName()).isEqualTo("RNG HQ");
            assertThat(guilds.getFirst().getApproximateMemberCount()).isEqualTo(1250);
            assertThat(guilds.getFirst().getApproximatePresenceCount()).isEqualTo(480);
        }

        @Test
        @DisplayName("getGuildDetails parses boost level, features, and system channel flags")
        void getGuildDetails_success() {
            wireMockServer.stubFor(get(urlEqualTo("/api/v10/guilds/109823471928374650"))
                    .willReturn(aResponse()
                            .withStatus(200)
                            .withHeader("Content-Type", "application/json")
                            .withBody("""
                                    {
                                      "id": "109823471928374650",
                                      "name": "RNG HQ",
                                      "premium_tier": 2,
                                      "premium_subscription_count": 7,
                                      "features": ["BANNER", "COMMUNITY"],
                                      "system_channel_flags": 3,
                                      "vanity_url_code": "rng-hq"
                                    }
                                    """)));

            DiscordGuildDetailDto detail = discordClient.getGuildDetails("109823471928374650");

            assertThat(detail).isNotNull();
            assertThat(detail.getPremiumTier()).isEqualTo(2);
            assertThat(detail.getPremiumSubscriptionCount()).isEqualTo(7);
            assertThat(detail.getSystemChannelFlags()).isEqualTo(3);
            assertThat(detail.getFeatures()).contains("BANNER", "COMMUNITY");
        }

        @Test
        @DisplayName("getGuildChannels parses Discord channel descriptor array")
        void getGuildChannels_success() {
            wireMockServer.stubFor(get(urlEqualTo("/api/v10/guilds/109823471928374650/channels"))
                    .willReturn(aResponse()
                            .withStatus(200)
                            .withHeader("Content-Type", "application/json")
                            .withBody("""
                                    [
                                      {"id": "c1", "name": "general", "type": 0, "position": 1},
                                      {"id": "c2", "name": "Voice Lounge", "type": 2, "position": 2}
                                    ]
                                    """)));

            List<DiscordChannelDto> channels = discordClient.getGuildChannels("109823471928374650");

            assertThat(channels).hasSize(2);
            assertThat(channels.get(0).getName()).isEqualTo("general");
            assertThat(channels.get(1).getType()).isEqualTo(2);
        }

        @Test
        @DisplayName("updateGuildVanityUrl successfully patches guild vanity code")
        void updateGuildVanityUrl_success() {
            wireMockServer.stubFor(patch(urlEqualTo("/api/v10/guilds/109823471928374650/vanity-url"))
                    .withHeader("Authorization", equalTo("Bot test-bot-token-12345"))
                    .withRequestBody(containing("\"code\":\"rng-elite\""))
                    .willReturn(aResponse().withStatus(200)));

            discordClient.updateGuildVanityUrl("109823471928374650", "rng-elite", "Audit");

            wireMockServer.verify(patchRequestedFor(urlEqualTo("/api/v10/guilds/109823471928374650/vanity-url")));
        }

        @Test
        @DisplayName("updateGuildWidget patches widget settings with and without channel ID")
        void updateGuildWidget_success() {
            wireMockServer.stubFor(patch(urlEqualTo("/api/v10/guilds/109823471928374650/widget"))
                    .withHeader("Authorization", equalTo("Bot test-bot-token-12345"))
                    .willReturn(aResponse().withStatus(200)));

            discordClient.updateGuildWidget("109823471928374650", true, "channel-123", "Audit");
            discordClient.updateGuildWidget("109823471928374650", false, null, "Audit");

            wireMockServer.verify(2, patchRequestedFor(urlEqualTo("/api/v10/guilds/109823471928374650/widget")));
        }

        @Test
        @DisplayName("getBotGuilds and getGuildChannels return empty list when server returns null body")
        void queries_nullBody_returnsEmptyList() {
            wireMockServer.stubFor(get(urlEqualTo("/api/v10/users/@me/guilds?with_counts=true"))
                    .willReturn(aResponse().withStatus(204)));

            wireMockServer.stubFor(get(urlEqualTo("/api/v10/guilds/109823471928374650/channels"))
                    .willReturn(aResponse().withStatus(204)));

            assertThat(discordClient.getBotGuilds()).isEmpty();
            assertThat(discordClient.getGuildChannels("109823471928374650")).isEmpty();
        }
    }

    @Nested
    @DisplayName("Error Resilience & RFC Status Code Mapping")
    class ErrorResilience {

        @Test
        @DisplayName("Maps 409 Conflict to ConflictException")
        void updateGuildSettings_409Conflict_throwsConflictException() {
            wireMockServer.stubFor(patch(urlEqualTo("/api/v10/guilds/109823471928374650"))
                    .willReturn(aResponse().withStatus(409).withBody("{\"message\":\"Conflict\"}")));

            assertThatThrownBy(() -> discordClient.updateGuildSettings(
                    "109823471928374650",
                    DiscordGuildPatchRequest.builder().name("Test").build(),
                    "Audit"
            )).isInstanceOf(ConflictException.class)
                    .hasMessageContaining("already taken by another Discord server");
        }

        @Test
        @DisplayName("Maps 400 Bad Request with vanity taken (code 50020) to ConflictException")
        void updateGuildSettings_400VanityTaken_throwsConflictException() {
            wireMockServer.stubFor(patch(urlEqualTo("/api/v10/guilds/109823471928374650"))
                    .willReturn(aResponse().withStatus(400).withBody("{\"code\": 50020, \"message\": \"Vanity URL already taken\"}")));

            assertThatThrownBy(() -> discordClient.updateGuildSettings(
                    "109823471928374650",
                    DiscordGuildPatchRequest.builder().name("Test").build(),
                    "Audit"
            )).isInstanceOf(ConflictException.class)
                    .hasMessageContaining("already in use");
        }

        @Test
        @DisplayName("Maps 403 Forbidden to ForbiddenException")
        void updateGuildSettings_403Forbidden_throwsForbiddenException() {
            wireMockServer.stubFor(patch(urlEqualTo("/api/v10/guilds/109823471928374650"))
                    .willReturn(aResponse().withStatus(403).withBody("{\"message\":\"Missing Permissions\"}")));

            assertThatThrownBy(() -> discordClient.updateGuildSettings(
                    "109823471928374650",
                    DiscordGuildPatchRequest.builder().name("Test").build(),
                    "Audit"
            )).isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Bot does not have required permissions");
        }

        @Test
        @DisplayName("Maps 404 Not Found to ResourceNotFoundException")
        void updateGuildSettings_404NotFound_throwsResourceNotFoundException() {
            wireMockServer.stubFor(patch(urlEqualTo("/api/v10/guilds/999"))
                    .willReturn(aResponse().withStatus(404).withBody("{\"message\":\"Unknown Guild\"}")));

            assertThatThrownBy(() -> discordClient.updateGuildSettings(
                    "999",
                    DiscordGuildPatchRequest.builder().name("Test").build(),
                    "Audit"
            )).isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("was not found");
        }

        @Test
        @DisplayName("Maps 429 Too Many Requests to ServiceUnavailableException")
        void updateGuildSettings_429RateLimit_throwsServiceUnavailable() {
            wireMockServer.stubFor(patch(urlEqualTo("/api/v10/guilds/109823471928374650"))
                    .willReturn(aResponse().withStatus(429).withHeader("Retry-After", "5").withBody("{\"message\":\"Rate limited\"}")));

            assertThatThrownBy(() -> discordClient.updateGuildSettings(
                    "109823471928374650",
                    DiscordGuildPatchRequest.builder().name("Test").build(),
                    "Audit"
            )).isInstanceOf(ServiceUnavailableException.class)
                    .hasMessageContaining("rate limit reached");
        }

        @Test
        @DisplayName("Maps 500/503 Discord Gateway Outage to ServiceUnavailableException")
        void updateGuildSettings_503GatewayOutage_throwsServiceUnavailable() {
            wireMockServer.stubFor(patch(urlEqualTo("/api/v10/guilds/109823471928374650"))
                    .willReturn(aResponse().withStatus(503).withBody("Service Unavailable")));

            assertThatThrownBy(() -> discordClient.updateGuildSettings(
                    "109823471928374650",
                    DiscordGuildPatchRequest.builder().name("Test").build(),
                    "Audit"
            )).isInstanceOf(ServiceUnavailableException.class)
                    .hasMessageContaining("currently experiencing outages");
        }

        @Test
        @DisplayName("Maps Socket Read Timeout to ServiceUnavailableException")
        void updateGuildSettings_readTimeout_throwsServiceUnavailable() {
            wireMockServer.stubFor(patch(urlEqualTo("/api/v10/guilds/109823471928374650"))
                    .willReturn(aResponse().withFixedDelay(2000).withStatus(200)));

            assertThatThrownBy(() -> discordClient.updateGuildSettings(
                    "109823471928374650",
                    DiscordGuildPatchRequest.builder().name("Test").build(),
                    "Audit"
            )).isInstanceOf(ServiceUnavailableException.class)
                    .hasMessageContaining("currently unreachable");
        }
    }
}
