package com.rednecksgaming.botmodule.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request payload for patching bot module and network configurations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotModuleConfigRequest {

    private Map<String, Object> modules;

    private Map<String, Object> network;

    @JsonIgnore
    @AssertTrue(message = "modules or network payload must be provided")
    public boolean isValid() {
        return (modules != null && !modules.isEmpty()) || (network != null && !network.isEmpty());
    }
}
