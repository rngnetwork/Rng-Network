package com.rng.embed.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.CompoundOperation;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.EmbedTemplate;
import com.rng.embed.domain.InteractionLog;
import com.rng.embed.domain.ResponseType;
import com.rng.embed.domain.RoleSubtype;
import com.rng.embed.dto.ActionExecutionResult;
import com.rng.embed.repository.EmbedActionRepository;
import com.rng.embed.repository.EmbedTemplateRepository;
import com.rng.embed.repository.InteractionLogRepository;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

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
    private final EmbedActionRepository embedActionRepository;
    private final Optional<EmbedTemplateRenderer> embedTemplateRenderer;
    private final Optional<StringRedisTemplate> redisTemplate;
    private final Optional<DiscordDispatchService> discordDispatchService;

    public ActionExecutionServiceImpl(
            InteractionLogRepository interactionLogRepository,
            EmbedTemplateRepository embedTemplateRepository,
            EmbedActionRepository embedActionRepository,
            @Autowired(required = false) EmbedTemplateRenderer embedTemplateRenderer,
            @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this(interactionLogRepository, embedTemplateRepository, embedActionRepository, embedTemplateRenderer, redisTemplate, null);
    }

    @Autowired
    public ActionExecutionServiceImpl(
            InteractionLogRepository interactionLogRepository,
            EmbedTemplateRepository embedTemplateRepository,
            EmbedActionRepository embedActionRepository,
            @Autowired(required = false) EmbedTemplateRenderer embedTemplateRenderer,
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            @Autowired(required = false) DiscordDispatchService discordDispatchService) {
        this.interactionLogRepository = interactionLogRepository;
        this.embedTemplateRepository = embedTemplateRepository;
        this.embedActionRepository = embedActionRepository;
        this.embedTemplateRenderer = Optional.ofNullable(embedTemplateRenderer);
        this.redisTemplate = Optional.ofNullable(redisTemplate);
        this.discordDispatchService = Optional.ofNullable(discordDispatchService);
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
        if (targetMember == null) {
            hook.editOriginal("❌ Target member is no longer in this server.").queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Target member left server");
            return;
        }

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
                        dispatchFollowUpTemplateMessage(action, guild, clickingMember, targetMember, targetRole, channel, hook);
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
                        dispatchFollowUpTemplateMessage(action, guild, clickingMember, targetMember, targetRole, channel, hook);
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

        Member targetMember = resolveTargetMember(guild, clickingMember, sessionData);
        Role targetRole = resolveTargetRole(guild, action, sessionData);

        String ticketId = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
        String channelName = resolveTicketChannelName(action.getChannelPrefix(), ticketId, clickingMember, targetMember);

        guild.createTextChannel(channelName)
                .addPermissionOverride(guild.getPublicRole(), null, EnumSet.of(Permission.VIEW_CHANNEL))
                .addMemberPermissionOverride(clickingMember.getIdLong(),
                        EnumSet.of(Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND, Permission.MESSAGE_HISTORY, Permission.MESSAGE_ATTACH_FILES),
                        null)
                .queue(
                        ticketChannel -> {
                            String welcome = interpolate(action.getWelcomeMessage(), guild, clickingMember, targetMember, targetRole, ticketChannel, selectedOption);
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

        Member targetMember = resolveTargetMember(guild, clickingMember, sessionData);
        Role targetRole = resolveTargetRole(guild, action, sessionData);

        String content = interpolate(action.getReplyContent(), guild, clickingMember, targetMember, targetRole, channel, selectedOption);
        if (content.isBlank()) {
            content = "✅ Action acknowledged.";
        }

        hook.editOriginal(content).queue();
        if (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank()) {
            dispatchFollowUpTemplateMessage(action, guild, clickingMember, targetMember, targetRole, channel, hook);
        }
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

        Member targetMember = resolveTargetMember(guild, clickingMember, sessionData);
        Role targetRole = resolveTargetRole(guild, action, sessionData);

        String rawContent = action.getDmContent() != null && !action.getDmContent().isBlank()
                ? action.getDmContent()
                : action.getReplyContent();
        String dmText = interpolate(rawContent, guild, clickingMember, targetMember, targetRole, channel, selectedOption);

        if (dmText.isBlank()) {
            dmText = "Thank you for verifying on **" + guild.getName() + "**!";
        }

        final String finalDmText = dmText;
        User targetUser = (targetMember != null && targetMember.getUser() != null)
                ? targetMember.getUser()
                : user;

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

    private Member resolveTargetMember(Guild guild, Member clickingMember, Map<String, String> sessionData) {
        if (sessionData != null && (sessionData.containsKey("targetUser") || sessionData.containsKey("target_user"))) {
            String targetUserId = sessionData.getOrDefault("targetUser", sessionData.get("target_user"));
            if (targetUserId != null && !targetUserId.isBlank()) {
                if (guild == null) return null;
                Member member = guild.getMemberById(targetUserId);
                if (member != null) {
                    return member;
                }
                try {
                    var restAction = guild.retrieveMemberById(targetUserId);
                    if (restAction != null) {
                        return restAction.complete();
                    }
                } catch (Exception e) {
                    log.warn("Target member {} has left guild {}: {}", targetUserId, guild.getId(), e.getMessage());
                    return null; // NEVER fallback to clickingMember!
                }
            }
        }
        return clickingMember;
    }

    private Role resolveTargetRole(Guild guild, EmbedAction action, Map<String, String> sessionData) {
        if (guild == null) {
            return null;
        }
        if (sessionData != null) {
            List<String> keys = List.of("targetRole", "target_role", "roleId", "role_id", "selected_option");
            for (String key : keys) {
                String roleId = sessionData.get(key);
                if (roleId != null && !roleId.isBlank()) {
                    try {
                        Role role = guild.getRoleById(roleId);
                        if (role != null) {
                            return role;
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
            if (sessionData.containsKey("selected_options")) {
                String raw = sessionData.get("selected_options");
                if (raw != null) {
                    for (String part : raw.split(",")) {
                        String trimmed = part.trim();
                        if (!trimmed.isBlank()) {
                            try {
                                Role role = guild.getRoleById(trimmed);
                                if (role != null) {
                                    return role;
                                }
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }
            }
        }
        if (action != null && action.getRoleId() != null && !action.getRoleId().isBlank()) {
            try {
                return guild.getRoleById(action.getRoleId());
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private String resolveTicketChannelName(String configuredPrefix, String ticketId, Member operator, Member targetMember) {
        if (configuredPrefix == null || configuredPrefix.isBlank()) {
            return "ticket-" + ticketId;
        }

        String name = configuredPrefix.trim();
        boolean hasHexTag = name.contains("{hexCode}") || name.contains("{hexcode}")
                || name.contains("{ticketId}") || name.contains("{ticketid}")
                || name.contains("{id}");

        if (hasHexTag) {
            name = name.replace("{hexCode}", ticketId)
                    .replace("{hexcode}", ticketId)
                    .replace("{ticketId}", ticketId)
                    .replace("{ticketid}", ticketId)
                    .replace("{id}", ticketId);
        } else if (name.endsWith("-")) {
            name = name + ticketId;
        }

        if (targetMember != null && targetMember.getUser() != null && targetMember.getUser().getName() != null) {
            String sanitizedTarget = targetMember.getUser().getName().toLowerCase().replaceAll("[^a-z0-9-_]", "");
            name = name.replace("{targetUser}", sanitizedTarget)
                    .replace("{target_user}", sanitizedTarget);
        }
        if (operator != null && operator.getUser() != null && operator.getUser().getName() != null) {
            String sanitizedOp = operator.getUser().getName().toLowerCase().replaceAll("[^a-z0-9-_]", "");
            name = name.replace("{user}", sanitizedOp)
                    .replace("{username}", sanitizedOp);
        }

        name = name.toLowerCase().replaceAll("[^a-z0-9-_]", "-").replaceAll("-+", "-");
        if (name.length() > 100) {
            name = name.substring(0, 100);
        }
        return name;
    }

    private Map<String, String> buildTemplateVariables(
            String ticketId,
            Guild guild,
            Member operator,
            Member targetMember,
            Role targetRole,
            MessageChannel channel) {

        Map<String, String> vars = new HashMap<>();
        vars.put("user", operator != null && operator.getAsMention() != null ? operator.getAsMention() : "");
        vars.put("username", operator != null && operator.getUser() != null && operator.getUser().getName() != null ? operator.getUser().getName() : "");
        vars.put("user_id", operator != null && operator.getId() != null ? operator.getId() : "");
        vars.put("targetUser", targetMember != null && targetMember.getAsMention() != null ? targetMember.getAsMention() : "");
        vars.put("target_user", targetMember != null && targetMember.getAsMention() != null ? targetMember.getAsMention() : "");

        String roleName = (targetRole != null && targetRole.getName() != null) ? targetRole.getName() : "";
        String roleMention = "";
        if (targetRole != null) {
            roleMention = targetRole.getAsMention() != null ? targetRole.getAsMention() : ("@" + roleName);
        }
        vars.put("targetRole", roleMention);
        vars.put("target_role", roleMention);
        vars.put("role", roleMention);
        vars.put("targetRoleName", roleName);
        vars.put("target_role_name", roleName);
        vars.put("role_name", roleName);
        vars.put("server", guild != null && guild.getName() != null ? guild.getName() : "");
        vars.put("channel", channel != null ? "<#" + channel.getId() + ">" : "");
        if (ticketId != null) {
            vars.put("ticketId", ticketId);
            vars.put("ticketid", ticketId);
            vars.put("hexCode", ticketId);
            vars.put("hexcode", ticketId);
            vars.put("id", ticketId);
        }
        return vars;
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
            if (clickingMember.getAsMention() != null) {
                result = result.replace("{user}", clickingMember.getAsMention());
            }
            if (clickingMember.getUser() != null && clickingMember.getUser().getName() != null) {
                result = result.replace("{username}", clickingMember.getUser().getName());
            }
            if (clickingMember.getId() != null) {
                result = result.replace("{user_id}", clickingMember.getId());
            }
        }
        if (guild != null && guild.getName() != null) {
            result = result.replace("{server}", guild.getName());
        }
        if (channel != null && channel.getId() != null) {
            result = result.replace("{channel}", "<#" + channel.getId() + ">");
        }
        if (targetMember != null) {
            if (targetMember.getAsMention() != null) {
                result = result.replace("{target_user}", targetMember.getAsMention())
                        .replace("{targetUser}", targetMember.getAsMention());
            }
            if (targetMember.getUser() != null && targetMember.getUser().getName() != null) {
                result = result.replace("{target_username}", targetMember.getUser().getName())
                        .replace("{targetUsername}", targetMember.getUser().getName());
            }
        }
        if (targetRole != null) {
            String roleName = targetRole.getName() != null ? targetRole.getName() : "";
            String roleDisplay = "@" + roleName;
            result = result.replace("{target_role}", roleDisplay)
                    .replace("{targetRole}", roleDisplay)
                    .replace("{role}", roleDisplay)
                    .replace("{targetRoleName}", roleName)
                    .replace("{target_role_name}", roleName)
                    .replace("{role_name}", roleName);
        }
        if (selectedOption != null) {
            result = result.replace("{selected_option}", selectedOption);
        }

        return result;
    }

    private Optional<EmbedTemplate> resolveTemplate(String templateId) {
        if (templateId == null || templateId.isBlank()) {
            return Optional.empty();
        }
        return embedTemplateRepository.findByTemplateId(templateId)
                .or(() -> embedTemplateRepository.findById(templateId));
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

    @Override
    public boolean canOperatorAssignRole(Member operator, Role targetRole) {
        if (operator == null || targetRole == null) {
            return false;
        }
        if (operator.isOwner()) {
            return true;
        }
        if (operator.getRoles() == null || operator.getRoles().isEmpty()) {
            return false;
        }
        int highestPosition = operator.getRoles().stream().mapToInt(Role::getPosition).max().orElse(-1);
        return highestPosition > targetRole.getPosition();
    }

    @Override
    public ActionExecutionResult executeComponentAction(String actionId, Guild guild, Member operator, InteractionHook hook, Map<String, String> sessionData) {
        EmbedAction action = embedActionRepository.findByActionId(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action not found: " + actionId));

        if (action.getActionType() == ActionType.ROLE) {
            Member targetMember = resolveTargetMember(guild, operator, sessionData);
            if (targetMember == null) {
                if (hook != null) {
                    hook.editOriginal("❌ Target member is no longer in this server.").queue();
                }
                return ActionExecutionResult.failure("Target member left server");
            }
            Role targetRole = resolveTargetRole(guild, action, sessionData);
            if (targetRole == null) {
                if (hook != null) {
                    hook.editOriginal("❌ Role configuration error: No target role was selected from the dropdown or the role does not exist.").queue();
                }
                return ActionExecutionResult.failure("Target role not found or not selected");
            }
            if (!canOperatorAssignRole(operator, targetRole)) {
                if (hook != null) {
                    hook.editOriginal("❌ Hierarchy violation: You cannot assign a role equal to or higher than your highest role.").queue();
                }
                return ActionExecutionResult.failure("Role hierarchy violation");
            }
            if (targetRole.isPublicRole()) {
                if (hook != null) {
                    hook.editOriginal("❌ Cannot assign or modify the @everyone public role.").queue();
                }
                return ActionExecutionResult.failure("Attempted to assign @everyone");
            }
            if (targetRole.isManaged()) {
                if (hook != null) {
                    hook.editOriginal("❌ Cannot assign managed integration/bot role: @" + targetRole.getName()).queue();
                }
                return ActionExecutionResult.failure("Attempted to assign managed role @" + targetRole.getName());
            }
            Member botMember = resolveBotMember(guild);
            if (botMember != null) {
                if (!botMember.hasPermission(Permission.MANAGE_ROLES)) {
                    if (hook != null) {
                        hook.editOriginal("❌ Bot configuration error: Bot lacks 'Manage Roles' permission.").queue();
                    }
                    return ActionExecutionResult.failure("Bot lacks MANAGE_ROLES permission");
                }
                if (!botMember.canInteract(targetRole)) {
                    if (hook != null) {
                        hook.editOriginal("❌ Role hierarchy error: @" + targetRole.getName() + " is higher than or equal to the bot's highest role.").queue();
                    }
                    return ActionExecutionResult.failure("Bot role hierarchy violation for @" + targetRole.getName());
                }
            }
            guild.addRoleToMember(targetMember, targetRole).complete();

            MessageChannel channel = null;
            if (hook != null && hook.getInteraction() != null) {
                try {
                    channel = hook.getInteraction().getMessageChannel();
                } catch (Exception ignored) {
                }
            }

            String feedbackTemplate = action.getReplyContent();
            if (feedbackTemplate == null || feedbackTemplate.isBlank()) {
                feedbackTemplate = action.getConfirmationMessage();
            }
            String feedbackMsg;
            String targetRoleMention = targetRole != null ? (targetRole.getAsMention() != null ? targetRole.getAsMention() : "@" + targetRole.getName()) : "";
            String targetMemberMention = targetMember != null ? (targetMember.getAsMention() != null ? targetMember.getAsMention() : targetMember.getEffectiveName()) : "";
            if (feedbackTemplate != null && !feedbackTemplate.isBlank()) {
                feedbackMsg = interpolate(feedbackTemplate, guild, operator, targetMember, targetRole, channel, null);
            } else {
                feedbackMsg = "✅ Granted role " + targetRoleMention + " to " + targetMemberMention + ".";
            }

            if (hook != null) {
                hook.editOriginal(feedbackMsg).queue();
            }

            if (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank()) {
                return dispatchFollowUpTemplateMessage(action, guild, operator, targetMember, targetRole, channel, hook);
            }

            return ActionExecutionResult.success("Role assigned");
        }

        if (action.getActionType() == ActionType.REPLY) {
            MessageChannel channel = null;
            if (hook != null && hook.getInteraction() != null) {
                try {
                    channel = hook.getInteraction().getMessageChannel();
                } catch (Exception ignored) {
                }
            }

            Member targetMember = resolveTargetMember(guild, operator, sessionData);
            Role targetRole = resolveTargetRole(guild, action, sessionData);

            String feedbackTemplate = action.getReplyContent();
            if (feedbackTemplate == null || feedbackTemplate.isBlank()) {
                feedbackTemplate = action.getConfirmationMessage();
            }
            String feedbackMsg;
            if (feedbackTemplate != null && !feedbackTemplate.isBlank()) {
                feedbackMsg = interpolate(feedbackTemplate, guild, operator, targetMember, targetRole, channel, null);
            } else {
                feedbackMsg = "✅ Action acknowledged.";
            }

            if (hook != null) {
                hook.editOriginal(feedbackMsg).queue();
            }

            if (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank()) {
                return dispatchFollowUpTemplateMessage(action, guild, operator, targetMember, targetRole, channel, hook);
            }

            return ActionExecutionResult.success("Reply acknowledged");
        }

        if (action.getActionType() == ActionType.TICKET) {
            MessageChannel channel = null;
            if (hook != null && hook.getInteraction() != null) {
                try {
                    channel = hook.getInteraction().getMessageChannel();
                } catch (Exception ignored) {
                }
            }

            Member botMember = resolveBotMember(guild);
            if (botMember != null && !botMember.hasPermission(Permission.MANAGE_CHANNEL)) {
                if (hook != null) {
                    hook.editOriginal("❌ Bot configuration error: Bot lacks 'Manage Channels' permission to create tickets.").queue();
                }
                return ActionExecutionResult.failure("Bot lacks MANAGE_CHANNEL permission");
            }

            Member targetMember = resolveTargetMember(guild, operator, sessionData);
            Role targetRole = resolveTargetRole(guild, action, sessionData);

            String ticketId = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
            String channelName = resolveTicketChannelName(action.getChannelPrefix(), ticketId, operator, targetMember);

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

            String welcome = interpolate(action.getWelcomeMessage(), guild, operator, targetMember, targetRole, ticketChannel, null);
            if (welcome.isBlank()) {
                welcome = "👋 Welcome " + operator.getAsMention() + " to your support ticket! Staff will assist you shortly.";
            }
            ticketChannel.sendMessage(welcome).queue();

            // Handle DM logs or compound operations if configured
            if (action.getCompoundOperations() != null && !action.getCompoundOperations().isEmpty()) {
                action.getCompoundOperations().stream()
                        .filter(op -> op.getOperationType() == CompoundOperation.OperationType.SEND_DM_TEMPLATE)
                        .findFirst()
                        .ifPresent(op -> {
                            EmbedTemplate dmTpl = resolveTemplate(op.getTemplateId()).orElse(null);
                            if (dmTpl != null && embedTemplateRenderer.isPresent()) {
                                Map<String, String> vars = buildTemplateVariables(ticketId, guild, operator, targetMember, targetRole, ticketChannel);
                                MessageCreateData dmData = embedTemplateRenderer.get().renderToMessageData(dmTpl, vars);
                                User dmRecipient = (targetMember != null && targetMember.getUser() != null)
                                        ? targetMember.getUser()
                                        : (operator != null ? operator.getUser() : null);
                                if (dmRecipient != null) {
                                    dispatchDMLogsWithFallback(dmRecipient, ticketChannel, dmData);
                                }
                            }
                        });
            } else if (action.getDmContent() != null && !action.getDmContent().isBlank()) {
                String dmText = interpolate(action.getDmContent(), guild, operator, targetMember, targetRole, ticketChannel, null);
                User dmRecipient = (targetMember != null && targetMember.getUser() != null)
                        ? targetMember.getUser()
                        : (operator != null ? operator.getUser() : null);
                if (dmRecipient != null) {
                    dispatchDMLogsWithFallback(dmRecipient, ticketChannel, MessageCreateData.fromContent(dmText));
                }
            }

            if (hook != null) {
                hook.editOriginal("✅ Support ticket created: " + ticketChannel.getAsMention()).queue();
            }

            if (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank()) {
                return dispatchFollowUpTemplateMessage(action, guild, operator, targetMember, targetRole, ticketChannel, hook);
            }

            return ActionExecutionResult.builder()
                    .success(true)
                    .ticketId(ticketId)
                    .channelId(ticketChannel.getId())
                    .isTerminal(action.getResponseEmbedTemplateId() == null || action.getResponseEmbedTemplateId().isBlank())
                    .build();
        }

        if (action.getActionType() == ActionType.DM) {
            Member targetMember = resolveTargetMember(guild, operator, sessionData);
            Role targetRole = resolveTargetRole(guild, action, sessionData);
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
            String dmText = interpolate(rawContent, guild, operator, targetMember, targetRole, channel, null);
            if (dmText.isBlank()) {
                dmText = "Thank you for verifying on **" + guild.getName() + "**!";
            }

            final String finalDmText = dmText;
            User targetUser = (targetMember != null && targetMember.getUser() != null)
                    ? targetMember.getUser()
                    : (operator != null ? operator.getUser() : null);

            if (targetUser != null) {
                try {
                    var pc = targetUser.openPrivateChannel().complete();
                    pc.sendMessage(finalDmText).complete();
                    if (hook != null) {
                        hook.editOriginal("✅ Direct message sent! Please check your private messages.").queue();
                    }
                } catch (Exception e) {
                    log.warn("Direct messaging failed for user {}, falling back: {}", targetUser.getId(), e.getMessage());
                    if (hook != null) {
                        hook.editOriginal("⚠️ Could not send a DM. Please enable direct messages from server members in your Privacy Settings. Message:\n\n" + finalDmText).queue();
                    }
                }
            } else if (hook != null) {
                hook.editOriginal("❌ Could not resolve target user for Direct Message.").queue();
            }

            if (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank()) {
                return dispatchFollowUpTemplateMessage(action, guild, operator, targetMember, targetRole, channel, hook);
            }

            return ActionExecutionResult.success("Direct message delivered");
        }

        if (hook != null) {
            hook.editOriginal("❌ Unsupported action type: " + action.getActionType()).queue();
        }
        return ActionExecutionResult.failure("Unsupported component action type: " + action.getActionType());
    }

    private ActionExecutionResult dispatchFollowUpTemplateMessage(
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

        Map<String, String> vars = buildTemplateVariables(null, guild, operator, targetMember, targetRole, channel);

        ResponseType rType = action.getResponseType() != null ? action.getResponseType() : ResponseType.PUBLIC_EMBED;

        if (rType == ResponseType.PUBLIC_EMBED || rType == ResponseType.PUBLIC_TEXT) {
            // First attempt: Dispatch authentic Discord Components V2 wire payload directly via Discord REST API v10
            if (channel != null && discordDispatchService.isPresent()) {
                try {
                    Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(template, vars);
                    JsonNode dispatchResult = discordDispatchService.get().dispatchToChannel(channel.getId(), wirePayload, null);
                    String messageId = dispatchResult != null && dispatchResult.has("id") ? dispatchResult.get("id").asText() : null;
                    log.info("Dispatched public Components V2 follow-up embed {} to channel {} via Discord REST API v10 (messageId: {})",
                            responseTplId, channel.getId(), messageId);
                    return ActionExecutionResult.intermediate(messageId);
                } catch (Exception e) {
                    log.warn("Discord REST API v10 dispatch failed ({}), falling back to JDA sendMessage: {}",
                            e.getMessage(), e.getClass().getSimpleName());
                }
            }

            // Fallback: Dispatch via JDA MessageCreateData
            MessageCreateData msgData = embedTemplateRenderer.get().renderToMessageData(template, vars);
            if (channel != null) {
                try {
                    var sentMsg = channel.sendMessage(msgData).complete();
                    log.info("Dispatched public follow-up embed {} to channel {} via JDA", responseTplId, channel.getId());
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
            User dmRecipient = (targetMember != null && targetMember.getUser() != null)
                    ? targetMember.getUser()
                    : (operator != null ? operator.getUser() : null);
            if (dmRecipient != null) {
                try {
                    var pc = dmRecipient.openPrivateChannel().complete();
                    if (pc != null) {
                        if (discordDispatchService.isPresent()) {
                            try {
                                Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(template, vars);
                                JsonNode dispatchResult = discordDispatchService.get().dispatchToChannel(pc.getId(), wirePayload, null);
                                String messageId = dispatchResult != null && dispatchResult.has("id") ? dispatchResult.get("id").asText() : null;
                                log.info("Dispatched Components V2 DM follow-up embed {} to DM channel {} (recipient {}) via Discord REST API v10 (messageId: {})",
                                        responseTplId, pc.getId(), dmRecipient.getId(), messageId);
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
                    if (hook != null) {
                        MessageCreateData msgData = embedTemplateRenderer.get().renderToMessageData(template, vars);
                        var sentMsgAction = hook.sendMessage(msgData);
                        var sentMsg = sentMsgAction != null ? sentMsgAction.complete() : null;
                        return ActionExecutionResult.intermediate(sentMsg != null ? sentMsg.getId() : null);
                    }
                }
            }
        } else {
            // EPHEMERAL_EMBED / default
            if (hook != null) {
                MessageCreateData msgData = embedTemplateRenderer.get().renderToMessageData(template, vars);
                var sentMsgAction = hook.sendMessage(msgData);
                var sentMsg = sentMsgAction != null ? sentMsgAction.complete() : null;
                return ActionExecutionResult.intermediate(sentMsg != null ? sentMsg.getId() : null);
            }
        }

        return ActionExecutionResult.success("Follow-up processed");
    }

    @Override
    public ActionExecutionResult executeCompoundAction(String actionId, Guild guild, Member operator, InteractionHook hook, Map<String, String> sessionData) {
        EmbedAction action = embedActionRepository.findByActionId(actionId)
                .or(() -> embedActionRepository.findById(actionId))
                .orElseThrow(() -> new ResourceNotFoundException("Action not found: " + actionId));

        Member botMember = resolveBotMember(guild);
        if (botMember != null && !botMember.hasPermission(Permission.MANAGE_CHANNEL)) {
            if (hook != null) {
                hook.editOriginal("❌ Bot configuration error: Bot lacks 'Manage Channels' permission to create tickets.").queue();
            }
            return ActionExecutionResult.failure("Bot lacks MANAGE_CHANNEL permission");
        }

        Member targetMember = resolveTargetMember(guild, operator, sessionData);
        Role targetRole = resolveTargetRole(guild, action, sessionData);

        String ticketId = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
        String channelName = resolveTicketChannelName(action.getChannelPrefix(), ticketId, operator, targetMember);

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
                            Map<String, String> vars = buildTemplateVariables(ticketId, guild, operator, targetMember, targetRole, ticketChannel);
                            MessageCreateData dmData = embedTemplateRenderer.get().renderToMessageData(dmTpl, vars);
                            User dmRecipient = (operator != null && operator.getUser() != null)
                                    ? operator.getUser()
                                    : (targetMember != null ? targetMember.getUser() : null);
                            if (dmRecipient != null) {
                                dispatchDMLogsWithFallback(dmRecipient, ticketChannel, dmData);
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

    @Override
    public ActionExecutionResult dispatchDMLogsWithFallback(User user, TextChannel ticketChannel, MessageCreateData logData) {
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
            pc.sendMessage(logData).complete();
            return ActionExecutionResult.builder().success(true).dmDelivered(true).build();
        } catch (Exception ex) {
            log.warn("Direct messaging failed for user {}, falling back to ticket channel: {}", user != null ? user.getId() : "unknown", ex.getMessage());
            try {
                if (ticketChannel != null) {
                    var sendAction = ticketChannel.sendMessage(logData);
                    if (sendAction != null) {
                        sendAction.complete();
                    }
                }
            } catch (Exception fallbackEx) {
                log.error("Failed to post fallback audit log in ticket channel: {}", fallbackEx.getMessage());
            }
            return ActionExecutionResult.builder().success(true).dmDelivered(false).build();
        }
    }
}
