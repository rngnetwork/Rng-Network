package com.rednecksgaming.botmodule.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request payload for patching bot module configurations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotModuleConfigRequest {

    @NotNull(message = "modules payload cannot be null")
    private Map<String, Object> modules;
}
