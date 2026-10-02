package com.rng.embed.dto;

import com.rng.embed.domain.ActionPayload;
import com.rng.embed.domain.ActionType;
import lombok.Builder;

/**
 * Request payload for modifying an existing action in the registry.
 */
@Builder
public record UpdateActionRequest(
    String name,
    ActionType actionType,
    ActionPayload payload
) {}
