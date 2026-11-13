// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.botmodule.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Composite response payload representing server effective bot module configuration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotModuleConfigResponse {

    private String serverId;
    private String guildId;
    private String serverSlug;
    private String serverName;
    private Map<String, Object> schema;
    private Map<String, Object> modules;
}
