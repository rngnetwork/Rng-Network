package com.rednecksgaming.embed.dto;

import com.rednecksgaming.embed.domain.DispatchStatus;
import com.rednecksgaming.embed.domain.DispatchType;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;

/**
 * Transfer object delivering chronological dispatch telemetry logs.
 */
@Builder
public record DispatchLogResponse(
    String id,
    String dispatchId,
    String userId,
    String userEmail,
    String serverId,
    String serverName,
    String channelId,
    String channelName,
    DispatchType dispatchType,
    DispatchStatus status,
    String discordMessageId,
    String errorMessage,
    Long latencyMs,
    Map<String, Object> payloadSnapshot,
    Instant scheduledFor,
    Instant timestamp
) {}
