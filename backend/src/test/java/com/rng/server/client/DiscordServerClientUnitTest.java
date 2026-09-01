package com.rng.server.client;

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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscordServerClientUnitTest {

    @Mock
    private RestTemplate restTemplate;

    private DiscordServerClientImpl client;

    @BeforeEach
    void setUp() {
        client = new DiscordServerClientImpl(restTemplate, "mock-bot-token", "https://discord.com/api/v10");
    }

    @Test
    @DisplayName("Default constructor initializes properly")
    void defaultConstructors_initialize() {
        DiscordServerClientImpl defaultClient = new DiscordServerClientImpl();
        assertThat(defaultClient).isNotNull();

        DiscordServerClientImpl twoArgClient = new DiscordServerClientImpl(restTemplate, "token");
        assertThat(twoArgClient).isNotNull();
    }

    @Test
    @DisplayName("getBotGuilds returns empty list when response body is null")
    void getBotGuilds_nullBody_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(DiscordGuildDto[].class)))
                .thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        List<DiscordGuildDto> guilds = client.getBotGuilds();
        assertThat(guilds).isEmpty();
    }

    @Test
    @DisplayName("getGuildDetails returns null when exception occurs")
    void getGuildDetails_exception_returnsNull() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(DiscordGuildDetailDto.class)))
                .thenThrow(new ResourceAccessException("Connection timed out"));

        DiscordGuildDetailDto details = client.getGuildDetails("123");
        assertThat(details).isNull();
    }

    @Test
    @DisplayName("getGuildChannels returns empty list when response body is null")
    void getGuildChannels_nullBody_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(DiscordChannelDto[].class)))
                .thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        List<DiscordChannelDto> channels = client.getGuildChannels("123");
        assertThat(channels).isEmpty();
    }

    @Test
    @DisplayName("handleException maps 409 Conflict to ConflictException")
    void handleException_409Conflict_throwsConflict() {
        HttpClientErrorException ex = HttpClientErrorException.create(HttpStatus.CONFLICT, "Conflict", HttpHeaders.EMPTY, "taken".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("123", DiscordGuildPatchRequest.builder().name("HQ").build(), "Audit"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already taken");
    }

    @Test
    @DisplayName("handleException maps 400 Bad Request with code/50020 to ConflictException")
    void handleException_400VanityTaken_throwsConflict() {
        HttpClientErrorException ex = HttpClientErrorException.create(HttpStatus.BAD_REQUEST, "Bad Request", HttpHeaders.EMPTY, "{\"code\": 50020}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildVanityUrl("123", "taken-vanity", "Audit"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("vanity URL is already in use");
    }

    @Test
    @DisplayName("handleException maps 400 Bad Request (generic) to IllegalArgumentException")
    void handleException_400Generic_throwsIllegalArgument() {
        HttpClientErrorException ex = HttpClientErrorException.create(HttpStatus.BAD_REQUEST, "Bad Request", HttpHeaders.EMPTY, "{\"message\": \"Invalid payload\"}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("123", DiscordGuildPatchRequest.builder().name("HQ").build(), "Audit"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid Discord server settings");
    }

    @Test
    @DisplayName("handleException maps 404 Not Found to ResourceNotFoundException")
    void handleException_404NotFound_throwsResourceNotFound() {
        HttpClientErrorException ex = HttpClientErrorException.create(HttpStatus.NOT_FOUND, "Not Found", HttpHeaders.EMPTY, "{}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(ex);

        assertThatThrownBy(() -> client.updateGuildSettings("123", DiscordGuildPatchRequest.builder().name("HQ").build(), "Audit"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("was not found");
    }

    @Test
    @DisplayName("handleException maps 401 Unauthorized and 403 Forbidden to ForbiddenException")
    void handleException_401And403_throwsForbidden() {
        HttpClientErrorException ex401 = HttpClientErrorException.create(HttpStatus.UNAUTHORIZED, "Unauthorized", HttpHeaders.EMPTY, "{}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(ex401);

        assertThatThrownBy(() -> client.updateGuildSettings("123", DiscordGuildPatchRequest.builder().name("HQ").build(), "Audit"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Bot does not have required permissions");
    }

    @Test
    @DisplayName("handleException maps 429 Too Many Requests to ServiceUnavailableException")
    void handleException_429RateLimit_throwsServiceUnavailable() {
        HttpClientErrorException ex429 = HttpClientErrorException.create(HttpStatus.TOO_MANY_REQUESTS, "Rate Limit", HttpHeaders.EMPTY, "{}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(ex429);

        assertThatThrownBy(() -> client.updateGuildSettings("123", DiscordGuildPatchRequest.builder().name("HQ").build(), "Audit"))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("rate limit reached");
    }

    @Test
    @DisplayName("handleException maps 5xx Server Errors to ServiceUnavailableException")
    void handleException_5xxError_throwsServiceUnavailable() {
        HttpServerErrorException ex500 = HttpServerErrorException.create(HttpStatus.INTERNAL_SERVER_ERROR, "Server Error", HttpHeaders.EMPTY, "{}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(ex500);

        assertThatThrownBy(() -> client.updateGuildSettings("123", DiscordGuildPatchRequest.builder().name("HQ").build(), "Audit"))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("experiencing outages");
    }

    @Test
    @DisplayName("updateGuildWidget sets channel_id when non-null and omits when null")
    void updateGuildWidget_channelIdHandling() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.OK));

        client.updateGuildWidget("123", true, "channel-1", "Audit");
        client.updateGuildWidget("123", false, null, null);

        verify(restTemplate, org.mockito.Mockito.times(2)).exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(Void.class));
    }
}
