package com.rednecksgaming.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Pre2FaResponse {

    private String token;
    @Builder.Default
    private boolean requiresDiscord2Fa = true;
    private boolean discordLinked;
    private String userEmail;
}
