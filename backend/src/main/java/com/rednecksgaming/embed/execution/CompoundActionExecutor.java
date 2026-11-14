// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.execution;

import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.embed.domain.CompoundOperation;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedActionRepository;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.service.EmbedTemplateRenderer;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Enterprise executor for complex compound actions chaining multiple operations
 * (role updates, ticket provisioning, and direct message dispatches).
 */
@Slf4j
@Component
public class CompoundActionExecutor {

    private final EmbedActionRepository embedActionRepository;
    private final EmbedTemplateRepository embedTemplateRepository;
    private final TemplateVariableInterpolator interpolator;
    private final RoleActionExecutor roleActionExecutor;
    private final DmActionExecutor dmActionExecutor;
    private final Optional<EmbedTemplateRenderer> embedTemplateRenderer;

    @Autowired
    public CompoundActionExecutor(
            EmbedActionRepository embedActionRepository,
            EmbedTemplateRepository embedTemplateRepository,
            TemplateVariableInterpolator interpolator,
            RoleActionExecutor roleActionExecutor,
            DmActionExecutor dmActionExecutor,
            @Autowired(required = false) EmbedTemplateRenderer embedTemplateRenderer) {
        this.embedActionRepository = embedActionRepository;
        this.embedTemplateRepository = embedTemplateRepository;
        this.interpolator = interpolator;
        this.roleActionExecutor = roleActionExecutor;
        this.dmActionExecutor = dmActionExecutor;
        this.embedTemplateRenderer = Optional.ofNullable(embedTemplateRenderer);
    }

    public ActionExecutionResult executeCompoundAction(
            String actionId,
            Guild guild,
            Member operator,
            InteractionHook hook,
            Map<String, String> sessionData) {

        EmbedAction action = embedActionRepository.findByActionId(actionId)
                .or(() -> embedActionRepository.findById(actionId))
                .orElseThrow(() -> new ResourceNotFoundException("Action not found: " + actionId));

        Member botMember = roleActionExecutor.resolveBotMember(guild);
        if (botMember != null && !botMember.hasPermission(Permission.MANAGE_CHANNEL)) {
            if (hook != null) {
                hook.editOriginal("❌ Bot configuration error: Bot lacks 'Manage Channels' permission to create tickets.").queue();
            }
            return ActionExecutionResult.failure("Bot lacks MANAGE_CHANNEL permission");
        }

        Member targetMember = roleActionExecutor.resolveTargetMember(guild, operator, sessionData);
        Role targetRole = roleActionExecutor.resolveTargetRole(guild, action, sessionData);

        String ticketId = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
        String channelName = interpolator.resolveTicketChannelName(action.getChannelPrefix(), ticketId, operator, targetMember);

        TextChannel ticketChannel;
        try {
            var channelAction = guild.createTextChannel(channelName)
                    .addPermissionOverride(guild.getPublicRole(), Collections.emptyList(), List.of(Permission.VIEW_CHANNEL))
                    .addPermissionOverride(operator, List.of(Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND, Permission.MESSAGE_HISTORY, Permission.MESSAGE_ATTACH_FILES, Permission.MESSAGE_EMBED_LINKS), Collections.emptyList());
            if (targetMember != null && !targetMember.equals(operator)) {
                channelAction = channelAction.addPermissionOverride(targetMember, List.of(Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND, Permission.MESSAGE_HISTORY, Permission.MESSAGE_ATTACH_FILES, Permission.MESSAGE_EMBED_LINKS), Collections.emptyList());
            }
            ticketChannel = channelAction.complete();
        } catch (Exception e) {
            log.error("Failed to create compound ticket channel {} in guild {}: {}", channelName, guild != null ? guild.getId() : "null", e.getMessage(), e);
            if (hook != null) {
                hook.editOriginal("❌ Failed to create support ticket channel: " + e.getMessage()).queue();
            }
            return ActionExecutionResult.failure("Failed to create ticket channel: " + e.getMessage());
        }

        if (action.getCompoundOperations() != null) {
            action.getCompoundOperations().stream()
                    .filter(op -> op.getOperationType() == CompoundOperation.OperationType.SEND_DM_TEMPLATE)
                    .findFirst()
                    .ifPresent(op -> {
                        EmbedTemplate dmTpl = resolveTemplate(op.getTemplateId()).orElse(null);
                        if (dmTpl != null && embedTemplateRenderer.isPresent()) {
                            Map<String, String> vars = interpolator.buildTemplateVariables(ticketId, guild, operator, targetMember, targetRole, ticketChannel, true);
                            MessageCreateData dmData = embedTemplateRenderer.get().renderToMessageData(dmTpl, vars);
                            User dmRecipient = (operator != null && operator.getUser() != null)
                                    ? operator.getUser()
                                    : (targetMember != null ? targetMember.getUser() : null);
                            if (dmRecipient != null) {
                                dmActionExecutor.dispatchDMLogsWithFallback(dmRecipient, ticketChannel, dmTpl, vars, dmData);
                            }
                        }
                    });
        }

        if (hook != null) {
            hook.editOriginal("✅ Created ticket #" + channelName).queue();
        }
        return ActionExecutionResult.builder()
                .success(true)
                .ticketId(ticketId)
                .channelId(ticketChannel != null ? ticketChannel.getId() : null)
                .isTerminal(true)
                .build();
    }

    private Optional<EmbedTemplate> resolveTemplate(String templateId) {
        if (templateId == null || templateId.isBlank()) {
            return Optional.empty();
        }
        return embedTemplateRepository.findByTemplateId(templateId)
                .or(() -> embedTemplateRepository.findById(templateId));
    }
}
