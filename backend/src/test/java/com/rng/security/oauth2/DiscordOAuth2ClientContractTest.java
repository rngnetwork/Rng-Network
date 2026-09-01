package com.rng.security.oauth2;

import com.github.tomakehurst.wiremock.junit5.WireMockExtension;
import com.rng.common.dto.DiscordUserDto;
import com.rng.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.web.client.RestTemplate;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DiscordOAuth2ClientContractTest {

    @RegisterExtension
    static WireMockExtension wireMockServer = WireMockExtension.newInstance()
            .options(wireMockConfig().dynamicPort())
            .build();

    private DiscordClientImpl discordClient;

    @BeforeEach
    void setUp() {
        discordClient = new DiscordClientImpl(
                new RestTemplate(),
                "test-client-id",
                "test-client-secret",
                "http://localhost:3000/auth/discord/callback",
                wireMockServer.baseUrl() + "/api"
        );
    }

    @Test
    @DisplayName("Successfully exchanges authorization code and parses Discord @me profile")
    void fetchDiscordUser_validCode_returnsProfile() {
        wireMockServer.stubFor(post(urlEqualTo("/api/oauth2/token"))
                .withHeader("Content-Type", containing("application/x-www-form-urlencoded"))
                .withRequestBody(containing("grant_type=authorization_code"))
                .withRequestBody(containing("code=valid-auth-code"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "access_token": "discord-bearer-token-xyz",
                                  "token_type": "Bearer",
                                  "expires_in": 604800,
                                  "scope": "identify"
                                }
                                """)));

        wireMockServer.stubFor(get(urlEqualTo("/api/users/@me"))
                .withHeader("Authorization", equalTo("Bearer discord-bearer-token-xyz"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "id": "112233445566778899",
                                  "username": "RNG_Commander",
                                  "email": "commander@rng.com",
                                  "avatar": "a_customavatarhash"
                                }
                                """)));

        DiscordUserDto user = discordClient.fetchDiscordUser("valid-auth-code");

        assertThat(user).isNotNull();
        assertThat(user.getId()).isEqualTo("112233445566778899");
        assertThat(user.getUsername()).isEqualTo("RNG_Commander");
        assertThat(user.getEmail()).isEqualTo("commander@rng.com");
        assertThat(user.getAvatar()).isEqualTo("a_customavatarhash");
    }

    @Test
    @DisplayName("Throws UnauthorizedException on invalid or expired authorization code")
    void fetchDiscordUser_invalidCode_throwsUnauthorized() {
        wireMockServer.stubFor(post(urlEqualTo("/api/oauth2/token"))
                .willReturn(aResponse()
                        .withStatus(400)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"error\": \"invalid_grant\", \"error_description\": \"Invalid code\"}")));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("invalid-code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid or expired Discord OAuth2 code");
    }

    @Test
    @DisplayName("Throws UnauthorizedException when @me endpoint returns 500 internal server error")
    void fetchDiscordUser_profileOutage_throwsUnauthorized() {
        wireMockServer.stubFor(post(urlEqualTo("/api/oauth2/token"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"access_token\": \"token-123\"}")));

        wireMockServer.stubFor(get(urlEqualTo("/api/users/@me"))
                .willReturn(aResponse().withStatus(500)));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("valid-code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid or expired Discord OAuth2 code");
    }
}
