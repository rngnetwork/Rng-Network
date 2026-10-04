package com.rng.server.listener;

import com.rng.embed.domain.EmbedAction;
import com.rng.embed.service.ActionExecutionService;
import com.rng.embed.service.EmbedActionService;
import com.rng.embed.service.RedisRateLimiterService;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.entities.Mentions;
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
    @SuppressWarnings("rawtypes")
    public void onGenericGuildUpdate(@NotNull GenericGuildUpdateEvent event) {
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
    @SuppressWarnings("rawtypes")
    public void onGenericChannelUpdate(@NotNull GenericChannelUpdateEvent event) {
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

        // Sub-50ms ephemeral acknowledgment - guarantees Discord SLA window (<3000ms)
        event.deferReply(true).queue();

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

        Optional<EmbedAction> actionOpt = embedActionService.get().resolveAction(componentId);
        if (actionOpt.isEmpty()) {
            event.getHook().editOriginal("❌ Action template not found or no longer active: " + componentId).queue();
            return;
        }

        EmbedAction action = actionOpt.get();
        Map<String, String> sessionData = getSessionData(guildId, userId, messageId);

        if (action.isRequiredUser() && !sessionData.containsKey("target_user")) {
            event.getHook().editOriginal("⚠️ Missing Required Selections: Please select a target user before clicking this button.").queue();
            return;
        }
        if (action.isRequiredRole() && !sessionData.containsKey("target_role")) {
            event.getHook().editOriginal("⚠️ Missing Required Selections: Please select a target role before clicking this button.").queue();
            return;
        }

        actionExecutionService.get().executeButtonAction(event, action, sessionData);
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

            // Immediate sub-50ms ephemeral acknowledgment
            event.deferReply(true).queue();

            String actionId = isActionOption ? firstValue : componentId;
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

            Optional<EmbedAction> actionOpt = embedActionService.get().resolveAction(actionId);
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
        } else if (componentId.startsWith("rng_")) {
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
        if (!componentId.startsWith("rng_")) {
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
                if (!mentions.getUsers().isEmpty()) {
                    rt.opsForHash().put(sessionKey, "target_user", mentions.getUsers().get(0).getId());
                }
                if (!mentions.getRoles().isEmpty()) {
                    rt.opsForHash().put(sessionKey, "target_role", mentions.getRoles().get(0).getId());
                }
                if (!mentions.getChannels().isEmpty()) {
                    rt.opsForHash().put(sessionKey, "target_channel", mentions.getChannels().get(0).getId());
                }
                rt.opsForHash().put(sessionKey, "last_updated", String.valueOf(System.currentTimeMillis()));
                rt.expire(sessionKey, Duration.ofMinutes(15));
            } catch (Exception e) {
                log.warn("Failed to persist entity select interaction session in Redis: {}", e.getMessage());
            }
        });
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
