// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.execution;

import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Enterprise template variable interpolator providing deterministic token substitution
 * across interactive Discord embeds, action buttons, select menus, and direct messages.
 */
@Component
public class TemplateVariableInterpolator {

    public String resolveTicketChannelName(String configuredPrefix, String ticketId, Member operator, Member targetMember) {
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

    public Map<String, String> buildTemplateVariables(
            String ticketId,
            Guild guild,
            Member operator,
            Member targetMember,
            Role targetRole,
            MessageChannel channel) {
        boolean isDm = (channel instanceof net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel);
        return buildTemplateVariables(ticketId, guild, operator, targetMember, targetRole, channel, isDm);
    }

    public Map<String, String> buildTemplateVariables(
            String ticketId,
            Guild guild,
            Member operator,
            Member targetMember,
            Role targetRole,
            MessageChannel channel,
            boolean isDm) {

        Map<String, String> vars = new HashMap<>();
        vars.put("user", operator != null && operator.getAsMention() != null ? operator.getAsMention() : "");
        vars.put("username", operator != null && operator.getUser() != null && operator.getUser().getName() != null ? operator.getUser().getName() : "");
        vars.put("user_id", operator != null && operator.getId() != null ? operator.getId() : "");
        vars.put("targetUser", targetMember != null && targetMember.getAsMention() != null ? targetMember.getAsMention() : "");
        vars.put("target_user", targetMember != null && targetMember.getAsMention() != null ? targetMember.getAsMention() : "");

        String roleName = (targetRole != null && targetRole.getName() != null) ? targetRole.getName() : "";
        String roleMention = "";
        if (targetRole != null) {
            if (isDm) {
                roleMention = "@" + roleName;
            } else {
                roleMention = targetRole.getAsMention() != null ? targetRole.getAsMention() : ("@" + roleName);
            }
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

    public String interpolate(
            String text,
            Guild guild,
            Member clickingMember,
            Member targetMember,
            Role targetRole,
            MessageChannel channel,
            String selectedOption) {
        boolean isDm = (channel instanceof net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel);
        return interpolate(text, guild, clickingMember, targetMember, targetRole, channel, selectedOption, isDm);
    }

    public String interpolate(
            String text,
            Guild guild,
            Member clickingMember,
            Member targetMember,
            Role targetRole,
            MessageChannel channel,
            String selectedOption,
            boolean isDm) {

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
            String roleDisplay;
            if (isDm) {
                roleDisplay = "@" + roleName;
            } else {
                roleDisplay = targetRole.getAsMention() != null ? targetRole.getAsMention() : ("@" + roleName);
            }
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
}
