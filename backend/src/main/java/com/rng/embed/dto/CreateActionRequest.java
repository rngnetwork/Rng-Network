package com.rng.embed.dto;

import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.RoleSubtype;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload requesting creation of an interactive component Action Template.
 */
public record CreateActionRequest(
    String serverId,

    boolean isGlobal,

    @NotBlank(message = "Action name cannot be blank")
    @Size(max = 100, message = "Action name cannot exceed 100 characters")
    String name,

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    String description,

    @NotNull(message = "Action type is required")
    ActionType actionType,

    RoleSubtype roleSubtype,

    String roleId,

    String roleName,

    String channelPrefix,

    String welcomeMessage,

    String replyContent,

    Boolean isEphemeral,

    String dmContent,

    Boolean requiredUser,

    Boolean requiredRole,

    String responseEmbedTemplateId
) {}
