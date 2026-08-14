package com.rng.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String email;
    private String fullName;
    private String provider;
    private String discordId;
    private String discordUsername;
    private String discordAvatar;
    private boolean discordLinked;
    private String role;
}
