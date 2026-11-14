// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWhitelistedUserRequest {

    private String userName;

    @NotEmpty(message = "At least one designation is required")
    private List<String> designations;

    @NotEmpty(message = "At least one role is required")
    private List<String> roles;
}
