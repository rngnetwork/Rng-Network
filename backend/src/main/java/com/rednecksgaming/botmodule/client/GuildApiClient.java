package com.rednecksgaming.botmodule.client;

import java.util.Map;

/**
 * High-performance HTTP client interfacing with the upstream Discord Guild API.
 */
public interface GuildApiClient {

    /**
     * Retrieves network-wide default modules: GET /v1/default
     */
    Map<String, Object> getDefaultModules();

    /**
     * Retrieves full nested JSON configuration tree across all servers: GET /v1/guildConfig
     */
    Map<String, Object> getGuildConfig();

    /**
     * Retrieves server-specific modules: GET /v1/guild/:guildId
     */
    Map<String, Object> getGuildModules(String guildId);

    /**
     * Updates network-wide default modules: PATCH /v1/default
     */
    Map<String, Object> patchDefaultModules(String actorId, Map<String, Object> modules);

    /**
     * Updates server-specific modules: PATCH /v1/guild/:guildId
     */
    Map<String, Object> patchGuildModules(String guildId, Map<String, Object> modules);

    /**
     * Deletes / resets a server module: DELETE /v1/guild/:guildId/modules/:moduleName
     */
    Map<String, Object> deleteGuildModule(String guildId, String moduleName);
}
