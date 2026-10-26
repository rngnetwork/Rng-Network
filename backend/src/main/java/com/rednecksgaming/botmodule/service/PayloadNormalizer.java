package com.rednecksgaming.botmodule.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@Service
public class PayloadNormalizer {

    private final ObjectMapper objectMapper;
    private final NetworkKeyCategorizer networkKeyCategorizer;

    public PayloadNormalizer(ObjectMapper objectMapper) {
        this(objectMapper, new NetworkKeyCategorizer());
    }

    @Autowired
    public PayloadNormalizer(ObjectMapper objectMapper, NetworkKeyCategorizer networkKeyCategorizer) {
        this.objectMapper = objectMapper;
        this.networkKeyCategorizer = networkKeyCategorizer != null ? networkKeyCategorizer : new NetworkKeyCategorizer();
    }

    public Map<String, Object> unwrapEnvelope(Map<String, Object> response) {
        if (response == null) {
            return Collections.emptyMap();
        }
        if (response.containsKey("data") && response.get("data") instanceof Map<?, ?> dataMap) {
            return safeCastMap(dataMap);
        }
        return response;
    }

    public Map<String, Object> normalizeModules(Map<String, Object> rawPayload) {
        if (rawPayload == null) {
            return Collections.emptyMap();
        }

        Map<String, Object> unwrapped = unwrapEnvelope(rawPayload);

        boolean hasNetworkEnvelope = unwrapped.containsKey("network")
                || unwrapped.containsKey("hubGuildId")
                || unwrapped.containsKey("servers")
                || unwrapped.containsKey("schema");

        if (hasNetworkEnvelope) {
            Map<String, Object> normalizedEnvelope = new LinkedHashMap<>();
            if (unwrapped.containsKey("hubGuildId")) {
                normalizedEnvelope.put("hubGuildId", unwrapped.get("hubGuildId"));
            }
            if (unwrapped.containsKey("servers")) {
                normalizedEnvelope.put("servers", unwrapped.get("servers"));
            }
            if (unwrapped.containsKey("schema")) {
                Object schemaObj = unwrapped.get("schema");
                if (schemaObj instanceof Map<?, ?> sMap) {
                    normalizedEnvelope.put("schema", enrichSchema(safeCastMap(sMap)));
                } else {
                    normalizedEnvelope.put("schema", normalizeValue(schemaObj));
                }
            }
            if (unwrapped.containsKey("network")) {
                normalizedEnvelope.put("network", normalizeValue(unwrapped.get("network")));
            }
            if (unwrapped.containsKey("modules")) {
                Object modObj = unwrapped.get("modules");
                if (modObj instanceof Map<?, ?> modMap) {
                    normalizedEnvelope.put("modules", normalizeModuleMap(safeCastMap(modMap)));
                } else {
                    normalizedEnvelope.put("modules", modObj);
                }
            }
            return normalizedEnvelope;
        }

        Map<String, Object> targetMap = unwrapped;
        if (unwrapped.containsKey("modules") && unwrapped.get("modules") instanceof Map<?, ?> modulesMap) {
            targetMap = safeCastMap(modulesMap);
        }

        return normalizeModuleMap(targetMap);
    }

    public Map<String, Object> normalizeServerResponse(Map<String, Object> serverResponse) {
        if (serverResponse == null) {
            return Collections.emptyMap();
        }

        Map<String, Object> unwrapped = unwrapEnvelope(serverResponse);

        if (unwrapped.containsKey("modules") && unwrapped.get("modules") instanceof Map<?, ?> modulesMap) {
            return normalizeModuleMap(safeCastMap(modulesMap));
        }

        Map<String, Object> filtered = new LinkedHashMap<>(unwrapped);
        filtered.remove("guildId");
        return normalizeModuleMap(filtered);
    }


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
        }

        for (Map.Entry<String, Object> entry : unwrapped.entrySet()) {
            String key = entry.getKey();
            if ("guilds".equals(key)) {
                continue;
            }
            if ("schema".equals(key) && entry.getValue() instanceof Map<?, ?> sMap) {
                normalizedTree.put("schema", enrichSchema(safeCastMap(sMap)));
            } else {
                normalizedTree.put(key, normalizeValue(entry.getValue()));
            }
        }

        return normalizedTree;
    }

    public Map<String, Object> normalizeNetworkPayload(Map<String, Object> rawDefault, Map<String, Object> rawConfig) {
        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, Object> unwrappedDefault = unwrapEnvelope(rawDefault);
        Map<String, Object> unwrappedConfig = unwrapEnvelope(rawConfig);

        if (unwrappedDefault.containsKey("hubGuildId")) {
            result.put("hubGuildId", unwrappedDefault.get("hubGuildId"));
        }
        if (unwrappedDefault.containsKey("servers")) {
            result.put("servers", unwrappedDefault.get("servers"));
        }


        Object schemaObj = unwrappedConfig.get("schema");
        if (schemaObj == null && rawConfig != null && rawConfig.containsKey("schema")) {
            schemaObj = rawConfig.get("schema");
        }
        if (schemaObj instanceof Map<?, ?> schemaMap) {
            result.put("schema", enrichSchema(safeCastMap(schemaMap)));
        } else {
            result.put("schema", Collections.emptyMap());
        }

        Object modulesObj = unwrappedDefault.get("modules");
        if (modulesObj instanceof Map<?, ?> modulesMap) {
            result.put("modules", normalizeModuleMap(safeCastMap(modulesMap)));
        } else if (unwrappedDefault.containsKey("modules")) {
            result.put("modules", unwrappedDefault.get("modules"));
        } else {
            Map<String, Object> filtered = new LinkedHashMap<>(unwrappedDefault);
            filtered.remove("guildId");
            filtered.remove("hubGuildId");
            filtered.remove("servers");
            filtered.remove("network");
            filtered.remove("schema");
            result.put("modules", normalizeModuleMap(filtered));
        }

        Object networkObj = unwrappedDefault.get("network");
        if (networkObj instanceof Map<?, ?> networkMap) {
            Map<String, Object> normalizedNet = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : networkMap.entrySet()) {
                String k = String.valueOf(entry.getKey());
                Object v = normalizeValue(entry.getValue());
                if (v instanceof Map<?, ?> valMap) {
                    Map<String, Object> enrichedVal = new LinkedHashMap<>(safeCastMap(valMap));
                    if (!enrichedVal.containsKey("category")) {
                        String desc = enrichedVal.containsKey("label") ? String.valueOf(enrichedVal.get("label")) : "";
                        enrichedVal.put("category", networkKeyCategorizer.categorize(k, desc));
                    }
                    normalizedNet.put(k, enrichedVal);
                } else {
                    normalizedNet.put(k, v);
                }
            }
            result.put("network", normalizedNet);
        } else if (rawDefault != null && rawDefault.containsKey("network") && rawDefault.get("network") instanceof Map<?, ?> netMap) {
            result.put("network", normalizeValue(netMap));
        } else {
            result.put("network", Collections.emptyMap());
        }

        return result;
    }

    public Map<String, Object> enrichSchema(Map<String, Object> rawSchema) {
        if (rawSchema == null) {
            return Collections.emptyMap();
        }

        Map<String, Object> enrichedSchema = new LinkedHashMap<>(rawSchema);

        Map<String, String> moduleDisplayNames = new LinkedHashMap<>();
        Object modulesObj = rawSchema.get("modules");
        if (modulesObj instanceof Map<?, ?> modulesMap) {
            Map<String, Object> enrichedModules = new LinkedHashMap<>();
            for (Map.Entry<?, ?> modEntry : modulesMap.entrySet()) {
                String modName = String.valueOf(modEntry.getKey());
                String formattedModTitle = ModuleTextFormatter.format(modName);
                moduleDisplayNames.put(modName, formattedModTitle);

                Object modFieldsObj = modEntry.getValue();
                if (modFieldsObj instanceof Map<?, ?> fieldsMap) {
                    Map<String, Object> enrichedFields = new LinkedHashMap<>();
                    for (Map.Entry<?, ?> fieldEntry : fieldsMap.entrySet()) {
                        String fieldName = String.valueOf(fieldEntry.getKey());
                        Object fieldSchemaObj = fieldEntry.getValue();
                        if (fieldSchemaObj instanceof Map<?, ?> fieldSchemaMap) {
                            Map<String, Object> enrichedFieldSchema = new LinkedHashMap<>(safeCastMap(fieldSchemaMap));
                            String formattedField = ModuleTextFormatter.format(fieldName);
                            enrichedFieldSchema.put("displayName", formattedField);
                            if (!enrichedFieldSchema.containsKey("label") || enrichedFieldSchema.get("label") == null) {
                                enrichedFieldSchema.put("label", formattedField);
                            }
                            enrichedFields.put(fieldName, enrichedFieldSchema);
                        } else {
                            enrichedFields.put(fieldName, fieldSchemaObj);
                        }
                    }
                    enrichedModules.put(modName, enrichedFields);
                } else {
                    enrichedModules.put(modName, modFieldsObj);
                }
            }
            enrichedSchema.put("modules", enrichedModules);
        }
        enrichedSchema.put("moduleDisplayNames", moduleDisplayNames);

        Map<String, String> networkKeyDisplayNames = new LinkedHashMap<>();
        Object networkKeysObj = rawSchema.get("networkKeys");
        if (networkKeysObj instanceof Map<?, ?> networkKeysMap) {
            Map<String, Object> enrichedKeys = new LinkedHashMap<>();
            for (Map.Entry<?, ?> keyEntry : networkKeysMap.entrySet()) {
                String keyName = String.valueOf(keyEntry.getKey());
                String formattedKeyTitle = ModuleTextFormatter.format(keyName);
                networkKeyDisplayNames.put(keyName, formattedKeyTitle);

                Object keySchemaObj = keyEntry.getValue();
                if (keySchemaObj instanceof Map<?, ?> keySchemaMap) {
                    Map<String, Object> enrichedKeySchema = new LinkedHashMap<>(safeCastMap(keySchemaMap));
                    enrichedKeySchema.put("displayName", formattedKeyTitle);
                    if (!enrichedKeySchema.containsKey("label") || enrichedKeySchema.get("label") == null) {
                        enrichedKeySchema.put("label", formattedKeyTitle);
                    }
                    String desc = enrichedKeySchema.containsKey("description") && enrichedKeySchema.get("description") != null
                            ? String.valueOf(enrichedKeySchema.get("description"))
                            : String.valueOf(enrichedKeySchema.get("label"));
                    enrichedKeySchema.put("category", networkKeyCategorizer.categorize(keyName, desc));
                    enrichedKeys.put(keyName, enrichedKeySchema);
                } else {
                    Map<String, Object> enrichedKeySchema = new LinkedHashMap<>();
                    enrichedKeySchema.put("displayName", formattedKeyTitle);
                    enrichedKeySchema.put("label", formattedKeyTitle);
                    enrichedKeySchema.put("category", networkKeyCategorizer.categorize(keyName, formattedKeyTitle));
                    enrichedKeys.put(keyName, enrichedKeySchema);
                }
            }
            enrichedSchema.put("networkKeys", enrichedKeys);
        }
        enrichedSchema.put("networkKeyDisplayNames", networkKeyDisplayNames);
        enrichedSchema.put("networkKeyCategories", networkKeyCategorizer.getCategoryLabels());

        return enrichedSchema;
    }

    private Map<String, Object> normalizeModuleMap(Map<String, Object> map) {
        Map<String, Object> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if ("guildId".equals(entry.getKey())) {
                continue;
            }
            normalized.put(entry.getKey(), normalizeValue(entry.getValue()));
        }
        return normalized;
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
