package com.rng.embed.execution;

import com.fasterxml.jackson.databind.JsonNode;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.EmbedTemplate;
import com.rng.embed.domain.InteractionLog;
import com.rng.embed.domain.ResponseType;
import com.rng.embed.dto.ActionExecutionResult;
import com.rng.embed.repository.EmbedTemplateRepository;
import com.rng.embed.repository.InteractionLogRepository;
import com.rng.embed.service.DiscordDispatchService;
import com.rng.embed.service.EmbedTemplateRenderer;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import net.dv8tion.jda.api.utils.messages.MessageEditData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/**
 * Enterprise executor for Discord interactive component reply actions,
 * supporting ephemeral messages, public announcements, and rich embed follow-up templates.
 */
@Slf4j
@Component
public class ReplyActionExecutor {

    private final InteractionLogRepository interactionLogRepository;
    private final EmbedTemplateRepository embedTemplateRepository;
    private final TemplateVariableInterpolator interpolator;
    private final RoleActionExecutor roleActionExecutor;
    private final Optional<EmbedTemplateRenderer> embedTemplateRenderer;
    private final Optional<DiscordDispatchService> discordDispatchService;

    @Autowired
    public ReplyActionExecutor(
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

    public void executeReplyAction(
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

        if (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank()) {
            EmbedTemplate template = resolveTemplate(action.getResponseEmbedTemplateId()).orElse(null);
            if (template != null) {
                boolean isDm = (channel instanceof net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel);
                Map<String, String> vars = interpolator.buildTemplateVariables(null, guild, clickingMember, targetMember, targetRole, channel, isDm);
                if (discordDispatchService.isPresent() && embedTemplateRenderer.isPresent()) {
                    try {
                        Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(template, vars);
                        discordDispatchService.get().editOriginalInteraction(hook.getId(), hook.getToken(), wirePayload);
                        recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Sent embed reply");
                        return;
                    } catch (Exception e) {
                        log.warn("Discord REST API v10 edit original interaction failed ({}), falling back to JDA: {}", e.getMessage(), e.getClass().getSimpleName());
                    }
                }
                if (embedTemplateRenderer.isPresent()) {
                    MessageCreateData msgData = embedTemplateRenderer.get().renderToMessageData(template, vars);
                    hook.editOriginal(MessageEditData.fromCreateData(msgData)).queue();
                    recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Sent embed reply via JDA fallback");
                    return;
                }
            }
        }

        String content = interpolator.interpolate(action.getReplyContent(), guild, clickingMember, targetMember, targetRole, channel, selectedOption);
        if (content.isBlank()) {
            content = "✅ Action acknowledged.";
        }

        hook.editOriginal(content).queue();
        recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Sent reply message");
    }

    public ActionExecutionResult executeReplyActionSynchronous(
            EmbedAction action,
            Guild guild,
            Member operator,
            InteractionHook hook,
            Map<String, String> sessionData) {

        MessageChannel channel = null;
        if (hook != null && hook.getInteraction() != null) {
            try {
                channel = hook.getInteraction().getMessageChannel();
            } catch (Exception ignored) {
            }
        }

        Member targetMember = roleActionExecutor.resolveTargetMember(guild, operator, sessionData);
        Role targetRole = roleActionExecutor.resolveTargetRole(guild, action, sessionData);

        if (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank()) {
            return dispatchFollowUpTemplateMessage(action, guild, operator, targetMember, targetRole, channel, hook);
        }

        String feedbackTemplate = action.getReplyContent();
        if (feedbackTemplate == null || feedbackTemplate.isBlank()) {
            feedbackTemplate = action.getConfirmationMessage();
        }
        String feedbackMsg;
        if (feedbackTemplate != null && !feedbackTemplate.isBlank()) {
            feedbackMsg = interpolator.interpolate(feedbackTemplate, guild, operator, targetMember, targetRole, channel, null);
        } else {
            feedbackMsg = "✅ Action acknowledged.";
        }

        if (hook != null) {
            hook.editOriginal(feedbackMsg).queue();
        }

        return ActionExecutionResult.success("Reply acknowledged");
    }

    public ActionExecutionResult dispatchFollowUpTemplateMessage(
            EmbedAction action,
            Guild guild,
            Member operator,
            Member targetMember,
            Role targetRole,
            MessageChannel channel,
            InteractionHook hook) {

        String responseTplId = action != null ? action.getResponseEmbedTemplateId() : null;
        if (responseTplId == null || responseTplId.isBlank()) {
            return ActionExecutionResult.success("No response template configured");
        }

        EmbedTemplate template = resolveTemplate(responseTplId).orElse(null);
        if (template == null) {
            log.warn("Response template ID '{}' could not be resolved from MongoDB! Checked templateId and _id.", responseTplId);
            return ActionExecutionResult.failure("Response template not found: " + responseTplId);
        }

        if (embedTemplateRenderer.isEmpty()) {
            log.warn("EmbedTemplateRenderer is not available to render template '{}'", responseTplId);
            return ActionExecutionResult.failure("EmbedTemplateRenderer unavailable");
        }

        ResponseType rType = action.getResponseType() != null ? action.getResponseType() : ResponseType.PUBLIC_EMBED;
        boolean isDm = (rType == ResponseType.DM_EMBED) || (channel instanceof net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel);

        Map<String, String> vars = interpolator.buildTemplateVariables(null, guild, operator, targetMember, targetRole, channel, isDm);

        if (rType == ResponseType.PUBLIC_EMBED || rType == ResponseType.PUBLIC_TEXT) {
            if (channel != null && discordDispatchService.isPresent()) {
                try {
                    Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(template, vars);
                    JsonNode dispatchResult = discordDispatchService.get().dispatchToChannel(channel.getId(), wirePayload, null);
                    String messageId = dispatchResult != null && dispatchResult.has("id") ? dispatchResult.get("id").asText() : null;
                    return ActionExecutionResult.intermediate(messageId);
                } catch (Exception e) {
                    log.warn("Discord REST API v10 dispatch failed ({}), falling back to JDA sendMessage: {}",
                            e.getMessage(), e.getClass().getSimpleName());
                }
            }

            MessageCreateData msgData = embedTemplateRenderer.get().renderToMessageData(template, vars);
            if (channel != null) {
                try {
                    var sentMsg = channel.sendMessage(msgData).complete();
                    return ActionExecutionResult.intermediate(sentMsg != null ? sentMsg.getId() : null);
                } catch (Exception e) {
                    log.warn("Direct channel sendMessage failed ({}), attempting hook.sendMessage: {}", e.getMessage(), e.getClass().getSimpleName());
                    if (hook != null) {
                        var sentMsgAction = hook.sendMessage(msgData);
                        var sentMsg = sentMsgAction != null ? sentMsgAction.complete() : null;
                        return ActionExecutionResult.intermediate(sentMsg != null ? sentMsg.getId() : null);
                    }
                }
            } else if (hook != null) {
                var sentMsgAction = hook.sendMessage(msgData);
                var sentMsg = sentMsgAction != null ? sentMsgAction.complete() : null;
                return ActionExecutionResult.intermediate(sentMsg != null ? sentMsg.getId() : null);
            }
        } else if (rType == ResponseType.DM_EMBED) {
            User dmRecipient = (operator != null && operator.getUser() != null)
                    ? operator.getUser()
                    : (targetMember != null ? targetMember.getUser() : null);
            if (dmRecipient != null) {
                try {
                    var pc = dmRecipient.openPrivateChannel().complete();
                    if (pc != null) {
                        if (discordDispatchService.isPresent()) {
                            try {
                                Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(template, vars);
                                JsonNode dispatchResult = discordDispatchService.get().dispatchToChannel(pc.getId(), wirePayload, null);
                                String messageId = dispatchResult != null && dispatchResult.has("id") ? dispatchResult.get("id").asText() : null;
                                return ActionExecutionResult.intermediate(messageId);
                            } catch (Exception e) {
                                log.warn("Discord REST API v10 DM dispatch failed ({}), falling back to JDA pc.sendMessage: {}",
                                        e.getMessage(), e.getClass().getSimpleName());
                            }
                        }

                        MessageCreateData msgData = embedTemplateRenderer.get().renderToMessageData(template, vars);
                        var sentMsg = pc.sendMessage(msgData).complete();
                        return ActionExecutionResult.intermediate(sentMsg != null ? sentMsg.getId() : null);
                    }
                } catch (Exception e) {
                    log.warn("DM delivery failed, falling back to hook: {}", e.getMessage());
                }
            }
        }

        // Ephemeral or standard fallback via hook
        if (hook != null) {
            try {
                if (discordDispatchService.isPresent()) {
                    try {
                        Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(template, vars);
                        discordDispatchService.get().editOriginalInteraction(hook.getId(), hook.getToken(), wirePayload);
                        return ActionExecutionResult.intermediate(null);
                    } catch (Exception e) {
                        log.warn("Discord REST API v10 edit original interaction failed, falling back to JDA: {}", e.getMessage());
                    }
                }
                MessageCreateData msgData = embedTemplateRenderer.get().renderToMessageData(template, vars);
                hook.editOriginal(MessageEditData.fromCreateData(msgData)).queue();
                return ActionExecutionResult.intermediate(null);
            } catch (Exception e) {
                log.error("Failed to deliver follow-up template embed: {}", e.getMessage(), e);
            }
        }

        return ActionExecutionResult.failure("Failed to dispatch follow-up template message");
    }

    public Optional<EmbedTemplate> resolveTemplate(String templateId) {
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
