// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;
import java.util.Set;

/**
 * Effective permission matrix evaluated for the active caller via multi-role additive union or R9/R8 preview mode.
 */
public record EffectivePermissionsDto(
        String userId,
        Set<String> rolesEvaluated,
        @JsonProperty("isPreviewMode") boolean isPreviewMode,
        String previewRoleId,
        String previewRoleName,
        int callerMaxRankWeight,
        Map<String, Object> permissions
) {
}
