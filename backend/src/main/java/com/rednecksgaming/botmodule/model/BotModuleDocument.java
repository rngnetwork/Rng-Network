package com.rednecksgaming.botmodule.model;

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
import java.util.Map;

/**
 * MongoDB Document representing Bot Module Configurations for Network-Wide and Server-Specific scopes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bot_modules")
@CompoundIndexes({
    @CompoundIndex(name = "idx_scope_server", def = "{'scope': 1, 'serverId': 1}", unique = true)
})
public class BotModuleDocument {

    @Id
    private String id;

    @NotBlank(message = "scope is required")
    @Indexed
    private String scope;

    @Indexed
    private String serverId;

    @NotNull
    private Map<String, Object> modules;

    private Map<String, Object> network;

    @Version
    private Long version;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    private String lastModifiedBy;
}
