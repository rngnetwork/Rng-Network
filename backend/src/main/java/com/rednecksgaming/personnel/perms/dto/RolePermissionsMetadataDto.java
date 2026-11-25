// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

/**
 * Role schema metadata block rendered by the visual and JSON permission editors.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RolePermissionsMetadataDto(
        @JsonProperty("role_name") String roleName,
        @JsonProperty("designation_id") String designationId,
        @JsonProperty("designation_name") String designationName,
        String code,
        int weight,
        Long version,
        @JsonProperty("last_modified_at") Instant lastModifiedAt,
        @JsonProperty("last_modified_by") String lastModifiedBy
) {
}
