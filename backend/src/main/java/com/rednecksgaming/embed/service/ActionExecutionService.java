package com.rednecksgaming.embed.service;

import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;

import java.util.Map;

/**
 * Service orchestrating execution of Discord interactive component actions
 * (ROLE, TICKET, REPLY, DM) with strict hierarchy guardrails and telemetry.
 */
public interface ActionExecutionService {

    void executeButtonAction(ButtonInteractionEvent event, EmbedAction action, Map<String, String> sessionData);

    void executeStringSelectAction(StringSelectInteractionEvent event, EmbedAction action, Map<String, String> sessionData);

    ActionExecutionResult executeComponentAction(String actionId, Guild guild, Member operator, InteractionHook hook, Map<String, String> sessionData);

    ActionExecutionResult executeCompoundAction(String actionId, Guild guild, Member operator, InteractionHook hook, Map<String, String> sessionData);

    boolean canOperatorAssignRole(Member operator, Role targetRole);

    ActionExecutionResult dispatchDMLogsWithFallback(User user, TextChannel ticketChannel, MessageCreateData logData);
}
