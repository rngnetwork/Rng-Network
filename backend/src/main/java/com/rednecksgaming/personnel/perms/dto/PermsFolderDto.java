// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

import java.util.List;

/**
 * Explorer folder grouping explicit role permission files under one designation.
 */
public record PermsFolderDto(
        String id,
        String name,
        List<PermsFileDto> files
) {
}
