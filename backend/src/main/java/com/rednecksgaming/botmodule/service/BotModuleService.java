package com.rednecksgaming.botmodule.service;

import java.util.Map;

/**
 * Service orchestrating Bot Module Configurations across network-wide and server-specific scopes,
 * integrating Redis multi-tier caching, upstream GuildApiClient proxying, and MongoDB persistence.
 */
public interface BotModuleService {

    /**
     * Retrieves network-wide default bot modules (cached in Redis bot:config:default for 5 minutes).
     */
    Map<String, Object> getNetworkDefaultModules();

    /**
     * Retrieves full configuration tree across all servers (cached in Redis bot:config:tree for 10 minutes).
     */
    Map<String, Object> getGuildConfigTree();

    /**
     * Retrieves raw server-specific modules (cached in Redis bot:guild:{snowflake}:modules for 60 seconds).
     */
    Map<String, Object> getServerModules(String idOrSlug);

    /**
     * Computes effective server configuration with inheritance indicators (isOverridden, effectiveConfig, networkDefault).
     */
    Map<String, Object> getServerEffectiveModules(String idOrSlug);

    /**
     * Updates network-wide defaults, persists to MongoDB, records audit event, and evicts dual keys.
     */
    Map<String, Object> updateNetworkDefaultModules(String actorId, String actorName, Map<String, Object> patch);

    /**
     * Updates network-wide defaults and network parameters, persists to MongoDB, records audit event, and evicts dual keys.
     */
    Map<String, Object> updateNetworkDefaultModules(String actorId, String actorName, Map<String, Object> modules, Map<String, Object> network);

    /**
     * Updates network-wide defaults, network parameters, and schema metadata, persists to MongoDB, records audit event, and evicts dual keys.
     */
    Map<String, Object> updateNetworkDefaultModules(String actorId, String actorName, Map<String, Object> modules, Map<String, Object> network, Map<String, Object> schema);

    /**
     * Updates server-specific modules, persists to MongoDB, records audit event, and evicts dual keys.
     */
    Map<String, Object> updateServerModules(String idOrSlug, String actorId, String actorName, Map<String, Object> patch);

    /**
     * Resets a server module back to network default, deletes upstream, updates MongoDB, and evicts dual keys.
     */
    Map<String, Object> resetServerModule(String idOrSlug, String moduleName, String actorId, String actorName);
}
