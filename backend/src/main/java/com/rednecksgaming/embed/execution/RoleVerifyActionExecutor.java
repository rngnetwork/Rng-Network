// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.execution;

import com.rednecksgaming.embed.domain.ActionType;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.domain.ResponseType;
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
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import net.dv8tion.jda.api.utils.messages.MessageEditData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/**
 * Enterprise executor for member role verification actions (ROLE_VERIFY),
 * enforcing bot hierarchy, managed role safety, idempotency, and response delivery.
 */
@Slf4j
@Component
public class RoleVerifyActionExecutor {

    private final InteractionLogRepository interactionLogRepository;
    private final EmbedTemplateRepository embedTemplateRepository;
    private final TemplateVariableInterpolator interpolator;
    private final Optional<EmbedTemplateRenderer> embedTemplateRenderer;
    private final Optional<DiscordDispatchService> discordDispatchService;

    @Autowired
    public RoleVerifyActionExecutor(
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

    public void executeRoleVerifyAction(
            InteractionHook hook,
            Guild guild,
            Member clickingMember,
            User user,
            MessageChannel channel,
            String messageId,
            EmbedAction action,
            Map<String, String> sessionData) {

        if (clickingMember == null) {
            if (hook != null) {
                hook.editOriginal("❌ Target member is no longer in this server.").queue();
            }
            recordAuditLog(action, guild != null ? guild.getId() : null, channel != null ? channel.getId() : null,
                    messageId, user != null ? user.getId() : null, user != null ? user.getName() : null,
                    "FAILED", "Clicking member not found in guild");
            return;
        }

        String roleId = action.getRoleId();
        if (roleId == null || roleId.trim().isBlank()) {
            if (hook != null) {
                hook.editOriginal("❌ Role verification error: Verification role ID is not configured.").queue();
            }
            recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown", messageId, user.getId(), user.getName(),
                    "FAILED", "Verification role ID is blank");
            return;
        }

        Role targetRole;
        try {
            targetRole = guild.getRoleById(roleId.trim());
        } catch (Exception e) {
            targetRole = null;
        }

        if (targetRole == null) {
            if (hook != null) {
                hook.editOriginal("❌ Role verification error: The configured verification role does not exist on this server.").queue();
            }
            recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown", messageId, user.getId(), user.getName(),
                    "FAILED", "Configured role " + roleId + " not found on server");
            return;
        }

        if (targetRole.isPublicRole()) {
            if (hook != null) {
                hook.editOriginal("❌ Cannot assign or modify the @everyone public role.").queue();
            }
            recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown", messageId, user.getId(), user.getName(),
                    "FAILED", "Attempted to verify with @everyone role");
            return;
        }

        if (targetRole.isManaged()) {
            if (hook != null) {
                hook.editOriginal("❌ Cannot assign managed integration/bot role: @" + targetRole.getName()).queue();
            }
            recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown", messageId, user.getId(), user.getName(),
                    "FAILED", "Attempted to assign managed role @" + targetRole.getName());
            return;
        }

        Member botMember = resolveBotMember(guild);
        if (botMember == null) {
            if (hook != null) {
                hook.editOriginal("❌ Bot configuration error: Unable to verify bot permissions in this server.").queue();
            }
            recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown", messageId, user.getId(), user.getName(),
                    "FAILED", "Bot self member not found");
            return;
        }

        if (!botMember.hasPermission(Permission.MANAGE_ROLES)) {
            if (hook != null) {
                hook.editOriginal("❌ Bot configuration error: Bot lacks 'Manage Roles' permission.").queue();
            }
            recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown", messageId, user.getId(), user.getName(),
                    "FAILED", "Bot lacks MANAGE_ROLES permission");
            return;
        }

        if (!botMember.canInteract(targetRole)) {
            if (hook != null) {
                hook.editOriginal("❌ Role hierarchy error: @" + targetRole.getName() + " is higher than or equal to the bot's highest role.").queue();
            }
            recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown", messageId, user.getId(), user.getName(),
                    "FAILED", "Role hierarchy violation for @" + targetRole.getName());
            return;
        }

        boolean alreadyHasRole = clickingMember.getRoles().contains(targetRole);
        if (alreadyHasRole) {
            deliverResponse(hook, guild, clickingMember, targetRole, channel, action, user, messageId, true);
            recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown", messageId, user.getId(), user.getName(),
                    "NOOP", "Member already has verification role @" + targetRole.getName());
            return;
        }

        final Role resolvedRole = targetRole;
        guild.addRoleToMember(clickingMember, targetRole).queue(
                success -> {
                    deliverResponse(hook, guild, clickingMember, resolvedRole, channel, action, user, messageId, false);
                    recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown", messageId, user.getId(), user.getName(),
                            "SUCCESS", "Granted verification role @" + resolvedRole.getName() + " to " + clickingMember.getUser().getName());
                },
                error -> {
                    if (hook != null) {
                        hook.editOriginal("❌ Failed to assign verification role: " + error.getMessage()).queue();
                    }
                    recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown", messageId, user.getId(), user.getName(),
                            "FAILED", "Discord error: " + error.getMessage());
                }
        );
    }

    public ActionExecutionResult executeRoleVerifyActionSynchronous(
            EmbedAction action,
            Guild guild,
            Member operator,
            InteractionHook hook,
            Map<String, String> sessionData) {

        if (operator == null) {
            if (hook != null) {
                hook.editOriginal("❌ Target member is no longer in this server.").queue();
            }
            return ActionExecutionResult.failure("Member not found in guild");
        }

        String roleId = action.getRoleId();
        if (roleId == null || roleId.trim().isBlank()) {
            if (hook != null) {
                hook.editOriginal("❌ Role verification error: Verification role ID is not configured.").queue();
            }
            return ActionExecutionResult.failure("Verification role ID missing");
        }

        Role targetRole;
        try {
            targetRole = guild.getRoleById(roleId.trim());
        } catch (Exception e) {
            targetRole = null;
        }

        if (targetRole == null) {
            if (hook != null) {
                hook.editOriginal("❌ Role verification error: The configured verification role does not exist on this server.").queue();
            }
            return ActionExecutionResult.failure("Verification role not found");
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

        boolean alreadyHasRole = operator.getRoles().contains(targetRole);
        if (!alreadyHasRole) {
            guild.addRoleToMember(operator, targetRole).complete();
        }

        MessageChannel channel = null;
        if (hook != null && hook.getInteraction() != null) {
            try {
                channel = hook.getInteraction().getMessageChannel();
            } catch (Exception ignored) {
            }
        }
        if (channel == null && sessionData != null && sessionData.containsKey("channel_id") && guild != null) {
            try {
                channel = guild.getTextChannelById(sessionData.get("channel_id"));
            } catch (Exception ignored) {
            }
        }

        User user = operator.getUser();
        String messageId = (hook != null && hook.getInteraction() != null) ? hook.getInteraction().getId() : "sync";

        deliverResponse(hook, guild, operator, targetRole, channel, action, user, messageId, alreadyHasRole);

        recordAuditLog(action, guild.getId(), channel != null ? channel.getId() : "unknown",
                messageId, user != null ? user.getId() : operator.getId(),
                user != null ? user.getName() : operator.getEffectiveName(),
                alreadyHasRole ? "NOOP" : "SUCCESS",
                alreadyHasRole ? "Member already has verification role @" + targetRole.getName()
                        : "Granted verification role @" + targetRole.getName() + " to " + (user != null ? user.getName() : operator.getEffectiveName()));

        return ActionExecutionResult.success("Role verified");
    }

    private void deliverResponse(
            InteractionHook hook,
            Guild guild,
            Member member,
            Role role,
            MessageChannel channel,
            EmbedAction action,
            User user,
            String messageId,
            boolean isAlreadyVerified) {

        ResponseType responseType = action.getResponseType() != null ? action.getResponseType() : ResponseType.EPHEMERAL_EMBED;
        boolean isPublicResponse = (responseType == ResponseType.PUBLIC_EMBED || responseType == ResponseType.PUBLIC_TEXT);

        // Case 1: Member is already verified
        if (isAlreadyVerified) {
            if (isPublicResponse) {
                // Public deferral was made by gateway listener. Delete it cleanly so no raw status text is in chat.
                if (hook != null) {
                    try {
                        hook.deleteOriginal().queue();
                    } catch (Exception e) {
                        log.debug("Failed to delete public deferral: {}", e.getMessage());
                    }
                }
                // Notify user privately via DM
                if (user != null) {
                    user.openPrivateChannel().queue(
                            pc -> pc.sendMessage("ℹ️ You are already verified with @" + role.getName() + " on **" + guild.getName() + "**.").queue(),
                            err -> log.debug("Could not send private DM to user {}: {}", user.getId(), err.getMessage())
                    );
                }
            } else {
                // The hook is already ephemeral
                if (hook != null) {
                    hook.editOriginal("ℹ️ You are already verified with @" + role.getName() + ".").queue();
                }
            }
            return;
        }

        // Case 2: Fresh verification - check for configured Embed Template
        String templateId = action.getResponseEmbedTemplateId();
        Optional<EmbedTemplate> templateOpt = (templateId != null && !templateId.isBlank())
                ? embedTemplateRepository.findByTemplateId(templateId).or(() -> embedTemplateRepository.findById(templateId))
                : Optional.empty();

        Map<String, String> vars = interpolator.buildTemplateVariables(null, guild, member, member, role, channel, false);

        if (templateOpt.isPresent() && embedTemplateRenderer.isPresent()) {
            EmbedTemplate template = templateOpt.get();

            // DM_EMBED: Deliver template to user's direct messages via Discord REST API v10 (with JDA fallback)
            if (responseType == ResponseType.DM_EMBED) {
                if (user != null) {
                    user.openPrivateChannel().queue(
                            pc -> {
                                if (discordDispatchService.isPresent() && embedTemplateRenderer.isPresent()) {
                                    try {
                                        Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(template, vars);
                                        discordDispatchService.get().dispatchToChannel(pc.getId(), wirePayload, null);
                                        if (hook != null) {
                                            hook.editOriginal("✅ Verification complete! Granted role @" + role.getName() + ". Please check your private messages.").queue();
                                        }
                                        return;
                                    } catch (Exception e) {
                                        log.warn("Discord REST API v10 DM dispatch failed: {}", e.getMessage());
                                    }
                                }
                                if (embedTemplateRenderer.isPresent()) {
                                    MessageCreateData dmMsg = embedTemplateRenderer.get().renderToMessageData(template, vars);
                                    pc.sendMessage(dmMsg).queue(
                                            success -> {
                                                if (hook != null) {
                                                    hook.editOriginal("✅ Verification complete! Granted role @" + role.getName() + ". Please check your private messages.").queue();
                                                }
                                            },
                                            error -> {
                                                if (hook != null) {
                                                    hook.editOriginal("⚠️ Could not send a DM. Please enable direct messages from server members in your Privacy Settings.").queue();
                                                }
                                            }
                                    );
                                }
                            },
                            error -> {
                                if (hook != null) {
                                    hook.editOriginal("⚠️ Could not open private channel. Please check your Discord Privacy Settings.").queue();
                                }
                            }
                    );
                } else if (hook != null) {
                    hook.editOriginal("✅ You have been successfully verified! Granted role @" + role.getName() + ".").queue();
                }
                return;
            }

            // PUBLIC_EMBED or EPHEMERAL_EMBED: Edit original interaction hook with the rendered embed template
            // (If public, hook is public -> renders as public embed. If ephemeral, hook is ephemeral -> renders as ephemeral embed)
            if (hook != null) {
                if (discordDispatchService.isPresent()) {
                    try {
                        Map<String, Object> wirePayload = embedTemplateRenderer.get().renderInterpolatedWirePayload(template, vars);
                        discordDispatchService.get().editOriginalInteraction(hook.getId(), hook.getToken(), wirePayload);
                        return;
                    } catch (Exception e) {
                        log.warn("Discord REST API v10 edit original interaction failed, falling back to JDA: {}", e.getMessage());
                    }
                }
                MessageCreateData msgData = embedTemplateRenderer.get().renderToMessageData(template, vars);
                hook.editOriginal(MessageEditData.fromCreateData(msgData)).queue();
            }
            return;
        }

        // Case 3: Fresh verification but NO template configured (Template is None / blank)
        if (isPublicResponse) {
            // Delete the public deferral so no raw console emoji text is posted into the server channel
            if (hook != null) {
                try {
                    hook.deleteOriginal().queue();
                } catch (Exception e) {
                    log.debug("Failed to delete public deferral: {}", e.getMessage());
                }
            }
            // Send user their confirmation privately in DMs
            if (user != null) {
                user.openPrivateChannel().queue(
                        pc -> pc.sendMessage("✅ You have been successfully verified with @" + role.getName() + " on **" + guild.getName() + "**.").queue(),
                        err -> log.debug("Could not send private DM to user {}: {}", user.getId(), err.getMessage())
                );
            }
        } else if (responseType == ResponseType.DM_EMBED) {
            if (user != null) {
                user.openPrivateChannel().queue(
                        pc -> pc.sendMessage("✅ You have been successfully verified! Granted role @" + role.getName() + " on **" + guild.getName() + "**.").queue(
                                success -> {
                                    if (hook != null) {
                                        hook.editOriginal("✅ Verification complete! Granted role @" + role.getName() + ". Please check your private messages.").queue();
                                    }
                                },
                                error -> {
                                    if (hook != null) {
                                        hook.editOriginal("⚠️ Could not send a DM. Please enable direct messages from server members in your Privacy Settings.").queue();
                                    }
                                }
                        ),
                        error -> {
                            if (hook != null) {
                                hook.editOriginal("⚠️ Could not open private channel. Please check your Discord Privacy Settings.").queue();
                            }
                        }
                );
            } else if (hook != null) {
                hook.editOriginal("✅ You have been successfully verified! Granted role @" + role.getName() + ".").queue();
            }
        } else {
            // Ephemeral hook: output the confirmation privately to the clicker
            if (hook != null) {
                hook.editOriginal("✅ You have been successfully verified! Granted role @" + role.getName() + ".").queue();
            }
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
            InteractionLog auditLog = InteractionLog.builder()
                    .actionId(action != null ? action.getActionId() : null)
                    .actionType(action != null ? action.getActionType() : ActionType.ROLE_VERIFY)
                    .guildId(guildId)
                    .channelId(channelId)
                    .messageId(messageId)
                    .userId(userId)
                    .username(username)
                    .status(status)
                    .details(details)
                    .createdAt(Instant.now())
                    .build();
            interactionLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Failed to record role verification audit log: {}", e.getMessage());
        }
    }
}
