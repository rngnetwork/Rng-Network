package com.rednecksgaming.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveSessionDto {

    private String id;
    private String ipAddress;
    private String userAgent;
    private Instant createdAt;
    private Instant lastActiveAt;
    private boolean current;
}
