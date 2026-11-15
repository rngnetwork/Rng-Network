// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddRoleRequest(
        @NotNull(message = "rankWeight must not be null")
        @Min(value = 0, message = "rankWeight must be >= 0")
        @Max(value = 100, message = "rankWeight must be <= 100")
        Integer rankWeight,

        @NotBlank(message = "designationId must not be blank")
        @Size(min = 2, max = 100, message = "designationId length must be between 2 and 100")
        @Pattern(regexp = "^[a-z0-9_-]+$", message = "designationId must be lowercase alphanumeric with hyphens or underscores")
        String designationId,

        @NotBlank(message = "role name must not be blank")
        @Size(min = 2, max = 150, message = "role name length must be between 2 and 150")
        String name
) {}
