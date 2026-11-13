// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.execution;

import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.domain.RoleSubtype;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import com.rednecksgaming.embed.service.DiscordDispatchService;
import com.rednecksgaming.embed.service.EmbedTemplateRenderer;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Enterprise executor for Discord role assignment and removal actions,
 * strictly enforcing Discord native role hierarchy and permission invariants.
 */
@Slf4j
@Component
public class RoleActionExecutor {

    private final InteractionLogRepository interactionLogRepository;
    private final EmbedTemplateRepository embedTemplateRepository;
    private final TemplateVariableInterpolator interpolator;
    private final Optional<EmbedTemplateRenderer> embedTemplateRenderer;
    private final Optional<DiscordDispatchService> discordDispatchService;

    @Autowired
    public RoleActionExecutor(
            InteractionLogRepository interactionLogRepository,
            EmbedTemplateRepository embedTemplateRepository,
            TemplateVariableInterpolator interpolator,
            @Autowired(required = false) EmbedTemplateRenderer embedTemplateRenderer,
            @Autowired(required = false) DiscordDispatchService discordDispatchService) {
        this.interactionLogRepository = interactionLogRepository;
        this.embedTemplateRepository = embedTemplateRepository;
        this.interpolator = interpolator;
        this.embedTemplateRenderer = Optional.ofNullable(embedTemplateRenderer);
        this.discordDispatchService = Optional.ofNullable(discordDispatchService);
    }

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

    public void executeRoleAction(
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
        if (targetMember == null) {
            hook.editOriginal("❌ Target member is no longer in this server.").queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "FAILED", "Target member left server");
            return;
        }

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
            String msg = interpolator.interpolate(action.getReplyContent(), guild, clickingMember, targetMember, targetRole, channel, selectedOption);
            hook.editOriginal(msg.isBlank() ? "ℹ️ " + targetMember.getAsMention() + " already has the role @" + targetRole.getName() + "." : msg).queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "NOOP", "Member already has role @" + targetRole.getName());
            return;
        }

        if (subtype == RoleSubtype.REMOVE && !hasRole) {
            String msg = interpolator.interpolate(action.getReplyContent(), guild, clickingMember, targetMember, targetRole, channel, selectedOption);
            hook.editOriginal(msg.isBlank() ? "ℹ️ " + targetMember.getAsMention() + " does not have the role @" + targetRole.getName() + "." : msg).queue();
            recordAuditLog(action, guild.getId(), channel.getId(), messageId, user.getId(), user.getName(), "NOOP", "Member does not have role @" + targetRole.getName());
            return;
        }

        boolean willAdd = (subtype == RoleSubtype.ADD) || (subtype == RoleSubtype.TOGGLE && !hasRole);

        if (willAdd) {
            guild.addRoleToMember(targetMember, targetRole).queue(
                    success -> {
                        String responseMsg = interpolator.interpolate(action.getReplyContent(), guild, clickingMember, targetMember, targetRole, channel, selectedOption);
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
                        String responseMsg = interpolator.interpolate(action.getReplyContent(), guild, clickingMember, targetMember, targetRole, channel, selectedOption);
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

    public ActionExecutionResult executeRoleActionSynchronous(
            EmbedAction action,
            Guild guild,
            Member operator,
            InteractionHook hook,
            Map<String, String> sessionData) {

        Member targetMember = resolveTargetMember(guild, operator, sessionData);
        Role targetRole = resolveTargetRole(guild, action, sessionData);

        if (targetMember == null) {
            if (hook != null) {
                hook.editOriginal("❌ Target member is no longer in this server.").queue();
            }
            return ActionExecutionResult.failure("Target member not found or left server");
        }
        if (targetRole == null) {
            if (hook != null) {
                hook.editOriginal("❌ Role configuration error: No target role was selected.").queue();
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

        // Check for intermediate follow-up template in multi-stage workflows
        if (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank()
                && embedTemplateRepository != null && embedTemplateRenderer.isPresent() && hook != null) {
            Optional<com.rednecksgaming.embed.domain.EmbedTemplate> intermediateTpl = embedTemplateRepository.findById(action.getResponseEmbedTemplateId());
            if (intermediateTpl.isPresent()) {
                Map<String, String> vars = sessionData != null ? new java.util.HashMap<>(sessionData) : new java.util.HashMap<>();
                if (targetMember != null) {
                    vars.put("targetUser", targetMember.getId());
                    vars.put("target_user", targetMember.getId());
                }
                if (targetRole != null) {
                    vars.put("targetRole", targetRole.getId());
                    vars.put("target_role", targetRole.getId());
                }
                net.dv8tion.jda.api.utils.messages.MessageCreateData rendered = embedTemplateRenderer.get().renderToMessageData(intermediateTpl.get(), vars);
                var sendMsgAction = hook.sendMessage(rendered);
                net.dv8tion.jda.api.entities.Message intermediateMsg = sendMsgAction != null ? sendMsgAction.complete() : null;
                String msgId = intermediateMsg != null ? intermediateMsg.getId() : null;
                return ActionExecutionResult.intermediate(msgId);
            } else {
                log.warn("Configured intermediate template {} not found in repository for action {}",
                        action.getResponseEmbedTemplateId(), action.getActionId());
            }
        }

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
            feedbackMsg = interpolator.interpolate(feedbackTemplate, guild, operator, targetMember, targetRole, channel, null);
        } else {
            feedbackMsg = "✅ Granted role " + targetRoleMention + " to " + targetMemberMention + ".";
        }

        if (hook != null) {
            hook.editOriginal(feedbackMsg).queue();
        }

        return ActionExecutionResult.success("Role assigned");
    }

    public Member resolveTargetMember(Guild guild, Member clickingMember, Map<String, String> sessionData) {
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
                    return null;
                }
            }
        }
        return clickingMember;
    }

    public Role resolveTargetRole(Guild guild, EmbedAction action, Map<String, String> sessionData) {
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

    public Member resolveBotMember(Guild guild) {
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
