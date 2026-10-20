package com.rednecksgaming.server.dto.discord;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscordGuildDetailDto {

    private String id;
    private String name;
    private String description;
    private String icon;
    private String banner;

    @JsonProperty("approximate_member_count")
    private Integer approximateMemberCount;

    @JsonProperty("approximate_presence_count")
    private Integer approximatePresenceCount;

    @JsonProperty("premium_tier")
    private Integer premiumTier;

    @JsonProperty("premium_subscription_count")
    private Integer premiumSubscriptionCount;

    private List<String> features;

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

    @JsonProperty("vanity_url_code")
    private String vanityUrlCode;

    @JsonProperty("widget_enabled")
    private Boolean widgetEnabled;

    @JsonProperty("widget_channel_id")
    private String widgetChannelId;
}
