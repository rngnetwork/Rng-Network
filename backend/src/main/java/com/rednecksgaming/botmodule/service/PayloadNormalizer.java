package com.rednecksgaming.botmodule.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Normalizes upstream Guild API payloads, unwrapping envelopes, un-stringifying JSON fields,
 * and stripping redundant metadata.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayloadNormalizer {

    private final ObjectMapper objectMapper;

    /**
     * Unwraps upstream response envelope (e.g. {"ok": true, "data": {...}}) if present.
     */
    public Map<String, Object> unwrapEnvelope(Map<String, Object> response) {
        if (response == null) {
            return Collections.emptyMap();
        }
        if (response.containsKey("data") && response.get("data") instanceof Map<?, ?> dataMap) {
            return safeCastMap(dataMap);
        }
        return response;
    }

    /**
     * Normalizes a modules dictionary, recursively parsing any stringified JSON arrays/objects.
     */
    public Map<String, Object> normalizeModules(Map<String, Object> rawPayload) {
        if (rawPayload == null) {
            return Collections.emptyMap();
        }

        Map<String, Object> unwrapped = unwrapEnvelope(rawPayload);
        Map<String, Object> targetMap = unwrapped;

        if (unwrapped.containsKey("modules") && unwrapped.get("modules") instanceof Map<?, ?> modulesMap) {
            targetMap = safeCastMap(modulesMap);
        }

        Map<String, Object> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : targetMap.entrySet()) {
            if ("guildId".equals(entry.getKey())) {
                continue;
            }
            normalized.put(entry.getKey(), normalizeValue(entry.getValue()));
        }
        return normalized;
    }

    /**
     * Normalizes a server-specific response from GET /v1/guild/:guildId, stripping redundant guildId.
     */
    public Map<String, Object> normalizeServerResponse(Map<String, Object> serverResponse) {
        if (serverResponse == null) {
            return Collections.emptyMap();
        }

        Map<String, Object> unwrapped = unwrapEnvelope(serverResponse);

        if (unwrapped.containsKey("modules") && unwrapped.get("modules") instanceof Map<?, ?> modulesMap) {
            return normalizeModules(safeCastMap(modulesMap));
        }

        Map<String, Object> filtered = new LinkedHashMap<>(unwrapped);
        filtered.remove("guildId");
        return normalizeModules(filtered);
    }

    /**
     * Normalizes the full tree response from GET /v1/guildConfig.
     */
    public Map<String, Object> normalizeGuildConfigTree(Map<String, Object> configTree) {
        if (configTree == null) {
            return Collections.emptyMap();
        }

        Map<String, Object> unwrapped = unwrapEnvelope(configTree);
        Map<String, Object> normalizedTree = new LinkedHashMap<>();

        Object guildsObj = unwrapped.get("guilds");
        if (guildsObj instanceof Map<?, ?> guildsMap) {
            Map<String, Object> normalizedGuilds = new LinkedHashMap<>();
            for (Map.Entry<?, ?> guildEntry : guildsMap.entrySet()) {
                String guildId = String.valueOf(guildEntry.getKey());
                Object guildData = guildEntry.getValue();
                if (guildData instanceof Map<?, ?> guildDataMap) {
                    normalizedGuilds.put(guildId, normalizeServerResponse(safeCastMap(guildDataMap)));
                } else {
                    normalizedGuilds.put(guildId, guildData);
                }
            }
            normalizedTree.put("guilds", normalizedGuilds);
        } else {
            normalizedTree.putAll(unwrapped);
        }
        return normalizedTree;
    }

    private Object normalizeValue(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Map<?, ?> mapValue) {
            Map<String, Object> nested = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : mapValue.entrySet()) {
                if ("guildId".equals(entry.getKey())) {
                    continue;
                }
                nested.put(String.valueOf(entry.getKey()), normalizeValue(entry.getValue()));
            }
            return nested;
        }

        if (value instanceof List<?> listValue) {
            return listValue.stream().map(this::normalizeValue).toList();
        }

        if (value instanceof String strValue) {
            String trimmed = strValue.trim();
            // Un-stringify JSON arrays or objects (e.g. badWords: "[]")
            if ((trimmed.startsWith("[") && trimmed.endsWith("]"))
                    || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
                try {
                    Object parsed = objectMapper.readValue(trimmed, new TypeReference<Object>() {});
                    return normalizeValue(parsed);
                } catch (Exception e) {
                    log.debug("String field '{}' could not be parsed as JSON, retaining as String", trimmed);
                }
            }
        }

        return value;
    }

    private Map<String, Object> safeCastMap(Map<?, ?> rawMap) {
        Map<String, Object> typedMap = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
            typedMap.put(String.valueOf(entry.getKey()), entry.getValue());
        }
        return typedMap;
    }
}
