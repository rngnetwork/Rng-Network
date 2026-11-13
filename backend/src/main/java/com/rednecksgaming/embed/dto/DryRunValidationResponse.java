// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.dto;

import lombok.Builder;

import java.util.List;

/**
 * Diagnostic report transfer object evaluating Discord V2 message constraints and permissions.
 */
@Builder
public record DryRunValidationResponse(
    boolean isValid,
    List<String> errors,
    List<String> warnings,
    int containerCount,
    int totalComponentCount,
    int totalActionRows,
    long cumulativeCharCount,
    long estimatedBytes,
    BotPermissionCheck permissions
) {
    @Builder
    public record BotPermissionCheck(
        boolean hasViewChannel,
        boolean hasSendMessages,
        boolean hasEmbedLinks
    ) {}
}
