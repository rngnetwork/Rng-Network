package com.rng.embed.dto;

import com.rng.embed.domain.DispatchType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Payload requesting immediate or scheduled bot dispatch of a Discord V2 embed.
 */
public record DispatchEmbedRequest(
    @NotBlank(message = "serverId is required")
    String serverId,

    @NotBlank(message = "channelId is required")
    String channelId,

    @NotNull(message = "dispatchType is required")
    DispatchType dispatchType,

    Instant scheduledFor,

    @NotNull(message = "payload is required")
    Map<String, Object> payload,

    List<AttachmentMetadata> attachments
) {
    public record AttachmentMetadata(
        int id,
        String filename,
        String description
    ) {}
}
