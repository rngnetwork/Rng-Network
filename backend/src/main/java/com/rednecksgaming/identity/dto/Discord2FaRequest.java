package com.rednecksgaming.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Discord2FaRequest {

    @NotBlank(message = "Discord OAuth2 code is required")
    private String code;

    private String redirectUri;
}
