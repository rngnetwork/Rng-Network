// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * MongoDB Document representing reusable Discord component action templates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "embed_actions")
public class EmbedAction {

    @Id
    private String id;

    @Indexed(unique = true)
    @NotBlank(message = "actionId is required")
    private String actionId;

    @Indexed
    private String serverId;

    @Indexed
    @Builder.Default
    private boolean isGlobal = false;

    @Indexed
    @Builder.Default
    private List<String> serverIds = new ArrayList<>();

    @NotBlank(message = "Action name cannot be blank")
    @Size(max = 100)
    @Indexed
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull(message = "actionType is required")
    private ActionType actionType;

    private RoleSubtype roleSubtype;

    private String roleId;

    private String roleName;

    private String channelPrefix;

    private String welcomeMessage;

    private String replyContent;

    private String confirmationMessage;

    @Builder.Default
    private boolean isEphemeral = true;

    private String dmContent;

    @Builder.Default
    private boolean requiredUser = false;

    @Builder.Default
    private boolean requiredRole = false;

    @Builder.Default
    private ResponseType responseType = ResponseType.EPHEMERAL_TEXT;

    private String responseEmbedTemplateId;

    @Builder.Default
    private List<CompoundOperation> compoundOperations = new ArrayList<>();

    @Version
    private Long version;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
