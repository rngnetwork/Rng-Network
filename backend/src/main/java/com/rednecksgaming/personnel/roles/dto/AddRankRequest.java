// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AddRankRequest(
        @NotNull(message = "weight must not be null")
        @Min(value = 0, message = "weight must be >= 0")
        @Max(value = 100, message = "weight must be <= 100")
        Integer weight,

        @NotBlank(message = "code must not be blank")
        @Size(min = 2, max = 20, message = "code length must be between 2 and 20")
        String code
) {}
