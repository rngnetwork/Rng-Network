package com.rednecksgaming.embed.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.rednecksgaming.embed.domain.ActionType;
import com.rednecksgaming.embed.domain.CompoundOperation;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.ResponseType;
import com.rednecksgaming.embed.domain.RoleSubtype;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO representing an EmbedAction template.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class EmbedActionDto {

    private String id;
    private String actionId;
    private String serverId;

    @JsonProperty("isGlobal")
    @Builder.Default
    private boolean isGlobal = false;

    @Builder.Default
    private List<String> serverIds = new ArrayList<>();

    private String name;
    private String description;
    private ActionType actionType;
    private RoleSubtype roleSubtype;
    private String roleId;
    private String roleName;
    private String channelPrefix;
    private String welcomeMessage;
    private String replyContent;
    private String confirmationMessage;

    @JsonProperty("isEphemeral")
    @Builder.Default
    private boolean isEphemeral = true;

    private String dmContent;

    @JsonProperty("requiredUser")
    @Builder.Default
    private boolean requiredUser = false;

    @JsonProperty("requiredRole")
    @Builder.Default
    private boolean requiredRole = false;

    @Builder.Default
    private ResponseType responseType = ResponseType.EPHEMERAL_TEXT;

    private String responseEmbedTemplateId;

    @Builder.Default
    private List<CompoundOperation> compoundOperations = new ArrayList<>();

    private Long version;
    private Instant createdAt;
    private Instant updatedAt;

    /**
     * Backward-compatible 20-parameter constructor.
     */
    public EmbedActionDto(
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
            Instant updatedAt) {
        this.id = id;
        this.actionId = actionId;
        this.serverId = serverId;
        this.isGlobal = isGlobal;
        this.serverIds = serverId != null ? List.of(serverId) : new ArrayList<>();
        this.name = name;
        this.description = description;
        this.actionType = actionType;
        this.roleSubtype = roleSubtype;
        this.roleId = roleId;
        this.roleName = roleName;
        this.channelPrefix = channelPrefix;
        this.welcomeMessage = welcomeMessage;
        this.replyContent = replyContent;
        this.confirmationMessage = null;
        this.isEphemeral = isEphemeral;
        this.dmContent = dmContent;
        this.requiredUser = requiredUser;
        this.requiredRole = requiredRole;
        this.responseType = ResponseType.EPHEMERAL_TEXT;
        this.responseEmbedTemplateId = responseEmbedTemplateId;
        this.compoundOperations = new ArrayList<>();
        this.version = null;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static EmbedActionDto fromDomain(EmbedAction action) {
        if (action == null) return null;
        return EmbedActionDto.builder()
                .id(action.getId())
                .actionId(action.getActionId())
                .serverId(action.getServerId())
                .isGlobal(action.isGlobal())
                .serverIds(action.getServerIds() != null ? action.getServerIds() : new ArrayList<>())
                .name(action.getName())
                .description(action.getDescription())
                .actionType(action.getActionType())
                .roleSubtype(action.getRoleSubtype())
                .roleId(action.getRoleId())
                .roleName(action.getRoleName())
                .channelPrefix(action.getChannelPrefix())
                .welcomeMessage(action.getWelcomeMessage())
                .replyContent(action.getReplyContent())
                .confirmationMessage(action.getConfirmationMessage())
                .isEphemeral(action.isEphemeral())
                .dmContent(action.getDmContent())
                .requiredUser(action.isRequiredUser())
                .requiredRole(action.isRequiredRole())
                .responseType(action.getResponseType() != null ? action.getResponseType() : ResponseType.EPHEMERAL_TEXT)
                .responseEmbedTemplateId(action.getResponseEmbedTemplateId())
                .compoundOperations(action.getCompoundOperations() != null ? action.getCompoundOperations() : new ArrayList<>())
                .version(action.getVersion())
                .createdAt(action.getCreatedAt())
                .updatedAt(action.getUpdatedAt())
                .build();
    }

    // Dual record-style accessors (ignored by Jackson to avoid phantom property introspection)
    @JsonIgnore public String id() { return id; }
    @JsonIgnore public String actionId() { return actionId; }
    @JsonIgnore public String serverId() { return serverId; }
    @JsonIgnore public boolean isGlobal() { return isGlobal; }
    @JsonIgnore public List<String> serverIds() { return serverIds; }
    @JsonIgnore public String name() { return name; }
    @JsonIgnore public String description() { return description; }
    @JsonIgnore public ActionType actionType() { return actionType; }
    @JsonIgnore public RoleSubtype roleSubtype() { return roleSubtype; }
    @JsonIgnore public String roleId() { return roleId; }
    @JsonIgnore public String roleName() { return roleName; }
    @JsonIgnore public String channelPrefix() { return channelPrefix; }
    @JsonIgnore public String welcomeMessage() { return welcomeMessage; }
    @JsonIgnore public String replyContent() { return replyContent; }
    @JsonIgnore public String confirmationMessage() { return confirmationMessage; }
    @JsonIgnore public boolean isEphemeral() { return isEphemeral; }
    @JsonIgnore public String dmContent() { return dmContent; }
    @JsonIgnore public boolean requiredUser() { return requiredUser; }
    @JsonIgnore public boolean requiredRole() { return requiredRole; }
    @JsonIgnore public ResponseType responseType() { return responseType; }
    @JsonIgnore public String responseEmbedTemplateId() { return responseEmbedTemplateId; }
    @JsonIgnore public List<CompoundOperation> compoundOperations() { return compoundOperations; }
    @JsonIgnore public Long version() { return version; }
    @JsonIgnore public Instant createdAt() { return createdAt; }
    @JsonIgnore public Instant updatedAt() { return updatedAt; }
}
