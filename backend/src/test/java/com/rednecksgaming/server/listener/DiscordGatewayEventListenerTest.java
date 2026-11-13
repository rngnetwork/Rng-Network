// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.server.listener;

import com.rednecksgaming.embed.domain.ActionType;
import com.rednecksgaming.embed.domain.CompoundOperation;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.ResponseType;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.service.ActionExecutionService;
import com.rednecksgaming.embed.service.EmbedActionService;
import com.rednecksgaming.embed.service.RedisRateLimiterService;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.components.Component;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.IMentionable;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Mentions;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.SelfUser;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.middleman.GuildChannel;
import net.dv8tion.jda.api.events.channel.ChannelCreateEvent;
import net.dv8tion.jda.api.events.channel.ChannelDeleteEvent;
import net.dv8tion.jda.api.events.channel.update.GenericChannelUpdateEvent;
import net.dv8tion.jda.api.events.guild.GuildLeaveEvent;
import net.dv8tion.jda.api.events.guild.GuildReadyEvent;
import net.dv8tion.jda.api.events.guild.update.GenericGuildUpdateEvent;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.EntitySelectInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.requests.RestAction;
import net.dv8tion.jda.api.requests.restaction.CacheRestAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageEditAction;
import net.dv8tion.jda.api.requests.restaction.interactions.MessageEditCallbackAction;
import net.dv8tion.jda.api.requests.restaction.interactions.ReplyCallbackAction;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscordGatewayEventListenerTest {

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache cache;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private HashOperations<String, Object, Object> hashOperations;

    @Mock
    private RedisRateLimiterService rateLimiterService;

    @Mock
    private EmbedActionService embedActionService;

    @Mock
    private ActionExecutionService actionExecutionService;

    @Mock
    private ButtonInteractionEvent buttonEvent;

    @Mock
    private StringSelectInteractionEvent stringSelectEvent;

    @Mock
    private EntitySelectInteractionEvent entitySelectEvent;

    @Mock
    private ReplyCallbackAction replyCallbackAction;

    @Mock
    private MessageEditCallbackAction editCallbackAction;

    @Mock
    private WebhookMessageEditAction<net.dv8tion.jda.api.entities.Message> webhookMessageEditAction;

    @Mock
    private InteractionHook hook;

    @Mock
    private Guild guild;

    @Mock
    private Member member;

    @Mock
    private User user;

    @Mock
    private Mentions mentions;

    @Mock
    private User targetUser;

    @Mock
    private Role targetRole;

    @Mock
    private GuildChannel targetChannel;

    private DiscordGatewayEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new DiscordGatewayEventListener(
                cacheManager,
                redisTemplate,
                rateLimiterService,
                embedActionService,
                actionExecutionService
        );

        lenient().when(buttonEvent.getGuild()).thenReturn(guild);
        lenient().when(buttonEvent.getMember()).thenReturn(member);
        lenient().when(buttonEvent.getUser()).thenReturn(user);
        lenient().when(buttonEvent.getMessageId()).thenReturn("msg_123");
        lenient().when(buttonEvent.deferReply(true)).thenReturn(replyCallbackAction);
        lenient().when(buttonEvent.deferReply(false)).thenReturn(replyCallbackAction);
        lenient().when(buttonEvent.getHook()).thenReturn(hook);

        lenient().when(stringSelectEvent.getGuild()).thenReturn(guild);
        lenient().when(stringSelectEvent.getMember()).thenReturn(member);
        lenient().when(stringSelectEvent.getUser()).thenReturn(user);
        lenient().when(stringSelectEvent.getMessageId()).thenReturn("msg_123");
        lenient().when(stringSelectEvent.deferReply(true)).thenReturn(replyCallbackAction);
        lenient().when(stringSelectEvent.deferReply(false)).thenReturn(replyCallbackAction);
        lenient().when(stringSelectEvent.deferEdit()).thenReturn(editCallbackAction);
        lenient().when(stringSelectEvent.getHook()).thenReturn(hook);

        lenient().when(entitySelectEvent.getGuild()).thenReturn(guild);
        lenient().when(entitySelectEvent.getMember()).thenReturn(member);
        lenient().when(entitySelectEvent.getUser()).thenReturn(user);
        lenient().when(entitySelectEvent.getMessageId()).thenReturn("msg_123");
        lenient().when(entitySelectEvent.deferEdit()).thenReturn(editCallbackAction);
        lenient().when(entitySelectEvent.getMentions()).thenReturn(mentions);

        lenient().when(guild.getId()).thenReturn("guild_1");
        lenient().when(user.getId()).thenReturn("user_1");

        lenient().when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        lenient().when(rateLimiterService.tryAcquire(anyString(), anyInt(), anyLong())).thenReturn(true);
        lenient().when(hook.editOriginal(anyString())).thenReturn(webhookMessageEditAction);
    }

    @Test
    @DisplayName("onButtonInteraction ignores non-rng component IDs")
    void onButtonInteraction_ignoresNonMatchingId() {
        when(buttonEvent.getComponentId()).thenReturn("other_button");

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent, never()).deferReply(anyBoolean());
        verify(actionExecutionService, never()).executeButtonAction(any(), any(), any());
    }

    @Test
    @DisplayName("onButtonInteraction responds with rate limit warning when rate limit is exceeded")
    void onButtonInteraction_rateLimitExceeded() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_role_1");
        when(rateLimiterService.tryAcquire("ratelimit:member:guild_1:user_1", 3, 5000L)).thenReturn(false);

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).deferReply(true);
        verify(hook).editOriginal(contains("Rate limit exceeded"));
        verify(actionExecutionService, never()).executeButtonAction(any(), any(), any());
    }

    @Test
    @DisplayName("onButtonInteraction responds when action template is not found")
    void onButtonInteraction_actionNotFound() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_missing");
        when(embedActionService.resolveAction("rng_act_missing")).thenReturn(Optional.empty());

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).deferReply(true);
        verify(hook).editOriginal(contains("Action template not found"));
        verify(actionExecutionService, never()).executeButtonAction(any(), any(), any());
    }

    @Test
    @DisplayName("onButtonInteraction enforces required user selection from Redis session")
    void onButtonInteraction_missingRequiredUser() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_role_1");
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_1")
                .actionType(ActionType.ROLE)
                .requiredUser(true)
                .build();
        when(embedActionService.resolveAction("rng_act_role_1")).thenReturn(Optional.of(action));
        when(hashOperations.entries("interaction:session:guild_1:user_1:msg_123")).thenReturn(Collections.emptyMap());

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).deferReply(true);
        verify(hook).editOriginal(contains("Missing Required Selections: Please select a target user"));
        verify(actionExecutionService, never()).executeButtonAction(any(), any(), any());
    }

    @Test
    @DisplayName("onButtonInteraction executes button action when all preconditions are satisfied")
    void onButtonInteraction_success() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_role_1");
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_1")
                .actionType(ActionType.ROLE)
                .requiredUser(true)
                .build();
        when(embedActionService.resolveAction("rng_act_role_1")).thenReturn(Optional.of(action));

        Map<Object, Object> session = new HashMap<>();
        session.put("target_user", "target_user_99");
        when(hashOperations.entries("interaction:session:guild_1:user_1:msg_123")).thenReturn(session);

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).deferReply(true);
        verify(actionExecutionService).executeButtonAction(eq(buttonEvent), eq(action), argThat(map -> "target_user_99".equals(map.get("target_user"))));
    }

    @Test
    @DisplayName("onEntitySelectInteraction records user, role, and channel selections into Redis session")
    void onEntitySelectInteraction_storesSession() {
        when(entitySelectEvent.getComponentId()).thenReturn("rng_sel_entities");
        when(mentions.getUsers()).thenReturn(List.of(targetUser));
        when(targetUser.getId()).thenReturn("usr_target_1");
        when(mentions.getRoles()).thenReturn(List.of(targetRole));
        when(targetRole.getId()).thenReturn("role_target_1");
        when(mentions.getChannels()).thenReturn(List.of(targetChannel));
        when(targetChannel.getId()).thenReturn("chan_target_1");

        listener.onEntitySelectInteraction(entitySelectEvent);

        verify(entitySelectEvent).deferEdit();
        String sessionKey = "interaction:session:guild_1:user_1:msg_123";
        verify(hashOperations).put(sessionKey, "target_user", "usr_target_1");
        verify(hashOperations).put(sessionKey, "target_role", "role_target_1");
        verify(hashOperations).put(sessionKey, "target_channel", "chan_target_1");
        verify(redisTemplate).expire(eq(sessionKey), eq(Duration.ofMinutes(15)));
    }

    @Test
    @DisplayName("onEntitySelectInteraction supports select_ prefix and extracts user via member fallback")
    void onEntitySelectInteraction_supportsSelectPrefixAndMemberFallback() {
        when(entitySelectEvent.getComponentId()).thenReturn("select_1728237999");
        when(mentions.getUsers()).thenReturn(Collections.emptyList());
        Member targetMember = mock(Member.class);
        when(targetMember.getId()).thenReturn("usr_bot_member_1");
        when(mentions.getMembers()).thenReturn(List.of(targetMember));
        when(mentions.getRoles()).thenReturn(Collections.emptyList());
        when(mentions.getChannels()).thenReturn(Collections.emptyList());

        listener.onEntitySelectInteraction(entitySelectEvent);

        verify(entitySelectEvent).deferEdit();
        String sessionKey = "interaction:session:guild_1:user_1:msg_123";
        verify(hashOperations).put(sessionKey, "target_user", "usr_bot_member_1");
        verify(redisTemplate).expire(eq(sessionKey), eq(Duration.ofMinutes(15)));
    }

    @Test
    @DisplayName("onEntitySelectInteraction resolves user directly via values when USER_SELECT type")
    void onEntitySelectInteraction_resolvesUserViaValues() {
        when(entitySelectEvent.getComponentId()).thenReturn("rng_sel_user");
        when(mentions.getUsers()).thenReturn(Collections.emptyList());
        when(mentions.getMembers()).thenReturn(Collections.emptyList());
        when(mentions.getRoles()).thenReturn(Collections.emptyList());
        when(mentions.getChannels()).thenReturn(Collections.emptyList());
        when(entitySelectEvent.getComponentType()).thenReturn(Component.Type.USER_SELECT);

        IMentionable mentionableUser = mock(IMentionable.class);
        when(mentionableUser.getId()).thenReturn("usr_mentionable_bot");
        when(entitySelectEvent.getValues()).thenReturn(List.of(mentionableUser));

        listener.onEntitySelectInteraction(entitySelectEvent);

        verify(entitySelectEvent).deferEdit();
        String sessionKey = "interaction:session:guild_1:user_1:msg_123";
        verify(hashOperations).put(sessionKey, "target_user", "usr_mentionable_bot");
        verify(redisTemplate).expire(eq(sessionKey), eq(Duration.ofMinutes(15)));
    }

    @Test
    @DisplayName("onButtonInteraction shows consolidated warning when both user and role are missing")
    void onButtonInteraction_bothRequiredSelectionsMissing() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_role_grant");
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_grant")
                .actionType(ActionType.ROLE)
                .requiredUser(true)
                .requiredRole(true)
                .build();
        when(embedActionService.resolveAction("rng_act_role_grant")).thenReturn(Optional.of(action));
        when(hashOperations.entries("interaction:session:guild_1:user_1:msg_123")).thenReturn(Collections.emptyMap());

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).deferReply(true);
        verify(hook).editOriginal("⚠️ Missing Required Selections: Please select both a target user and a target role before clicking this button.");
        verifyNoInteractions(actionExecutionService);
    }

    @Test
    @DisplayName("onStringSelectInteraction stores intermediate form selection in Redis session")
    void onStringSelectInteraction_intermediateSelection() {
        when(stringSelectEvent.getComponentId()).thenReturn("rng_form_reason");
        when(stringSelectEvent.getValues()).thenReturn(List.of("reason_spam"));

        listener.onStringSelectInteraction(stringSelectEvent);

        verify(stringSelectEvent).deferEdit();
        String sessionKey = "interaction:session:guild_1:user_1:msg_123";
        verify(hashOperations).put(sessionKey, "selected_option", "reason_spam");
        verify(hashOperations).put(sessionKey, "selected_options", "reason_spam");
        verify(redisTemplate).expire(eq(sessionKey), eq(Duration.ofMinutes(15)));
    }

    @Test
    @DisplayName("onStringSelectInteraction executes action template when selected option is rng_act_")
    void onStringSelectInteraction_actionOptionSelected() {
        when(stringSelectEvent.getComponentId()).thenReturn("menu_actions");
        when(stringSelectEvent.getValues()).thenReturn(List.of("rng_act_opt_1"));

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_opt_1")
                .actionType(ActionType.REPLY)
                .build();
        when(embedActionService.resolveAction("rng_act_opt_1")).thenReturn(Optional.of(action));

        listener.onStringSelectInteraction(stringSelectEvent);

        verify(stringSelectEvent).deferReply(true);
        verify(actionExecutionService).executeStringSelectAction(eq(stringSelectEvent), eq(action), anyMap());
    }

    @Test
    @DisplayName("Should dynamically defer publicly when action responseType is PUBLIC_EMBED")
    void should_defer_publicly_for_public_embed() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_role_grant");
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_grant")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();
        when(embedActionService.resolveAction("rng_act_role_grant")).thenReturn(Optional.of(action));
        when(buttonEvent.deferReply(false)).thenReturn(replyCallbackAction);
        when(actionExecutionService.executeComponentAction(eq("rng_act_role_grant"), eq(guild), eq(member), eq(hook), anyMap()))
                .thenReturn(ActionExecutionResult.success("Role assigned"));

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).deferReply(false);
        verify(actionExecutionService).executeComponentAction(eq("rng_act_role_grant"), eq(guild), eq(member), eq(hook), anyMap());
    }

    @Test
    @DisplayName("Should reject chained follow-up button if caller is not the origin operator")
    void should_reject_chained_button_when_caller_is_not_origin_caller() {
        User intruder = mock(User.class);
        when(intruder.getId()).thenReturn("intruder-999");
        when(buttonEvent.getUser()).thenReturn(intruder);
        when(buttonEvent.getMember()).thenReturn(member);
        when(member.hasPermission(Permission.ADMINISTRATOR)).thenReturn(false);

        Map<String, String> sessionData = Map.of("originCaller", "operator-111");

        assertThatThrownBy(() -> listener.validateCallerIdentity(buttonEvent, sessionData))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Caller identity mismatch");

        verify(hook).editOriginal("❌ Only the operator who initiated this action can execute subsequent steps.");
    }

    @Test
    @DisplayName("Should carryover session state to new message id with 15-minute TTL")
    void should_carryover_session_state_to_new_message_id() {
        Map<String, String> sessionData = Map.of("targetUser", "usr_1", "targetRole", "role_1");

        listener.carryoverSession("guild_1", "chan_1", "user_1", "msg_old", "msg_new", sessionData);

        String expectedKey = "interaction:session:guild_1:user_1:msg_new";
        verify(hashOperations).putAll(expectedKey, sessionData);
        verify(redisTemplate).expire(expectedKey, Duration.ofMinutes(15));
    }

    @Test
    @DisplayName("Single-argument constructor initializes properly")
    void testSingleArgConstructor() {
        DiscordGatewayEventListener simpleListener = new DiscordGatewayEventListener(cacheManager);
        assertThat(simpleListener).isNotNull();
    }

    @Test
    @DisplayName("Lifecycle events trigger cache evictions")
    void testLifecycleEventsEvictCaches() {
        Cache summaryCache = mock(Cache.class);
        Cache detailsCache = mock(Cache.class);
        Cache rolesCache = mock(Cache.class);
        Cache channelsCache = mock(Cache.class);

        when(cacheManager.getCache("guilds:summary")).thenReturn(summaryCache);
        when(cacheManager.getCache("guild:details")).thenReturn(detailsCache);
        when(cacheManager.getCache("guild:roles")).thenReturn(rolesCache);
        when(cacheManager.getCache("guild:channels")).thenReturn(channelsCache);

        GenericGuildUpdateEvent<?> guildUpdateEvent = mock(GenericGuildUpdateEvent.class);
        when(guildUpdateEvent.getGuild()).thenReturn(guild);
        listener.onGenericGuildUpdate(guildUpdateEvent);
        verify(summaryCache).clear();
        verify(detailsCache).evict("guild_1");
        verify(rolesCache).evict("guild_1");

        GuildLeaveEvent leaveEvent = mock(GuildLeaveEvent.class);
        when(leaveEvent.getGuild()).thenReturn(guild);
        listener.onGuildLeave(leaveEvent);

        GuildReadyEvent readyEvent = mock(GuildReadyEvent.class);
        when(readyEvent.getGuild()).thenReturn(guild);
        listener.onGuildReady(readyEvent);

        ChannelCreateEvent channelCreateGuild = mock(ChannelCreateEvent.class);
        when(channelCreateGuild.isFromGuild()).thenReturn(true);
        when(channelCreateGuild.getGuild()).thenReturn(guild);
        listener.onChannelCreate(channelCreateGuild);
        verify(channelsCache).evict("guild_1");

        ChannelCreateEvent channelCreateDm = mock(ChannelCreateEvent.class);
        when(channelCreateDm.isFromGuild()).thenReturn(false);
        listener.onChannelCreate(channelCreateDm);

        ChannelDeleteEvent channelDeleteGuild = mock(ChannelDeleteEvent.class);
        when(channelDeleteGuild.isFromGuild()).thenReturn(true);
        when(channelDeleteGuild.getGuild()).thenReturn(guild);
        listener.onChannelDelete(channelDeleteGuild);

        ChannelDeleteEvent channelDeleteDm = mock(ChannelDeleteEvent.class);
        when(channelDeleteDm.isFromGuild()).thenReturn(false);
        listener.onChannelDelete(channelDeleteDm);

        GenericChannelUpdateEvent<?> channelUpdateGuild = mock(GenericChannelUpdateEvent.class);
        when(channelUpdateGuild.isFromGuild()).thenReturn(true);
        when(channelUpdateGuild.getGuild()).thenReturn(guild);
        listener.onGenericChannelUpdate(channelUpdateGuild);

        GenericChannelUpdateEvent<?> channelUpdateDm = mock(GenericChannelUpdateEvent.class);
        when(channelUpdateDm.isFromGuild()).thenReturn(false);
        listener.onGenericChannelUpdate(channelUpdateDm);
    }

    @Test
    @DisplayName("evictGuildCaches handles null caches and null guildId defensively")
    void testEvictGuildCachesDefensive() {
        when(cacheManager.getCache("guilds:summary")).thenReturn(null);
        when(cacheManager.getCache("guild:details")).thenReturn(null);
        when(cacheManager.getCache("guild:roles")).thenReturn(null);
        when(cacheManager.getCache("guild:channels")).thenReturn(null);

        listener.evictGuildCaches(null);
        listener.evictGuildChannelsCache(null);

        DiscordGatewayEventListener noCacheListener = new DiscordGatewayEventListener(null);
        noCacheListener.evictGuildCaches("g1");
        noCacheListener.evictGuildChannelsCache("g1");
    }

    @Test
    @DisplayName("onButtonInteraction outside of a guild replies with error")
    void testOnButtonInteractionOutsideGuild() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_dm");
        when(buttonEvent.getGuild()).thenReturn(null);
        ReplyCallbackAction replyAction = mock(ReplyCallbackAction.class);
        when(buttonEvent.reply(anyString())).thenReturn(replyAction);
        when(replyAction.setEphemeral(true)).thenReturn(replyAction);

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).reply(contains("Interactive actions are only supported inside a Discord server"));
    }

    @Test
    @DisplayName("onButtonInteraction responds with various response types")
    void testOnButtonInteractionResponseTypes() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_pub_text");
        EmbedAction pubTextAction = EmbedAction.builder()
                .actionId("rng_act_pub_text")
                .responseType(ResponseType.PUBLIC_TEXT)
                .build();
        when(embedActionService.resolveAction("rng_act_pub_text")).thenReturn(Optional.of(pubTextAction));
        when(buttonEvent.deferReply(false)).thenReturn(replyCallbackAction);
        when(actionExecutionService.executeComponentAction(eq("rng_act_pub_text"), any(), any(), any(), any()))
                .thenReturn(ActionExecutionResult.success("Success"));

        listener.onButtonInteraction(buttonEvent);
        verify(buttonEvent).deferReply(false);

        // EPHEMERAL_TEXT -> isEphemeral true
        when(buttonEvent.getComponentId()).thenReturn("rng_act_eph_text");
        EmbedAction ephTextAction = EmbedAction.builder()
                .actionId("rng_act_eph_text")
                .responseType(ResponseType.EPHEMERAL_TEXT)
                .build();
        when(embedActionService.resolveAction("rng_act_eph_text")).thenReturn(Optional.of(ephTextAction));

        listener.onButtonInteraction(buttonEvent);
        verify(buttonEvent, atLeastOnce()).deferReply(true);

        // EPHEMERAL_EMBED -> isEphemeral true
        when(buttonEvent.getComponentId()).thenReturn("rng_act_eph_embed");
        EmbedAction ephEmbedAction = EmbedAction.builder()
                .actionId("rng_act_eph_embed")
                .responseType(ResponseType.EPHEMERAL_EMBED)
                .build();
        when(embedActionService.resolveAction("rng_act_eph_embed")).thenReturn(Optional.of(ephEmbedAction));

        listener.onButtonInteraction(buttonEvent);

        // Fallback isEphemeral false with DM_EMBED
        when(buttonEvent.getComponentId()).thenReturn("rng_act_custom_eph");
        EmbedAction customEphAction = EmbedAction.builder()
                .actionId("rng_act_custom_eph")
                .responseType(ResponseType.DM_EMBED)
                .isEphemeral(false)
                .build();
        when(embedActionService.resolveAction("rng_act_custom_eph")).thenReturn(Optional.of(customEphAction));

        listener.onButtonInteraction(buttonEvent);
    }

    @Test
    @DisplayName("onButtonInteraction warns when only role is missing")
    void testOnButtonInteractionMissingRoleOnly() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_role_req");
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_req")
                .requiredRole(true)
                .build();
        when(embedActionService.resolveAction("rng_act_role_req")).thenReturn(Optional.of(action));
        when(hashOperations.entries(anyString())).thenReturn(Collections.emptyMap());

        listener.onButtonInteraction(buttonEvent);

        verify(hook).editOriginal("⚠️ Missing Required Selections: Please select a target role before clicking this button.");
    }

    @Test
    @DisplayName("onButtonInteraction retrieves member when event member is null")
    void testOnButtonInteractionRetrieveMemberFallback() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_retrieve_member");
        EmbedAction action = EmbedAction.builder().actionId("rng_act_retrieve_member").build();
        when(embedActionService.resolveAction("rng_act_retrieve_member")).thenReturn(Optional.of(action));
        when(buttonEvent.getMember()).thenReturn(null);

        CacheRestAction<Member> restAction = mock(CacheRestAction.class);
        when(guild.retrieveMember(user)).thenReturn(restAction);
        when(restAction.complete()).thenReturn(member);

        listener.onButtonInteraction(buttonEvent);

        verify(guild).retrieveMember(user);
    }

    @Test
    @DisplayName("onButtonInteraction handles compound actions and execution errors")
    void testOnButtonInteractionCompoundActionAndErrorHandling() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_compound");
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_compound")
                .compoundOperations(List.of(CompoundOperation.builder().operationType(CompoundOperation.OperationType.CREATE_TICKET).build()))
                .build();
        when(embedActionService.resolveAction("rng_act_compound")).thenReturn(Optional.of(action));

        when(actionExecutionService.executeCompoundAction(eq("rng_act_compound"), any(), any(), any(), any()))
                .thenReturn(ActionExecutionResult.failure("Compound operation failed"));

        listener.onButtonInteraction(buttonEvent);

        verify(hook).editOriginal("❌ Action failed: Compound operation failed");

        // Action failed with message instead of errorMessage
        when(actionExecutionService.executeCompoundAction(eq("rng_act_compound"), any(), any(), any(), any()))
                .thenReturn(ActionExecutionResult.builder().success(false).errorMessage("General failure").build());

        listener.onButtonInteraction(buttonEvent);
        verify(hook).editOriginal("❌ Action failed: General failure");

        // Action failed with both null
        when(actionExecutionService.executeCompoundAction(eq("rng_act_compound"), any(), any(), any(), any()))
                .thenReturn(ActionExecutionResult.builder().success(false).build());

        listener.onButtonInteraction(buttonEvent);
        verify(hook).editOriginal("❌ Action failed: Unknown error");

        // Action throws exception
        when(actionExecutionService.executeCompoundAction(eq("rng_act_compound"), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Crash during compound"));

        listener.onButtonInteraction(buttonEvent);
        verify(hook).editOriginal("❌ Error executing action: Crash during compound");
    }

    @Test
    @DisplayName("onButtonInteraction executes component action when responseEmbedTemplateId is set")
    void testOnButtonInteractionResponseEmbedTemplate() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_tmpl");
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_tmpl")
                .responseEmbedTemplateId("tmpl_123")
                .build();
        when(embedActionService.resolveAction("rng_act_tmpl")).thenReturn(Optional.of(action));

        when(actionExecutionService.executeComponentAction(eq("rng_act_tmpl"), any(), any(), any(), any()))
                .thenReturn(ActionExecutionResult.success("Rendered"));

        listener.onButtonInteraction(buttonEvent);

        verify(actionExecutionService).executeComponentAction(eq("rng_act_tmpl"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("onButtonInteraction carries over session when result is not terminal")
    void testOnButtonInteractionCarryoverSession() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_next");
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_next")
                .responseEmbedTemplateId("tmpl_123")
                .build();
        when(embedActionService.resolveAction("rng_act_next")).thenReturn(Optional.of(action));

        net.dv8tion.jda.api.entities.channel.unions.MessageChannelUnion channelUnion = mock(net.dv8tion.jda.api.entities.channel.unions.MessageChannelUnion.class);
        when(buttonEvent.getChannel()).thenReturn(channelUnion);
        when(channelUnion.getId()).thenReturn("chan_123");

        ActionExecutionResult result = ActionExecutionResult.builder()
                .success(true)
                .isTerminal(false)
                .newGeneratedMessageId("msg_next_999")
                .build();

        when(actionExecutionService.executeComponentAction(any(), any(), any(), any(), any())).thenReturn(result);

        when(hashOperations.entries("interaction:session:guild_1:user_1:msg_123"))
                .thenReturn(Map.of("targetRole", "role_123"));

        listener.onButtonInteraction(buttonEvent);

        verify(hashOperations).putAll(eq("interaction:session:guild_1:user_1:msg_next_999"), anyMap());
    }

    @Test
    @DisplayName("onButtonInteraction warns when action services are empty")
    void testOnButtonInteractionEmptyServices() {
        DiscordGatewayEventListener emptyServicesListener = new DiscordGatewayEventListener(
                cacheManager, redisTemplate, rateLimiterService, null, null
        );

        when(buttonEvent.getComponentId()).thenReturn("rng_act_test");
        emptyServicesListener.onButtonInteraction(buttonEvent);

        verify(hook).editOriginal("⚠️ Interactive action engine is temporarily unavailable.");
    }

    @Test
    @DisplayName("validateCallerIdentity passes when caller matches originCaller or user is administrator")
    void testValidateCallerIdentityBranches() {
        // null sessionData
        assertThatNoException().isThrownBy(() -> listener.validateCallerIdentity(buttonEvent, null));

        // Matching origin_caller
        Map<String, String> matchSession = Map.of("origin_caller", "user_1");
        assertThatNoException().isThrownBy(() -> listener.validateCallerIdentity(buttonEvent, matchSession));

        // Mismatched caller but user is administrator
        Map<String, String> adminSession = Map.of("originCaller", "other_user");
        when(member.hasPermission(Permission.ADMINISTRATOR)).thenReturn(true);
        assertThatNoException().isThrownBy(() -> listener.validateCallerIdentity(buttonEvent, adminSession));
    }

    @Test
    @DisplayName("carryoverSession handles empty redisTemplate and null or empty sessionData defensively")
    void testCarryoverSessionDefensive() {
        DiscordGatewayEventListener noRedisListener = new DiscordGatewayEventListener(
                cacheManager, null, rateLimiterService, embedActionService, actionExecutionService
        );
        noRedisListener.carryoverSession("g1", "c1", "u1", "m1", "m2", Map.of("k", "v"));

        listener.carryoverSession("g1", "c1", "u1", "m1", "m2", null);
        listener.carryoverSession("g1", "c1", "u1", "m1", "m2", Collections.emptyMap());
    }

    @Test
    @DisplayName("onStringSelectInteraction edge cases: outside guild, rate limit, missing services, missing selections")
    void testOnStringSelectInteractionEdgeCases() {
        // Outside guild
        when(stringSelectEvent.getComponentId()).thenReturn("rng_act_select");
        when(stringSelectEvent.getValues()).thenReturn(List.of("val1"));
        when(stringSelectEvent.getGuild()).thenReturn(null);
        ReplyCallbackAction replyAction = mock(ReplyCallbackAction.class);
        when(stringSelectEvent.reply(anyString())).thenReturn(replyAction);
        when(replyAction.setEphemeral(true)).thenReturn(replyAction);

        listener.onStringSelectInteraction(stringSelectEvent);
        verify(stringSelectEvent).reply(contains("Interactive actions are only supported inside a Discord server"));

        // Rate limit exceeded
        when(stringSelectEvent.getGuild()).thenReturn(guild);
        when(rateLimiterService.tryAcquire(anyString(), anyInt(), anyLong())).thenReturn(false);

        listener.onStringSelectInteraction(stringSelectEvent);
        verify(hook).editOriginal(contains("Rate limit exceeded"));

        // Missing services
        when(rateLimiterService.tryAcquire(anyString(), anyInt(), anyLong())).thenReturn(true);
        DiscordGatewayEventListener noServicesListener = new DiscordGatewayEventListener(
                cacheManager, redisTemplate, rateLimiterService, null, null
        );
        noServicesListener.onStringSelectInteraction(stringSelectEvent);
        verify(hook).editOriginal("⚠️ Interactive action engine is temporarily unavailable.");

        // Action not found
        when(embedActionService.resolveAction("rng_act_select")).thenReturn(Optional.empty());
        listener.onStringSelectInteraction(stringSelectEvent);
        verify(hook).editOriginal(contains("Action template not found"));

        // Missing required user
        EmbedAction reqUserAction = EmbedAction.builder().actionId("rng_act_select").requiredUser(true).build();
        when(embedActionService.resolveAction("rng_act_select")).thenReturn(Optional.of(reqUserAction));
        when(hashOperations.entries(anyString())).thenReturn(Collections.emptyMap());

        listener.onStringSelectInteraction(stringSelectEvent);
        verify(hook).editOriginal(contains("Please select a target user before submitting this selection"));

        // Missing required role
        EmbedAction reqRoleAction = EmbedAction.builder().actionId("rng_act_select").requiredRole(true).build();
        when(embedActionService.resolveAction("rng_act_select")).thenReturn(Optional.of(reqRoleAction));

        listener.onStringSelectInteraction(stringSelectEvent);
        verify(hook).editOriginal(contains("Please select a target role before submitting this selection"));
    }

    @Test
    @DisplayName("onStringSelectInteraction intermediate handling outside guild and empty values")
    void testOnStringSelectInteractionIntermediateBranches() {
        when(stringSelectEvent.getComponentId()).thenReturn("rng_form_test");
        when(stringSelectEvent.getValues()).thenReturn(Collections.emptyList());
        when(stringSelectEvent.getGuild()).thenReturn(null);

        listener.onStringSelectInteraction(stringSelectEvent);

        when(stringSelectEvent.getGuild()).thenReturn(guild);
        listener.onStringSelectInteraction(stringSelectEvent);
        verify(stringSelectEvent, atLeastOnce()).deferEdit();
    }

    @Test
    @DisplayName("onEntitySelectInteraction resolves role select, channel select, and mentionables")
    void testOnEntitySelectInteractionRoleChannelAndMentionables() {
        // Role select via mentions
        when(entitySelectEvent.getComponentId()).thenReturn("rng_sel_roles");
        when(mentions.getUsers()).thenReturn(Collections.emptyList());
        when(mentions.getMembers()).thenReturn(Collections.emptyList());
        when(mentions.getRoles()).thenReturn(List.of(targetRole));
        when(targetRole.getId()).thenReturn("role_99");
        when(mentions.getChannels()).thenReturn(Collections.emptyList());

        listener.onEntitySelectInteraction(entitySelectEvent);
        verify(hashOperations).put(anyString(), eq("target_role"), eq("role_99"));

        // Channel select via mentions
        when(mentions.getRoles()).thenReturn(Collections.emptyList());
        when(mentions.getChannels()).thenReturn(List.of(targetChannel));
        when(targetChannel.getId()).thenReturn("chan_99");

        listener.onEntitySelectInteraction(entitySelectEvent);
        verify(hashOperations).put(anyString(), eq("target_channel"), eq("chan_99"));

        // Channel select via component type
        when(mentions.getChannels()).thenReturn(Collections.emptyList());
        when(entitySelectEvent.getComponentType()).thenReturn(Component.Type.CHANNEL_SELECT);
        IMentionable mentionChan = mock(IMentionable.class);
        when(mentionChan.getId()).thenReturn("chan_type_99");
        when(entitySelectEvent.getValues()).thenReturn(List.of(mentionChan));

        listener.onEntitySelectInteraction(entitySelectEvent);
        verify(hashOperations).put(anyString(), eq("target_channel"), eq("chan_type_99"));

        // Mentionable Select with Role
        when(entitySelectEvent.getComponentType()).thenReturn(Component.Type.MENTIONABLE_SELECT);
        Role roleMentionable = mock(Role.class);
        when(roleMentionable.getId()).thenReturn("role_ment_99");
        when(entitySelectEvent.getValues()).thenReturn(List.of(roleMentionable));

        listener.onEntitySelectInteraction(entitySelectEvent);
        verify(hashOperations).put(anyString(), eq("target_role"), eq("role_ment_99"));

        // Mentionable Select with User
        User userMentionable = mock(User.class);
        when(userMentionable.getId()).thenReturn("user_ment_99");
        when(entitySelectEvent.getValues()).thenReturn(List.of(userMentionable));

        listener.onEntitySelectInteraction(entitySelectEvent);
        verify(hashOperations).put(anyString(), eq("target_user"), eq("user_ment_99"));
    }

    @Test
    @DisplayName("onEntitySelectInteraction returns when interaction is outside guild or unhandled")
    void testOnEntitySelectInteractionOutsideGuildOrUnhandled() {
        when(entitySelectEvent.getComponentId()).thenReturn("unhandled_select");
        listener.onEntitySelectInteraction(entitySelectEvent);

        when(entitySelectEvent.getComponentId()).thenReturn("rng_sel_test");
        when(entitySelectEvent.getGuild()).thenReturn(null);
        listener.onEntitySelectInteraction(entitySelectEvent);
    }

    @Test
    @DisplayName("isHandledSelectComponent recognizes prefixes, bot author matching, and non-matches")
    void testIsHandledSelectComponent() {
        assertThat(listener.isHandledSelectComponent("sel_menu", null, null)).isTrue();
        assertThat(listener.isHandledSelectComponent("rng_menu", null, null)).isTrue();
        assertThat(listener.isHandledSelectComponent("select_menu", null, null)).isTrue();

        Message msg = mock(Message.class);
        User author = mock(User.class);
        when(msg.getAuthor()).thenReturn(author);
        when(author.getIdLong()).thenReturn(111222L);

        JDA jda = mock(JDA.class);
        SelfUser selfUser = mock(SelfUser.class);
        when(jda.getSelfUser()).thenReturn(selfUser);
        when(selfUser.getIdLong()).thenReturn(111222L);

        assertThat(listener.isHandledSelectComponent("other_component", msg, jda)).isTrue();

        when(selfUser.getIdLong()).thenReturn(999999L);
        assertThat(listener.isHandledSelectComponent("other_component", msg, jda)).isFalse();

        assertThat(listener.isHandledSelectComponent(null, null, null)).isFalse();
    }

    @Test
    @DisplayName("onButtonInteraction tests modal response type, button execution branch, and failure messages")
    void testOnButtonInteractionExtraBranches() {
        // 1. DM action with isEphemeral false and null template -> calls executeButtonAction
        when(buttonEvent.getComponentId()).thenReturn("rng_act_modal");
        EmbedAction modalAction = EmbedAction.builder()
                .actionId("rng_act_modal")
                .responseType(ResponseType.DM_EMBED)
                .isEphemeral(false)
                .build();
        when(embedActionService.resolveAction("rng_act_modal")).thenReturn(Optional.of(modalAction));

        listener.onButtonInteraction(buttonEvent);
        verify(actionExecutionService).executeButtonAction(eq(buttonEvent), eq(modalAction), any());

        // 2. Failure result with null errorMessage but non-null responseMessage
        net.dv8tion.jda.api.interactions.InteractionHook hook = mock(net.dv8tion.jda.api.interactions.InteractionHook.class, RETURNS_DEEP_STUBS);
        when(buttonEvent.getHook()).thenReturn(hook);
        when(buttonEvent.getComponentId()).thenReturn("rng_act_fail_msg");
        EmbedAction failAction = EmbedAction.builder()
                .actionId("rng_act_fail_msg")
                .responseEmbedTemplateId("tmpl_err")
                .build();
        when(embedActionService.resolveAction("rng_act_fail_msg")).thenReturn(Optional.of(failAction));

        ActionExecutionResult failResult = ActionExecutionResult.builder()
                .success(false)
                .errorMessage(null)
                .responseMessage("Specific failure reason")
                .build();
        when(actionExecutionService.executeComponentAction(any(), any(), any(), any(), any())).thenReturn(failResult);

        listener.onButtonInteraction(buttonEvent);
        verify(hook).editOriginal(contains("Specific failure reason"));

        // 3. Failure result with both errorMessage and responseMessage null -> falls back to "Unknown error"
        ActionExecutionResult unknownFailResult = ActionExecutionResult.builder()
                .success(false)
                .errorMessage(null)
                .responseMessage(null)
                .build();
        when(actionExecutionService.executeComponentAction(any(), any(), any(), any(), any())).thenReturn(unknownFailResult);

        listener.onButtonInteraction(buttonEvent);
        verify(hook).editOriginal(contains("Unknown error"));
    }

    @Test
    @DisplayName("validateCallerIdentity handles matching caller, admin bypass, and null user/member")
    void testValidateCallerIdentityExtraBranches() {
        // Matching origin caller
        Map<String, String> sessionData = Map.of("originCaller", "user_1");
        listener.validateCallerIdentity(buttonEvent, sessionData);

        // Mismatched caller but user is Administrator -> passes without throwing
        Map<String, String> mismatchedSession = Map.of("originCaller", "other_user");
        Member adminMember = mock(Member.class);
        when(adminMember.hasPermission(net.dv8tion.jda.api.Permission.ADMINISTRATOR)).thenReturn(true);
        when(buttonEvent.getMember()).thenReturn(adminMember);
        listener.validateCallerIdentity(buttonEvent, mismatchedSession);

        // User is null in event
        when(buttonEvent.getUser()).thenReturn(null);
        assertThatThrownBy(() -> {
            when(adminMember.hasPermission(net.dv8tion.jda.api.Permission.ADMINISTRATOR)).thenReturn(false);
            listener.validateCallerIdentity(buttonEvent, mismatchedSession);
        }).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("onStringSelectInteraction covers public text and modal response types")
    void testOnStringSelectInteractionExtraResponseTypes() {
        when(stringSelectEvent.getComponentId()).thenReturn("rng_act_select_modal");
        when(stringSelectEvent.getValues()).thenReturn(List.of("opt1"));

        EmbedAction modalAction = EmbedAction.builder()
                .actionId("rng_act_select_modal")
                .responseType(ResponseType.DM_EMBED)
                .isEphemeral(false)
                .build();
        when(embedActionService.resolveAction("rng_act_select_modal")).thenReturn(Optional.of(modalAction));

        listener.onStringSelectInteraction(stringSelectEvent);
        verify(stringSelectEvent).deferReply(eq(false));

        // Public text response type
        when(stringSelectEvent.getComponentId()).thenReturn("rng_act_select_pub_text");
        EmbedAction pubTextAction = EmbedAction.builder()
                .actionId("rng_act_select_pub_text")
                .responseType(ResponseType.PUBLIC_TEXT)
                .build();
        when(embedActionService.resolveAction("rng_act_select_pub_text")).thenReturn(Optional.of(pubTextAction));

        listener.onStringSelectInteraction(stringSelectEvent);
        verify(stringSelectEvent, atLeastOnce()).deferReply(eq(false));
    }

    @Test
    @DisplayName("onEntitySelectInteraction handles empty values, member mentions, and USER_SELECT type")
    void testOnEntitySelectInteractionExtraEntityTypes() {
        when(entitySelectEvent.getComponentId()).thenReturn("rng_sel_roles");
        when(entitySelectEvent.getGuild()).thenReturn(guild);

        // 1. Empty values list
        when(entitySelectEvent.getValues()).thenReturn(List.of());
        listener.onEntitySelectInteraction(entitySelectEvent);

        // 2. Mentions with Member instance
        Member memberMention = mock(Member.class);
        when(memberMention.getId()).thenReturn("m_ment_123");
        when(mentions.getMembers()).thenReturn(List.of(memberMention));
        listener.onEntitySelectInteraction(entitySelectEvent);

        verify(hashOperations).put(anyString(), eq("target_user"), eq("m_ment_123"));

        // 3. Component type USER_SELECT with values
        when(mentions.getMembers()).thenReturn(List.of());
        when(entitySelectEvent.getComponentType()).thenReturn(net.dv8tion.jda.api.components.Component.Type.USER_SELECT);
        net.dv8tion.jda.api.entities.IMentionable userVal = mock(net.dv8tion.jda.api.entities.IMentionable.class);
        when(userVal.getId()).thenReturn("u_val_456");
        when(entitySelectEvent.getValues()).thenReturn(List.of(userVal));
        listener.onEntitySelectInteraction(entitySelectEvent);

        verify(hashOperations).put(anyString(), eq("target_user"), eq("u_val_456"));
    }

    @Test
    @DisplayName("isHandledSelectComponent handles null message, null selfUser, and null author")
    void testIsHandledSelectComponentNullBranches() {
        JDA jda = mock(JDA.class);
        Message msg = mock(Message.class);

        // message null
        assertThat(listener.isHandledSelectComponent("custom_comp", null, jda)).isFalse();

        // jda selfUser null
        when(jda.getSelfUser()).thenReturn(null);
        assertThat(listener.isHandledSelectComponent("custom_comp", msg, jda)).isFalse();

        // message author null
        SelfUser selfUser = mock(SelfUser.class);
        when(jda.getSelfUser()).thenReturn(selfUser);
        when(msg.getAuthor()).thenReturn(null);
        assertThat(listener.isHandledSelectComponent("custom_comp", msg, jda)).isFalse();
    }

    @Test
    @DisplayName("evict methods handle null guildId and null cache references")
    void testEvictCachesNullGuildIdAndNullCaches() {
        // null guildId
        listener.evictGuildCaches(null);
        listener.evictGuildChannelsCache(null);

        // cacheManager returns null cache
        CacheManager mockCm = mock(CacheManager.class);
        when(mockCm.getCache(anyString())).thenReturn(null);
        DiscordGatewayEventListener nullCacheListener = new DiscordGatewayEventListener(
                mockCm, redisTemplate, rateLimiterService, embedActionService, actionExecutionService
        );
        nullCacheListener.evictGuildCaches("guild_1");
        nullCacheListener.evictGuildChannelsCache("guild_1");
    }

    @Test
    @DisplayName("onStringSelectInteraction checks required user and required role validation")
    void testOnStringSelectInteractionRequiredSelections() {
        // Missing required user
        when(stringSelectEvent.getComponentId()).thenReturn("rng_act_req_user");
        when(stringSelectEvent.getValues()).thenReturn(List.of("opt"));
        EmbedAction reqUserAction = EmbedAction.builder()
                .actionId("rng_act_req_user")
                .requiredUser(true)
                .build();
        when(embedActionService.resolveAction("rng_act_req_user")).thenReturn(Optional.of(reqUserAction));

        listener.onStringSelectInteraction(stringSelectEvent);
        verify(hook).editOriginal(contains("Please select a target user"));

        // Missing required role
        when(stringSelectEvent.getComponentId()).thenReturn("rng_act_req_role");
        EmbedAction reqRoleAction = EmbedAction.builder()
                .actionId("rng_act_req_role")
                .requiredRole(true)
                .build();
        when(embedActionService.resolveAction("rng_act_req_role")).thenReturn(Optional.of(reqRoleAction));

        listener.onStringSelectInteraction(stringSelectEvent);
        verify(hook).editOriginal(contains("Please select a target role"));
    }

    @Test
    @DisplayName("interactions handle null user in events")
    void testInteractionsNullUser() {
        // Button interaction with null user
        when(buttonEvent.getUser()).thenReturn(null);
        when(buttonEvent.getComponentId()).thenReturn("rng_act_null_user");
        EmbedAction action = EmbedAction.builder().actionId("rng_act_null_user").build();
        when(embedActionService.resolveAction("rng_act_null_user")).thenReturn(Optional.of(action));

        listener.onButtonInteraction(buttonEvent);

        // String select interaction with null user
        when(stringSelectEvent.getUser()).thenReturn(null);
        when(stringSelectEvent.getComponentId()).thenReturn("rng_act_null_user_sel");
        when(stringSelectEvent.getValues()).thenReturn(List.of("val"));
        EmbedAction selAction = EmbedAction.builder().actionId("rng_act_null_user_sel").build();
        when(embedActionService.resolveAction("rng_act_null_user_sel")).thenReturn(Optional.of(selAction));

        listener.onStringSelectInteraction(stringSelectEvent);

        // Entity select interaction with null user
        when(entitySelectEvent.getUser()).thenReturn(null);
        when(entitySelectEvent.getComponentId()).thenReturn("rng_sel_null_user");
        when(entitySelectEvent.getValues()).thenReturn(List.of());

        listener.onEntitySelectInteraction(entitySelectEvent);
    }

    @Test
    @DisplayName("onButtonInteraction handles missing execution service, missing action template, and execution exceptions")
    void testButtonActionMissingServicesAndExceptions() {
        // 1. Missing actionExecutionService
        DiscordGatewayEventListener listenerNoActionExec = new DiscordGatewayEventListener(
                cacheManager, redisTemplate, rateLimiterService, embedActionService, null);
        when(buttonEvent.getUser()).thenReturn(user);
        when(buttonEvent.getComponentId()).thenReturn("rng_act_no_exec");
        EmbedAction action = EmbedAction.builder().actionId("rng_act_no_exec").build();
        when(embedActionService.resolveAction("rng_act_no_exec")).thenReturn(Optional.of(action));

        listenerNoActionExec.onButtonInteraction(buttonEvent);
        verify(hook).editOriginal("⚠️ Interactive action engine is temporarily unavailable.");

        // 2. Action template not found
        when(buttonEvent.getComponentId()).thenReturn("rng_act_not_found");
        when(embedActionService.resolveAction("rng_act_not_found")).thenReturn(Optional.empty());

        listener.onButtonInteraction(buttonEvent);
        verify(hook).editOriginal("❌ Action template not found or no longer active: rng_act_not_found");

        // 3. Execution throws exception
        when(buttonEvent.getComponentId()).thenReturn("rng_act_throws");
        EmbedAction throwsAction = EmbedAction.builder()
                .actionId("rng_act_throws")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();
        when(embedActionService.resolveAction("rng_act_throws")).thenReturn(Optional.of(throwsAction));
        when(actionExecutionService.executeComponentAction(eq("rng_act_throws"), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Crash simulation"));

        listener.onButtonInteraction(buttonEvent);
        verify(hook).editOriginal("❌ Error executing action: Crash simulation");

        // 4. Execution throws exception but hook is null
        ButtonInteractionEvent nullHookButtonEvent = mock(ButtonInteractionEvent.class);
        when(nullHookButtonEvent.getComponentId()).thenReturn("rng_act_throws");
        when(nullHookButtonEvent.getGuild()).thenReturn(guild);
        when(nullHookButtonEvent.getUser()).thenReturn(user);
        when(nullHookButtonEvent.getMessageId()).thenReturn("msg_123");
        when(nullHookButtonEvent.getHook()).thenReturn(null);
        when(nullHookButtonEvent.deferReply(anyBoolean())).thenReturn(replyCallbackAction);

        assertThatNoException().isThrownBy(() -> listener.onButtonInteraction(nullHookButtonEvent));
    }

    @Test
    @DisplayName("validateCallerIdentity handles blank origin, null caller user, and null hook on mismatch")
    void testValidateCallerIdentityBlankOriginAndNullHook() {
        // 1. Blank originCaller in sessionData
        Map<String, String> blankOriginMap = Map.of("originCaller", "   ");
        assertThatNoException().isThrownBy(() -> listener.validateCallerIdentity(buttonEvent, blankOriginMap));

        // 2. Blank origin_caller in sessionData
        Map<String, String> blankSnakeMap = Map.of("origin_caller", "   ");
        assertThatNoException().isThrownBy(() -> listener.validateCallerIdentity(buttonEvent, blankSnakeMap));

        // 3. Caller mismatch with null hook and non-admin member
        ButtonInteractionEvent mismatchNullHookEvent = mock(ButtonInteractionEvent.class);
        User caller = mock(User.class);
        when(caller.getId()).thenReturn("caller_999");
        when(mismatchNullHookEvent.getUser()).thenReturn(caller);
        Member regularMember = mock(Member.class);
        when(regularMember.hasPermission(Permission.ADMINISTRATOR)).thenReturn(false);
        when(mismatchNullHookEvent.getMember()).thenReturn(regularMember);
        when(mismatchNullHookEvent.getHook()).thenReturn(null);

        Map<String, String> sessionData = Map.of("originCaller", "origin_111");
        assertThatThrownBy(() -> listener.validateCallerIdentity(mismatchNullHookEvent, sessionData))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Caller identity mismatch: caller is not origin caller");

        // 4. Caller mismatch with null user in event
        ButtonInteractionEvent nullUserMismatchEvent = mock(ButtonInteractionEvent.class);
        when(nullUserMismatchEvent.getUser()).thenReturn(null);
        when(nullUserMismatchEvent.getMember()).thenReturn(regularMember);
        when(nullUserMismatchEvent.getHook()).thenReturn(hook);

        assertThatThrownBy(() -> listener.validateCallerIdentity(nullUserMismatchEvent, sessionData))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Caller identity mismatch: caller is not origin caller");
    }

    @Test
    @DisplayName("carryoverSession catches and logs redis exceptions without rethrowing")
    void testCarryoverSessionRedisException() {
        when(redisTemplate.opsForHash()).thenThrow(new RuntimeException("Redis connection dropped"));

        assertThatNoException().isThrownBy(() -> listener.carryoverSession(
                "guild1", "chan1", "user1", "oldMsg", "newMsg", Map.of("key", "val")));
    }

    @Test
    @DisplayName("isHandledSelectComponent evaluates all short-circuit null conditions")
    void testIsHandledSelectComponentEdgeCases() {
        Message msg = mock(Message.class);

        JDA jda = mock(JDA.class);
        SelfUser selfUser = mock(SelfUser.class);
        when(jda.getSelfUser()).thenReturn(selfUser);

        // msg != null, jda == null -> false
        assertThat(listener.isHandledSelectComponent("other_id", msg, null)).isFalse();

        // msg != null, jda != null, selfUser == null -> false
        JDA jdaNoSelf = mock(JDA.class);
        when(jdaNoSelf.getSelfUser()).thenReturn(null);
        assertThat(listener.isHandledSelectComponent("other_id", msg, jdaNoSelf)).isFalse();

        // msg != null, jda != null, selfUser != null, msg.getAuthor() == null -> false
        when(msg.getAuthor()).thenReturn(null);
        assertThat(listener.isHandledSelectComponent("other_id", msg, jda)).isFalse();
    }

    @Test
    @DisplayName("onStringSelectInteraction handles missing actionExecutionService and missing action template")
    void testStringSelectActionMissingServicesAndNotFound() {
        // 1. Missing actionExecutionService
        DiscordGatewayEventListener listenerNoActionExec = new DiscordGatewayEventListener(
                cacheManager, redisTemplate, rateLimiterService, embedActionService, null);
        when(stringSelectEvent.getUser()).thenReturn(user);
        when(stringSelectEvent.getComponentId()).thenReturn("rng_act_sel_no_exec");
        when(stringSelectEvent.getValues()).thenReturn(List.of("val1"));
        EmbedAction action = EmbedAction.builder().actionId("rng_act_sel_no_exec").build();
        when(embedActionService.resolveAction("rng_act_sel_no_exec")).thenReturn(Optional.of(action));

        listenerNoActionExec.onStringSelectInteraction(stringSelectEvent);
        verify(hook).editOriginal("⚠️ Interactive action engine is temporarily unavailable.");

        // 2. Action template not found
        when(stringSelectEvent.getComponentId()).thenReturn("rng_act_sel_not_found");
        when(stringSelectEvent.getValues()).thenReturn(List.of("val1"));
        when(embedActionService.resolveAction("rng_act_sel_not_found")).thenReturn(Optional.empty());

        listener.onStringSelectInteraction(stringSelectEvent);
        verify(hook).editOriginal("❌ Action template not found or no longer active: rng_act_sel_not_found");
    }

    @Test
    @DisplayName("onGenericGuildUpdate, onGuildLeave, and onGuildReady evict summary, details, and roles caches")
    void testGuildLifecycleEventsAndCacheEviction() {
        Cache summaryCache = mock(Cache.class);
        Cache detailsCache = mock(Cache.class);
        Cache rolesCache = mock(Cache.class);
        when(cacheManager.getCache("guilds:summary")).thenReturn(summaryCache);
        when(cacheManager.getCache("guild:details")).thenReturn(detailsCache);
        when(cacheManager.getCache("guild:roles")).thenReturn(rolesCache);

        GenericGuildUpdateEvent<?> updateEvent = mock(GenericGuildUpdateEvent.class);
        when(updateEvent.getGuild()).thenReturn(guild);
        when(guild.getId()).thenReturn("guild_123");

        listener.onGenericGuildUpdate(updateEvent);
        verify(summaryCache).clear();
        verify(detailsCache).evict("guild_123");
        verify(rolesCache).evict("guild_123");

        GuildLeaveEvent leaveEvent = mock(GuildLeaveEvent.class);
        when(leaveEvent.getGuild()).thenReturn(guild);
        listener.onGuildLeave(leaveEvent);
        verify(summaryCache, times(2)).clear();
        verify(detailsCache, times(2)).evict("guild_123");
        verify(rolesCache, times(2)).evict("guild_123");

        GuildReadyEvent readyEvent = mock(GuildReadyEvent.class);
        when(readyEvent.getGuild()).thenReturn(guild);
        listener.onGuildReady(readyEvent);
        verify(summaryCache, times(3)).clear();
        verify(detailsCache, times(3)).evict("guild_123");
        verify(rolesCache, times(3)).evict("guild_123");

        // Edge case: null guildId clears summary but skips details/roles eviction
        listener.evictGuildCaches(null);
        verify(summaryCache, times(4)).clear();
        verify(detailsCache, times(3)).evict("guild_123");

        // Edge case: cacheManager is empty
        DiscordGatewayEventListener emptyListener = new DiscordGatewayEventListener(null);
        emptyListener.evictGuildCaches("guild_123");

        // Edge case: caches in CacheManager are null
        when(cacheManager.getCache(anyString())).thenReturn(null);
        listener.evictGuildCaches("guild_123");
    }

    @Test
    @DisplayName("onChannelCreate, onChannelDelete, and onGenericChannelUpdate evict channel cache when from guild")
    void testChannelLifecycleEventsAndCacheEviction() {
        Cache channelsCache = mock(Cache.class);
        when(cacheManager.getCache("guild:channels")).thenReturn(channelsCache);
        when(guild.getId()).thenReturn("guild_123");

        // 1. ChannelCreateEvent
        ChannelCreateEvent createFromGuild = mock(ChannelCreateEvent.class);
        when(createFromGuild.isFromGuild()).thenReturn(true);
        when(createFromGuild.getGuild()).thenReturn(guild);
        listener.onChannelCreate(createFromGuild);
        verify(channelsCache).evict("guild_123");

        ChannelCreateEvent createNotFromGuild = mock(ChannelCreateEvent.class);
        when(createNotFromGuild.isFromGuild()).thenReturn(false);
        listener.onChannelCreate(createNotFromGuild);
        verify(channelsCache, times(1)).evict("guild_123");

        // 2. ChannelDeleteEvent
        ChannelDeleteEvent deleteFromGuild = mock(ChannelDeleteEvent.class);
        when(deleteFromGuild.isFromGuild()).thenReturn(true);
        when(deleteFromGuild.getGuild()).thenReturn(guild);
        listener.onChannelDelete(deleteFromGuild);
        verify(channelsCache, times(2)).evict("guild_123");

        ChannelDeleteEvent deleteNotFromGuild = mock(ChannelDeleteEvent.class);
        when(deleteNotFromGuild.isFromGuild()).thenReturn(false);
        listener.onChannelDelete(deleteNotFromGuild);
        verify(channelsCache, times(2)).evict("guild_123");

        // 3. GenericChannelUpdateEvent
        GenericChannelUpdateEvent<?> updateFromGuild = mock(GenericChannelUpdateEvent.class);
        when(updateFromGuild.isFromGuild()).thenReturn(true);
        when(updateFromGuild.getGuild()).thenReturn(guild);
        listener.onGenericChannelUpdate(updateFromGuild);
        verify(channelsCache, times(3)).evict("guild_123");

        GenericChannelUpdateEvent<?> updateNotFromGuild = mock(GenericChannelUpdateEvent.class);
        when(updateNotFromGuild.isFromGuild()).thenReturn(false);
        listener.onGenericChannelUpdate(updateNotFromGuild);
        verify(channelsCache, times(3)).evict("guild_123");

        // 4. Null guildId skips eviction
        listener.evictGuildChannelsCache(null);
        verify(channelsCache, times(3)).evict(anyString());

        // 5. CacheManager is empty or channelsCache is null
        DiscordGatewayEventListener emptyListener = new DiscordGatewayEventListener(null);
        emptyListener.evictGuildChannelsCache("guild_123");

        when(cacheManager.getCache("guild:channels")).thenReturn(null);
        listener.evictGuildChannelsCache("guild_123");
    }

    @Test
    @DisplayName("onButtonInteraction retrieves member when member is null and validates admin bypass")
    void testButtonInteractionMemberRetrievalAndAdminBypass() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_btn_nomember");
        when(buttonEvent.getMember()).thenReturn(null);

        Member retrievedMember = mock(Member.class);
        CacheRestAction cacheRestAction = mock(CacheRestAction.class);
        when(cacheRestAction.complete()).thenReturn(retrievedMember);
        when(guild.retrieveMember(user)).thenReturn(cacheRestAction);

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_btn_nomember")
                .responseType(ResponseType.PUBLIC_TEXT)
                .build();
        when(embedActionService.resolveAction("rng_act_btn_nomember")).thenReturn(Optional.of(action));

        listener.onButtonInteraction(buttonEvent);
        verify(actionExecutionService).executeComponentAction(eq("rng_act_btn_nomember"), eq(guild), eq(retrievedMember), eq(hook), any());

        // When retrieveMember throws exception
        when(cacheRestAction.complete()).thenThrow(new RuntimeException("Member retrieve failed"));
        listener.onButtonInteraction(buttonEvent);
        verify(actionExecutionService).executeComponentAction(eq("rng_act_btn_nomember"), eq(guild), isNull(), eq(hook), any());
    }

    @Test
    @DisplayName("validateCallerIdentity allows administrator to bypass caller identity check")
    void testValidateCallerIdentityAdminBypass() {
        Map<String, String> sessionData = Map.of("originCaller", "user_origin");
        when(user.getId()).thenReturn("user_admin");
        when(member.hasPermission(Permission.ADMINISTRATOR)).thenReturn(true);

        assertThatNoException().isThrownBy(() -> listener.validateCallerIdentity(buttonEvent, sessionData));

        // When non-admin and user is null
        when(buttonEvent.getUser()).thenReturn(null);
        when(member.hasPermission(Permission.ADMINISTRATOR)).thenReturn(false);
        assertThatThrownBy(() -> listener.validateCallerIdentity(buttonEvent, sessionData))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("onButtonInteraction handles failed result with null message fallback and null hook")
    void testButtonInteractionFailedResultNullMessageFallback() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_btn_failed");
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_btn_failed")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();
        when(embedActionService.resolveAction("rng_act_btn_failed")).thenReturn(Optional.of(action));

        ActionExecutionResult failedResult = ActionExecutionResult.builder()
                .success(false)
                .errorMessage(null)
                .responseMessage(null)
                .build();
        when(actionExecutionService.executeComponentAction(any(), any(), any(), any(), any())).thenReturn(failedResult);

        listener.onButtonInteraction(buttonEvent);
        verify(hook).editOriginal("❌ Action failed: Unknown error");

        // When hook is null
        when(buttonEvent.getHook()).thenReturn(null);
        assertThatNoException().isThrownBy(() -> listener.onButtonInteraction(buttonEvent));
    }

    @Test
    @DisplayName("onStringSelectInteraction handles empty values, null guild, and Redis exception in intermediate menu")
    void testStringSelectIntermediateEmptyValuesAndNullGuild() {
        when(stringSelectEvent.getComponentId()).thenReturn("select_intermediate");
        when(stringSelectEvent.getValues()).thenReturn(List.of());

        // Empty values
        listener.onStringSelectInteraction(stringSelectEvent);
        verify(stringSelectEvent).deferEdit();

        // Null guild
        when(stringSelectEvent.getGuild()).thenReturn(null);
        listener.onStringSelectInteraction(stringSelectEvent);

        // Redis exception during intermediate update
        when(stringSelectEvent.getGuild()).thenReturn(guild);
        when(stringSelectEvent.getValues()).thenReturn(List.of("val1"));
        doThrow(new RuntimeException("Redis put failed")).when(hashOperations).put(anyString(), anyString(), anyString());
        assertThatNoException().isThrownBy(() -> listener.onStringSelectInteraction(stringSelectEvent));
    }

    @Test
    @DisplayName("onEntitySelectInteraction covers all mention and type resolution paths")
    void testEntitySelectAllResolutionPaths() {
        when(entitySelectEvent.getComponentId()).thenReturn("rng_sel_entities");

        // 1. Mentions members
        Member mentionMember = mock(Member.class);
        when(mentionMember.getId()).thenReturn("member_m1");
        when(mentions.getUsers()).thenReturn(List.of());
        when(mentions.getMembers()).thenReturn(List.of(mentionMember));
        when(mentions.getRoles()).thenReturn(List.of());
        when(mentions.getChannels()).thenReturn(List.of());
        when(entitySelectEvent.getComponentType()).thenReturn(Component.Type.USER_SELECT);
        when(entitySelectEvent.getValues()).thenReturn(List.of());

        listener.onEntitySelectInteraction(entitySelectEvent);
        verify(hashOperations).put(anyString(), eq("target_user"), eq("member_m1"));

        // 2. Mentions channels
        GuildChannel mentionChan = mock(GuildChannel.class);
        when(mentionChan.getId()).thenReturn("chan_c1");
        when(mentions.getMembers()).thenReturn(List.of());
        when(mentions.getChannels()).thenReturn(List.of(mentionChan));

        listener.onEntitySelectInteraction(entitySelectEvent);
        verify(hashOperations).put(anyString(), eq("target_channel"), eq("chan_c1"));

        // 3. Component types ROLE_SELECT, CHANNEL_SELECT with values
        when(mentions.getChannels()).thenReturn(List.of());
        IMentionable roleMention = mock(Role.class);
        when(roleMention.getId()).thenReturn("role_v1");
        when(entitySelectEvent.getComponentType()).thenReturn(Component.Type.ROLE_SELECT);
        when(entitySelectEvent.getValues()).thenReturn(List.of(roleMention));

        listener.onEntitySelectInteraction(entitySelectEvent);
        verify(hashOperations).put(anyString(), eq("target_role"), eq("role_v1"));

        // 4. CHANNEL_SELECT with values
        IMentionable chanMention = mock(GuildChannel.class);
        when(chanMention.getId()).thenReturn("chan_v1");
        when(entitySelectEvent.getComponentType()).thenReturn(Component.Type.CHANNEL_SELECT);
        when(entitySelectEvent.getValues()).thenReturn(List.of(chanMention));

        listener.onEntitySelectInteraction(entitySelectEvent);
        verify(hashOperations).put(anyString(), eq("target_channel"), eq("chan_v1"));

        // 5. MENTIONABLE_SELECT with User
        User userMention = mock(User.class);
        when(userMention.getId()).thenReturn("user_mentionable_1");
        when(entitySelectEvent.getComponentType()).thenReturn(Component.Type.MENTIONABLE_SELECT);
        when(entitySelectEvent.getValues()).thenReturn(List.of(userMention));

        listener.onEntitySelectInteraction(entitySelectEvent);
        verify(hashOperations).put(anyString(), eq("target_user"), eq("user_mentionable_1"));

        // 6. Null guild returns early
        when(entitySelectEvent.getGuild()).thenReturn(null);
        listener.onEntitySelectInteraction(entitySelectEvent);

        // 7. Redis exception handled gracefully
        when(entitySelectEvent.getGuild()).thenReturn(guild);
        doThrow(new RuntimeException("Redis error")).when(hashOperations).put(anyString(), anyString(), anyString());
        assertThatNoException().isThrownBy(() -> listener.onEntitySelectInteraction(entitySelectEvent));
    }

    @Test
    @DisplayName("getSessionData handles null entries and Redis exceptions")
    void testGetSessionDataNullEntriesAndException() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_session_test");
        EmbedAction action = EmbedAction.builder().actionId("rng_act_session_test").build();
        when(embedActionService.resolveAction("rng_act_session_test")).thenReturn(Optional.of(action));

        // 1. entries returns null
        when(hashOperations.entries(anyString())).thenReturn(null);
        listener.onButtonInteraction(buttonEvent);

        // 2. entries throws exception
        when(hashOperations.entries(anyString())).thenThrow(new RuntimeException("Redis entries failed"));
        listener.onButtonInteraction(buttonEvent);

        // 3. redisTemplate is empty
        DiscordGatewayEventListener noRedisListener = new DiscordGatewayEventListener(
                cacheManager, null, rateLimiterService, embedActionService, actionExecutionService);
        noRedisListener.onButtonInteraction(buttonEvent);
    }
}
