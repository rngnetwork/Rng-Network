package com.rednecksgaming.botmodule.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.botmodule.client.GuildApiClient;
import com.rednecksgaming.botmodule.model.BotModuleDocument;
import com.rednecksgaming.botmodule.repository.BotModuleRepository;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.repository.ServerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Implementation of BotModuleService with multi-tier Redis caching, upstream GuildApiClient proxying,
 * MongoDB persistence, and atomic dual-key eviction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BotModuleServiceImpl implements BotModuleService {

    private final GuildApiClient guildApiClient;
    private final BotModuleRepository botModuleRepository;
    private final ServerRepository serverRepository;
    private final StringRedisTemplate redisTemplate;
    private final SchemaValidatorService schemaValidatorService;
    private final BotModuleAuditService auditService;
    private final PayloadNormalizer payloadNormalizer;
    private final ObjectMapper objectMapper;

    public static final String CACHE_KEY_TREE = "bot:config:tree";
    public static final String CACHE_KEY_DEFAULT = "bot:config:default";
    public static final String CACHE_KEY_GUILD_PREFIX = "bot:guild:";
    public static final String CACHE_KEY_SLUG_PREFIX = "server:slug:";

    public static final Duration TTL_TREE = Duration.ofMinutes(10);
    public static final Duration TTL_DEFAULT = Duration.ofMinutes(5);
    public static final Duration TTL_GUILD = Duration.ofSeconds(60);
    public static final Duration TTL_SLUG = Duration.ofHours(1);

    private static final Pattern SNOWFLAKE_PATTERN = Pattern.compile("^[0-9]{17,20}$");

    @Override
    public Map<String, Object> getNetworkDefaultModules() {
        String cached = getFromRedis(CACHE_KEY_DEFAULT);
        if (cached != null) {
            return deserializeMap(cached);
        }

        Map<String, Object> defaults = guildApiClient.getDefaultModules();
        Map<String, Object> configTree = getGuildConfigTree();

        Map<String, Object> aggregated = payloadNormalizer.normalizeNetworkPayload(defaults, configTree);
        setInRedis(CACHE_KEY_DEFAULT, aggregated, TTL_DEFAULT);
        return aggregated;
    }

    @Override
    public Map<String, Object> getGuildConfigTree() {
        String cached = getFromRedis(CACHE_KEY_TREE);
        if (cached != null) {
            return deserializeMap(cached);
        }

        Map<String, Object> configTree = guildApiClient.getGuildConfig();
        setInRedis(CACHE_KEY_TREE, configTree, TTL_TREE);
        return configTree;
    }

    @Override
    public Map<String, Object> getServerModules(String idOrSlug) {
        Server server = resolveServer(idOrSlug);
        String snowflake = server.getId();
        String cacheKey = CACHE_KEY_GUILD_PREFIX + snowflake + ":modules";

        String cached = getFromRedis(cacheKey);
        if (cached != null) {
            return deserializeMap(cached);
        }

        Map<String, Object> modules = guildApiClient.getGuildModules(snowflake);
        setInRedis(cacheKey, modules, TTL_GUILD);
        return modules;
    }

    @Override
    public Map<String, Object> getServerEffectiveModules(String idOrSlug) {
        Server server = resolveServer(idOrSlug);
        String snowflake = server.getId();

        Map<String, Object> networkDefaultsEnvelope = getNetworkDefaultModules();
        Map<String, Object> networkDefaults = networkDefaultsEnvelope;
        if (networkDefaultsEnvelope.containsKey("modules") && networkDefaultsEnvelope.get("modules") instanceof Map<?, ?> modMap) {
            networkDefaults = safeCastMap(modMap);
        }
        Map<String, Object> serverModules = getServerModules(snowflake);

        Map<String, Object> compositeModules = new LinkedHashMap<>();

        // 1. Process all network defaults and compute server override diffs
        for (Map.Entry<String, Object> entry : networkDefaults.entrySet()) {
            String moduleName = entry.getKey();
            Object defaultVal = entry.getValue();

            Map<String, Object> moduleStatus = new LinkedHashMap<>();
            if (serverModules.containsKey(moduleName) && serverModules.get(moduleName) != null) {
                Object serverVal = serverModules.get(moduleName);
                moduleStatus.put("isOverridden", true);
                moduleStatus.put("effectiveConfig", serverVal);
                moduleStatus.put("networkDefault", defaultVal);
                moduleStatus.put("serverOverride", serverVal);
            } else {
                moduleStatus.put("isOverridden", false);
                moduleStatus.put("effectiveConfig", defaultVal);
                moduleStatus.put("networkDefault", defaultVal);
                moduleStatus.put("serverOverride", null);
            }
            compositeModules.put(moduleName, moduleStatus);
        }

        // 2. Process server-only modules not present in network defaults
        for (Map.Entry<String, Object> entry : serverModules.entrySet()) {
            String moduleName = entry.getKey();
            if (!compositeModules.containsKey(moduleName)) {
                Map<String, Object> moduleStatus = new LinkedHashMap<>();
                moduleStatus.put("isOverridden", true);
                moduleStatus.put("effectiveConfig", entry.getValue());
                moduleStatus.put("networkDefault", null);
                moduleStatus.put("serverOverride", entry.getValue());
                compositeModules.put(moduleName, moduleStatus);
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("serverId", snowflake);
        response.put("guildId", snowflake);
        response.put("serverSlug", server.getSlug() != null ? server.getSlug() : snowflake);
        response.put("serverName", server.getName() != null ? server.getName() : "Discord Server");

        Map<String, Object> configTree = getGuildConfigTree();
        Object schemaObj = configTree.get("schema");
        if (schemaObj instanceof Map<?, ?> schemaMap) {
            response.put("schema", schemaMap);
        } else {
            response.put("schema", Collections.emptyMap());
        }

        response.put("modules", compositeModules);
        return response;
    }

    @Override
    public Map<String, Object> updateNetworkDefaultModules(String actorId, String actorName, Map<String, Object> patch) {
        return updateNetworkDefaultModules(actorId, actorName, patch, null);
    }

    @Override
    public Map<String, Object> updateNetworkDefaultModules(String actorId, String actorName, Map<String, Object> modules, Map<String, Object> network) {
        if (modules != null && !modules.isEmpty()) {
            schemaValidatorService.validateModules(modules);
        }

        Map<String, Object> result;
        if (network != null && !network.isEmpty()) {
            result = guildApiClient.patchDefaultModules(actorId, modules, network);
        } else {
            result = guildApiClient.patchDefaultModules(actorId, modules != null ? modules : Collections.emptyMap());
        }

        // Persist to MongoDB
        BotModuleDocument doc = botModuleRepository.findByScope("NETWORK")
                .orElseGet(() -> BotModuleDocument.builder()
                        .scope("NETWORK")
                        .modules(new HashMap<>())
                        .network(new HashMap<>())
                        .createdAt(Instant.now())
                        .build());

        if (modules != null && !modules.isEmpty()) {
            Map<String, Object> currentModules = doc.getModules() != null ? new HashMap<>(doc.getModules()) : new HashMap<>();
            currentModules.putAll(modules);
            doc.setModules(currentModules);
        } else if (doc.getModules() == null) {
            doc.setModules(new HashMap<>());
        }

        if (network != null && !network.isEmpty()) {
            Map<String, Object> currentNetwork = doc.getNetwork() != null ? new HashMap<>(doc.getNetwork()) : new HashMap<>();
            currentNetwork.putAll(network);
            doc.setNetwork(currentNetwork);
        }

        doc.setUpdatedAt(Instant.now());
        doc.setLastModifiedBy(actorName != null ? actorName : actorId);
        botModuleRepository.save(doc);

        // Audit log (Backend-only persistence)
        Map<String, Object> auditPayload = new HashMap<>();
        if (modules != null) {
            auditPayload.put("modules", modules);
        }
        if (network != null) {
            auditPayload.put("network", network);
        }
        auditService.recordAuditLog("NETWORK", null, actorId, actorName, "UPDATE_NETWORK", null, auditPayload);

        // Atomic dual-key cache eviction: bot:config:tree AND bot:config:default
        evictCache(CACHE_KEY_TREE);
        evictCache(CACHE_KEY_DEFAULT);

        return result;
    }

    @Override
    public Map<String, Object> updateServerModules(String idOrSlug, String actorId, String actorName, Map<String, Object> patch) {
        Server server = resolveServer(idOrSlug);
        String snowflake = server.getId();

        schemaValidatorService.validateModules(patch);

        Map<String, Object> result = guildApiClient.patchGuildModules(snowflake, patch);

        // Persist to MongoDB
        BotModuleDocument doc = botModuleRepository.findByScopeAndServerId("SERVER", snowflake)
                .orElseGet(() -> BotModuleDocument.builder()
                        .scope("SERVER")
                        .serverId(snowflake)
                        .modules(new HashMap<>())
                        .createdAt(Instant.now())
                        .build());

        Map<String, Object> currentModules = doc.getModules() != null ? new HashMap<>(doc.getModules()) : new HashMap<>();
        currentModules.putAll(patch);
        doc.setModules(currentModules);
        doc.setUpdatedAt(Instant.now());
        doc.setLastModifiedBy(actorName != null ? actorName : actorId);
        botModuleRepository.save(doc);

        // Audit log (Backend-only persistence)
        auditService.recordAuditLog("SERVER", snowflake, actorId, actorName, "UPDATE_SERVER", null, patch);

        // Atomic dual-key cache eviction: bot:config:tree AND bot:guild:{snowflake}:modules
        evictCache(CACHE_KEY_TREE);
        evictCache(CACHE_KEY_GUILD_PREFIX + snowflake + ":modules");

        return result;
    }

    @Override
    public Map<String, Object> resetServerModule(String idOrSlug, String moduleName, String actorId, String actorName) {
        Server server = resolveServer(idOrSlug);
        String snowflake = server.getId();

        Map<String, Object> result = guildApiClient.deleteGuildModule(snowflake, moduleName);

        // Update MongoDB
        botModuleRepository.findByScopeAndServerId("SERVER", snowflake).ifPresent(doc -> {
            if (doc.getModules() != null) {
                Map<String, Object> updated = new HashMap<>(doc.getModules());
                updated.remove(moduleName);
                doc.setModules(updated);
                doc.setUpdatedAt(Instant.now());
                doc.setLastModifiedBy(actorName != null ? actorName : actorId);
                botModuleRepository.save(doc);
            }
        });

        // Audit log (Backend-only persistence)
        auditService.recordAuditLog(
                "SERVER", snowflake, actorId, actorName,
                "RESET_SERVER_MODULE", moduleName, Map.of("moduleName", moduleName)
        );

        // Atomic dual-key cache eviction: bot:config:tree AND bot:guild:{snowflake}:modules
        evictCache(CACHE_KEY_TREE);
        evictCache(CACHE_KEY_GUILD_PREFIX + snowflake + ":modules");

        return result;
    }

    private Server resolveServer(String idOrSlug) {
        if (idOrSlug == null || idOrSlug.isBlank()) {
            throw new ResourceNotFoundException("Server identifier cannot be empty");
        }

        String cleanIdentifier = idOrSlug.trim();
        if (cleanIdentifier.startsWith("\"") && cleanIdentifier.endsWith("\"") && cleanIdentifier.length() >= 2) {
            cleanIdentifier = cleanIdentifier.substring(1, cleanIdentifier.length() - 1).trim();
        }

        if (SNOWFLAKE_PATTERN.matcher(cleanIdentifier).matches()) {
            Optional<Server> byId = serverRepository.findById(cleanIdentifier);
            if (byId.isPresent()) {
                return byId.get();
            }
            return Server.builder()
                    .id(cleanIdentifier)
                    .slug(cleanIdentifier)
                    .name("Discord Server (" + cleanIdentifier + ")")
                    .build();
        }

        String slugKey = CACHE_KEY_SLUG_PREFIX + cleanIdentifier;
        String cachedSnowflake = getFromRedis(slugKey);
        if (cachedSnowflake != null) {
            cachedSnowflake = cachedSnowflake.trim();
            if (cachedSnowflake.startsWith("\"") && cachedSnowflake.endsWith("\"") && cachedSnowflake.length() >= 2) {
                cachedSnowflake = cachedSnowflake.substring(1, cachedSnowflake.length() - 1).trim();
            }
            return Server.builder()
                    .id(cachedSnowflake)
                    .slug(cleanIdentifier)
                    .name("Discord Server (" + cleanIdentifier + ")")
                    .build();
        }

        Optional<Server> serverOpt = serverRepository.findByIdOrSlug(cleanIdentifier);
        if (serverOpt.isPresent()) {
            Server server = serverOpt.get();
            if (server.getId() != null) {
                String sid = server.getId().trim();
                if (sid.startsWith("\"") && sid.endsWith("\"") && sid.length() >= 2) {
                    sid = sid.substring(1, sid.length() - 1).trim();
                    server.setId(sid);
                }
            }
            if (server.getSlug() != null) {
                setInRedis(CACHE_KEY_SLUG_PREFIX + server.getSlug(), server.getId(), TTL_SLUG);
            }
            return server;
        }

        throw new ResourceNotFoundException("Server not found for identifier: " + idOrSlug);
    }

    private String getFromRedis(String key) {
        if (redisTemplate == null) {
            return null;
        }
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.warn("Redis read failed for key {}: {}", key, e.getMessage());
            return null;
        }
    }

    private void setInRedis(String key, Object value, Duration ttl) {
        if (redisTemplate == null) {
            return;
        }
        try {
            String json = (value instanceof String s) ? s : objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set(key, json, ttl);
        } catch (Exception e) {
            log.warn("Redis write failed for key {}: {}", key, e.getMessage());
        }
    }

    private void evictCache(String key) {
        if (redisTemplate == null) {
            return;
        }
        try {
            redisTemplate.delete(key);
            log.debug("Evicted Redis key: {}", key);
        } catch (Exception e) {
            log.warn("Redis eviction failed for key {}: {}", key, e.getMessage());
        }
    }

    private Map<String, Object> deserializeMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("Failed deserializing cached JSON: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private Map<String, Object> safeCastMap(Map<?, ?> rawMap) {
        Map<String, Object> typedMap = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
            typedMap.put(String.valueOf(entry.getKey()), entry.getValue());
        }
        return typedMap;
    }
}
