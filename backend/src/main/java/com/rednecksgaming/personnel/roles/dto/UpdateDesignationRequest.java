// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateDesignationRequest(
        @NotBlank(message = "designation name must not be blank")
        @Size(min = 2, max = 150, message = "designation name length must be between 2 and 150")
        String name
) {}
