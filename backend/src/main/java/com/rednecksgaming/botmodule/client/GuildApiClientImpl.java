// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.botmodule.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.botmodule.service.PayloadNormalizer;
import com.rednecksgaming.common.exception.UpstreamServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;


@Slf4j
@Service
public class GuildApiClientImpl implements GuildApiClient {

    private final RestTemplate restTemplate;
    private final PayloadNormalizer payloadNormalizer;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String apiToken;
    private final int connectTimeoutMs;
    private final int readTimeoutMs;

    @Autowired
    public GuildApiClientImpl(
            PayloadNormalizer payloadNormalizer,
            ObjectMapper objectMapper,
            @Value("${app.guild-api.base-url:http://185.223.31.168:8790/v1}") String baseUrl,
            @Value("${app.guild-api.api-token:}") String apiToken,
            @Value("${app.guild-api.connect-timeout-ms:3000}") int connectTimeoutMs,
            @Value("${app.guild-api.read-timeout-ms:8000}") int readTimeoutMs
    ) {
        this.payloadNormalizer = payloadNormalizer;
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.apiToken = apiToken;
        this.connectTimeoutMs = connectTimeoutMs;
        this.readTimeoutMs = readTimeoutMs;

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMs))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));
        this.restTemplate = new RestTemplate(requestFactory);
    }

    public GuildApiClientImpl(
            RestTemplate restTemplate,
            PayloadNormalizer payloadNormalizer,
            ObjectMapper objectMapper,
            String baseUrl,
            String apiToken,
            int connectTimeoutMs,
            int readTimeoutMs
    ) {
        this.restTemplate = restTemplate;
        this.payloadNormalizer = payloadNormalizer;
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.apiToken = apiToken;
        this.connectTimeoutMs = connectTimeoutMs;
        this.readTimeoutMs = readTimeoutMs;
    }

    @Override
    public Map<String, Object> getDefaultModules() {
        String url = baseUrl + "/default";
        Map<String, Object> response = executeRequest(url, HttpMethod.GET, null);
        return payloadNormalizer.normalizeModules(response);
    }

    @Override
    public Map<String, Object> getGuildConfig() {
        String url = baseUrl + "/guildConfig";
        Map<String, Object> response = executeRequest(url, HttpMethod.GET, null);
        return payloadNormalizer.normalizeGuildConfigTree(response);
    }

    @Override
    public Map<String, Object> getGuildModules(String guildId) {
        String url = baseUrl + "/guild/" + guildId;
        Map<String, Object> response = executeRequest(url, HttpMethod.GET, null);
        return payloadNormalizer.normalizeServerResponse(response);
    }

    @Override
    public Map<String, Object> patchDefaultModules(String actorId, Map<String, Object> modules) {
        return patchDefaultModules(actorId, modules, null);
    }

    @Override
    public Map<String, Object> patchDefaultModules(String actorId, Map<String, Object> modules, Map<String, Object> network) {
        String url = baseUrl + "/default";
        Map<String, Object> payload = new HashMap<>();
        payload.put("actorId", actorId);
        if (modules != null) {
            payload.put("modules", payloadNormalizer.serializeOutgoingModules(modules));
        }
        if (network != null) {
            payload.put("network", network);
        }
        return executeRequest(url, HttpMethod.PATCH, payload);
    }

    @Override
    public Map<String, Object> patchGuildModules(String guildId, Map<String, Object> modules) {
        String url = baseUrl + "/guild/" + guildId;
        Map<String, Object> payload = Map.of("modules", payloadNormalizer.serializeOutgoingModules(modules));
        return executeRequest(url, HttpMethod.PATCH, payload);
    }

    @Override
    public Map<String, Object> deleteGuildModule(String guildId, String moduleName) {
        String url = baseUrl + "/guild/" + guildId + "/" + moduleName;
        return executeRequest(url, HttpMethod.DELETE, null);
    }

    private Map<String, Object> executeRequest(String url, HttpMethod method, Object body) {
        HttpHeaders headers = new HttpHeaders();
        if (apiToken != null && !apiToken.isBlank()) {
            headers.set("X-Api-Token", apiToken);
        }
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<?> entity = body != null ? new HttpEntity<>(body, headers) : new HttpEntity<>(headers);

        try {
            log.debug("Executing {} to upstream Guild API: {}", method, url);
            ResponseEntity<String> response = restTemplate.exchange(url, method, entity, String.class);

            if (response.getBody() == null || response.getBody().isBlank()) {
                return Collections.emptyMap();
            }

            Map<String, Object> bodyMap = objectMapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>() {});
            checkForUpstreamErrors(bodyMap);
            return bodyMap;
        } catch (UpstreamServiceException e) {
            throw e;
        } catch (ResourceAccessException e) {
            log.error("Timeout or connection refusal contacting upstream Guild API at {}: {}", url, e.getMessage());
            throw new UpstreamServiceException("Upstream Guild API connection timed out: " + e.getMessage(), e);
        } catch (HttpStatusCodeException e) {
            log.error("Upstream Guild API returned error HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new UpstreamServiceException("Upstream Guild API returned HTTP " + e.getStatusCode() + ": " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Unexpected error executing {} to {}: {}", method, url, e.getMessage(), e);
            throw new UpstreamServiceException("Failed communicating with upstream Guild API: " + e.getMessage(), e);
        }
    }

    private void checkForUpstreamErrors(Map<String, Object> bodyMap) {
        if (bodyMap == null) {
            return;
        }
        if (bodyMap.containsKey("error") && bodyMap.get("error") != null) {
            throw new UpstreamServiceException(String.valueOf(bodyMap.get("error")));
        }
        Object dataObj = bodyMap.get("data");
        if (dataObj instanceof Map<?, ?> dataMap) {
            if (dataMap.containsKey("error") && dataMap.get("error") != null) {
                throw new UpstreamServiceException(String.valueOf(dataMap.get("error")));
            }
            Object modulesObj = dataMap.get("modules");
            if (modulesObj instanceof Map<?, ?> modulesMap) {
                for (Map.Entry<?, ?> modEntry : modulesMap.entrySet()) {
                    if (modEntry.getValue() instanceof Map<?, ?> modData) {
                        if (modData.containsKey("error") && modData.get("error") != null) {
                            throw new UpstreamServiceException(
                                    "Upstream Guild API module error in '" + modEntry.getKey() + "': " + modData.get("error"));
                        }
                        if (modData.containsKey("enabledError") && modData.get("enabledError") != null) {
                            throw new UpstreamServiceException(
                                    "Upstream Guild API module error in '" + modEntry.getKey() + "': " + modData.get("enabledError"));
                        }
                    }
                }
            }
        }
    }
}
