package com.rng.embed.dto;

import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.RoleSubtype;

import java.time.Instant;

/**
 * Response DTO representing an EmbedAction template.
 */
public record EmbedActionDto(
    String id,
    String actionId,
    String serverId,
    boolean isGlobal,
    String name,
    String description,
    ActionType actionType,
    RoleSubtype roleSubtype,
    String roleId,
    String roleName,
    String channelPrefix,
    String welcomeMessage,
    String replyContent,
    boolean isEphemeral,
    String dmContent,
    boolean requiredUser,
    boolean requiredRole,
    String responseEmbedTemplateId,
    Instant createdAt,
    Instant updatedAt
) {
    public static EmbedActionDto fromDomain(EmbedAction action) {
        return new EmbedActionDto(
            action.getId(),
            action.getActionId(),
            action.getServerId(),
            action.isGlobal(),
            action.getName(),
            action.getDescription(),
            action.getActionType(),
            action.getRoleSubtype(),
            action.getRoleId(),
            action.getRoleName(),
            action.getChannelPrefix(),
            action.getWelcomeMessage(),
            action.getReplyContent(),
            action.isEphemeral(),
            action.getDmContent(),
            action.isRequiredUser(),
            action.isRequiredRole(),
            action.getResponseEmbedTemplateId(),
            action.getCreatedAt(),
            action.getUpdatedAt()
        );
    }
}
