package com.rng.embed.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Encapsulated action configuration parameters.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionPayload {

    // ROLE configuration
    private String roleSubtype; // TOGGLE, ADD, REMOVE
    private String roleId;
    private String roleName;
    private String successMessage;
    private String removeMessage;

    // REPLY & DM configuration
    private Boolean ephemeral;
    private String replyContent;

    // TICKET configuration
    private String channelPrefix;
    private String categoryId;
    private List<String> supportRoleIds;
    private String welcomeMessage;

    // DM configuration
    private String dmContent;
}
