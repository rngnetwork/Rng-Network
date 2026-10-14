package com.rng.server.listener;

import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.CompoundOperation;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.ResponseType;
import com.rng.embed.dto.ActionExecutionResult;
import com.rng.embed.service.ActionExecutionService;
import com.rng.embed.service.EmbedActionService;
import com.rng.embed.service.RedisRateLimiterService;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.components.Component;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.IMentionable;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Mentions;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.middleman.GuildChannel;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.EntitySelectInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.requests.RestAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageEditAction;
import net.dv8tion.jda.api.requests.restaction.interactions.MessageEditCallbackAction;
import net.dv8tion.jda.api.requests.restaction.interactions.ReplyCallbackAction;
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
        lenient().when(buttonEvent.getHook()).thenReturn(hook);

        lenient().when(stringSelectEvent.getGuild()).thenReturn(guild);
        lenient().when(stringSelectEvent.getMember()).thenReturn(member);
        lenient().when(stringSelectEvent.getUser()).thenReturn(user);
        lenient().when(stringSelectEvent.getMessageId()).thenReturn("msg_123");
        lenient().when(stringSelectEvent.deferReply(true)).thenReturn(replyCallbackAction);
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
    @DisplayName("onStringSelectInteraction defers edit and stores action option in Redis session for mapped button click")
    void onStringSelectInteraction_actionOptionSelected() {
        when(stringSelectEvent.getComponentId()).thenReturn("menu_actions");
        when(stringSelectEvent.getValues()).thenReturn(List.of("rng_act_opt_1"));

        listener.onStringSelectInteraction(stringSelectEvent);

        verify(stringSelectEvent).deferEdit();
        String sessionKey = "interaction:session:guild_1:user_1:msg_123";
        verify(hashOperations).put(sessionKey, "selected_option", "rng_act_opt_1");
        verify(hashOperations).put(sessionKey, "selected_option:menu_actions", "rng_act_opt_1");
        verify(actionExecutionService, never()).executeStringSelectAction(any(), any(), any());
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
    @DisplayName("Should warn ephemerally when invoke button is clicked before selecting an option")
    void should_warn_ephemerally_when_invoke_button_clicked_without_selecting_option() {
        when(buttonEvent.getComponentId()).thenReturn("rng_btn_invoke_menu_1");
        when(user.getId()).thenReturn("usr_1");
        when(guild.getId()).thenReturn("gld_1");
        when(buttonEvent.getMessageId()).thenReturn("msg_123");
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        when(hashOperations.entries("interaction:session:gld_1:usr_1:msg_123")).thenReturn(Collections.emptyMap());
        when(buttonEvent.reply("⚠️ Please select an option from the menu first!")).thenReturn(replyCallbackAction);
        when(replyCallbackAction.setEphemeral(true)).thenReturn(replyCallbackAction);

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).reply("⚠️ Please select an option from the menu first!");
        verify(replyCallbackAction).setEphemeral(true);
        verify(replyCallbackAction).queue();
        verify(buttonEvent, never()).deferReply(anyBoolean());
    }

    @Test
    @DisplayName("Should execute mapped action when invoke button is clicked with selected option in session")
    void should_execute_mapped_action_when_invoke_button_clicked_with_selected_option() {
        when(buttonEvent.getComponentId()).thenReturn("rng_btn_invoke_menu_1");
        when(user.getId()).thenReturn("usr_1");
        when(guild.getId()).thenReturn("gld_1");
        when(buttonEvent.getMessageId()).thenReturn("msg_123");
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);
        Map<Object, Object> session = new HashMap<>();
        session.put("selected_option:menu_1", "rng_act_grant_role");
        when(hashOperations.entries("interaction:session:gld_1:usr_1:msg_123")).thenReturn(session);

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_grant_role")
                .responseType(ResponseType.EPHEMERAL_TEXT)
                .build();
        when(embedActionService.resolveAction("rng_act_grant_role")).thenReturn(Optional.of(action));
        when(rateLimiterService.tryAcquire(anyString(), anyInt(), anyLong())).thenReturn(true);

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).deferReply(true);
        verify(actionExecutionService).executeButtonAction(eq(buttonEvent), eq(action), anyMap());
    }

    @Test
    @DisplayName("Should defer string select interaction when message contains an invoke button")
    void should_defer_string_select_when_message_contains_invoke_button() {
        when(stringSelectEvent.getComponentId()).thenReturn("sel_roles");
        when(stringSelectEvent.getValues()).thenReturn(List.of("rng_act_premium_role"));
        when(user.getId()).thenReturn("usr_1");
        when(guild.getId()).thenReturn("gld_1");
        when(stringSelectEvent.getMessageId()).thenReturn("msg_123");
        when(stringSelectEvent.deferEdit()).thenReturn(editCallbackAction);
        when(redisTemplate.opsForHash()).thenReturn(hashOperations);

        listener.onStringSelectInteraction(stringSelectEvent);

        verify(stringSelectEvent).deferEdit();
        verify(editCallbackAction).queue();
        verify(hashOperations).put("interaction:session:gld_1:usr_1:msg_123", "selected_option", "rng_act_premium_role");
        verify(hashOperations).put("interaction:session:gld_1:usr_1:msg_123", "selected_option:sel_roles", "rng_act_premium_role");
        verify(actionExecutionService, never()).executeStringSelectAction(any(), any(), any());
    }
}
