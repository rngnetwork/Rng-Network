package com.rng.server.listener;

import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.ResponseType;
import com.rng.embed.dto.ActionExecutionResult;
import com.rng.embed.service.ActionExecutionService;
import com.rng.embed.service.EmbedActionService;
import com.rng.embed.service.RedisRateLimiterService;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.components.Component.Type;
import net.dv8tion.jda.api.entities.IMentionable;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Mentions;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.events.channel.ChannelCreateEvent;
import net.dv8tion.jda.api.events.channel.ChannelDeleteEvent;
import net.dv8tion.jda.api.events.channel.update.GenericChannelUpdateEvent;
import net.dv8tion.jda.api.events.guild.GuildLeaveEvent;
import net.dv8tion.jda.api.events.guild.GuildReadyEvent;
import net.dv8tion.jda.api.events.guild.update.GenericGuildUpdateEvent;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.EntitySelectInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class DiscordGatewayEventListener extends ListenerAdapter {

    private final Optional<CacheManager> cacheManager;
    private final Optional<StringRedisTemplate> redisTemplate;
    private final Optional<RedisRateLimiterService> rateLimiterService;
    private final Optional<EmbedActionService> embedActionService;
    private final Optional<ActionExecutionService> actionExecutionService;

    public DiscordGatewayEventListener(CacheManager cacheManager) {
        this(cacheManager, null, null, null, null);
    }

    @Autowired
    public DiscordGatewayEventListener(
            @Autowired(required = false) CacheManager cacheManager,
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            @Autowired(required = false) RedisRateLimiterService rateLimiterService,
            @Autowired(required = false) EmbedActionService embedActionService,
            @Autowired(required = false) ActionExecutionService actionExecutionService) {
        this.cacheManager = Optional.ofNullable(cacheManager);
        this.redisTemplate = Optional.ofNullable(redisTemplate);
        this.rateLimiterService = Optional.ofNullable(rateLimiterService);
        this.embedActionService = Optional.ofNullable(embedActionService);
        this.actionExecutionService = Optional.ofNullable(actionExecutionService);
    }

    @Override
    public void onGenericGuildUpdate(@NotNull GenericGuildUpdateEvent<?> event) {
        String guildId = event.getGuild().getId();
        log.info("Discord Gateway Event: Guild {} updated", guildId);
        evictGuildCaches(guildId);
    }

    @Override
    public void onGuildLeave(@NotNull GuildLeaveEvent event) {
        String guildId = event.getGuild().getId();
        log.info("Discord Gateway Event: Left guild {}", guildId);
        evictGuildCaches(guildId);
    }

    @Override
    public void onGuildReady(@NotNull GuildReadyEvent event) {
        String guildId = event.getGuild().getId();
        log.info("Discord Gateway Event: Guild {} ready with {} members", guildId, event.getGuild().getMemberCount());
        evictGuildCaches(guildId);
    }

    @Override
    public void onChannelCreate(@NotNull ChannelCreateEvent event) {
        if (event.isFromGuild()) {
            String guildId = event.getGuild().getId();
            log.debug("Discord Gateway Event: Channel created in guild {}", guildId);
            evictGuildChannelsCache(guildId);
        }
    }

    @Override
    public void onChannelDelete(@NotNull ChannelDeleteEvent event) {
        if (event.isFromGuild()) {
            String guildId = event.getGuild().getId();
            log.debug("Discord Gateway Event: Channel deleted in guild {}", guildId);
            evictGuildChannelsCache(guildId);
        }
    }

    @Override
    public void onGenericChannelUpdate(@NotNull GenericChannelUpdateEvent<?> event) {
        if (event.isFromGuild()) {
            String guildId = event.getGuild().getId();
            log.debug("Discord Gateway Event: Channel updated in guild {}", guildId);
            evictGuildChannelsCache(guildId);
        }
    }

    public void evictGuildCaches(String guildId) {
        cacheManager.ifPresent(cm -> {
            Cache summaryCache = cm.getCache("guilds:summary");
            if (summaryCache != null) {
                summaryCache.clear();
            }
            Cache detailsCache = cm.getCache("guild:details");
            if (detailsCache != null && guildId != null) {
                detailsCache.evict(guildId);
            }
            Cache rolesCache = cm.getCache("guild:roles");
            if (rolesCache != null && guildId != null) {
                rolesCache.evict(guildId);
            }
        });
    }

    public void evictGuildChannelsCache(String guildId) {
        cacheManager.ifPresent(cm -> {
            Cache channelsCache = cm.getCache("guild:channels");
            if (channelsCache != null && guildId != null) {
                channelsCache.evict(guildId);
            }
        });
    }

    @Override
    public void onButtonInteraction(@NotNull ButtonInteractionEvent event) {
        String componentId = event.getComponentId();
        if (!componentId.startsWith("rng_act_")) {
            return;
        }

        String userId = event.getUser() != null ? event.getUser().getId() : "unknown";
        String userName = event.getUser() != null ? event.getUser().getName() : "unknown";
        String guildId = event.getGuild() != null ? event.getGuild().getId() : null;

        log.info("Gateway ButtonInteraction received: componentId='{}', user='{}' ({}), guild='{}'",
                componentId, userName, userId, guildId != null ? guildId : "none");

        if (event.getGuild() == null) {
            log.warn("ButtonInteraction '{}' rejected: interaction is outside of a guild.", componentId);
            event.reply("❌ Interactive actions are only supported inside a Discord server.").setEphemeral(true).queue();
            return;
        }

        // Pre-resolve action to determine ephemeral vs public acknowledgment
        Optional<EmbedAction> actionOpt = embedActionService.flatMap(eas -> eas.resolveAction(componentId));
        boolean isEphemeral = actionOpt.map(a -> {
            if (a.getResponseType() == ResponseType.PUBLIC_EMBED || a.getResponseType() == ResponseType.PUBLIC_TEXT) {
                return false;
            }
            if (a.getResponseType() == ResponseType.EPHEMERAL_EMBED || a.getResponseType() == ResponseType.EPHEMERAL_TEXT) {
                return true;
            }
            return a.isEphemeral();
        }).orElse(true);

        // Sub-50ms acknowledgment - guarantees Discord SLA window (<3000ms)
        event.deferReply(isEphemeral).queue();

        String messageId = event.getMessageId();

        // Sliding-window rate limit: 3 interactions per 5 seconds per member
        String rateLimitKey = "ratelimit:member:" + guildId + ":" + userId;
        boolean allowed = rateLimiterService
                .map(rl -> rl.tryAcquire(rateLimitKey, 3, 5000L))
                .orElse(true);

        if (!allowed) {
            event.getHook().editOriginal("⏳ Rate limit exceeded: Please wait a few seconds before interacting again.").queue();
            return;
        }

        if (embedActionService.isEmpty() || actionExecutionService.isEmpty()) {
            event.getHook().editOriginal("⚠️ Interactive action engine is temporarily unavailable.").queue();
            return;
        }

        if (actionOpt.isEmpty()) {
            event.getHook().editOriginal("❌ Action template not found or no longer active: " + componentId).queue();
            return;
        }

        EmbedAction action = actionOpt.get();
        Map<String, String> sessionData = getSessionData(guildId, userId, messageId);

        try {
            validateCallerIdentity(event, sessionData);
        } catch (IllegalStateException ex) {
            return;
        }

        boolean missingUser = action.isRequiredUser() && !sessionData.containsKey("target_user") && !sessionData.containsKey("targetUser");
        boolean missingRole = action.isRequiredRole() && !sessionData.containsKey("target_role") && !sessionData.containsKey("targetRole");

        if (missingUser && missingRole) {
            event.getHook().editOriginal("⚠️ Missing Required Selections: Please select both a target user and a target role before clicking this button.").queue();
            return;
        }
        if (missingUser) {
            event.getHook().editOriginal("⚠️ Missing Required Selections: Please select a target user before clicking this button.").queue();
            return;
        }
        if (missingRole) {
            event.getHook().editOriginal("⚠️ Missing Required Selections: Please select a target role before clicking this button.").queue();
            return;
        }

        Member member = event.getMember();
        if (member == null && event.getGuild() != null && event.getUser() != null) {
            try {
                member = event.getGuild().retrieveMember(event.getUser()).complete();
            } catch (Exception e) {
                log.warn("Failed to retrieve member {} in guild {}: {}", event.getUser().getId(), event.getGuild().getId(), e.getMessage());
            }
        }

        ActionExecutionResult result = null;
        try {
            if (action.getCompoundOperations() != null && !action.getCompoundOperations().isEmpty()) {
                result = actionExecutionService.get().executeCompoundAction(componentId, event.getGuild(), member, event.getHook(), sessionData);
            } else if (action.getResponseType() == ResponseType.PUBLIC_EMBED || action.getResponseType() == ResponseType.PUBLIC_TEXT || (action.getResponseEmbedTemplateId() != null && !action.getResponseEmbedTemplateId().isBlank())) {
                result = actionExecutionService.get().executeComponentAction(componentId, event.getGuild(), member, event.getHook(), sessionData);
            } else {
                actionExecutionService.get().executeButtonAction(event, action, sessionData);
            }
        } catch (Exception e) {
            log.error("Error executing button action {}: {}", componentId, e.getMessage(), e);
            if (event.getHook() != null) {
                event.getHook().editOriginal("❌ Error executing action: " + e.getMessage()).queue();
            }
            return;
        }

        if (result != null) {
            if (!result.isSuccess()) {
                if (event.getHook() != null) {
                    String msg = result.getErrorMessage() != null ? result.getErrorMessage() : result.getMessage();
                    event.getHook().editOriginal("❌ Action failed: " + (msg != null ? msg : "Unknown error")).queue();
                }
            } else if (!result.isTerminal() && result.getNewGeneratedMessageId() != null) {
                carryoverSession(guildId, event.getChannel().getId(), userId, messageId, result.getNewGeneratedMessageId(), sessionData);
            }
        }
    }

    public void validateCallerIdentity(ButtonInteractionEvent event, Map<String, String> sessionData) {
        if (sessionData == null) {
            return;
        }
        String originCaller = sessionData.getOrDefault("originCaller", sessionData.get("origin_caller"));
        if (originCaller != null && !originCaller.isBlank()) {
            String currentUserId = event.getUser() != null ? event.getUser().getId() : "";
            if (!originCaller.equals(currentUserId)) {
                Member member = event.getMember();
                boolean isAdmin = member != null && member.hasPermission(Permission.ADMINISTRATOR);
                if (!isAdmin) {
                    if (event.getHook() != null) {
                        event.getHook().editOriginal("❌ Only the operator who initiated this action can execute subsequent steps.").queue();
                    }
                    throw new IllegalStateException("Caller identity mismatch: caller is not origin caller");
                }
            }
        }
    }

    public void carryoverSession(String guildId, String channelId, String userId, String oldMsgId, String newMsgId, Map<String, String> sessionData) {
        if (redisTemplate.isEmpty() || sessionData == null || sessionData.isEmpty()) {
            return;
        }
        try {
            String sessionKey = "interaction:session:" + guildId + ":" + userId + ":" + newMsgId;
            redisTemplate.get().opsForHash().putAll(sessionKey, sessionData);
            redisTemplate.get().expire(sessionKey, Duration.ofMinutes(15));
        } catch (Exception e) {
            log.warn("Failed to carryover session state to message {}: {}", newMsgId, e.getMessage());
        }
    }

    @Override
    public void onStringSelectInteraction(@NotNull StringSelectInteractionEvent event) {
        String componentId = event.getComponentId();
        List<String> values = event.getValues();
        String firstValue = values.isEmpty() ? null : values.get(0);

        boolean isActionComponent = componentId.startsWith("rng_act_");
        boolean isActionOption = firstValue != null && firstValue.startsWith("rng_act_");

        String userId = event.getUser() != null ? event.getUser().getId() : "unknown";
        String userName = event.getUser() != null ? event.getUser().getName() : "unknown";
        String guildId = event.getGuild() != null ? event.getGuild().getId() : null;

        if (isActionComponent || isActionOption) {
            log.info("Gateway StringSelectInteraction (Action) received: componentId='{}', value='{}', user='{}' ({}), guild='{}'",
                    componentId, firstValue, userName, userId, guildId != null ? guildId : "none");

            if (event.getGuild() == null) {
                log.warn("StringSelectInteraction '{}' rejected: interaction is outside of a guild.", componentId);
                event.reply("❌ Interactive actions are only supported inside a Discord server.").setEphemeral(true).queue();
                return;
            }

            String actionId = isActionOption ? firstValue : componentId;
            Optional<EmbedAction> actionOpt = embedActionService.flatMap(eas -> eas.resolveAction(actionId));
            boolean isEphemeral = actionOpt.map(a -> {
                if (a.getResponseType() == ResponseType.PUBLIC_EMBED || a.getResponseType() == ResponseType.PUBLIC_TEXT) {
                    return false;
                }
                if (a.getResponseType() == ResponseType.EPHEMERAL_EMBED || a.getResponseType() == ResponseType.EPHEMERAL_TEXT) {
                    return true;
                }
                return a.isEphemeral();
            }).orElse(true);

            // Immediate sub-50ms acknowledgment
            event.deferReply(isEphemeral).queue();

            String messageId = event.getMessageId();

            String rateLimitKey = "ratelimit:member:" + guildId + ":" + userId;
            boolean allowed = rateLimiterService
                    .map(rl -> rl.tryAcquire(rateLimitKey, 3, 5000L))
                    .orElse(true);

            if (!allowed) {
                event.getHook().editOriginal("⏳ Rate limit exceeded: Please wait a few seconds before interacting again.").queue();
                return;
            }

            if (embedActionService.isEmpty() || actionExecutionService.isEmpty()) {
                event.getHook().editOriginal("⚠️ Interactive action engine is temporarily unavailable.").queue();
                return;
            }

            if (actionOpt.isEmpty()) {
                event.getHook().editOriginal("❌ Action template not found or no longer active: " + actionId).queue();
                return;
            }

            EmbedAction action = actionOpt.get();
            Map<String, String> sessionData = getSessionData(guildId, userId, messageId);

            if (action.isRequiredUser() && !sessionData.containsKey("target_user")) {
                event.getHook().editOriginal("⚠️ Missing Required Selections: Please select a target user before submitting this selection.").queue();
                return;
            }
            if (action.isRequiredRole() && !sessionData.containsKey("target_role")) {
                event.getHook().editOriginal("⚠️ Missing Required Selections: Please select a target role before submitting this selection.").queue();
                return;
            }

            actionExecutionService.get().executeStringSelectAction(event, action, sessionData);
        } else if (isHandledSelectComponent(componentId, event.getMessage(), event.getJDA())) {
            log.info("Gateway StringSelectInteraction (Intermediate) received: componentId='{}', values='{}', user='{}' ({}), guild='{}'",
                    componentId, values, userName, userId, guildId != null ? guildId : "none");

            if (event.getGuild() == null) {
                return;
            }

            // Intermediate select menu in multi-select chained workflow
            event.deferEdit().queue();

            String messageId = event.getMessageId();
            String sessionKey = "interaction:session:" + guildId + ":" + userId + ":" + messageId;

            redisTemplate.ifPresent(rt -> {
                try {
                    if (firstValue != null) {
                        rt.opsForHash().put(sessionKey, "selected_option", firstValue);
                        rt.opsForHash().put(sessionKey, "selected_options", String.join(",", values));
                        rt.opsForHash().put(sessionKey, "last_updated", String.valueOf(System.currentTimeMillis()));
                        rt.expire(sessionKey, Duration.ofMinutes(15));
                    }
                } catch (Exception e) {
                    log.warn("Failed to update Redis session for string select: {}", e.getMessage());
                }
            });
        }
    }

    @Override
    public void onEntitySelectInteraction(@NotNull EntitySelectInteractionEvent event) {
        String componentId = event.getComponentId();
        if (!isHandledSelectComponent(componentId, event.getMessage(), event.getJDA())) {
            return;
        }

        String userId = event.getUser() != null ? event.getUser().getId() : "unknown";
        String userName = event.getUser() != null ? event.getUser().getName() : "unknown";
        String guildId = event.getGuild() != null ? event.getGuild().getId() : null;

        log.info("Gateway EntitySelectInteraction received: componentId='{}', user='{}' ({}), guild='{}'",
                componentId, userName, userId, guildId != null ? guildId : "none");

        if (event.getGuild() == null) {
            return;
        }

        // Sub-50ms silent acknowledgment
        event.deferEdit().queue();

        String messageId = event.getMessageId();
        String sessionKey = "interaction:session:" + guildId + ":" + userId + ":" + messageId;

        redisTemplate.ifPresent(rt -> {
            try {
                Mentions mentions = event.getMentions();
                List<IMentionable> values = event.getValues();
                Type type = event.getComponentType();

                String targetUserId = null;
                String targetRoleId = null;
                String targetChannelId = null;

                // 1. Target User Resolution (users, members, or user select values)
                if (mentions != null && !mentions.getUsers().isEmpty()) {
                    targetUserId = mentions.getUsers().get(0).getId();
                } else if (mentions != null && !mentions.getMembers().isEmpty()) {
                    targetUserId = mentions.getMembers().get(0).getId();
                } else if (type == Type.USER_SELECT && values != null && !values.isEmpty()) {
                    targetUserId = values.get(0).getId();
                }

                // 2. Target Role Resolution (roles or role select values)
                if (mentions != null && !mentions.getRoles().isEmpty()) {
                    targetRoleId = mentions.getRoles().get(0).getId();
                } else if (type == Type.ROLE_SELECT && values != null && !values.isEmpty()) {
                    targetRoleId = values.get(0).getId();
                }

                // 3. Target Channel Resolution (channels or channel select values)
                if (mentions != null && !mentions.getChannels().isEmpty()) {
                    targetChannelId = mentions.getChannels().get(0).getId();
                } else if (type == Type.CHANNEL_SELECT && values != null && !values.isEmpty()) {
                    targetChannelId = values.get(0).getId();
                }

                // 4. Mentionable Select (Type 7) fallback
                if (type == Type.MENTIONABLE_SELECT && values != null && !values.isEmpty()) {
                    IMentionable val = values.get(0);
                    if (val instanceof Role) {
                        targetRoleId = val.getId();
                    } else {
                        targetUserId = val.getId();
                    }
                }

                if (targetUserId != null) {
                    rt.opsForHash().put(sessionKey, "target_user", targetUserId);
                    rt.opsForHash().put(sessionKey, "targetUser", targetUserId);
                    log.info("Persisted target_user '{}' in Redis session key '{}'", targetUserId, sessionKey);
                }
                if (targetRoleId != null) {
                    rt.opsForHash().put(sessionKey, "target_role", targetRoleId);
                    rt.opsForHash().put(sessionKey, "targetRole", targetRoleId);
                    log.info("Persisted target_role '{}' in Redis session key '{}'", targetRoleId, sessionKey);
                }
                if (targetChannelId != null) {
                    rt.opsForHash().put(sessionKey, "target_channel", targetChannelId);
                    rt.opsForHash().put(sessionKey, "targetChannel", targetChannelId);
                    log.info("Persisted target_channel '{}' in Redis session key '{}'", targetChannelId, sessionKey);
                }

                rt.opsForHash().put(sessionKey, "originCaller", userId);
                rt.opsForHash().put(sessionKey, "origin_caller", userId);
                rt.opsForHash().put(sessionKey, "last_updated", String.valueOf(System.currentTimeMillis()));
                rt.expire(sessionKey, Duration.ofMinutes(15));
            } catch (Exception e) {
                log.warn("Failed to persist entity select interaction session in Redis: {}", e.getMessage());
            }
        });
    }

    public boolean isHandledSelectComponent(String componentId, Message message, net.dv8tion.jda.api.JDA jda) {
        if (componentId != null && (componentId.startsWith("rng_") || componentId.startsWith("select_") || componentId.startsWith("sel_"))) {
            return true;
        }
        if (message != null && jda != null && jda.getSelfUser() != null && message.getAuthor() != null) {
            return message.getAuthor().getIdLong() == jda.getSelfUser().getIdLong();
        }
        return false;
    }

    private Map<String, String> getSessionData(String guildId, String userId, String messageId) {
        String sessionKey = "interaction:session:" + guildId + ":" + userId + ":" + messageId;
        return redisTemplate.map(rt -> {
            try {
                Map<Object, Object> raw = rt.opsForHash().entries(sessionKey);
                if (raw == null || raw.isEmpty()) {
                    return Collections.<String, String>emptyMap();
                }
                Map<String, String> result = new HashMap<>();
                raw.forEach((k, v) -> result.put(String.valueOf(k), String.valueOf(v)));
                return result;
            } catch (Exception e) {
                log.warn("Failed to read Redis session data: {}", e.getMessage());
                return Collections.<String, String>emptyMap();
            }
        }).orElse(Collections.emptyMap());
    }
}
