package com.rng.server.listener;

import com.rng.embed.domain.ActionPayload;
import com.rng.embed.domain.ActionType;
import com.rng.embed.dto.EmbedActionDto;
import com.rng.embed.service.EmbedActionService;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.Category;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.events.channel.ChannelCreateEvent;
import net.dv8tion.jda.api.events.channel.ChannelDeleteEvent;
import net.dv8tion.jda.api.events.channel.update.GenericChannelUpdateEvent;
import net.dv8tion.jda.api.events.guild.GuildLeaveEvent;
import net.dv8tion.jda.api.events.guild.GuildReadyEvent;
import net.dv8tion.jda.api.events.guild.update.GenericGuildUpdateEvent;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.requests.restaction.ChannelAction;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
public class DiscordGatewayEventListener extends ListenerAdapter {

    private final Optional<CacheManager> cacheManager;
    private final Optional<EmbedActionService> actionService;
    private final Optional<StringRedisTemplate> redisTemplate;

    @Autowired
    public DiscordGatewayEventListener(
            @Autowired(required = false) CacheManager cacheManager,
            @Autowired(required = false) EmbedActionService actionService,
            @Autowired(required = false) StringRedisTemplate redisTemplate
    ) {
        this.cacheManager = Optional.ofNullable(cacheManager);
        this.actionService = Optional.ofNullable(actionService);
        this.redisTemplate = Optional.ofNullable(redisTemplate);
    }

    public DiscordGatewayEventListener() {
        this(null, null, null);
    }

    public DiscordGatewayEventListener(CacheManager cacheManager) {
        this(cacheManager, null, null);
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

    @Override
    public void onButtonInteraction(@NotNull ButtonInteractionEvent event) {
        String customId = event.getComponentId();
        if (customId == null || !customId.startsWith("rng_act_")) {
            return;
        }

        if (actionService.isEmpty() || event.getGuild() == null || event.getMember() == null) {
            return;
        }

        String guildId = event.getGuild().getId();
        EmbedActionDto action = resolveAction(guildId, customId);
        if (action == null) {
            event.deferReply(true).queue(h -> h.editOriginal("❌ Action configuration not found.").queue());
            return;
        }

        // Discord Invariant: replyModal cannot follow deferReply
        if (action.actionType() == ActionType.MODAL) {
            log.info("Modal action requested on button interaction: {}", customId);
            return;
        }

        // Sub-50ms acknowledgement
        event.deferReply(true).queue(hook -> {
            executeAction(action, event.getGuild(), event.getMember(), event.getUser(), hook);
        });
    }

    @Override
    public void onStringSelectInteraction(@NotNull StringSelectInteractionEvent event) {
        if (actionService.isEmpty() || event.getGuild() == null || event.getMember() == null) {
            return;
        }

        String actionId = event.getValues().stream()
                .filter(v -> v.startsWith("rng_act_"))
                .findFirst()
                .orElse(null);

        if (actionId == null) {
            return;
        }

        String guildId = event.getGuild().getId();
        EmbedActionDto action = resolveAction(guildId, actionId);
        if (action == null) {
            event.deferReply(true).queue(h -> h.editOriginal("❌ Action configuration not found.").queue());
            return;
        }

        event.deferReply(true).queue(hook -> {
            executeAction(action, event.getGuild(), event.getMember(), event.getUser(), hook);
        });
    }

    private EmbedActionDto resolveAction(String guildId, String actionId) {
        if (actionService.isEmpty()) return null;
        try {
            return actionService.get().getAction(guildId, actionId);
        } catch (Exception e) {
            return actionService.get().findActionByIdOnly(actionId).orElse(null);
        }
    }

    private void executeAction(EmbedActionDto action, Guild guild, Member member, User user, InteractionHook hook) {
        // Enforce member sliding-window rate limit (3 per 5 seconds)
        if (!checkMemberRateLimit(guild.getId(), member.getId())) {
            hook.editOriginal("⚠️ You are interacting too quickly. Please wait a moment.").queue();
            return;
        }

        ActionPayload payload = action.payload();
        if (payload == null) {
            hook.editOriginal("❌ Empty action configuration.").queue();
            return;
        }

        switch (action.actionType()) {
            case ROLE -> handleRoleAction(payload, guild, member, hook);
            case REPLY -> handleReplyAction(payload, guild, user, hook);
            case TICKET -> handleTicketAction(payload, guild, member, user, hook);
            case DM -> handleDmAction(payload, guild, user, hook);
            default -> hook.editOriginal("✅ Interaction acknowledged.").queue();
        }
    }

    private void handleRoleAction(ActionPayload payload, Guild guild, Member member, InteractionHook hook) {
        Member selfMember = guild.getSelfMember();
        if (selfMember == null || !selfMember.hasPermission(Permission.MANAGE_ROLES)) {
            hook.editOriginal("❌ Bot configuration error: Bot lacks 'Manage Roles' permission on this server.").queue();
            return;
        }

        if (payload.getRoleId() == null || payload.getRoleId().isBlank()) {
            hook.editOriginal("❌ Target role ID is not configured.").queue();
            return;
        }

        Role role = guild.getRoleById(payload.getRoleId());
        if (role == null) {
            hook.editOriginal("❌ Target role not found on server.").queue();
            return;
        }

        if (role.isManaged()) {
            hook.editOriginal("❌ Role @" + role.getName() + " is an integrated bot role and cannot be manually assigned.").queue();
            return;
        }

        if (!selfMember.canInteract(role)) {
            hook.editOriginal("❌ Bot hierarchy error: Cannot manage role @" + role.getName() + " because it is above the bot's highest role.").queue();
            return;
        }

        String subtype = payload.getRoleSubtype() != null ? payload.getRoleSubtype().toUpperCase() : "TOGGLE";
        boolean hasRole = member.getRoles().contains(role);

        if ("TOGGLE".equals(subtype)) {
            if (hasRole) {
                removeRole(guild, member, role, payload, hook);
            } else {
                addRole(guild, member, role, payload, hook);
            }
        } else if ("ADD".equals(subtype)) {
            if (hasRole) {
                hook.editOriginal("ℹ️ You already have the role @" + role.getName() + ".").queue();
            } else {
                addRole(guild, member, role, payload, hook);
            }
        } else if ("REMOVE".equals(subtype)) {
            if (!hasRole) {
                hook.editOriginal("ℹ️ You do not have the role @" + role.getName() + ".").queue();
            } else {
                removeRole(guild, member, role, payload, hook);
            }
        }
    }

    private void addRole(Guild guild, Member member, Role role, ActionPayload payload, InteractionHook hook) {
        guild.addRoleToMember(member, role).queue(
                v -> {
                    String msg = payload.getSuccessMessage() != null && !payload.getSuccessMessage().isBlank()
                            ? payload.getSuccessMessage()
                            : "Role **" + role.getName() + "** has been added to your account!";
                    hook.editOriginal(msg).queue();
                },
                err -> hook.editOriginal("❌ Failed to assign role: " + err.getMessage()).queue()
        );
    }

    private void removeRole(Guild guild, Member member, Role role, ActionPayload payload, InteractionHook hook) {
        guild.removeRoleFromMember(member, role).queue(
                v -> {
                    String msg = payload.getRemoveMessage() != null && !payload.getRemoveMessage().isBlank()
                            ? payload.getRemoveMessage()
                            : "Role **" + role.getName() + "** has been removed from your account.";
                    hook.editOriginal(msg).queue();
                },
                err -> hook.editOriginal("❌ Failed to remove role: " + err.getMessage()).queue()
        );
    }

    private void handleReplyAction(ActionPayload payload, Guild guild, User user, InteractionHook hook) {
        String content = payload.getReplyContent() != null && !payload.getReplyContent().isBlank()
                ? payload.getReplyContent()
                : "Action acknowledged.";

        content = content.replace("{user}", user.getAsMention())
                .replace("{username}", user.getName())
                .replace("{server}", guild.getName());

        hook.editOriginal(content).queue();
    }

    private void handleTicketAction(ActionPayload payload, Guild guild, Member member, User user, InteractionHook hook) {
        Member selfMember = guild.getSelfMember();
        if (selfMember == null || !selfMember.hasPermission(Permission.MANAGE_CHANNEL)) {
            hook.editOriginal("❌ Bot configuration error: Bot lacks 'Manage Channels' permission on this server.").queue();
            return;
        }

        String prefix = payload.getChannelPrefix() != null && !payload.getChannelPrefix().isBlank()
                ? payload.getChannelPrefix()
                : "ticket-";
        String channelName = (prefix + user.getName()).toLowerCase().replaceAll("[^a-z0-9-]", "-");

        Optional<TextChannel> existing = guild.getTextChannels().stream()
                .filter(c -> c.getName().equals(channelName))
                .findFirst();

        if (existing.isPresent()) {
            hook.editOriginal("ℹ️ You already have an active ticket channel: " + existing.get().getAsMention()).queue();
            return;
        }

        ChannelAction<TextChannel> channelAction = guild.createTextChannel(channelName);
        if (payload.getCategoryId() != null && !payload.getCategoryId().isBlank()) {
            Category category = guild.getCategoryById(payload.getCategoryId());
            if (category != null) {
                channelAction.setParent(category);
            }
        }

        channelAction.addRolePermissionOverride(guild.getPublicRole().getIdLong(), null, EnumSet.of(Permission.VIEW_CHANNEL))
                .addMemberPermissionOverride(member.getIdLong(),
                        EnumSet.of(Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND, Permission.MESSAGE_ATTACH_FILES, Permission.MESSAGE_HISTORY),
                        null);

        if (payload.getSupportRoleIds() != null) {
            for (String sRoleId : payload.getSupportRoleIds()) {
                Role sRole = guild.getRoleById(sRoleId);
                if (sRole != null) {
                    channelAction.addRolePermissionOverride(sRole.getIdLong(),
                            EnumSet.of(Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND, Permission.MESSAGE_ATTACH_FILES, Permission.MESSAGE_HISTORY, Permission.MESSAGE_MANAGE),
                            null);
                }
            }
        }

        channelAction.queue(
                ch -> {
                    String welcomeMsg = payload.getWelcomeMessage() != null && !payload.getWelcomeMessage().isBlank()
                            ? payload.getWelcomeMessage()
                            : "Welcome to your support ticket! Support staff will assist you shortly.";
                    ch.sendMessage(user.getAsMention() + " " + welcomeMsg).queue();
                    hook.editOriginal("✅ Support ticket created: " + ch.getAsMention()).queue();
                },
                err -> hook.editOriginal("❌ Failed to create ticket channel: " + err.getMessage()).queue()
        );
    }

    private void handleDmAction(ActionPayload payload, Guild guild, User user, InteractionHook hook) {
        String dmText = payload.getDmContent() != null && !payload.getDmContent().isBlank()
                ? payload.getDmContent()
                : "Direct message from " + guild.getName();

        user.openPrivateChannel().queue(
                pc -> pc.sendMessage(dmText).queue(
                        msg -> hook.editOriginal("✅ A direct message has been sent to your private inbox.").queue(),
                        err -> hook.editOriginal("❌ Could not send DM. Please enable direct messages from server members in your privacy settings.").queue()
                ),
                err -> hook.editOriginal("❌ Could not open direct message channel. Please check your privacy settings.").queue()
        );
    }

    private boolean checkMemberRateLimit(String guildId, String memberId) {
        if (redisTemplate.isEmpty()) return true;
        try {
            String key = "ratelimit:member:" + guildId + ":" + memberId;
            long now = System.currentTimeMillis();
            long window = 5000L;
            int limit = 3;

            ZSetOperations<String, String> zset = redisTemplate.get().opsForZSet();
            zset.removeRangeByScore(key, 0, now - window);
            Long current = zset.zCard(key);
            if (current != null && current >= limit) {
                return false;
            }
            zset.add(key, UUID.randomUUID().toString(), now);
            redisTemplate.get().expire(key, Duration.ofSeconds(15));
            return true;
        } catch (Exception e) {
            log.warn("Rate limit check failed, allowing interaction: {}", e.getMessage());
            return true;
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

    public void evictGuildRolesCache(String guildId) {
        cacheManager.ifPresent(cm -> {
            Cache rolesCache = cm.getCache("guild:roles");
            if (rolesCache != null && guildId != null) {
                rolesCache.evict(guildId);
            }
        });
    }
}
