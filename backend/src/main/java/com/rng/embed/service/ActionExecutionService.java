package com.rng.embed.service;

import com.rng.embed.domain.EmbedAction;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;

import java.util.Map;

/**
 * Service orchestrating execution of Discord interactive component actions
 * (ROLE, TICKET, REPLY, DM) with strict hierarchy guardrails and telemetry.
 */
public interface ActionExecutionService {

    void executeButtonAction(ButtonInteractionEvent event, EmbedAction action, Map<String, String> sessionData);

    void executeStringSelectAction(StringSelectInteractionEvent event, EmbedAction action, Map<String, String> sessionData);
}
