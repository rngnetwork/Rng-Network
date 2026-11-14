// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Dispatch routing type for Discord Components V2 messages.
 * Supports standard and legacy client aliases via JsonCreator.
 */
public enum DispatchType {
    IMMEDIATE,
    SCHEDULED,
    WEBHOOK;

    @JsonCreator
    public static DispatchType fromString(String value) {
        if (value == null || value.isBlank()) {
            return IMMEDIATE;
        }
        String upper = value.trim().toUpperCase();
        if (upper.contains("WEBHOOK")) {
            return WEBHOOK;
        }
        if (upper.contains("SCHEDULE")) {
            return SCHEDULED;
        }
        return IMMEDIATE;
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}
