// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

/**
 * Payload requesting modification of an existing embed template in MongoDB.
 */
public record UpdateTemplateRequest(
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

    Boolean isPublic
) {
    public UpdateTemplateRequest(
            String name,
            String description,
            String category,
            List<String> tags,
            Map<String, Object> payload,
            Boolean isPublic) {
        this(name, description, category, tags, null, null, payload, isPublic);
    }
}
