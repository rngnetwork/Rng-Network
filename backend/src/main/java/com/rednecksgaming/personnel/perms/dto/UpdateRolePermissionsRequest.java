// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

/**
 * Request payload for updating a role's JSONB permission tree with optimistic concurrency locking.
 */
public record UpdateRolePermissionsRequest(
        @NotNull(message = "Permissions payload cannot be null")
        @NotEmpty(message = "Permissions payload cannot be empty")
        Map<String, Object> permissions,

        @NotNull(message = "Version is required for optimistic concurrency control")
        Long version
) {
}
