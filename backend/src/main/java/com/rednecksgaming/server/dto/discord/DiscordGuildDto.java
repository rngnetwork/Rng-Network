// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.server.dto.discord;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscordGuildDto {

    private String id;
    private String name;
    private String icon;
    private String banner;

    @JsonProperty("approximate_member_count")
    private Integer approximateMemberCount;

    @JsonProperty("approximate_presence_count")
    private Integer approximatePresenceCount;

    private String permissions;
}
