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
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * MongoDB Document representing reusable Discord Components V2 message templates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "embed_templates")
@CompoundIndexes({
    @CompoundIndex(name = "idx_server_public_category", def = "{'serverId': 1, 'isPublic': 1, 'category': 1}"),
    @CompoundIndex(name = "idx_server_ids_public", def = "{'serverIds': 1, 'isPublic': 1}"),
    @CompoundIndex(name = "idx_author_updated", def = "{'authorId': 1, 'updatedAt': -1}"),
    @CompoundIndex(name = "idx_category_tags", def = "{'category': 1, 'tags': 1}")
})
public class EmbedTemplate {

    @Id
    private String id;

    @Indexed(unique = true)
    @NotBlank(message = "templateId is required")
    private String templateId;

    @NotBlank(message = "Template name cannot be blank")
    @Size(max = 100)
    @Indexed
    private String name;

    @Size(max = 500)
    private String description;

    @NotBlank(message = "authorId is required")
    @Indexed
    private String authorId;

    @NotBlank(message = "authorName is required")
    private String authorName;

    @Indexed
    private String serverId; // Null for global community template

    @Indexed
    @Builder.Default
    @Field("serverIds")
    private List<String> serverIds = new ArrayList<>();

    @NotBlank(message = "Category is required")
    @Indexed
    @Builder.Default
    private String category = "general";

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @NotNull(message = "Discord V2 payload is mandatory")
    @Field("payload")
    private Map<String, Object> payload; // Full Type 17 Containers structure

    @Indexed
    @Builder.Default
    private boolean isPublic = false;

    @Version
    private Long version;

    @CreatedDate
    @Indexed
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
