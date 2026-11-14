// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB Document representing Discord component interaction audit logs.
 * Automatically pruned after 90 days via MongoDB TTL index.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interaction_logs")
@CompoundIndexes({
    @CompoundIndex(name = "idx_guild_created", def = "{'guildId': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "idx_user_created", def = "{'userId': 1, 'createdAt': -1}")
})
public class InteractionLog {

    @Id
    private String id;

    @Indexed
    private String actionId;

    private ActionType actionType;

    @NotBlank(message = "guildId is required")
    @Indexed
    private String guildId;

    private String channelId;

    private String messageId;

    @NotBlank(message = "userId is required")
    @Indexed
    private String userId;

    private String username;

    private String status;

    private String details;

    @CreatedDate
    @Indexed(expireAfter = "30d")
    private Instant createdAt;
}
