package com.rng.server.listener;

import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.service.ActionExecutionService;
import com.rng.embed.service.EmbedActionService;
import com.rng.embed.service.RedisRateLimiterService;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Mentions;
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
}
