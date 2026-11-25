// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Full DTO representing a single persisted role's permission matrix and audit metadata.
 */
public record RolePermissionsDto(
        String roleId,
        String designationId,
        String designationName,
        String roleName,
        int rankWeight,
        String rankCode,
        Map<String, Object> permissions,
        Map<String, String> labels,
        Long version,
        String updatedBy,
        Instant updatedAt
) {
}
