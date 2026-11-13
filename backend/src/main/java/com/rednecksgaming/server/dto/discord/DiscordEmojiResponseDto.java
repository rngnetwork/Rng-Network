// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.server.dto.discord;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Raw emoji payload received from Discord REST API v10 (/guilds/:id/emojis or /applications/:id/emojis).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record DiscordEmojiResponseDto(
    String id,
    String name,
    boolean animated,
    Boolean available,
    Boolean require_colons
) {}
