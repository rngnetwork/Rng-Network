package com.rng.server.dto.discord;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Raw Discord REST API v10 Role payload.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscordRoleDto {

    private String id;
    private String name;
    private Integer color;
    private Integer position;
    private Boolean managed;
    private String permissions;
}
