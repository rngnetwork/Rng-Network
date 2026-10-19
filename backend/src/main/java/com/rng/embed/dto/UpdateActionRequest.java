package com.rng.embed.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.CompoundOperation;
import com.rng.embed.domain.ResponseType;
import com.rng.embed.domain.RoleSubtype;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Payload requesting update of an existing Action Template.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateActionRequest {

    private String serverId;

    @JsonProperty("isGlobal")
    private Boolean isGlobal;

    private List<String> serverIds;

    @NotBlank(message = "Action name cannot be blank")
    @Size(max = 100, message = "Action name cannot exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotNull(message = "Action type is required")
    private ActionType actionType;

    private RoleSubtype roleSubtype;

    private String roleId;

    private String roleName;

    private String channelPrefix;

    private String welcomeMessage;

    private String replyContent;

    private String confirmationMessage;

    @JsonProperty("isEphemeral")
    private Boolean isEphemeral;

    private String dmContent;

    @JsonProperty("requiredUser")
    private Boolean requiredUser;

    @JsonProperty("requiredRole")
    private Boolean requiredRole;

    private ResponseType responseType;

    private String responseEmbedTemplateId;

    private List<CompoundOperation> compoundOperations;

    /**
     * Backward-compatible 16-parameter constructor.
     */
    public UpdateActionRequest(
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
            Boolean isEphemeral,
            String dmContent,
            Boolean requiredUser,
            Boolean requiredRole,
            String responseEmbedTemplateId) {
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
        this.isEphemeral = isEphemeral;
        this.dmContent = dmContent;
        this.requiredUser = requiredUser;
        this.requiredRole = requiredRole;
        this.responseEmbedTemplateId = responseEmbedTemplateId;
        this.compoundOperations = new ArrayList<>();
    }

    // Dual record-style accessors (ignored by Jackson to avoid phantom property introspection)
    @JsonIgnore public String serverId() { return serverId; }
    @JsonIgnore public Boolean isGlobal() { return isGlobal; }
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
    @JsonIgnore public Boolean isEphemeral() { return isEphemeral; }
    @JsonIgnore public String dmContent() { return dmContent; }
    @JsonIgnore public Boolean requiredUser() { return requiredUser; }
    @JsonIgnore public Boolean requiredRole() { return requiredRole; }
    @JsonIgnore public ResponseType responseType() { return responseType; }
    @JsonIgnore public String responseEmbedTemplateId() { return responseEmbedTemplateId; }
    @JsonIgnore public List<CompoundOperation> compoundOperations() { return compoundOperations; }
}
