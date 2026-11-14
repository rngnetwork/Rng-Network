// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.execution;

import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import com.rednecksgaming.embed.service.DiscordDispatchService;
import com.rednecksgaming.embed.service.EmbedTemplateRenderer;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/**
 * Enterprise executor for Discord direct message deliveries, featuring resilient
 * fallback handling for users with closed DMs (Discord Error 50007).
 */
@Slf4j
@Component
public class DmActionExecutor {

    private final InteractionLogRepository interactionLogRepository;
    private final EmbedTemplateRepository embedTemplateRepository;
    private final TemplateVariableInterpolator interpolator;
    private final RoleActionExecutor roleActionExecutor;
    private final Optional<EmbedTemplateRenderer> embedTemplateRenderer;
    private final Optional<DiscordDispatchService> discordDispatchService;

    @Autowired
    public DmActionExecutor(
            InteractionLogRepository interactionLogRepository,
            EmbedTemplateRepository embedTemplateRepository,
            TemplateVariableInterpolator interpolator,
            RoleActionExecutor roleActionExecutor,
            @Autowired(required = false) EmbedTemplateRenderer embedTemplateRenderer,
            @Autowired(required = false) DiscordDispatchService discordDispatchService) {
        this.interactionLogRepository = interactionLogRepository;
        this.embedTemplateRepository = embedTemplateRepository;
        this.interpolator = interpolator;
        this.roleActionExecutor = roleActionExecutor;
        this.embedTemplateRenderer = Optional.ofNullable(embedTemplateRenderer);
        this.discordDispatchService = Optional.ofNullable(discordDispatchService);
    }

    public void executeDmAction(
            InteractionHook hook,
            Guild guild,
            Member clickingMember,
            User user,
            MessageChannel channel,
            String messageId,
            EmbedAction action,
            Map<String, String> sessionData,
            String selectedOption) {

        Member targetMember = roleActionExecutor.resolveTargetMember(guild, clickingMember, sessionData);
        Role targetRole = roleActionExecutor.resolveTargetRole(guild, action, sessionData);
        User targetUser = (targetMember != null && targetMember.getUser() != null)
                ? targetMember.getUser()
                : user;

        if (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank()) {
            EmbedTemplate template = resolveTemplate(action.getResponseEmbedTemplateId()).orElse(null);
            if (template != null) {
                Map<String, String> vars = interpolator.buildTemplateVariables(null, guild, clickingMember, targetMember, targetRole, channel, true);
                targetUser.openPrivateChannel().queue(
                        pc -> {
                            if (discordDispatchService.isPresent() && embedTemplateRenderer.isPresent()) {
                                try {
                                    Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(template, vars);
                                    discordDispatchService.get().dispatchToChannel(pc.getId(), wirePayload, null);
                                    hook.editOriginal("✅ Direct message sent! Please check your private messages.").queue();
                                    recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Sent embed DM to " + user.getName());
                                    return;
                                } catch (Exception e) {
                                    log.warn("Discord REST API v10 DM dispatch failed: {}", e.getMessage());
                                }
                            }
                            if (embedTemplateRenderer.isPresent()) {
                                MessageCreateData msgData = embedTemplateRenderer.get().renderToMessageData(template, vars);
                                pc.sendMessage(msgData).queue(
                                        success -> {
                                            hook.editOriginal("✅ Direct message sent! Please check your private messages.").queue();
                                            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Sent embed DM to " + user.getName());
                                        },
                                        error -> {
                                            hook.editOriginal("⚠️ Could not send a DM. Please enable direct messages from server members in your Privacy Settings.").queue();
                                            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FALLBACK", "Closed DMs; fallback to ephemeral message");
                                        }
                                );
                            }
                        },
                        error -> {
                            hook.editOriginal("⚠️ Could not open private channel. Please check your Discord Privacy Settings.").queue();
                            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FALLBACK", "Failed to open private channel");
                        }
                );
                return;
            }
        }

        String rawContent = action.getDmContent() != null && !action.getDmContent().isBlank()
                ? action.getDmContent()
                : action.getReplyContent();
        String dmText = interpolator.interpolate(rawContent, guild, clickingMember, targetMember, targetRole, channel, selectedOption, true);
        if (dmText.isBlank()) {
            dmText = "Thank you for verifying on **" + guild.getName() + "**!";
        }

        final String finalDmText = dmText;
        targetUser.openPrivateChannel().queue(
                pc -> pc.sendMessage(finalDmText).queue(
                        success -> {
                            hook.editOriginal("✅ Direct message sent! Please check your private messages.").queue();
                            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Sent DM to " + user.getName());
                        },
                        error -> {
                            hook.editOriginal("⚠️ Could not send a DM. Please enable direct messages from server members in your Privacy Settings. Message:\n\n" + finalDmText).queue();
                            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FALLBACK", "Closed DMs; fallback to ephemeral message");
                        }
                ),
                error -> {
                    hook.editOriginal("⚠️ Could not open private channel. Please check your Discord Privacy Settings. Message:\n\n" + finalDmText).queue();
                    recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FALLBACK", "Failed to open private channel");
                }
        );
    }

    public ActionExecutionResult executeDmActionSynchronous(
            EmbedAction action,
            Guild guild,
            Member operator,
            InteractionHook hook,
            Map<String, String> sessionData) {

        Member targetMember = roleActionExecutor.resolveTargetMember(guild, operator, sessionData);
        Role targetRole = roleActionExecutor.resolveTargetRole(guild, action, sessionData);
        MessageChannel channel = null;
        if (hook != null && hook.getInteraction() != null) {
            try {
                channel = hook.getInteraction().getMessageChannel();
            } catch (Exception ignored) {
            }
        }

        String rawContent = action.getDmContent() != null && !action.getDmContent().isBlank()
                ? action.getDmContent()
                : action.getReplyContent();
        String dmText = interpolator.interpolate(rawContent, guild, operator, targetMember, targetRole, channel, null, true);
        if (dmText.isBlank()) {
            dmText = "Thank you for verifying on **" + (guild != null ? guild.getName() : "server") + "**!";
        }

        final String finalDmText = dmText;
        User targetUser = (targetMember != null && targetMember.getUser() != null)
                ? targetMember.getUser()
                : (operator != null ? operator.getUser() : null);

        if (targetUser != null) {
            try {
                PrivateChannel pc = targetUser.openPrivateChannel().complete();
                pc.sendMessage(finalDmText).complete();
                if (hook != null) {
                    hook.editOriginal("✅ Direct message sent! Please check your private messages.").queue();
                }
            } catch (Exception e) {
                log.warn("Direct messaging failed for user {}, falling back: {}", targetUser.getId(), e.getMessage());
                if (hook != null) {
                    hook.editOriginal("⚠️ Could not send a DM. Please enable direct messages in your Privacy Settings. Message:\n\n" + finalDmText).queue();
                }
            }
        }

        return ActionExecutionResult.success("DM dispatched");
    }

    public ActionExecutionResult dispatchDMLogsWithFallback(User user, TextChannel ticketChannel, MessageCreateData logData) {
        return dispatchDMLogsWithFallback(user, ticketChannel, null, null, logData);
    }

    public ActionExecutionResult dispatchDMLogsWithFallback(
            User user,
            TextChannel ticketChannel,
            EmbedTemplate dmTpl,
            Map<String, String> vars,
            MessageCreateData logData) {

        try {
            if (user == null) {
                throw new IllegalArgumentException("User cannot be null for direct messaging");
            }
            var restAction = user.openPrivateChannel();
            if (restAction == null) {
                throw new IllegalStateException("RestAction for openPrivateChannel is null");
            }
            var pc = restAction.complete();
            if (pc == null) {
                throw new IllegalStateException("PrivateChannel is null");
            }

            if (dmTpl != null && discordDispatchService.isPresent() && embedTemplateRenderer.isPresent()) {
                try {
                    Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(dmTpl, vars);
                    discordDispatchService.get().dispatchToChannel(pc.getId(), wirePayload, null);
                    log.info("Dispatched Components V2 DM logs to user {} (private channel {}) via REST API v10", user.getId(), pc.getId());
                    return ActionExecutionResult.builder().success(true).dmDelivered(true).build();
                } catch (Exception e) {
                    log.warn("Discord REST API v10 DM log dispatch failed ({}), attempting JDA pc.sendMessage: {}", e.getMessage(), e.getClass().getSimpleName());
                }
            }

            if (logData != null) {
                pc.sendMessage(logData).complete();
            }
            return ActionExecutionResult.builder().success(true).dmDelivered(true).build();
        } catch (Exception ex) {
            log.warn("Direct messaging failed for user {}, falling back to ticket channel: {}", user != null ? user.getId() : "unknown", ex.getMessage());
            try {
                if (ticketChannel != null) {
                    if (dmTpl != null && discordDispatchService.isPresent() && embedTemplateRenderer.isPresent()) {
                        try {
                            Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(dmTpl, vars);
                            discordDispatchService.get().dispatchToChannel(ticketChannel.getId(), wirePayload, null);
                            return ActionExecutionResult.builder().success(true).dmDelivered(false).build();
                        } catch (Exception e) {
                            log.warn("Failed to dispatch wire payload to fallback ticket channel: {}", e.getMessage());
                        }
                    }
                    if (logData != null) {
                        ticketChannel.sendMessage(logData).complete();
                    }
                    return ActionExecutionResult.builder().success(true).dmDelivered(false).build();
                }
            } catch (Exception fallbackEx) {
                log.error("Failed to post fallback DM message to ticket channel {}: {}", ticketChannel != null ? ticketChannel.getId() : "unknown", fallbackEx.getMessage());
            }
            return ActionExecutionResult.builder().success(false).dmDelivered(false).errorMessage(ex.getMessage()).build();
        }
    }

    private Optional<EmbedTemplate> resolveTemplate(String templateId) {
        if (templateId == null || templateId.isBlank()) {
            return Optional.empty();
        }
        return embedTemplateRepository.findByTemplateId(templateId)
                .or(() -> embedTemplateRepository.findById(templateId));
    }

    private void recordAuditLog(
            EmbedAction action,
            String guildId,
            String channelId,
            String messageId,
            String userId,
            String username,
            String status,
            String details) {
        try {
            InteractionLog logRecord = InteractionLog.builder()
                    .actionId(action != null ? action.getActionId() : "unknown")
                    .actionType(action != null ? action.getActionType() : null)
                    .guildId(guildId)
                    .channelId(channelId)
                    .messageId(messageId)
                    .userId(userId)
                    .username(username)
                    .status(status)
                    .details(details)
                    .createdAt(Instant.now())
                    .build();

            interactionLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Failed to write interaction audit log for user {} in guild {}: {}", userId, guildId, e.getMessage());
        }
    }
}
