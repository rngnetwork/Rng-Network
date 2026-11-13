// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionExecutionResult {
    private boolean success;
    private String ticketId;
    private String channelId;
    private String responseMessage;
    private String newGeneratedMessageId;
    private boolean isTerminal;
    private boolean dmDelivered;
    private String errorMessage;

    public static ActionExecutionResult success(String message) {
        return ActionExecutionResult.builder()
                .success(true)
                .responseMessage(message)
                .isTerminal(true)
                .build();
    }

    public static ActionExecutionResult intermediate(String newGeneratedMessageId) {
        return ActionExecutionResult.builder()
                .success(true)
                .newGeneratedMessageId(newGeneratedMessageId)
                .isTerminal(false)
                .build();
    }

    public static ActionExecutionResult failure(String errorMessage) {
        return ActionExecutionResult.builder()
                .success(false)
                .errorMessage(errorMessage)
                .isTerminal(true)
                .build();
    }

    public String getMessage() {
        return errorMessage != null ? errorMessage : responseMessage;
    }
}
