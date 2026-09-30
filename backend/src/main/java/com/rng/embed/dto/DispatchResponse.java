package com.rng.embed.dto;

import com.rng.embed.domain.DispatchStatus;
import lombok.Builder;

import java.time.Instant;

/**
 * Standard response transfer object returned following dispatch initiation or scheduling.
 */
@Builder
public record DispatchResponse(
    String dispatchId,
    String discordMessageId,
    DispatchStatus status,
    Instant scheduledFor,
    Instant timestamp,
    Long latencyMs
) {}
