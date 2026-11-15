// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.dto;

import java.util.List;
import java.util.Map;

public record RoleHierarchyMatrixDto(
        List<MatrixRankDto> ranks,
        List<MatrixDesignationDto> designations,
        Map<String, List<PopoverRoleDto>> cells
) {}
