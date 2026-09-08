package com.rng.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerDto {

    private String id;
    private String slug;
    private String name;
    private String iconUrl;
    private String bannerUrl;
    private Integer onlineCount;
    private Integer totalCount;
    private Integer boostLevel;
    private Integer boostCount;
    private String status;
}
