package com.rng.embed.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.core.io.Resource;

import java.util.List;
import java.util.Map;

/**
 * Service contract defining direct Discord REST API v10 outbound message dispatch operations.
 */
public interface DiscordDispatchService {

    /**
     * Dispatch Discord Components V2 message to a target channel using bot credentials.
     */
    JsonNode dispatchToChannel(String channelId, Map<String, Object> payload, List<Resource> fileAttachments);

    /**
     * Edit the original interaction response message with authentic Components V2 wire payload.
     */
    JsonNode editOriginalInteraction(String applicationId, String interactionToken, Map<String, Object> payload);

    /**
     * Send a follow-up interaction response message with authentic Components V2 wire payload.
     */
    JsonNode sendFollowUpInteraction(String applicationId, String interactionToken, Map<String, Object> payload, boolean ephemeral);
}

