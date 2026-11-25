// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

import java.util.List;
import java.util.Map;

/**
 * Aggregated explorer payload delivering designation folders, managed servers, and formatted display labels.
 */
public record PermsExplorerResponseDto(
        List<PermsFolderDto> folders,
        List<PermsServerSummaryDto> servers,
        Map<String, String> labels
) {
}
