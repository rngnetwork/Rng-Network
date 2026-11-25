// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

/**
 * Explorer file entry corresponding to an explicit role within a designation folder.
 */
public record PermsFileDto(
        String id,
        String name,
        String fileName,
        String designationId,
        String designationName,
        int rankWeight,
        String rankCode,
        PermsRoleSchemaDto schema
) {
}
