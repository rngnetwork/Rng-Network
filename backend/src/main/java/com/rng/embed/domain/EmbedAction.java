package com.rng.embed.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB Document representing an interactive action registered in the RNG Action Registry.
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
    private String actionId; // e.g. rng_act_a1b2c3d4e5f67890

    @Indexed
    @NotBlank(message = "serverId is required")
    private String serverId; // Discord Guild Snowflake

    private String name; // Friendly display label

    @NotNull(message = "actionType is required")
    private ActionType actionType; // ROLE, REPLY, TICKET, MODAL, DM

    private ActionPayload payload;

    private String createdBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Version
    private Long version;
}
