// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhitelistedUserDto {

    private Long id;
    private String email;
    private String userName;
    private String provider;
    private String role;
    private List<String> designations;
    private List<String> roles;
    private String discordId;
    private String discordUsername;
    private String discordAvatar;
    private boolean discordLinked;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
