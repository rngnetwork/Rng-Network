package com.rednecksgaming.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object representing a Discord guild role with bot assignability metadata.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerRoleDto {

    private String id;
    private String name;
    private String colorHex;
    private Integer position;
    private boolean managed;
    private boolean assignableByBot;
}
