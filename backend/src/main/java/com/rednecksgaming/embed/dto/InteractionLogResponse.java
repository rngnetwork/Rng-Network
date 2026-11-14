// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.dto;

import com.rednecksgaming.embed.domain.ActionType;
import com.rednecksgaming.embed.domain.InteractionLog;

import java.time.Instant;

/**
 * Response DTO representing an interaction log entry.
 */
public record InteractionLogResponse(
    String id,
    String actionId,
    ActionType actionType,
    String guildId,
    String channelId,
    String messageId,
    String userId,
    String username,
    String status,
    String details,
    Instant createdAt
) {
    public static InteractionLogResponse fromDomain(InteractionLog log) {
        return new InteractionLogResponse(
            log.getId(),
            log.getActionId(),
            log.getActionType(),
            log.getGuildId(),
            log.getChannelId(),
            log.getMessageId(),
            log.getUserId(),
            log.getUsername(),
            log.getStatus(),
            log.getDetails(),
            log.getCreatedAt()
        );
    }
}
