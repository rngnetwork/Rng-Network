// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.service;

import com.rednecksgaming.personnel.perms.dto.EffectivePermissionsDto;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.dto.ServerDto;
import com.rednecksgaming.server.repository.ServerRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Evaluates granular JSONB feature flags, whitelist {@code fullAccess}, and per-server visibility
 * against an operator's {@link EffectivePermissionsDto}.
 */
@Component
public class GranularPermissionEvaluator {

    private static final String KEY_DASHBOARD = "dashboard";
    private static final String KEY_SERVERS = "dashboard.servers";
    private static final String KEY_SERVERS_COLLECTION = "dashboard.servers.[serverId]";
    private static final String KEY_WHITELIST = "dashboard.whitelist";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_FULL_ACCESS = "fullAccess";

    private final ServerRepository serverRepository;

    public GranularPermissionEvaluator(ServerRepository serverRepository) {
        this.serverRepository = serverRepository;
    }

    /**
     * Checks whether the feature path resolves to {@code true} in the effective permission tree.
     * For nested paths (e.g. {@code "dashboard.personnel", "dashboard.personnel.perms"}),
     * every parent section along the path must also be enabled.
     *
     * @param effective evaluated caller permissions
     * @param path      ordered section keys from root down to target section
     * @return {@code true} when every segment and final {@code enabled} flag are true
     */
    public boolean isFeatureEnabled(EffectivePermissionsDto effective, String... path) {
        if (effective == null || effective.permissions() == null || path == null || path.length == 0) {
            return false;
        }
        Map<?, ?> current = effective.permissions();
        for (int i = 0; i < path.length; i++) {
            Object next = current.get(path[i]);
            if (!(next instanceof Map<?, ?> childMap)) {
                return false;
            }
            if (!isEnabledTrue(childMap)) {
                return false;
            }
            current = childMap;
        }
        return true;
    }

    /**
     * Checks whether the caller has global whitelist visibility ({@code dashboard.whitelist.fullAccess == true}).
     *
     * @param effective evaluated caller permissions
     * @return {@code true} if {@code dashboard.whitelist.enabled} and {@code fullAccess} are both true
     */
    public boolean hasWhitelistFullAccess(EffectivePermissionsDto effective) {
        if (!isFeatureEnabled(effective, KEY_DASHBOARD) || !isFeatureEnabled(effective, KEY_WHITELIST)) {
            return false;
        }
        Object whitelistNode = effective.permissions().get(KEY_WHITELIST);
        if (whitelistNode instanceof Map<?, ?> whitelistMap) {
            return Boolean.TRUE.equals(whitelistMap.get(KEY_FULL_ACCESS));
        }
        return false;
    }

    /**
     * Evaluates whether a managed server (and optional sub-feature such as {@code settings},
     * {@code botconfig}, {@code embeds}, or {@code analytics}) is permitted.
     *
     * @param effective      evaluated caller permissions
     * @param serverIdOrSlug Discord guild snowflake ID or server slug
     * @param subFeature     optional sub-feature flag name, or {@code null} for server visibility
     * @return {@code true} if server access is permitted
     */
    public boolean isServerAllowed(EffectivePermissionsDto effective, String serverIdOrSlug, String subFeature) {
        if (!isFeatureEnabled(effective, KEY_DASHBOARD) || !isFeatureEnabled(effective, KEY_SERVERS)) {
            return false;
        }
        if (serverIdOrSlug == null || serverIdOrSlug.isBlank()) {
            return false;
        }

        String resolvedSlug = resolveSlug(serverIdOrSlug.trim());
        Object serversSectionObj = effective.permissions().get(KEY_SERVERS);
        if (!(serversSectionObj instanceof Map<?, ?> serversSection)) {
            return false;
        }
        Object collectionObj = serversSection.get(KEY_SERVERS_COLLECTION);
        if (!(collectionObj instanceof Map<?, ?> serverCollection)) {
            // Unseeded server collection falls back to dashboard.servers.enabled (already verified true).
            return true;
        }

        Object explicitServerObj = serverCollection.get(resolvedSlug);
        if (explicitServerObj == null && !resolvedSlug.equals(serverIdOrSlug.trim())) {
            explicitServerObj = serverCollection.get(serverIdOrSlug.trim());
        }
        if (!(explicitServerObj instanceof Map<?, ?> serverNode)) {
            // Dynamic/unseeded server slug inherits dashboard.servers.enabled (true).
            return true;
        }

        if (!isEnabledTrue(serverNode)) {
            return false;
        }

        if (subFeature == null || subFeature.isBlank()) {
            return true;
        }

        Object subVal = serverNode.get(subFeature);
        if (subVal instanceof Boolean b) {
            return b;
        }
        if (subVal instanceof Map<?, ?> subMap) {
            return isEnabledTrue(subMap);
        }
        return false;
    }

    /**
     * Filters a list of {@link ServerDto}s down to those visible under {@code effective}.
     *
     * @param effective evaluated caller permissions
     * @param servers   candidate servers
     * @return filtered list preserving original order
     */
    public List<ServerDto> filterVisibleServers(EffectivePermissionsDto effective, List<ServerDto> servers) {
        if (servers == null || servers.isEmpty() || effective == null) {
            return List.of();
        }
        return servers.stream()
                .filter(server -> {
                    String key = (server.getSlug() != null && !server.getSlug().isBlank())
                            ? server.getSlug()
                            : server.getId();
                    return isServerAllowed(effective, key, null);
                })
                .toList();
    }

    private String resolveSlug(String idOrSlug) {
        Optional<Server> found = serverRepository.findByIdOrSlug(idOrSlug);
        return found.map(Server::getSlug).orElse(idOrSlug);
    }

    private boolean isEnabledTrue(Map<?, ?> node) {
        return Boolean.TRUE.equals(node.get(KEY_ENABLED));
    }
}
