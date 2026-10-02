package com.rng.embed.dto;

import com.rng.embed.domain.ActionPayload;
import com.rng.embed.domain.ActionType;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

/**
 * Request payload for creating a new interactive action in the registry.
 */
@Builder
public record CreateActionRequest(
    String name,

    @NotNull(message = "actionType is required")
    ActionType actionType,

    ActionPayload payload
) {}
