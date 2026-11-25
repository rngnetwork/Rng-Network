// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.service;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Normalizes and constructs canonical JSONB permission trees aligned with {@code dashboard.personnel.perms}
 * and active managed Discord server slugs.
 */
@Component
public class PermsSchemaNormalizer {

    private static final List<String> SERVER_SUB_FLAGS = List.of(
            "enabled", "settings", "botconfig", "embeds", "analytics"
    );

    /**
     * Builds a fresh canonical permission tree with all flags initialized to {@code allEnabled}.
     *
     * @param allEnabled  default boolean state (true for R9/R8, false for R7-R0)
     * @param serverSlugs active managed Discord server slugs
     * @return mutable canonical permission tree
     */
    public Map<String, Object> buildDefaultTree(boolean allEnabled, Collection<String> serverSlugs) {
        Map<String, Object> serversMap = new LinkedHashMap<>();
        if (serverSlugs != null) {
            for (String slug : serverSlugs) {
                if (slug != null && !slug.isBlank()) {
                    serversMap.put(slug, buildServerFlags(allEnabled));
                }
            }
        }

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("dashboard", mutableFlagMap("enabled", allEnabled));

        Map<String, Object> serversSection = new LinkedHashMap<>();
        serversSection.put("enabled", allEnabled);
        serversSection.put("dashboard.servers.[serverId]", serversMap);
        root.put("dashboard.servers", serversSection);

        root.put("dashboard.embeds", mutableFlagMap("enabled", allEnabled));
        root.put("dashboard.botconfig", mutableFlagMap("enabled", allEnabled));

        Map<String, Object> personnelSection = new LinkedHashMap<>();
        personnelSection.put("enabled", allEnabled);
        personnelSection.put("dashboard.personnel.roles", mutableFlagMap("enabled", allEnabled));
        personnelSection.put("dashboard.personnel.perms", mutableFlagMap("enabled", allEnabled));
        root.put("dashboard.personnel", personnelSection);

        Map<String, Object> whitelistSection = new LinkedHashMap<>();
        whitelistSection.put("enabled", allEnabled);
        whitelistSection.put("fullAccess", allEnabled);
        root.put("dashboard.whitelist", whitelistSection);

        root.put("dashboard.account", mutableFlagMap("enabled", allEnabled));
        return root;
    }

    /**
     * Ensures a persisted permission tree contains all canonical sections and active managed servers
     * without overwriting any explicitly configured boolean values.
     *
     * @param rawPermissions persisted JSONB map (may be partial or null)
     * @param serverSlugs    active managed server slugs
     * @param rankWeight     role rank weight used when initializing missing server entries
     * @return normalized mutable permission tree
     */
    public Map<String, Object> normalize(
            Map<String, Object> rawPermissions,
            Collection<String> serverSlugs,
            int rankWeight
    ) {
        Map<String, Object> base = buildDefaultTree(false, List.of());
        if (rawPermissions != null) {
            mergePreservingExisting(base, rawPermissions);
        }

        boolean defaultForUnseededServer = rankWeight >= 8 || extractServersSectionEnabled(base);
        ensureActiveServers(base, serverSlugs, defaultForUnseededServer);
        return base;
    }

    private void ensureActiveServers(
            Map<String, Object> root,
            Collection<String> serverSlugs,
            boolean defaultServerFlag
    ) {
        if (serverSlugs == null || serverSlugs.isEmpty()) {
            return;
        }
        Map<String, Object> serversSection = ensureChildMap(root, "dashboard.servers");
        Map<String, Object> serverCollection = ensureChildMap(serversSection, "dashboard.servers.[serverId]");

        for (String slug : serverSlugs) {
            if (slug == null || slug.isBlank()) {
                continue;
            }
            Object existingServerNode = serverCollection.get(slug);
            if (existingServerNode instanceof Map<?, ?> existingMap) {
                Map<String, Object> normalizedServer = cloneToMutableMap(existingMap);
                boolean serverEnabled = normalizedServer.get("enabled") instanceof Boolean b ? b : defaultServerFlag;
                for (String flag : SERVER_SUB_FLAGS) {
                    if ("enabled".equals(flag)) {
                        normalizedServer.putIfAbsent(flag, serverEnabled);
                    } else {
                        Object existingSub = normalizedServer.get(flag);
                        if (existingSub instanceof Boolean b) {
                            normalizedServer.put(flag, mutableFlagMap("enabled", b));
                        } else if (!(existingSub instanceof Map<?, ?>)) {
                            normalizedServer.put(flag, mutableFlagMap("enabled", serverEnabled));
                        }
                    }
                }
                serverCollection.put(slug, normalizedServer);
            } else {
                serverCollection.put(slug, buildServerFlags(defaultServerFlag));
            }
        }
    }

    private boolean extractServersSectionEnabled(Map<String, Object> root) {
        Object serversNode = root.get("dashboard.servers");
        if (serversNode instanceof Map<?, ?> serversMap) {
            Object enabled = serversMap.get("enabled");
            if (enabled instanceof Boolean b) {
                return b;
            }
        }
        return false;
    }

    private void mergePreservingExisting(Map<String, Object> target, Map<?, ?> source) {
        for (Map.Entry<?, ?> entry : source.entrySet()) {
            if (!(entry.getKey() instanceof String key) || entry.getValue() == null) {
                continue;
            }
            Object sourceVal = entry.getValue();
            if (sourceVal instanceof Map<?, ?> sourceMap) {
                Map<String, Object> targetChild = ensureChildMap(target, key);
                mergePreservingExisting(targetChild, sourceMap);
            } else {
                target.put(key, sourceVal);
            }
        }
    }

    private Map<String, Object> ensureChildMap(Map<String, Object> parent, String key) {
        Object existing = parent.get(key);
        if (existing instanceof Map<?, ?> existingMap) {
            Map<String, Object> mutable = cloneToMutableMap(existingMap);
            parent.put(key, mutable);
            return mutable;
        }
        Map<String, Object> created = new LinkedHashMap<>();
        parent.put(key, created);
        return created;
    }

    private Map<String, Object> cloneToMutableMap(Map<?, ?> source) {
        Map<String, Object> copy = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : source.entrySet()) {
            if (entry.getKey() instanceof String k && entry.getValue() != null) {
                if (entry.getValue() instanceof Map<?, ?> nested) {
                    copy.put(k, cloneToMutableMap(nested));
                } else {
                    copy.put(k, entry.getValue());
                }
            }
        }
        return copy;
    }

    private Map<String, Object> buildServerFlags(boolean enabled) {
        Map<String, Object> flags = new LinkedHashMap<>();
        flags.put("enabled", enabled);
        for (String flag : SERVER_SUB_FLAGS) {
            if (!"enabled".equals(flag)) {
                flags.put(flag, mutableFlagMap("enabled", enabled));
            }
        }
        return flags;
    }

    private Map<String, Object> mutableFlagMap(String key, boolean value) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put(key, value);
        return map;
    }
}
