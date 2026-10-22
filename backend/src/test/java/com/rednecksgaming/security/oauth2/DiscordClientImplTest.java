package com.rednecksgaming.security.oauth2;

import com.rednecksgaming.common.dto.DiscordUserDto;
import com.rednecksgaming.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscordClientImplTest {

    @Mock
    private RestTemplate restTemplate;

    @Captor
    private ArgumentCaptor<HttpEntity<MultiValueMap<String, String>>> tokenRequestCaptor;

    @Captor
    private ArgumentCaptor<HttpEntity<Void>> userRequestCaptor;

    private DiscordClientImpl discordClient;

    private static final String CLIENT_ID = "test-discord-client-id";
    private static final String CLIENT_SECRET = "test-discord-client-secret";
    private static final String DEFAULT_REDIRECT_URI = "http://localhost:3000/auth/discord/callback";

    @BeforeEach
    void setUp() {
        discordClient = new DiscordClientImpl();
        ReflectionTestUtils.setField(discordClient, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(discordClient, "clientId", CLIENT_ID);
        ReflectionTestUtils.setField(discordClient, "clientSecret", CLIENT_SECRET);
        ReflectionTestUtils.setField(discordClient, "redirectUri", DEFAULT_REDIRECT_URI);
    }

    @Test
    @DisplayName("fetchDiscordUser(code) successfully exchanges code and retrieves user with default redirect URI")
    void fetchDiscordUser_singleParam_success() {
        Map<String, Object> tokenBody = Map.of("access_token", "discord_mock_token_123");
        ResponseEntity<Map<String, Object>> tokenResponseEntity = ResponseEntity.ok(tokenBody);

        Map<String, Object> userBody = Map.of(
                "id", "987654321012345678",
                "username", "RNGCommander",
                "email", "commander@rednecksgaming.com",
                "avatar", "avatar_hash_abcdef"
        );
        ResponseEntity<Map<String, Object>> userResponseEntity = ResponseEntity.ok(userBody);

        when(restTemplate.exchange(
                eq("https://discord.com/api/oauth2/token"),
                eq(HttpMethod.POST),
                tokenRequestCaptor.capture(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(tokenResponseEntity);

        when(restTemplate.exchange(
                eq("https://discord.com/api/users/@me"),
                eq(HttpMethod.GET),
                userRequestCaptor.capture(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(userResponseEntity);

        DiscordUserDto result = discordClient.fetchDiscordUser("auth_code_xyz");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("987654321012345678");
        assertThat(result.getUsername()).isEqualTo("RNGCommander");
        assertThat(result.getEmail()).isEqualTo("commander@rednecksgaming.com");
        assertThat(result.getAvatar()).isEqualTo("avatar_hash_abcdef");

        HttpEntity<MultiValueMap<String, String>> capturedTokenReq = tokenRequestCaptor.getValue();
        assertThat(capturedTokenReq.getBody()).isNotNull();
        assertThat(capturedTokenReq.getBody().getFirst("client_id")).isEqualTo(CLIENT_ID);
        assertThat(capturedTokenReq.getBody().getFirst("client_secret")).isEqualTo(CLIENT_SECRET);
        assertThat(capturedTokenReq.getBody().getFirst("grant_type")).isEqualTo("authorization_code");
        assertThat(capturedTokenReq.getBody().getFirst("code")).isEqualTo("auth_code_xyz");
        assertThat(capturedTokenReq.getBody().getFirst("redirect_uri")).isEqualTo(DEFAULT_REDIRECT_URI);

        HttpEntity<Void> capturedUserReq = userRequestCaptor.getValue();
        assertThat(capturedUserReq.getHeaders().getFirst(HttpHeaders.AUTHORIZATION))
                .isEqualTo("Bearer discord_mock_token_123");
    }

    @Test
    @DisplayName("fetchDiscordUser handles null avatar and email attributes in Discord response")
    void fetchDiscordUser_withNullAvatarAndEmail_returnsDtoWithNulls() {
        Map<String, Object> tokenBody = Map.of("access_token", "discord_mock_token_no_email");
        ResponseEntity<Map<String, Object>> tokenResponseEntity = ResponseEntity.ok(tokenBody);

        java.util.HashMap<String, Object> userBody = new java.util.HashMap<>();
        userBody.put("id", "555666777888999000");
        userBody.put("username", "PrivacyFocusedUser");
        userBody.put("email", null);
        userBody.put("avatar", null);
        ResponseEntity<Map<String, Object>> userResponseEntity = ResponseEntity.ok(userBody);

        when(restTemplate.exchange(
                eq("https://discord.com/api/oauth2/token"),
                eq(HttpMethod.POST),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(tokenResponseEntity);

        when(restTemplate.exchange(
                eq("https://discord.com/api/users/@me"),
                eq(HttpMethod.GET),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(userResponseEntity);

        DiscordUserDto result = discordClient.fetchDiscordUser("auth_code_privacy");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("555666777888999000");
        assertThat(result.getUsername()).isEqualTo("PrivacyFocusedUser");
        assertThat(result.getEmail()).isNull();
        assertThat(result.getAvatar()).isNull();
    }

    @Test
    @DisplayName("fetchDiscordUser with non-blank override redirect URI trims and uses override")
    void fetchDiscordUser_withOverrideRedirectUri_success() {
        String overrideUri = "  https://control.rednecksgaming.com/auth/discord/callback  ";
        String expectedTrimmed = "https://control.rednecksgaming.com/auth/discord/callback";

        Map<String, Object> tokenBody = Map.of("access_token", "discord_mock_token_override");
        ResponseEntity<Map<String, Object>> tokenResponseEntity = ResponseEntity.ok(tokenBody);

        Map<String, Object> userBody = Map.of(
                "id", "111222333444555666",
                "username", "HighCommandUser",
                "email", "hc@rednecksgaming.com",
                "avatar", "avatar_override"
        );
        ResponseEntity<Map<String, Object>> userResponseEntity = ResponseEntity.ok(userBody);

        when(restTemplate.exchange(
                eq("https://discord.com/api/oauth2/token"),
                eq(HttpMethod.POST),
                tokenRequestCaptor.capture(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(tokenResponseEntity);

        when(restTemplate.exchange(
                eq("https://discord.com/api/users/@me"),
                eq(HttpMethod.GET),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(userResponseEntity);

        DiscordUserDto result = discordClient.fetchDiscordUser("auth_code_override", overrideUri);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("111222333444555666");

        HttpEntity<MultiValueMap<String, String>> capturedTokenReq = tokenRequestCaptor.getValue();
        assertThat(capturedTokenReq.getBody().getFirst("redirect_uri")).isEqualTo(expectedTrimmed);
    }

    @Test
    @DisplayName("fetchDiscordUser with empty or blank override redirect URI falls back to default URI")
    void fetchDiscordUser_withBlankOverrideRedirectUri_fallsBackToDefault() {
        Map<String, Object> tokenBody = Map.of("access_token", "discord_mock_token_blank");
        ResponseEntity<Map<String, Object>> tokenResponseEntity = ResponseEntity.ok(tokenBody);

        Map<String, Object> userBody = Map.of(
                "id", "222333444555666777",
                "username", "UserBlank",
                "email", "blank@rednecksgaming.com",
                "avatar", "avatar_blank"
        );
        ResponseEntity<Map<String, Object>> userResponseEntity = ResponseEntity.ok(userBody);

        when(restTemplate.exchange(
                eq("https://discord.com/api/oauth2/token"),
                eq(HttpMethod.POST),
                tokenRequestCaptor.capture(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(tokenResponseEntity);

        when(restTemplate.exchange(
                eq("https://discord.com/api/users/@me"),
                eq(HttpMethod.GET),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(userResponseEntity);

        DiscordUserDto result = discordClient.fetchDiscordUser("code", "   ");

        assertThat(result).isNotNull();
        assertThat(tokenRequestCaptor.getValue().getBody().getFirst("redirect_uri")).isEqualTo(DEFAULT_REDIRECT_URI);
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when token endpoint returns non-2xx")
    void fetchDiscordUser_tokenEndpointNon2xx_throwsUnauthorizedException() {
        ResponseEntity<Map<String, Object>> tokenErrorResponse = ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);

        when(restTemplate.exchange(
                eq("https://discord.com/api/oauth2/token"),
                eq(HttpMethod.POST),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(tokenErrorResponse);

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("bad_code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid or expired Discord OAuth2 code");
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when token endpoint returns null body")
    void fetchDiscordUser_tokenEndpointNullBody_throwsUnauthorizedException() {
        ResponseEntity<Map<String, Object>> tokenNullBody = ResponseEntity.ok(null);

        when(restTemplate.exchange(
                eq("https://discord.com/api/oauth2/token"),
                eq(HttpMethod.POST),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(tokenNullBody);

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("code_null_body"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Failed to obtain Discord OAuth2 token");
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when user profile endpoint returns non-2xx")
    void fetchDiscordUser_userEndpointNon2xx_throwsUnauthorizedException() {
        Map<String, Object> tokenBody = Map.of("access_token", "discord_valid_token");
        when(restTemplate.exchange(
                eq("https://discord.com/api/oauth2/token"),
                eq(HttpMethod.POST),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(ResponseEntity.ok(tokenBody));

        when(restTemplate.exchange(
                eq("https://discord.com/api/users/@me"),
                eq(HttpMethod.GET),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(ResponseEntity.status(HttpStatus.FORBIDDEN).body(null));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("valid_code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Failed to fetch Discord user details");
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when user profile endpoint returns null body")
    void fetchDiscordUser_userEndpointNullBody_throwsUnauthorizedException() {
        Map<String, Object> tokenBody = Map.of("access_token", "discord_valid_token");
        when(restTemplate.exchange(
                eq("https://discord.com/api/oauth2/token"),
                eq(HttpMethod.POST),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(ResponseEntity.ok(tokenBody));

        when(restTemplate.exchange(
                eq("https://discord.com/api/users/@me"),
                eq(HttpMethod.GET),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(ResponseEntity.ok(null));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("valid_code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Failed to fetch Discord user details");
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when token exchange throws HttpClientErrorException")
    void fetchDiscordUser_restClientExceptionOnToken_throwsUnauthorizedException() {
        when(restTemplate.exchange(
                eq("https://discord.com/api/oauth2/token"),
                eq(HttpMethod.POST),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED, "invalid_grant"));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("expired_code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid or expired Discord OAuth2 code: 401 invalid_grant");
    }

    @Test
    @DisplayName("fetchDiscordUser throws UnauthorizedException when user profile exchange throws exception")
    void fetchDiscordUser_restClientExceptionOnUser_throwsUnauthorizedException() {
        Map<String, Object> tokenBody = Map.of("access_token", "discord_valid_token");
        when(restTemplate.exchange(
                eq("https://discord.com/api/oauth2/token"),
                eq(HttpMethod.POST),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(ResponseEntity.ok(tokenBody));

        when(restTemplate.exchange(
                eq("https://discord.com/api/users/@me"),
                eq(HttpMethod.GET),
                any(),
                any(ParameterizedTypeReference.class)
        )).thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND, "User not found"));

        assertThatThrownBy(() -> discordClient.fetchDiscordUser("valid_code"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid or expired Discord OAuth2 code");
    }
}
