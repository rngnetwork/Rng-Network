package com.rednecksgaming.embed.dto;

import com.rednecksgaming.embed.domain.DispatchType;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;

/**
 * Data transfer object encapsulating queued scheduled dispatch tasks stored in Redis.
 */
@Builder(toBuilder = true)
public record ScheduledTaskDto(
    String dispatchId,
    String userId,
    String userEmail,
    String serverId,
    String channelId,
    DispatchType dispatchType,
    Instant scheduledFor,
    Map<String, Object> payload,
    int attemptCount,
    Instant createdAt,
    String lastError
) {}
