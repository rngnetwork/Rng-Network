package com.rng.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateServerSettingsRequest {

    @NotBlank(message = "Server name is required")
    @Size(min = 2, max = 100, message = "Server name must be between 2 and 100 characters")
    private String name;

    @Size(max = 120, message = "Description must not exceed 120 characters")
    private String description;

    private String icon;
    private String banner;

    private String afkChannelId;
    private Integer afkTimeout;
    private String systemChannelId;

    private Boolean sendWelcome;
    private Boolean stickerPrompt;
    private Boolean boostMessage;
    private Boolean setupTips;

    private Integer defaultMessageNotifications;
    private String vanityUrl;
    private Boolean widgetEnabled;
    private String widgetChannelId;
}
