package com.rng.server.client;

import com.rng.common.exception.ConflictException;
import com.rng.common.exception.ForbiddenException;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.common.exception.ServiceUnavailableException;
import com.rng.common.exception.UnauthorizedException;
import com.rng.server.dto.discord.DiscordChannelDto;
import com.rng.server.dto.discord.DiscordGuildDetailDto;
import com.rng.server.dto.discord.DiscordGuildDto;
import com.rng.server.dto.discord.DiscordGuildPatchRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class DiscordServerClientImpl implements DiscordServerClient {

    private static final String DISCORD_API_BASE = "https://discord.com/api/v10";

    private final RestTemplate restTemplate;

    @Value("${app.discord.bot-token:}")
    private String botToken;

    public DiscordServerClientImpl() {
        this.restTemplate = new RestTemplate(new JdkClientHttpRequestFactory());
    }

    public DiscordServerClientImpl(RestTemplate restTemplate, String botToken) {
        this.restTemplate = restTemplate;
        this.botToken = botToken;
    }

    private String cleanToken(String raw) {
        if (raw == null) return "";
        String t = raw.trim();
        if ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'"))) {
            t = t.substring(1, t.length() - 1).trim();
        }
        if (t.toLowerCase().startsWith("bot ")) {
            t = t.substring(4).trim();
        }
        return t;
    }

    private HttpHeaders createHeaders(String auditReason) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("User-Agent", "DiscordBot (https://rednecksgaming.com, 1.0.0)");
        String token = cleanToken(botToken);
        if (token.isBlank() || "your-discord-bot-token".equalsIgnoreCase(token) || "discord-bot-token-placeholder".equalsIgnoreCase(token)) {
            log.error("CRITICAL: DISCORD_BOT_TOKEN is blank or placeholder ('{}'). Discord API will reject with 401 Unauthorized.", botToken);
        }
        headers.set("Authorization", "Bot " + token);
        if (auditReason != null && !auditReason.isBlank()) {
            try {
                String encoded = URLEncoder.encode(auditReason, StandardCharsets.UTF_8).replace("+", "%20");
                headers.set("X-Audit-Log-Reason", encoded);
            } catch (Exception e) {
                headers.set("X-Audit-Log-Reason", auditReason);
            }
        }
        return headers;
    }

    @Override
    public List<DiscordGuildDto> getBotGuilds() {
        String url = DISCORD_API_BASE + "/users/@me/guilds?with_counts=true";
        try {
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders(null));
            ResponseEntity<DiscordGuildDto[]> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    DiscordGuildDto[].class
            );
            if (response.getBody() == null) {
                return List.of();
            }
            return Arrays.asList(response.getBody());
        } catch (Exception e) {
            handleException("getBotGuilds", e);
            return List.of();
        }
    }

    @Override
    public DiscordGuildDetailDto getGuildDetails(String guildId) {
        String url = DISCORD_API_BASE + "/guilds/" + guildId + "?with_counts=true";
        try {
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders(null));
            ResponseEntity<DiscordGuildDetailDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    DiscordGuildDetailDto.class
            );
            return response.getBody();
        } catch (Exception e) {
            handleException("getGuildDetails for " + guildId, e);
            return null;
        }
    }

    @Override
    public List<DiscordChannelDto> getGuildChannels(String guildId) {
        String url = DISCORD_API_BASE + "/guilds/" + guildId + "/channels";
        try {
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders(null));
            ResponseEntity<DiscordChannelDto[]> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    DiscordChannelDto[].class
            );
            if (response.getBody() == null) {
                return List.of();
            }
            return Arrays.asList(response.getBody());
        } catch (Exception e) {
            handleException("getGuildChannels for " + guildId, e);
            return List.of();
        }
    }

    @Override
    public void updateGuildSettings(String guildId, DiscordGuildPatchRequest request, String auditReason) {
        String url = DISCORD_API_BASE + "/guilds/" + guildId;
        try {
            HttpEntity<DiscordGuildPatchRequest> entity = new HttpEntity<>(request, createHeaders(auditReason));
            restTemplate.exchange(url, HttpMethod.PATCH, entity, Void.class);
        } catch (Exception e) {
            handleException("updateGuildSettings for " + guildId, e);
        }
    }

    @Override
    public void updateGuildWidget(String guildId, boolean enabled, String channelId, String auditReason) {
        String url = DISCORD_API_BASE + "/guilds/" + guildId + "/widget";
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("enabled", enabled);
            if (channelId != null) {
                body.put("channel_id", channelId);
            }
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders(auditReason));
            restTemplate.exchange(url, HttpMethod.PATCH, entity, Void.class);
        } catch (Exception e) {
            handleException("updateGuildWidget for " + guildId, e);
        }
    }

    @Override
    public List<com.rng.server.dto.discord.DiscordEmojiResponseDto> getGuildEmojis(String guildId) {
        String url = DISCORD_API_BASE + "/guilds/" + guildId + "/emojis";
        HttpHeaders headers = createHeaders(null);
        HttpEntity<?> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<com.rng.server.dto.discord.DiscordEmojiResponseDto[]> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, com.rng.server.dto.discord.DiscordEmojiResponseDto[].class
            );
            if (response.getBody() == null) return List.of();
            return Arrays.asList(response.getBody());
        } catch (Exception e) {
            log.warn("Failed to fetch guild emojis from Discord REST for guild {}: {}", guildId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public List<com.rng.server.dto.discord.DiscordEmojiResponseDto> getApplicationEmojis(String applicationId) {
        String url = DISCORD_API_BASE + "/applications/" + applicationId + "/emojis";
        HttpHeaders headers = createHeaders(null);
        HttpEntity<?> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, Map.class
            );
            if (response.getBody() != null && response.getBody().get("items") instanceof List<?> itemsList) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                return mapper.convertValue(
                        itemsList,
                        new com.fasterxml.jackson.core.type.TypeReference<List<com.rng.server.dto.discord.DiscordEmojiResponseDto>>() {}
                );
            }
            return List.of();
        } catch (Exception e) {
            log.warn("Failed to fetch application emojis from Discord REST for app {}: {}", applicationId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public String getApplicationId() {
        String url = DISCORD_API_BASE + "/oauth2/applications/@me";
        HttpHeaders headers = createHeaders(null);
        HttpEntity<?> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, Map.class
            );
            if (response.getBody() != null && response.getBody().get("id") != null) {
                return String.valueOf(response.getBody().get("id"));
            }
        } catch (Exception e) {
            log.warn("Failed to fetch application ID from Discord REST: {}", e.getMessage());
        }
        return null;
    }

    private void handleException(String operation, Exception e) {
        log.error("Discord API call failed in {}: {}", operation, e.getMessage());
        if (e instanceof HttpStatusCodeException statusEx) {
            String responseBody = statusEx.getResponseBodyAsString();
            log.warn("Discord error response status={} body={}", statusEx.getStatusCode(), responseBody);

            if (statusEx.getStatusCode() == HttpStatus.CONFLICT) {
                throw new ConflictException("The requested setting is already in conflict with another Discord server.");
            }
            if (statusEx.getStatusCode() == HttpStatus.BAD_REQUEST) {
                throw new IllegalArgumentException("Invalid Discord server settings: " + responseBody);
            }
            if (statusEx.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new ResourceNotFoundException("Discord server or channel was not found.");
            }
            if (statusEx.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new UnauthorizedException("Discord Bot Token (DISCORD_BOT_TOKEN) is invalid, expired, or missing: " + responseBody);
            }
            if (statusEx.getStatusCode() == HttpStatus.FORBIDDEN) {
                throw new ForbiddenException("Bot does not have required permissions in this Discord server: " + responseBody);
            }
            if (statusEx.getStatusCode().is5xxServerError()) {
                throw new ServiceUnavailableException("Discord API is currently experiencing outages. Please try again later.");
            }
        }
        if (e instanceof ResourceAccessException) {
            throw new ServiceUnavailableException("Discord API is currently unreachable. Please try again later.");
        }
        if (e instanceof RuntimeException re) {
            throw re;
        }
        throw new ServiceUnavailableException("Discord operation failed: " + e.getMessage());
    }
}
