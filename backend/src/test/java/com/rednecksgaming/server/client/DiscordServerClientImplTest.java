// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.server.client;

import com.rednecksgaming.common.exception.ConflictException;
import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.common.exception.ServiceUnavailableException;
import com.rednecksgaming.common.exception.UnauthorizedException;
import com.rednecksgaming.server.dto.discord.DiscordChannelDto;
import com.rednecksgaming.server.dto.discord.DiscordEmojiResponseDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildDetailDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildDto;
import com.rednecksgaming.server.dto.discord.DiscordGuildPatchRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscordServerClientImplTest {

    @Mock
    private RestTemplate restTemplate;

    private DiscordServerClientImpl client;

    @BeforeEach
    void setUp() {
        client = new DiscordServerClientImpl(restTemplate, "valid_bot_token_12345");
    }

    @Test
    @DisplayName("Default constructor should instantiate client with default rest template")
    void testDefaultConstructor() {
        DiscordServerClientImpl defaultClient = new DiscordServerClientImpl();
        assertThat(defaultClient).isNotNull();
    }

    @Test
    @DisplayName("cleanToken and createHeaders handles quotes, bot prefix, and placeholder warning")
    void testTokenCleaningAndHeaders() {
        DiscordServerClientImpl quotedClient = new DiscordServerClientImpl(restTemplate, " \"Bot test_quoted_token\" ");
        when(restTemplate.exchange(contains("/users/@me/guilds"), eq(HttpMethod.GET), any(), eq(DiscordGuildDto[].class)))
                .thenReturn(ResponseEntity.ok(new DiscordGuildDto[0]));

        quotedClient.getBotGuilds();

        ArgumentCaptor<HttpEntity<Void>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/users/@me/guilds"), eq(HttpMethod.GET), captor.capture(), eq(DiscordGuildDto[].class));

        HttpHeaders headers = captor.getValue().getHeaders();
        assertThat(headers.getFirst("Authorization")).isEqualTo("Bot test_quoted_token");
        assertThat(headers.getFirst("User-Agent")).contains("DiscordBot");
    }

    @Test
    @DisplayName("cleanToken handles single quotes, placeholder token, and null token")
    void testTokenCleaningSingleQuotesAndPlaceholders() {
        DiscordServerClientImpl singleQuotedClient = new DiscordServerClientImpl(restTemplate, "'your-discord-bot-token'");
        when(restTemplate.exchange(contains("/users/@me/guilds"), eq(HttpMethod.GET), any(), eq(DiscordGuildDto[].class)))
                .thenReturn(ResponseEntity.ok(new DiscordGuildDto[0]));

        singleQuotedClient.getBotGuilds();

        DiscordServerClientImpl nullTokenClient = new DiscordServerClientImpl(restTemplate, null);
        nullTokenClient.getBotGuilds();
    }

    @Test
    @DisplayName("createHeaders sets encoded X-Audit-Log-Reason when reason is provided")
    void testCreateHeadersWithAuditReason() {
        DiscordGuildPatchRequest patchReq = DiscordGuildPatchRequest.builder().name("Renamed Server").build();
        when(restTemplate.exchange(contains("/guilds/123"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenReturn(ResponseEntity.ok().build());

        client.updateGuildSettings("123", patchReq, "Changed by Admin for testing + audit");

        ArgumentCaptor<HttpEntity<DiscordGuildPatchRequest>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/guilds/123"), eq(HttpMethod.PATCH), captor.capture(), eq(Void.class));

        HttpHeaders headers = captor.getValue().getHeaders();
        assertThat(headers.getFirst("X-Audit-Log-Reason")).isEqualTo("Changed%20by%20Admin%20for%20testing%20%2B%20audit");
    }

    @Test
    @DisplayName("getBotGuilds returns list on success and empty list on null body")
    void testGetBotGuilds() {
        DiscordGuildDto guild = DiscordGuildDto.builder().id("g_1").name("Guild One").build();
        when(restTemplate.exchange(contains("/users/@me/guilds"), eq(HttpMethod.GET), any(), eq(DiscordGuildDto[].class)))
                .thenReturn(ResponseEntity.ok(new DiscordGuildDto[]{guild}));

        List<DiscordGuildDto> result = client.getBotGuilds();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("g_1");

        when(restTemplate.exchange(contains("/users/@me/guilds"), eq(HttpMethod.GET), any(), eq(DiscordGuildDto[].class)))
                .thenReturn(ResponseEntity.ok(null));
        assertThat(client.getBotGuilds()).isEmpty();
    }

    @Test
    @DisplayName("getGuildDetails returns detail DTO on success")
    void testGetGuildDetailsSuccess() {
        DiscordGuildDetailDto detail = DiscordGuildDetailDto.builder().id("g_1").name("Guild Detail").build();
        when(restTemplate.exchange(contains("/guilds/g_1"), eq(HttpMethod.GET), any(), eq(DiscordGuildDetailDto.class)))
                .thenReturn(ResponseEntity.ok(detail));

        DiscordGuildDetailDto result = client.getGuildDetails("g_1");
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Guild Detail");
    }

    @Test
    @DisplayName("getGuildChannels returns channel list on success and empty list on null body")
    void testGetGuildChannels() {
        DiscordChannelDto channel = DiscordChannelDto.builder().id("c_1").name("chat").type(0).build();
        when(restTemplate.exchange(contains("/guilds/g_1/channels"), eq(HttpMethod.GET), any(), eq(DiscordChannelDto[].class)))
                .thenReturn(ResponseEntity.ok(new DiscordChannelDto[]{channel}));

        List<DiscordChannelDto> channels = client.getGuildChannels("g_1");
        assertThat(channels).hasSize(1);
        assertThat(channels.get(0).getName()).isEqualTo("chat");

        when(restTemplate.exchange(contains("/guilds/g_1/channels"), eq(HttpMethod.GET), any(), eq(DiscordChannelDto[].class)))
                .thenReturn(ResponseEntity.ok(null));
        assertThat(client.getGuildChannels("g_1")).isEmpty();
    }

    @Test
    @DisplayName("updateGuildSettings executes PATCH exchange")
    void testUpdateGuildSettings() {
        DiscordGuildPatchRequest patchReq = DiscordGuildPatchRequest.builder().name("Server Updated").build();
        when(restTemplate.exchange(contains("/guilds/g_1"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenReturn(ResponseEntity.ok().build());

        client.updateGuildSettings("g_1", patchReq, null);

        verify(restTemplate).exchange(contains("/guilds/g_1"), eq(HttpMethod.PATCH), any(), eq(Void.class));
    }

    @Test
    @DisplayName("updateGuildWidget sets enabled and channelId when present")
    void testUpdateGuildWidget() {
        when(restTemplate.exchange(contains("/guilds/g_1/widget"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenReturn(ResponseEntity.ok().build());

        client.updateGuildWidget("g_1", true, "c_widget_1", "Enabling widget");

        ArgumentCaptor<HttpEntity<Map<String, Object>>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/guilds/g_1/widget"), eq(HttpMethod.PATCH), captor.capture(), eq(Void.class));

        Map<String, Object> body = captor.getValue().getBody();
        assertThat(body.get("enabled")).isEqualTo(true);
        assertThat(body.get("channel_id")).isEqualTo("c_widget_1");

        // Without channelId
        client.updateGuildWidget("g_1", false, null, null);
    }

    @Test
    @DisplayName("getGuildEmojis returns emojis on success, empty list on null body, and catches exceptions")
    void testGetGuildEmojis() {
        DiscordEmojiResponseDto emoji = new DiscordEmojiResponseDto("e_1", "pepe", false, true, true);
        when(restTemplate.exchange(contains("/guilds/g_1/emojis"), eq(HttpMethod.GET), any(), eq(DiscordEmojiResponseDto[].class)))
                .thenReturn(ResponseEntity.ok(new DiscordEmojiResponseDto[]{emoji}));

        List<DiscordEmojiResponseDto> result = client.getGuildEmojis("g_1");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("pepe");

        when(restTemplate.exchange(contains("/guilds/g_1/emojis"), eq(HttpMethod.GET), any(), eq(DiscordEmojiResponseDto[].class)))
                .thenReturn(ResponseEntity.ok(null));
        assertThat(client.getGuildEmojis("g_1")).isEmpty();

        when(restTemplate.exchange(contains("/guilds/g_1/emojis"), eq(HttpMethod.GET), any(), eq(DiscordEmojiResponseDto[].class)))
                .thenThrow(new RuntimeException("Network down"));
        assertThat(client.getGuildEmojis("g_1")).isEmpty();
    }

    @Test
    @DisplayName("getApplicationEmojis parses items list, handles null, and catches exceptions")
    void testGetApplicationEmojis() {
        Map<String, Object> bodyWithItems = Map.of(
                "items", List.of(Map.of("id", "app_e1", "name", "badge", "animated", false, "available", true, "require_colons", true))
        );
        when(restTemplate.exchange(contains("/applications/app_1/emojis"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(bodyWithItems));

        List<DiscordEmojiResponseDto> result = client.getApplicationEmojis("app_1");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("badge");

        // Body without items
        when(restTemplate.exchange(contains("/applications/app_1/emojis"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of()));
        assertThat(client.getApplicationEmojis("app_1")).isEmpty();

        // Null body
        when(restTemplate.exchange(contains("/applications/app_1/emojis"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(null));
        assertThat(client.getApplicationEmojis("app_1")).isEmpty();

        // Exception
        when(restTemplate.exchange(contains("/applications/app_1/emojis"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("App emoji error"));
        assertThat(client.getApplicationEmojis("app_1")).isEmpty();
    }

    @Test
    @DisplayName("getApplicationId returns ID string, null when missing, and catches exceptions")
    void testGetApplicationId() {
        when(restTemplate.exchange(contains("/oauth2/applications/@me"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("id", "999888777")));

        assertThat(client.getApplicationId()).isEqualTo("999888777");

        when(restTemplate.exchange(contains("/oauth2/applications/@me"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of()));
        assertThat(client.getApplicationId()).isNull();

        when(restTemplate.exchange(contains("/oauth2/applications/@me"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(null));
        assertThat(client.getApplicationId()).isNull();

        when(restTemplate.exchange(contains("/oauth2/applications/@me"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("OAuth failed"));
        assertThat(client.getApplicationId()).isNull();
    }

    @Test
    @DisplayName("handleException maps HTTP 409 Conflict to ConflictException")
    void testHandleExceptionConflict() {
        HttpClientErrorException ex = HttpClientErrorException.create(HttpStatus.CONFLICT, "Conflict", HttpHeaders.EMPTY, "Conflict body".getBytes(StandardCharsets.UTF_8), null);
        when(restTemplate.exchange(contains("/guilds/g_1"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("g_1", DiscordGuildPatchRequest.builder().name("x").build(), null))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already in conflict");
    }

    @Test
    @DisplayName("handleException maps HTTP 400 Bad Request to IllegalArgumentException")
    void testHandleExceptionBadRequest() {
        HttpClientErrorException ex = HttpClientErrorException.create(HttpStatus.BAD_REQUEST, "Bad Request", HttpHeaders.EMPTY, "Invalid payload".getBytes(StandardCharsets.UTF_8), null);
        when(restTemplate.exchange(contains("/guilds/g_1"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("g_1", DiscordGuildPatchRequest.builder().name("x").build(), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid Discord server settings");
    }

    @Test
    @DisplayName("handleException maps HTTP 404 Not Found to ResourceNotFoundException")
    void testHandleExceptionNotFound() {
        HttpClientErrorException ex = HttpClientErrorException.create(HttpStatus.NOT_FOUND, "Not Found", HttpHeaders.EMPTY, "Missing guild".getBytes(StandardCharsets.UTF_8), null);
        when(restTemplate.exchange(contains("/guilds/g_1"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("g_1", DiscordGuildPatchRequest.builder().name("x").build(), null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Discord server or channel was not found");
    }

    @Test
    @DisplayName("handleException maps HTTP 401 Unauthorized to UnauthorizedException")
    void testHandleExceptionUnauthorized() {
        HttpClientErrorException ex = HttpClientErrorException.create(HttpStatus.UNAUTHORIZED, "Unauthorized", HttpHeaders.EMPTY, "Bad Token".getBytes(StandardCharsets.UTF_8), null);
        when(restTemplate.exchange(contains("/guilds/g_1"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("g_1", DiscordGuildPatchRequest.builder().name("x").build(), null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Discord Bot Token (DISCORD_BOT_TOKEN) is invalid");
    }

    @Test
    @DisplayName("handleException maps HTTP 403 Forbidden to ForbiddenException")
    void testHandleExceptionForbidden() {
        HttpClientErrorException ex = HttpClientErrorException.create(HttpStatus.FORBIDDEN, "Forbidden", HttpHeaders.EMPTY, "No permissions".getBytes(StandardCharsets.UTF_8), null);
        when(restTemplate.exchange(contains("/guilds/g_1"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("g_1", DiscordGuildPatchRequest.builder().name("x").build(), null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Bot does not have required permissions");
    }

    @Test
    @DisplayName("handleException maps 5xx server errors to ServiceUnavailableException")
    void testHandleException5xx() {
        HttpServerErrorException ex = HttpServerErrorException.create(HttpStatus.INTERNAL_SERVER_ERROR, "Server Error", HttpHeaders.EMPTY, "Outage".getBytes(StandardCharsets.UTF_8), null);
        when(restTemplate.exchange(contains("/guilds/g_1"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("g_1", DiscordGuildPatchRequest.builder().name("x").build(), null))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("Discord API is currently experiencing outages");
    }

    @Test
    @DisplayName("handleException maps ResourceAccessException to ServiceUnavailableException")
    void testHandleExceptionResourceAccessException() {
        ResourceAccessException ex = new ResourceAccessException("Timeout");
        when(restTemplate.exchange(contains("/guilds/g_1"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("g_1", DiscordGuildPatchRequest.builder().name("x").build(), null))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("Discord API is currently unreachable");
    }

    @Test
    @DisplayName("handleException maps unhandled HTTP status codes and rethrows RuntimeException")
    void testHandleExceptionOtherStatusAndRuntimeException() {
        HttpClientErrorException ex = HttpClientErrorException.create(HttpStatus.I_AM_A_TEAPOT, "Teapot", HttpHeaders.EMPTY, "".getBytes(StandardCharsets.UTF_8), null);
        when(restTemplate.exchange(contains("/guilds/g_1"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("g_1", DiscordGuildPatchRequest.builder().name("x").build(), null))
                .isInstanceOf(HttpClientErrorException.class);
    }

    @Test
    @DisplayName("getGuildDetails delegates to handleException when restTemplate throws")
    void testGetGuildDetailsException() {
        when(restTemplate.exchange(contains("/guilds/g_err"), eq(HttpMethod.GET), any(), eq(DiscordGuildDetailDto.class)))
                .thenThrow(new ResourceAccessException("Connection timed out"));

        assertThatThrownBy(() -> client.getGuildDetails("g_err"))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("getGuildChannels delegates to handleException when restTemplate throws")
    void testGetGuildChannelsException() {
        when(restTemplate.exchange(contains("/guilds/g_err/channels"), eq(HttpMethod.GET), any(), eq(DiscordChannelDto[].class)))
                .thenThrow(new ResourceAccessException("Connection timed out"));

        assertThatThrownBy(() -> client.getGuildChannels("g_err"))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("updateGuildWidget delegates to handleException when restTemplate throws")
    void testUpdateGuildWidgetException() {
        when(restTemplate.exchange(contains("/guilds/g_err/widget"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenThrow(new ResourceAccessException("Widget error"));

        assertThatThrownBy(() -> client.updateGuildWidget("g_err", true, "ch_1", null))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("createHeaders ignores whitespace-only auditReason and cleanToken handles placeholder and unmatched quote")
    void testCreateHeadersWhitespaceAuditAndCleanTokenEdgeCases() {
        DiscordServerClientImpl placeholderClient = new DiscordServerClientImpl(restTemplate, "discord-bot-token-placeholder");
        when(restTemplate.exchange(contains("/guilds/g_edge"), eq(HttpMethod.PATCH), any(), eq(Void.class)))
                .thenReturn(ResponseEntity.ok().build());

        placeholderClient.updateGuildSettings("g_edge", DiscordGuildPatchRequest.builder().name("y").build(), "   ");

        ArgumentCaptor<HttpEntity<DiscordGuildPatchRequest>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/guilds/g_edge"), eq(HttpMethod.PATCH), captor.capture(), eq(Void.class));
        assertThat(captor.getValue().getHeaders().getFirst("X-Audit-Log-Reason")).isNull();

        // Token starting with quote but not ending with quote
        DiscordServerClientImpl unmatchedQuoteClient = new DiscordServerClientImpl(restTemplate, "\"unmatched_quote");
        when(restTemplate.exchange(contains("/users/@me/guilds"), eq(HttpMethod.GET), any(), eq(DiscordGuildDto[].class)))
                .thenReturn(ResponseEntity.ok(new DiscordGuildDto[0]));
        unmatchedQuoteClient.getBotGuilds();
    }

    @Test
    @DisplayName("getApplicationEmojis returns empty list when items is not a List")
    void testGetApplicationEmojisNonListItems() {
        when(restTemplate.exchange(contains("/applications/app_invalid/emojis"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("items", "not-a-list")));

        assertThat(client.getApplicationEmojis("app_invalid")).isEmpty();
    }
}
