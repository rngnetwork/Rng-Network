// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity.dto;

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
    private String designations;
    private String roles;
    private java.util.List<String> designationList;
    private java.util.List<String> roleList;
    private String status;
}
