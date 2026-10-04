package com.rng.embed.domain;

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
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB Document representing reusable Discord component action templates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "embed_actions")
@CompoundIndexes({
    @CompoundIndex(name = "idx_server_action", def = "{'serverId': 1, 'actionId': 1}", unique = true)
})
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

    @Builder.Default
    private boolean isEphemeral = true;

    private String dmContent;

    @Builder.Default
    private boolean requiredUser = false;

    @Builder.Default
    private boolean requiredRole = false;

    private String responseEmbedTemplateId;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
