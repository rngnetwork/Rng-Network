package com.rng.embed.dto;

import com.rng.embed.domain.ActionPayload;
import com.rng.embed.domain.ActionType;
import lombok.Builder;

import java.time.Instant;

/**
 * Data Transfer Object delivering registered action details.
 */
@Builder
public record EmbedActionDto(
    String id,
    String actionId,
    String serverId,
    String name,
    ActionType actionType,
    ActionPayload payload,
    String createdBy,
    Instant createdAt,
    Instant updatedAt
) {}
