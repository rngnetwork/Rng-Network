package com.rednecksgaming.embed.execution;

import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.embed.domain.ActionType;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedActionRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.interactions.InteractionHook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/**
 * Enterprise router coordinating interactive Discord component execution across
 * specialized single-purpose action executors, Redis session tracking, and audit logging.
 */
@Slf4j
@Component
public class ActionExecutionRouter {

    private final EmbedActionRepository embedActionRepository;
    private final InteractionLogRepository interactionLogRepository;
    private final RoleActionExecutor roleActionExecutor;
    private final TicketActionExecutor ticketActionExecutor;
    private final ReplyActionExecutor replyActionExecutor;
    private final DmActionExecutor dmActionExecutor;
    private final CompoundActionExecutor compoundActionExecutor;
    private final Optional<StringRedisTemplate> redisTemplate;

    @Autowired
    public ActionExecutionRouter(
            EmbedActionRepository embedActionRepository,
            InteractionLogRepository interactionLogRepository,
            RoleActionExecutor roleActionExecutor,
            TicketActionExecutor ticketActionExecutor,
            ReplyActionExecutor replyActionExecutor,
            DmActionExecutor dmActionExecutor,
            CompoundActionExecutor compoundActionExecutor,
            @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.embedActionRepository = embedActionRepository;
        this.interactionLogRepository = interactionLogRepository;
        this.roleActionExecutor = roleActionExecutor;
        this.ticketActionExecutor = ticketActionExecutor;
        this.replyActionExecutor = replyActionExecutor;
        this.dmActionExecutor = dmActionExecutor;
        this.compoundActionExecutor = compoundActionExecutor;
        this.redisTemplate = Optional.ofNullable(redisTemplate);
    }

    public void executeButtonAction(ButtonInteractionEvent event, EmbedAction action, Map<String, String> sessionData) {
        Member member = event.getMember();
        if (member == null && event.getGuild() != null && event.getUser() != null) {
            try {
                member = event.getGuild().retrieveMember(event.getUser()).complete();
            } catch (Exception e) {
                log.warn("Failed to retrieve clicking member {} in guild {}: {}", event.getUser().getId(), event.getGuild().getId(), e.getMessage());
            }
        }
        executeComponentAction(
                event.getHook(),
                event.getGuild(),
                member,
                event.getUser(),
                event.getMessageChannel(),
                event.getMessageId(),
                action,
                sessionData,
                null
        );
    }

    public void executeStringSelectAction(StringSelectInteractionEvent event, EmbedAction action, Map<String, String> sessionData) {
        Member member = event.getMember();
        if (member == null && event.getGuild() != null && event.getUser() != null) {
            try {
                member = event.getGuild().retrieveMember(event.getUser()).complete();
            } catch (Exception e) {
                log.warn("Failed to retrieve clicking member {} in guild {}: {}", event.getUser().getId(), event.getGuild().getId(), e.getMessage());
            }
        }
        String selectedOption = event.getValues().isEmpty() ? "" : event.getValues().get(0);
        executeComponentAction(
                event.getHook(),
                event.getGuild(),
                member,
                event.getUser(),
                event.getMessageChannel(),
                event.getMessageId(),
                action,
                sessionData,
                selectedOption
        );
    }

    public void executeComponentAction(
            InteractionHook hook,
            Guild guild,
            Member clickingMember,
            User user,
            MessageChannel channel,
            String messageId,
            EmbedAction action,
            Map<String, String> sessionData,
            String selectedOption) {

        if (guild == null || clickingMember == null) {
            hook.editOriginal("❌ This interactive component can only be used within a Discord server.").queue();
            return;
        }

        try {
            switch (action.getActionType()) {
                case ROLE -> roleActionExecutor.executeRoleAction(hook, guild, clickingMember, user, channel, messageId, action, sessionData, selectedOption);
                case TICKET -> ticketActionExecutor.executeTicketAction(hook, guild, clickingMember, user, channel, messageId, action, sessionData, selectedOption);
                case REPLY -> replyActionExecutor.executeReplyAction(hook, guild, clickingMember, user, channel, messageId, action, sessionData, selectedOption);
                case DM -> dmActionExecutor.executeDmAction(hook, guild, clickingMember, user, channel, messageId, action, sessionData, selectedOption);
            }
        } catch (Exception e) {
            log.error("Unhandled error executing action {} ({}) for user {} in guild {}: {}",
                    action.getActionId(), action.getActionType(), user.getId(), guild.getId(), e.getMessage(), e);
            hook.editOriginal("⚠️ An unexpected error occurred while executing this action: " + e.getMessage()).queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "ERROR", e.getMessage());
        } finally {
            cleanupSession(guild.getId(), user.getId(), messageId);
        }
    }

    public ActionExecutionResult executeComponentAction(
            String actionId,
            Guild guild,
            Member operator,
            InteractionHook hook,
            Map<String, String> sessionData) {

        EmbedAction action = embedActionRepository.findByActionId(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action not found: " + actionId));

        if (action.getActionType() == ActionType.ROLE) {
            return roleActionExecutor.executeRoleActionSynchronous(action, guild, operator, hook, sessionData);
        }

        if (action.getActionType() == ActionType.REPLY) {
            return replyActionExecutor.executeReplyActionSynchronous(action, guild, operator, hook, sessionData);
        }

        if (action.getActionType() == ActionType.TICKET) {
            return ticketActionExecutor.executeTicketActionSynchronous(action, guild, operator, hook, sessionData);
        }

        if (action.getActionType() == ActionType.DM) {
            return dmActionExecutor.executeDmActionSynchronous(action, guild, operator, hook, sessionData);
        }

        return ActionExecutionResult.failure("Unsupported action type: " + action.getActionType());
    }

    public ActionExecutionResult executeCompoundAction(
            String actionId,
            Guild guild,
            Member operator,
            InteractionHook hook,
            Map<String, String> sessionData) {
        return compoundActionExecutor.executeCompoundAction(actionId, guild, operator, hook, sessionData);
    }

    public void cleanupSession(String guildId, String userId, String messageId) {
        if (redisTemplate.isEmpty() || guildId == null || userId == null || messageId == null) {
            return;
        }

        try {
            String sessionKey = "interaction:session:" + guildId + ":" + userId + ":" + messageId;
            redisTemplate.get().delete(sessionKey);
        } catch (Exception e) {
            log.warn("Failed to clean up Redis session for guild {} user {} message {}: {}", guildId, userId, messageId, e.getMessage());
        }
    }

    public void recordAuditLog(
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
