package com.rng.server.dto.discord;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscordChannelDto {

    private String id;
    private String name;
    private Integer type;
    private Integer position;

    @JsonProperty("parent_id")
    private String parentId;
}
