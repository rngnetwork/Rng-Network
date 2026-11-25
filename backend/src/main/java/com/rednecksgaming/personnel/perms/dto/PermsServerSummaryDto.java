// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

/**
 * Minimal managed Discord server summary included in permissions explorer payloads.
 */
public record PermsServerSummaryDto(
        String slug,
        String name,
        String iconUrl
) {
}
