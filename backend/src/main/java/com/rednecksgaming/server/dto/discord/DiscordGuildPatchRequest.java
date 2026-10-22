package com.rednecksgaming.server.dto.discord;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DiscordGuildPatchRequest {

    private String name;
    private String description;
    private String icon;
    private String banner;

    @JsonProperty("afk_channel_id")
    private String afkChannelId;

    @JsonProperty("afk_timeout")
    private Integer afkTimeout;

    @JsonProperty("system_channel_id")
    private String systemChannelId;

    @JsonProperty("system_channel_flags")
    private Integer systemChannelFlags;

    @JsonProperty("default_message_notifications")
    private Integer defaultMessageNotifications;
}
