package com.rednecksgaming.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelDto {

    private String id;
    private String name;
    private Integer type;
    private Integer position;
    private String parentId;
}
