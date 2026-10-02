package com.rng.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object representing a Discord Server Role.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerRoleDto {

    private String id;
    private String name;
    private String color;
    private int position;
    private boolean managed;
    private boolean assignableByBot;
}
