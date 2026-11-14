// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.common.exception.BadRequestException;
import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.common.exception.InternalServerException;
import com.rednecksgaming.common.exception.ServiceUnavailableException;
import com.rednecksgaming.common.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Enterprise Spring RestClient implementation for Discord REST API v10 outbound message dispatch.
 * Operates on Java 21 Virtual Threads with rate-limit jitter backoff, Cloudflare edge-ban tripwires,
 * and multipart/form-data support.
 */
@Slf4j
@Service
public class DiscordDispatchServiceImpl implements DiscordDispatchService {

    private static final String DISCORD_API_BASE = "https://discord.com/api/v10";
    private static final String USER_AGENT = "DiscordBot (https://rednecksgaming.com, 1.0.0)";
    private static final int MAX_RATE_LIMIT_RETRIES = 3;
    private static final String EDGE_BAN_KEY = "discord:circuit:edge_ban";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.discord.bot-token:}")
    private String botToken;

    @Autowired
    public DiscordDispatchServiceImpl(ObjectMapper objectMapper, @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;

        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
        factory.setReadTimeout(Duration.ofSeconds(15));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader("User-Agent", USER_AGENT)
                .build();
    }

    // Package-private constructor for unit testing with custom RestClient
    DiscordDispatchServiceImpl(RestClient restClient, ObjectMapper objectMapper, StringRedisTemplate redisTemplate, String botToken) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
        this.botToken = botToken;
    }

    @Override
    public JsonNode dispatchToChannel(String channelId, Map<String, Object> payload, List<Resource> fileAttachments) {
        String url = DISCORD_API_BASE + "/channels/" + channelId + "/messages";
        String token = cleanToken(botToken);
        if (token.isBlank() || token.equalsIgnoreCase("your-discord-bot-token")) {
            throw new UnauthorizedException("Discord Bot Token (DISCORD_BOT_TOKEN) is not configured in .env. Please set a valid Discord Bot Token.");
        }

        return executeWithRetry(() -> {
            RestClient.RequestBodySpec requestSpec = restClient.post()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bot " + token);
            return sendRequest(requestSpec, payload, fileAttachments);
        });
    }

    @Override
    public JsonNode editOriginalInteraction(String applicationId, String interactionToken, Map<String, Object> payload) {
        String url = DISCORD_API_BASE + "/webhooks/" + applicationId + "/" + interactionToken + "/messages/@original";
        Map<String, Object> finalPayload = new HashMap<>(payload);
        if (!finalPayload.containsKey("flags")) {
            finalPayload.put("flags", 32768);
        }

        return executeWithRetry(() -> {
            RestClient.RequestBodySpec requestSpec = restClient.patch()
                    .uri(url);
            String token = cleanToken(botToken);
            if (!token.isBlank() && !token.equalsIgnoreCase("your-discord-bot-token")) {
                requestSpec.header(HttpHeaders.AUTHORIZATION, "Bot " + token);
            }
            String rawJson = requestSpec
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(finalPayload)
                    .retrieve()
                    .body(String.class);
            return parseResponse(rawJson);
        });
    }

    @Override
    public JsonNode sendFollowUpInteraction(String applicationId, String interactionToken, Map<String, Object> payload, boolean ephemeral) {
        String url = DISCORD_API_BASE + "/webhooks/" + applicationId + "/" + interactionToken;
        Map<String, Object> finalPayload = new HashMap<>(payload);
        int flags = 32768;
        if (ephemeral) {
            flags |= 64;
        }
        finalPayload.put("flags", flags);

        return executeWithRetry(() -> {
            RestClient.RequestBodySpec requestSpec = restClient.post()
                    .uri(url);
            String token = cleanToken(botToken);
            if (!token.isBlank() && !token.equalsIgnoreCase("your-discord-bot-token")) {
                requestSpec.header(HttpHeaders.AUTHORIZATION, "Bot " + token);
            }
            String rawJson = requestSpec
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(finalPayload)
                    .retrieve()
                    .body(String.class);
            return parseResponse(rawJson);
        });
    }

    private JsonNode sendRequest(RestClient.RequestBodySpec requestSpec, Map<String, Object> payload, List<Resource> fileAttachments) {
        if (fileAttachments == null || fileAttachments.isEmpty()) {
            String rawJson = requestSpec
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);
            return parseResponse(rawJson);
        } else {
            MultiValueMap<String, Object> multipartBody = new LinkedMultiValueMap<>();
            try {
                String payloadJsonString = objectMapper.writeValueAsString(payload);
                HttpHeaders jsonHeaders = new HttpHeaders();
                jsonHeaders.setContentType(MediaType.APPLICATION_JSON);
                multipartBody.add("payload_json", new HttpEntity<>(payloadJsonString, jsonHeaders));
            } catch (Exception e) {
                throw new InternalServerException("Failed to serialize Discord V2 payload to JSON", e);
            }

            for (int i = 0; i < fileAttachments.size(); i++) {
                multipartBody.add("files[" + i + "]", fileAttachments.get(i));
            }

            String rawJson = requestSpec
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(multipartBody)
                    .retrieve()
                    .body(String.class);
            return parseResponse(rawJson);
        }
    }

    private JsonNode parseResponse(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(rawJson);
        } catch (Exception e) {
            log.warn("Failed to parse Discord response payload as JsonNode: {}", rawJson, e);
            return objectMapper.createObjectNode();
        }
    }

    private JsonNode executeWithRetry(SupplierWithException<JsonNode> action) {
        // 1. Check Cloudflare Edge Ban circuit breaker
        if (redisTemplate != null && Boolean.TRUE.equals(redisTemplate.hasKey(EDGE_BAN_KEY))) {
            throw new ServiceUnavailableException("Discord Gateway temporarily throttled under Cloudflare edge protection. Retry in 10 minutes.");
        }

        int attempts = 0;
        while (attempts < MAX_RATE_LIMIT_RETRIES) {
            try {
                return action.get();
            } catch (HttpClientErrorException.TooManyRequests e) {
                attempts++;
                String responseBody = e.getResponseBodyAsString();

                // 2. Check for Cloudflare 1015 Edge Ban HTML response
                if (responseBody.contains("1015") || responseBody.contains("<html")) {
                    log.error("Cloudflare Edge Ban detected (Error 1015). Activating 10-minute circuit breaker.");
                    if (redisTemplate != null) {
                        redisTemplate.opsForValue().set(EDGE_BAN_KEY, "1", Duration.ofMinutes(10));
                    }
                    throw new ServiceUnavailableException("Cloudflare edge ban engaged. Outbound calls paused for 10 minutes.");
                }

                long backoffMs = parseRetryAfterWithJitter(e);
                log.warn("Discord Rate Limit (429). Attempt {}/{} - Backing off for {} ms", attempts, MAX_RATE_LIMIT_RETRIES, backoffMs);
                try {
                    Thread.sleep(backoffMs); // Suspends virtual thread, not carrier thread
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new InternalServerException("Dispatch interrupted during rate-limit backoff", ie);
                }
            } catch (HttpClientErrorException.Unauthorized e) {
                log.error("Discord API 401 Unauthorized - Invalid or expired bot credentials: {}", e.getMessage());
                throw new UnauthorizedException("Discord API rejected bot credentials (401 Unauthorized). Please check DISCORD_BOT_TOKEN in .env and verify the bot is in the server.");
            } catch (HttpClientErrorException.BadRequest e) {
                throw new BadRequestException("Discord rejected payload (400 Bad Request): " + e.getResponseBodyAsString());
            } catch (HttpClientErrorException.Forbidden e) {
                throw new ForbiddenException("Bot lacks permission to send to target channel (403 Forbidden).");
            } catch (ServiceUnavailableException | BadRequestException | ForbiddenException | UnauthorizedException e) {
                throw e;
            } catch (Exception e) {
                throw new InternalServerException("Discord dispatch error: " + e.getMessage(), e);
            }
        }
        throw new InternalServerException("Failed to dispatch to Discord after " + MAX_RATE_LIMIT_RETRIES + " rate limit retries.");
    }

    private long parseRetryAfterWithJitter(HttpClientErrorException.TooManyRequests e) {
        long jitter = ThreadLocalRandom.current().nextLong(50, 201); // 50-200ms randomized jitter
        try {
            JsonNode body = objectMapper.readTree(e.getResponseBodyAsString());
            if (body.has("retry_after")) {
                double retrySeconds = body.get("retry_after").asDouble();
                return (long) (retrySeconds * 1000) + jitter;
            }
        } catch (Exception ignored) {
        }

        // Fallback to Retry-After HTTP response header
        String retryAfterHeader = e.getResponseHeaders() != null ? e.getResponseHeaders().getFirst(HttpHeaders.RETRY_AFTER) : null;
        if (retryAfterHeader != null) {
            try {
                return (long) (Double.parseDouble(retryAfterHeader) * 1000) + jitter;
            } catch (NumberFormatException ignored) {
            }
        }

        return 1500L + jitter; // Default fallback
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

    @FunctionalInterface
    private interface SupplierWithException<T> {
        T get() throws Exception;
    }
}
