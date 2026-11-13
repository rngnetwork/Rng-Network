// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.botmodule.model;

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
import java.util.Map;

/**
 * MongoDB Document representing immutable audit log events for bot module modifications.
 * Retained for 30 days via MongoDB TTL index.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bot_module_audit_logs")
@CompoundIndexes({
    @CompoundIndex(name = "idx_audit_scope_server_time", def = "{'scope': 1, 'serverId': 1, 'timestamp': -1}"),
    @CompoundIndex(name = "idx_audit_actor_time", def = "{'actorId': 1, 'timestamp': -1}")
})
public class BotModuleAuditLogDocument {

    @Id
    private String id;

    @NotBlank(message = "scope is required")
    @Indexed
    private String scope;

    @Indexed
    private String serverId;

    @NotBlank(message = "actorId is required")
    @Indexed
    private String actorId;

    private String actorName;

    @NotBlank(message = "action is required")
    private String action;

    private String moduleName;

    private Map<String, Object> payloadDiff;

    @CreatedDate
    @Indexed(name = "idx_timestamp_ttl", expireAfter = "30d")
    private Instant timestamp;
}
