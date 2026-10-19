package com.rng.embed.execution;

import com.rng.embed.domain.CompoundOperation;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.EmbedTemplate;
import com.rng.embed.domain.InteractionLog;
import com.rng.embed.domain.ResponseType;
import com.rng.embed.dto.ActionExecutionResult;
import com.rng.embed.repository.EmbedTemplateRepository;
import com.rng.embed.repository.InteractionLogRepository;
import com.rng.embed.service.EmbedTemplateRenderer;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Enterprise executor for Discord support ticket provisioning,
 * creating private channels with strict permission overrides and resilient DM logging.
 */
@Slf4j
@Component
public class TicketActionExecutor {

    private final InteractionLogRepository interactionLogRepository;
    private final EmbedTemplateRepository embedTemplateRepository;
    private final TemplateVariableInterpolator interpolator;
    private final RoleActionExecutor roleActionExecutor;
    private final DmActionExecutor dmActionExecutor;
    private final ReplyActionExecutor replyActionExecutor;
    private final Optional<EmbedTemplateRenderer> embedTemplateRenderer;

    @Autowired
    public TicketActionExecutor(
            InteractionLogRepository interactionLogRepository,
            EmbedTemplateRepository embedTemplateRepository,
            TemplateVariableInterpolator interpolator,
            RoleActionExecutor roleActionExecutor,
            DmActionExecutor dmActionExecutor,
            ReplyActionExecutor replyActionExecutor,
            @Autowired(required = false) EmbedTemplateRenderer embedTemplateRenderer) {
        this.interactionLogRepository = interactionLogRepository;
        this.embedTemplateRepository = embedTemplateRepository;
        this.interpolator = interpolator;
        this.roleActionExecutor = roleActionExecutor;
        this.dmActionExecutor = dmActionExecutor;
        this.replyActionExecutor = replyActionExecutor;
        this.embedTemplateRenderer = Optional.ofNullable(embedTemplateRenderer);
    }

    public void executeTicketAction(
            InteractionHook hook,
            Guild guild,
            Member clickingMember,
            User user,
            MessageChannel channel,
            String messageId,
            EmbedAction action,
            Map<String, String> sessionData,
            String selectedOption) {

        Member botMember = roleActionExecutor.resolveBotMember(guild);
        if (botMember == null || !botMember.hasPermission(Permission.MANAGE_CHANNEL)) {
            hook.editOriginal("❌ Bot configuration error: Bot lacks 'Manage Channels' permission to create tickets.").queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Bot lacks MANAGE_CHANNEL permission");
            return;
        }

        Member targetMember = roleActionExecutor.resolveTargetMember(guild, clickingMember, sessionData);
        Role targetRole = roleActionExecutor.resolveTargetRole(guild, action, sessionData);

        String ticketId = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
        String channelName = interpolator.resolveTicketChannelName(action.getChannelPrefix(), ticketId, clickingMember, targetMember);

        var channelAction = guild.createTextChannel(channelName)
                .addPermissionOverride(guild.getPublicRole(), Collections.emptyList(), List.of(Permission.VIEW_CHANNEL))
                .addPermissionOverride(clickingMember, List.of(Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND, Permission.MESSAGE_HISTORY, Permission.MESSAGE_ATTACH_FILES, Permission.MESSAGE_EMBED_LINKS), Collections.emptyList());

        if (targetMember != null && !targetMember.equals(clickingMember)) {
            channelAction = channelAction.addPermissionOverride(targetMember, List.of(Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND, Permission.MESSAGE_HISTORY, Permission.MESSAGE_ATTACH_FILES, Permission.MESSAGE_EMBED_LINKS), Collections.emptyList());
        }

        channelAction.queue(
                ticketChannel -> {
                    String welcome = interpolator.interpolate(action.getWelcomeMessage(), guild, clickingMember, targetMember, targetRole, ticketChannel, selectedOption);
                    if (welcome.isBlank()) {
                        welcome = "👋 Welcome " + clickingMember.getAsMention() + " to your support ticket! Staff will assist you shortly.";
                    }
                    ticketChannel.sendMessage(welcome).queue();

                    // Optional initial DM to caller with ticket details
                    if (action.getDmContent() != null && !action.getDmContent().isBlank()) {
                        String dmText = interpolator.interpolate(action.getDmContent(), guild, clickingMember, targetMember, targetRole, ticketChannel, selectedOption, true);
                        user.openPrivateChannel().queue(
                                pc -> pc.sendMessage(dmText).queue(
                                        dmSuccess -> log.debug("Ticket DM sent to user {}", user.getId()),
                                        dmError -> log.warn("Could not DM ticket confirmation to user {}: {}", user.getId(), dmError.getMessage())
                                )
                        );
                    }

                    hook.editOriginal("✅ Support ticket created: " + ticketChannel.getAsMention()).queue();
                    recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Created ticket channel #" + channelName);
                },
                error -> {
                    hook.editOriginal("❌ Failed to create support ticket channel: " + error.getMessage()).queue();
                    recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", error.getMessage());
                }
        );
    }

    public ActionExecutionResult executeTicketActionSynchronous(
            EmbedAction action,
            Guild guild,
            Member operator,
            InteractionHook hook,
            Map<String, String> sessionData) {

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
            log.error("Failed to create ticket channel {} in guild {}: {}", channelName, guild != null ? guild.getId() : "null", e.getMessage(), e);
            if (hook != null) {
                hook.editOriginal("❌ Failed to create support ticket channel: " + e.getMessage()).queue();
            }
            return ActionExecutionResult.failure("Failed to create ticket channel: " + e.getMessage());
        }

        String welcome = interpolator.interpolate(action.getWelcomeMessage(), guild, operator, targetMember, targetRole, ticketChannel, null);
        if (welcome.isBlank()) {
            welcome = "👋 Welcome " + operator.getAsMention() + " to your support ticket! Staff will assist you shortly.";
        }
        ticketChannel.sendMessage(welcome).queue();

        if (action.getCompoundOperations() != null && !action.getCompoundOperations().isEmpty()) {
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
        } else if (action.getDmContent() != null && !action.getDmContent().isBlank()) {
            boolean hasFollowUpDm = action.getResponseEmbedTemplateId() != null
                    && !action.getResponseEmbedTemplateId().isBlank()
                    && (action.getResponseType() == null || action.getResponseType() == ResponseType.DM_EMBED);
            if (!hasFollowUpDm) {
                User dmRecipient = (operator != null && operator.getUser() != null)
                        ? operator.getUser()
                        : (targetMember != null ? targetMember.getUser() : null);
                if (dmRecipient != null) {
                    String dmText = interpolator.interpolate(action.getDmContent(), guild, operator, targetMember, targetRole, ticketChannel, null);
                    dmActionExecutor.dispatchDMLogsWithFallback(dmRecipient, ticketChannel, MessageCreateData.fromContent(dmText));
                }
            }
        }

        if (hook != null) {
            hook.editOriginal("✅ Support ticket created: " + ticketChannel.getAsMention()).queue();
        }

        if (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank()) {
            return replyActionExecutor.dispatchFollowUpTemplateMessage(action, guild, operator, targetMember, targetRole, ticketChannel, hook);
        }

        return ActionExecutionResult.builder()
                .success(true)
                .ticketId(ticketId)
                .channelId(ticketChannel.getId())
                .isTerminal(action.getResponseEmbedTemplateId() == null || action.getResponseEmbedTemplateId().isBlank())
                .build();
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
