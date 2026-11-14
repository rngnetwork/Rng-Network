// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

/**
 * Payload requesting pre-flight dry-run diagnostic evaluation of a Discord V2 message.
 */
public record DryRunValidationRequest(
    @NotBlank(message = "serverId is required")
    String serverId,

    @NotBlank(message = "channelId is required")
    String channelId,

    @NotNull(message = "payload is required")
    Map<String, Object> payload,

    List<DispatchEmbedRequest.AttachmentMetadata> attachments
) {}
