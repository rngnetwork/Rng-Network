// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

import java.util.Map;

/**
 * Render-ready permission schema document attached to an explorer role file.
 */
public record PermsRoleSchemaDto(
        String title,
        RolePermissionsMetadataDto metadata,
        Map<String, Object> permissions
) {
}
