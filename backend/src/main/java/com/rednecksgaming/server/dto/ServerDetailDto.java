package com.rednecksgaming.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerDetailDto {

    private String id;
    private String slug;
    private String name;
    private String description;
    private String iconUrl;
    private String bannerUrl;
    private Integer onlineCount;
    private Integer totalCount;
    private Integer boostLevel;
    private Integer boostCount;
    private List<String> features;

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
