package com.rednecksgaming.server.dto;

/**
 * Client-facing DTO representing a Discord emoji.
 */
public record DiscordEmojiDto(
    String id,
    String name,
    boolean animated,
    String url,
    String formatted
) {
    public static DiscordEmojiDto from(String id, String name, boolean animated) {
        String ext = animated ? "gif" : "webp";
        String url = (id != null && !id.isBlank())
            ? "https://cdn.discordapp.com/emojis/" + id + "." + ext + "?size=64"
            : "";
        String formatted = animated
            ? "<a:" + name + ":" + id + ">"
            : "<:" + name + ":" + id + ">";
        return new DiscordEmojiDto(id, name, animated, url, formatted);
    }
}
