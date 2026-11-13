// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity.dto;

import com.rednecksgaming.identity.domain.AuthProvider;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
public class WhitelistUserRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Username is required")
    private String userName;

    @Builder.Default
    private AuthProvider provider = AuthProvider.EMAIL;

    @NotEmpty(message = "At least one designation is required")
    private List<String> designations;

    @NotEmpty(message = "At least one role is required")
    private List<String> roles;
}
