package com.rng.security.oauth2;

import com.rng.common.dto.DiscordUserDto;
import com.rng.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscordClientUnitTest {

    @Mock
    private RestTemplate restTemplate;

    private DiscordClientImpl discordClient;

    @BeforeEach
    void setUp() {
        discordClient = new DiscordClientImpl(
                restTemplate,
                "mock-client-id",
                "mock-client-secret",
                "http://localhost:3000/auth/discord/callback",
                "https://discord.com/api"
        );
    }

    @Test
    @DisplayName("Default constructor initializes correctly")
    void defaultConstructor_initializes() {
        DiscordClientImpl client = new DiscordClientImpl();
        assertThat(client).isNotNull();
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when token exchange returns non-2xx status")
    void fetchDiscordUser_tokenExchangeNon2xx_throwsUnauthorized() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.BAD_REQUEST));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("invalid-code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Failed to obtain Discord OAuth2 token");
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when token exchange returns null body")
    void fetchDiscordUser_tokenExchangeNullBody_throwsUnauthorized() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Failed to obtain Discord OAuth2 token");
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when profile fetch returns non-2xx status")
    void fetchDiscordUser_profileNon2xx_throwsUnauthorized() {
        Map<String, Object> tokenBody = Map.of("access_token", "bearer-token-123");
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(tokenBody, HttpStatus.OK));

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Failed to fetch Discord user details");
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when profile fetch returns null body")
    void fetchDiscordUser_profileNullBody_throwsUnauthorized() {
        Map<String, Object> tokenBody = Map.of("access_token", "bearer-token-123");
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(tokenBody, HttpStatus.OK));

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Failed to fetch Discord user details");
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when rest client throws exception")
    void fetchDiscordUser_restClientException_throwsUnauthorized() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new RestClientException("Connection timed out"));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid or expired Discord OAuth2 code");
    }

    @Test
    @DisplayName("fetchDiscordUser successfully parses user profile when both endpoints succeed")
    void fetchDiscordUser_success() {
        Map<String, Object> tokenBody = Map.of("access_token", "bearer-token-123");
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(tokenBody, HttpStatus.OK));

        Map<String, Object> userBody = Map.of(
                "id", "123456789012345678",
                "username", "DiscordAdmin",
                "email", "admin@discord.com",
                "avatar", "avatar_hash_123"
        );
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(userBody, HttpStatus.OK));

        DiscordUserDto result = discordClient.fetchDiscordUser("valid-code");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("123456789012345678");
        assertThat(result.getUsername()).isEqualTo("DiscordAdmin");
        assertThat(result.getEmail()).isEqualTo("admin@discord.com");
        assertThat(result.getAvatar()).isEqualTo("avatar_hash_123");
    }
}
