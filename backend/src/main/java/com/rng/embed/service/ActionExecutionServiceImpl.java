package com.rng.embed.service;

import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.InteractionLog;
import com.rng.embed.domain.RoleSubtype;
import com.rng.embed.repository.EmbedTemplateRepository;
import com.rng.embed.repository.InteractionLogRepository;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.interactions.InteractionHook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Map;
import java.util.Optional;

/**
 * Enterprise implementation of interactive Discord component action execution,
 * enforcing role hierarchy guardrails, private channel provisioning, dynamic variable
 * interpolation, Redis session eviction, and MongoDB audit logging.
 */
@Slf4j
@Service
public class ActionExecutionServiceImpl implements ActionExecutionService {

    private final InteractionLogRepository interactionLogRepository;
    private final EmbedTemplateRepository embedTemplateRepository;
    private final Optional<StringRedisTemplate> redisTemplate;

    public ActionExecutionServiceImpl(
            InteractionLogRepository interactionLogRepository,
            EmbedTemplateRepository embedTemplateRepository,
            @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.interactionLogRepository = interactionLogRepository;
        this.embedTemplateRepository = embedTemplateRepository;
        this.redisTemplate = Optional.ofNullable(redisTemplate);
    }

    @Override
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

    @Override
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

    private void executeComponentAction(
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
                case ROLE -> executeRoleAction(hook, guild, clickingMember, user, channel, messageId, action, sessionData, selectedOption);
                case TICKET -> executeTicketAction(hook, guild, clickingMember, user, channel, messageId, action, sessionData, selectedOption);
                case REPLY -> executeReplyAction(hook, guild, clickingMember, user, channel, messageId, action, sessionData, selectedOption);
                case DM -> executeDmAction(hook, guild, clickingMember, user, channel, messageId, action, sessionData, selectedOption);
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

    private void executeRoleAction(
            InteractionHook hook,
            Guild guild,
            Member clickingMember,
            User user,
            MessageChannel channel,
            String messageId,
            EmbedAction action,
            Map<String, String> sessionData,
            String selectedOption) {

        // Resolve target member: session target or clicking member
        Member targetMember = resolveTargetMember(guild, clickingMember, sessionData);

        // Resolve target role: session target or template roleId
        Role targetRole = resolveTargetRole(guild, action, sessionData);

        if (targetRole == null) {
            hook.editOriginal("❌ Role configuration error: The requested role does not exist on this server.").queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Target role not found");
            return;
        }

        if (targetRole.isPublicRole()) {
            hook.editOriginal("❌ Cannot assign or modify the @everyone public role.").queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Attempted to assign @everyone");
            return;
        }

        if (targetRole.isManaged()) {
            hook.editOriginal("❌ Cannot assign managed integration/bot role: @" + targetRole.getName()).queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Attempted to assign managed role @" + targetRole.getName());
            return;
        }

        Member botMember = resolveBotMember(guild);
        if (botMember == null) {
            hook.editOriginal("❌ Bot configuration error: Unable to verify bot permissions in this server.").queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Bot self member not found");
            return;
        }
        if (!botMember.hasPermission(Permission.MANAGE_ROLES)) {
            hook.editOriginal("❌ Bot configuration error: Bot lacks 'Manage Roles' permission.").queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Bot lacks MANAGE_ROLES permission");
            return;
        }

        if (!botMember.canInteract(targetRole)) {
            hook.editOriginal("❌ Role hierarchy error: @" + targetRole.getName() + " is higher than or equal to the bot's highest role.").queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Role hierarchy violation for @" + targetRole.getName());
            return;
        }

        RoleSubtype subtype = action.getRoleSubtype() != null ? action.getRoleSubtype() : RoleSubtype.TOGGLE;
        boolean hasRole = targetMember.getRoles().contains(targetRole);

        if (subtype == RoleSubtype.ADD && hasRole) {
            String msg = interpolate(action.getReplyContent(), guild, clickingMember, targetMember, targetRole, channel, selectedOption);
            hook.editOriginal(msg.isBlank() ? "ℹ️ " + targetMember.getAsMention() + " already has the role @" + targetRole.getName() + "." : msg).queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "NOOP", "Member already has role @" + targetRole.getName());
            return;
        }

        if (subtype == RoleSubtype.REMOVE && !hasRole) {
            String msg = interpolate(action.getReplyContent(), guild, clickingMember, targetMember, targetRole, channel, selectedOption);
            hook.editOriginal(msg.isBlank() ? "ℹ️ " + targetMember.getAsMention() + " does not have the role @" + targetRole.getName() + "." : msg).queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "NOOP", "Member does not have role @" + targetRole.getName());
            return;
        }

        boolean willAdd = (subtype == RoleSubtype.ADD) || (subtype == RoleSubtype.TOGGLE && !hasRole);

        if (willAdd) {
            guild.addRoleToMember(targetMember, targetRole).queue(
                    success -> {
                        String responseMsg = interpolate(action.getReplyContent(), guild, clickingMember, targetMember, targetRole, channel, selectedOption);
                        if (responseMsg.isBlank()) {
                            responseMsg = "✅ Granted role @" + targetRole.getName() + " to " + targetMember.getAsMention() + ".";
                        }
                        hook.editOriginal(responseMsg).queue();
                        recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Added role @" + targetRole.getName() + " to " + targetMember.getUser().getName());
                    },
                    error -> {
                        hook.editOriginal("❌ Failed to assign role: " + error.getMessage()).queue();
                        recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", error.getMessage());
                    }
            );
        } else {
            guild.removeRoleFromMember(targetMember, targetRole).queue(
                    success -> {
                        String responseMsg = interpolate(action.getReplyContent(), guild, clickingMember, targetMember, targetRole, channel, selectedOption);
                        if (responseMsg.isBlank()) {
                            responseMsg = "✅ Removed role @" + targetRole.getName() + " from " + targetMember.getAsMention() + ".";
                        }
                        hook.editOriginal(responseMsg).queue();
                        recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Removed role @" + targetRole.getName() + " from " + targetMember.getUser().getName());
                    },
                    error -> {
                        hook.editOriginal("❌ Failed to remove role: " + error.getMessage()).queue();
                        recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", error.getMessage());
                    }
            );
        }
    }

    private void executeTicketAction(
            InteractionHook hook,
            Guild guild,
            Member clickingMember,
            User user,
            MessageChannel channel,
            String messageId,
            EmbedAction action,
            Map<String, String> sessionData,
            String selectedOption) {

        Member botMember = resolveBotMember(guild);
        if (botMember == null) {
            hook.editOriginal("❌ Bot configuration error: Unable to verify bot permissions in this server.").queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Bot self member not found");
            return;
        }
        if (!botMember.hasPermission(Permission.MANAGE_CHANNEL)) {
            hook.editOriginal("❌ Bot configuration error: Bot lacks 'Manage Channels' permission to create tickets.").queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Bot lacks MANAGE_CHANNEL permission");
            return;
        }

        String prefix = (action.getChannelPrefix() != null && !action.getChannelPrefix().isBlank())
                ? action.getChannelPrefix()
                : "ticket-";
        String sanitizedUsername = user.getName().toLowerCase().replaceAll("[^a-z0-9-_]", "");
        String channelName = prefix + sanitizedUsername;

        guild.createTextChannel(channelName)
                .addPermissionOverride(guild.getPublicRole(), null, EnumSet.of(Permission.VIEW_CHANNEL))
                .addMemberPermissionOverride(clickingMember.getIdLong(),
                        EnumSet.of(Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND, Permission.MESSAGE_HISTORY, Permission.MESSAGE_ATTACH_FILES),
                        null)
                .queue(
                        ticketChannel -> {
                            String welcome = interpolate(action.getWelcomeMessage(), guild, clickingMember, clickingMember, null, ticketChannel, selectedOption);
                            if (welcome.isBlank()) {
                                welcome = "👋 Welcome " + clickingMember.getAsMention() + " to your support ticket! Staff will assist you shortly.";
                            }
                            ticketChannel.sendMessage(welcome).queue();

                            hook.editOriginal("✅ Support ticket created: " + ticketChannel.getAsMention()).queue();
                            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Created ticket channel " + ticketChannel.getName());
                        },
                        error -> {
                            hook.editOriginal("❌ Failed to create support ticket channel: " + error.getMessage()).queue();
                            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", error.getMessage());
                        }
                );
    }

    private void executeReplyAction(
            InteractionHook hook,
            Guild guild,
            Member clickingMember,
            User user,
            MessageChannel channel,
            String messageId,
            EmbedAction action,
            Map<String, String> sessionData,
            String selectedOption) {

        String content = interpolate(action.getReplyContent(), guild, clickingMember, clickingMember, null, channel, selectedOption);
        if (content.isBlank()) {
            content = "✅ Action acknowledged.";
        }

        hook.editOriginal(content).queue();
        recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "SUCCESS", "Sent reply message");
    }

    private void executeDmAction(
            InteractionHook hook,
            Guild guild,
            Member clickingMember,
            User user,
            MessageChannel channel,
            String messageId,
            EmbedAction action,
            Map<String, String> sessionData,
            String selectedOption) {

        String rawContent = action.getDmContent() != null && !action.getDmContent().isBlank()
                ? action.getDmContent()
                : action.getReplyContent();
        String dmText = interpolate(rawContent, guild, clickingMember, clickingMember, null, channel, selectedOption);

        if (dmText.isBlank()) {
            dmText = "Thank you for verifying on **" + guild.getName() + "**!";
        }

        final String finalDmText = dmText;
        user.openPrivateChannel().queue(
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

    private Member resolveTargetMember(Guild guild, Member clickingMember, Map<String, String> sessionData) {
        if (sessionData != null && sessionData.containsKey("target_user")) {
            String targetUserId = sessionData.get("target_user");
            if (targetUserId != null && !targetUserId.isBlank()) {
                Member member = guild.getMemberById(targetUserId);
                if (member != null) {
                    return member;
                }
                try {
                    return guild.retrieveMemberById(targetUserId).complete();
                } catch (Exception e) {
                    log.warn("Failed to retrieve target member {} in guild {}: {}", targetUserId, guild.getId(), e.getMessage());
                }
            }
        }
        return clickingMember;
    }

    private Role resolveTargetRole(Guild guild, EmbedAction action, Map<String, String> sessionData) {
        if (sessionData != null && sessionData.containsKey("target_role")) {
            String targetRoleId = sessionData.get("target_role");
            if (targetRoleId != null && !targetRoleId.isBlank()) {
                Role role = guild.getRoleById(targetRoleId);
                if (role != null) {
                    return role;
                }
            }
        }
        if (action.getRoleId() != null && !action.getRoleId().isBlank()) {
            return guild.getRoleById(action.getRoleId());
        }
        return null;
    }

    private String interpolate(
            String text,
            Guild guild,
            Member clickingMember,
            Member targetMember,
            Role targetRole,
            MessageChannel channel,
            String selectedOption) {

        if (text == null || text.isBlank()) {
            return "";
        }

        String result = text;
        if (clickingMember != null) {
            result = result.replace("{user}", clickingMember.getAsMention())
                    .replace("{username}", clickingMember.getUser().getName())
                    .replace("{user_id}", clickingMember.getId());
        }
        if (guild != null) {
            result = result.replace("{server}", guild.getName());
        }
        if (channel != null) {
            result = result.replace("{channel}", "<#" + channel.getId() + ">");
        }
        if (targetMember != null) {
            result = result.replace("{target_user}", targetMember.getAsMention());
        }
        if (targetRole != null) {
            result = result.replace("{target_role}", "@" + targetRole.getName())
                    .replace("{role}", "@" + targetRole.getName());
        }
        if (selectedOption != null) {
            result = result.replace("{selected_option}", selectedOption);
        }

        return result;
    }

    private void cleanupSession(String guildId, String userId, String messageId) {
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

    private Member resolveBotMember(Guild guild) {
        if (guild == null) {
            return null;
        }
        try {
            return guild.getSelfMember();
        } catch (Exception e) {
            if (guild.getJDA() != null && guild.getJDA().getSelfUser() != null) {
                try {
                    return guild.retrieveMember(guild.getJDA().getSelfUser()).complete();
                } catch (Exception ex) {
                    log.warn("Failed to retrieve bot self member for guild {}: {}", guild.getId(), ex.getMessage());
                }
            }
            return null;
        }
    }
}
