package com.rednecksgaming.embed.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Transfer object delivering persisted embed template details to clients.
 */
@Builder
public record TemplateResponse(
    String id,
    String templateId,
    String name,
    String description,
    String authorId,
    String authorName,
    String serverId,
    String category,
    List<String> tags,
    Map<String, Object> payload,
    boolean isPublic,
    Long version,
    Instant createdAt,
    Instant updatedAt
) {}
