// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

/**
 * Selectable role summary offered to R9/R8 personnel inside the temporary role preview toggler.
 */
public record PreviewRoleOptionDto(
        String roleId,
        String designationId,
        String designationName,
        String roleName,
        int rankWeight,
        String rankCode
) {
}
