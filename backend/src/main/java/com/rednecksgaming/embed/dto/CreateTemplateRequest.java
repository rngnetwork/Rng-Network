// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Payload requesting creation of an embed template in MongoDB.
 */
public record CreateTemplateRequest(
    @NotBlank(message = "Template name cannot be blank")
    @Size(max = 100, message = "Template name cannot exceed 100 characters")
    String name,

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    String description,

    String category,

    List<String> tags,

    String serverId,

    List<String> serverIds,

    @NotNull(message = "Discord V2 payload is mandatory")
    Map<String, Object> payload,

    boolean isPublic
) {
    public CreateTemplateRequest(
            String name,
            String description,
            String category,
            List<String> tags,
            String serverId,
            Map<String, Object> payload,
            boolean isPublic) {
        this(name, description, category, tags, serverId,
                serverId != null && !serverId.isBlank() ? List.of(serverId) : new ArrayList<>(),
                payload, isPublic);
    }
}
