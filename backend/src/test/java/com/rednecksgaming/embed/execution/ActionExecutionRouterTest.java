package com.rednecksgaming.embed.execution;

import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.embed.domain.ActionType;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedActionRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.requests.restaction.CacheRestAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageEditAction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActionExecutionRouterTest {

    @Mock
    private EmbedActionRepository embedActionRepository;

    @Mock
    private InteractionLogRepository interactionLogRepository;

    @Mock
    private RoleActionExecutor roleActionExecutor;

    @Mock
    private TicketActionExecutor ticketActionExecutor;

    @Mock
    private ReplyActionExecutor replyActionExecutor;

    @Mock
    private DmActionExecutor dmActionExecutor;

    @Mock
    private CompoundActionExecutor compoundActionExecutor;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ButtonInteractionEvent buttonEvent;

    @Mock
    private StringSelectInteractionEvent selectEvent;

    @Mock
    private InteractionHook hook;

    @Mock
    private Guild guild;

    @Mock
    private Member member;

    @Mock
    private User user;

    @Mock
    private MessageChannel channel;

    @Mock
    private CacheRestAction<Member> memberRestAction;

    @Mock
    private WebhookMessageEditAction<net.dv8tion.jda.api.entities.Message> editAction;

    private ActionExecutionRouter router;

    @BeforeEach
    void setUp() {
        router = new ActionExecutionRouter(
                embedActionRepository,
                interactionLogRepository,
                roleActionExecutor,
                ticketActionExecutor,
                replyActionExecutor,
                dmActionExecutor,
                compoundActionExecutor,
                redisTemplate
        );
        lenient().when(hook.editOriginal(anyString())).thenReturn(editAction);
    }

    @Test
    @DisplayName("executeButtonAction: retrieves member when event.getMember() is null and succeeds")
    void executeButtonAction_retrieveMemberSuccess() {
        when(buttonEvent.getMember()).thenReturn(null);
        when(buttonEvent.getGuild()).thenReturn(guild);
        when(buttonEvent.getUser()).thenReturn(user);
        when(buttonEvent.getHook()).thenReturn(hook);
        when(buttonEvent.getMessageChannel()).thenReturn(channel);
        when(buttonEvent.getMessageId()).thenReturn("msg_001");
        when(guild.retrieveMember(user)).thenReturn(memberRestAction);
        when(memberRestAction.complete()).thenReturn(member);
        when(guild.getId()).thenReturn("g1");
        when(user.getId()).thenReturn("u1");

        EmbedAction action = EmbedAction.builder()
                .actionId("act_reply")
                .actionType(ActionType.REPLY)
                .build();

        router.executeButtonAction(buttonEvent, action, Map.of("k", "v"));

        verify(replyActionExecutor).executeReplyAction(hook, guild, member, user, channel, "msg_001", action, Map.of("k", "v"), null);
        verify(redisTemplate).delete("interaction:session:g1:u1:msg_001");
    }

    @Test
    @DisplayName("executeButtonAction: handles retrieveMember exception when event.getMember() is null")
    void executeButtonAction_retrieveMemberThrows() {
        when(buttonEvent.getMember()).thenReturn(null);
        when(buttonEvent.getGuild()).thenReturn(guild);
        when(buttonEvent.getUser()).thenReturn(user);
        when(buttonEvent.getHook()).thenReturn(hook);
        when(guild.retrieveMember(user)).thenReturn(memberRestAction);
        when(memberRestAction.complete()).thenThrow(new RuntimeException("Member departed"));
        when(user.getId()).thenReturn("u_missing");
        when(guild.getId()).thenReturn("g1");

        EmbedAction action = EmbedAction.builder()
                .actionId("act_reply")
                .actionType(ActionType.REPLY)
                .build();

        router.executeButtonAction(buttonEvent, action, Collections.emptyMap());

        verify(hook).editOriginal(contains("can only be used within a Discord server"));
        verifyNoInteractions(replyActionExecutor);
    }

    @Test
    @DisplayName("executeStringSelectAction: routes with selected option from event values")
    void executeStringSelectAction_withSelectedOption() {
        when(selectEvent.getMember()).thenReturn(member);
        when(selectEvent.getGuild()).thenReturn(guild);
        when(selectEvent.getUser()).thenReturn(user);
        when(selectEvent.getHook()).thenReturn(hook);
        when(selectEvent.getMessageChannel()).thenReturn(channel);
        when(selectEvent.getMessageId()).thenReturn("msg_select");
        when(selectEvent.getValues()).thenReturn(List.of("option_role_1", "option_role_2"));
        when(guild.getId()).thenReturn("g1");
        when(user.getId()).thenReturn("u1");

        EmbedAction action = EmbedAction.builder()
                .actionId("act_role")
                .actionType(ActionType.ROLE)
                .build();

        router.executeStringSelectAction(selectEvent, action, Collections.emptyMap());

        verify(roleActionExecutor).executeRoleAction(hook, guild, member, user, channel, "msg_select", action, Collections.emptyMap(), "option_role_1");
    }

    @Test
    @DisplayName("executeStringSelectAction: passes empty string when values are empty")
    void executeStringSelectAction_emptyValues() {
        when(selectEvent.getMember()).thenReturn(member);
        when(selectEvent.getGuild()).thenReturn(guild);
        when(selectEvent.getUser()).thenReturn(user);
        when(selectEvent.getHook()).thenReturn(hook);
        when(selectEvent.getMessageChannel()).thenReturn(channel);
        when(selectEvent.getMessageId()).thenReturn("msg_select_empty");
        when(selectEvent.getValues()).thenReturn(Collections.emptyList());
        when(guild.getId()).thenReturn("g1");
        when(user.getId()).thenReturn("u1");

        EmbedAction action = EmbedAction.builder()
                .actionId("act_role")
                .actionType(ActionType.ROLE)
                .build();

        router.executeStringSelectAction(selectEvent, action, Collections.emptyMap());

        verify(roleActionExecutor).executeRoleAction(hook, guild, member, user, channel, "msg_select_empty", action, Collections.emptyMap(), "");
    }

    @Test
    @DisplayName("executeComponentAction: rejects when guild is null or member is null")
    void executeComponentAction_nullGuildOrMember() {
        EmbedAction action = EmbedAction.builder().actionType(ActionType.ROLE).build();

        router.executeComponentAction(hook, null, member, user, channel, "m1", action, null, null);
        verify(hook).editOriginal(contains("can only be used within a Discord server"));

        router.executeComponentAction(hook, guild, null, user, channel, "m1", action, null, null);
        verify(hook, times(2)).editOriginal(contains("can only be used within a Discord server"));
    }

    @Test
    @DisplayName("executeComponentAction: routes to TICKET and DM executors")
    void executeComponentAction_routingTicketAndDm() {
        when(guild.getId()).thenReturn("g1");
        when(user.getId()).thenReturn("u1");

        EmbedAction ticketAction = EmbedAction.builder().actionId("act_t").actionType(ActionType.TICKET).build();
        router.executeComponentAction(hook, guild, member, user, channel, "m_t", ticketAction, null, null);
        verify(ticketActionExecutor).executeTicketAction(hook, guild, member, user, channel, "m_t", ticketAction, null, null);

        EmbedAction dmAction = EmbedAction.builder().actionId("act_d").actionType(ActionType.DM).build();
        router.executeComponentAction(hook, guild, member, user, channel, "m_d", dmAction, null, null);
        verify(dmActionExecutor).executeDmAction(hook, guild, member, user, channel, "m_d", dmAction, null, null);
    }

    @Test
    @DisplayName("executeComponentAction: catches unexpected executor exception, notifies hook, logs error, and cleans up")
    void executeComponentAction_executorThrowsException() {
        when(guild.getId()).thenReturn("g1");
        when(user.getId()).thenReturn("u1");
        when(user.getName()).thenReturn("Jane");
        when(channel.getId()).thenReturn("c1");

        EmbedAction action = EmbedAction.builder().actionId("act_err").actionType(ActionType.ROLE).build();
        doThrow(new IllegalStateException("Discord gateway unavailable"))
                .when(roleActionExecutor).executeRoleAction(any(), any(), any(), any(), any(), any(), any(), any(), any());

        router.executeComponentAction(hook, guild, member, user, channel, "m_err", action, null, null);

        verify(hook).editOriginal(contains("⚠️ An unexpected error occurred while executing this action"));
        verify(interactionLogRepository).save(argThat(log ->
                "ERROR".equals(log.getStatus()) && log.getDetails().contains("Discord gateway unavailable")
        ));
        verify(redisTemplate).delete("interaction:session:g1:u1:m_err");
    }

    @Test
    @DisplayName("executeComponentAction (synchronous): throws ResourceNotFoundException if action missing")
    void executeComponentActionSync_actionNotFound() {
        when(embedActionRepository.findByActionId("missing_id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> router.executeComponentAction("missing_id", guild, member, hook, Collections.emptyMap()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Action not found: missing_id");
    }

    @Test
    @DisplayName("executeComponentAction (synchronous): routes to ROLE, REPLY, TICKET, DM, and handles unsupported action")
    void executeComponentActionSync_routing() {
        EmbedAction roleAction = EmbedAction.builder().actionId("a_role").actionType(ActionType.ROLE).build();
        when(embedActionRepository.findByActionId("a_role")).thenReturn(Optional.of(roleAction));
        when(roleActionExecutor.executeRoleActionSynchronous(roleAction, guild, member, hook, null))
                .thenReturn(ActionExecutionResult.success("Role OK"));
        assertThat(router.executeComponentAction("a_role", guild, member, hook, null).getResponseMessage()).isEqualTo("Role OK");

        EmbedAction replyAction = EmbedAction.builder().actionId("a_reply").actionType(ActionType.REPLY).build();
        when(embedActionRepository.findByActionId("a_reply")).thenReturn(Optional.of(replyAction));
        when(replyActionExecutor.executeReplyActionSynchronous(replyAction, guild, member, hook, null))
                .thenReturn(ActionExecutionResult.success("Reply OK"));
        assertThat(router.executeComponentAction("a_reply", guild, member, hook, null).getResponseMessage()).isEqualTo("Reply OK");

        EmbedAction ticketAction = EmbedAction.builder().actionId("a_ticket").actionType(ActionType.TICKET).build();
        when(embedActionRepository.findByActionId("a_ticket")).thenReturn(Optional.of(ticketAction));
        when(ticketActionExecutor.executeTicketActionSynchronous(ticketAction, guild, member, hook, null))
                .thenReturn(ActionExecutionResult.success("Ticket OK"));
        assertThat(router.executeComponentAction("a_ticket", guild, member, hook, null).getResponseMessage()).isEqualTo("Ticket OK");

        EmbedAction dmAction = EmbedAction.builder().actionId("a_dm").actionType(ActionType.DM).build();
        when(embedActionRepository.findByActionId("a_dm")).thenReturn(Optional.of(dmAction));
        when(dmActionExecutor.executeDmActionSynchronous(dmAction, guild, member, hook, null))
                .thenReturn(ActionExecutionResult.success("DM OK"));
        assertThat(router.executeComponentAction("a_dm", guild, member, hook, null).getResponseMessage()).isEqualTo("DM OK");

        // Unsupported action type
        EmbedAction unsupportedAction = EmbedAction.builder().actionId("a_unsupp").actionType(null).build();
        when(embedActionRepository.findByActionId("a_unsupp")).thenReturn(Optional.of(unsupportedAction));
        ActionExecutionResult unsupportedResult = router.executeComponentAction("a_unsupp", guild, member, hook, null);
        assertThat(unsupportedResult.isSuccess()).isFalse();
        assertThat(unsupportedResult.getErrorMessage()).contains("Unsupported action type: null");
    }

    @Test
    @DisplayName("executeCompoundAction: delegates directly to compoundActionExecutor")
    void executeCompoundAction_delegates() {
        when(compoundActionExecutor.executeCompoundAction("cmp_1", guild, member, hook, null))
                .thenReturn(ActionExecutionResult.success("Chained OK"));

        ActionExecutionResult result = router.executeCompoundAction("cmp_1", guild, member, hook, null);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getResponseMessage()).isEqualTo("Chained OK");
    }

    @Test
    @DisplayName("cleanupSession: handles null parameters and redis exceptions gracefully")
    void cleanupSession_nullParametersAndExceptionHandling() {
        // Null parameters
        router.cleanupSession(null, "u1", "m1");
        router.cleanupSession("g1", null, "m1");
        router.cleanupSession("g1", "u1", null);
        verifyNoInteractions(redisTemplate);

        // Redis throws exception
        doThrow(new RuntimeException("Redis connection refused"))
                .when(redisTemplate).delete("interaction:session:g1:u1:m1");
        router.cleanupSession("g1", "u1", "m1");
        // Should not bubble exception
    }

    @Test
    @DisplayName("cleanupSession: early returns when redisTemplate is absent")
    void cleanupSession_redisAbsent() {
        ActionExecutionRouter routerNoRedis = new ActionExecutionRouter(
                embedActionRepository,
                interactionLogRepository,
                roleActionExecutor,
                ticketActionExecutor,
                replyActionExecutor,
                dmActionExecutor,
                compoundActionExecutor,
                null
        );

        routerNoRedis.cleanupSession("g1", "u1", "m1");
        // No exception
    }

    @Test
    @DisplayName("recordAuditLog: handles null action and repository exceptions gracefully")
    void recordAuditLog_nullActionAndSaveThrows() {
        // null action
        router.recordAuditLog(null, "g1", "c1", "m1", "u1", "Jane", "SUCCESS", "ok");
        verify(interactionLogRepository).save(argThat(log ->
                "unknown".equals(log.getActionId()) && log.getActionType() == null
        ));

        // save throws exception
        doThrow(new RuntimeException("MongoDB write timeout"))
                .when(interactionLogRepository).save(any(InteractionLog.class));
        router.recordAuditLog(null, "g1", "c1", "m1", "u1", "Jane", "SUCCESS", "ok");
        // Should not bubble exception
    }

    @Test
    @DisplayName("executeStringSelectAction: member null retrieval, retrieval exception, and empty values")
    void executeStringSelectAction_memberNullAndEmptyValues() {
        // 1. member null, retrieval succeeds, empty values
        when(selectEvent.getMember()).thenReturn(null);
        when(selectEvent.getGuild()).thenReturn(guild);
        when(selectEvent.getUser()).thenReturn(user);
        when(selectEvent.getHook()).thenReturn(hook);
        when(selectEvent.getMessageChannel()).thenReturn(channel);
        when(selectEvent.getMessageId()).thenReturn("msg_sel_1");
        when(guild.retrieveMember(user)).thenReturn(memberRestAction);
        when(memberRestAction.complete()).thenReturn(member);
        when(selectEvent.getValues()).thenReturn(Collections.emptyList());
        when(guild.getId()).thenReturn("g1");
        when(user.getId()).thenReturn("u1");

        EmbedAction action = EmbedAction.builder().actionId("a_sel").actionType(ActionType.ROLE).build();
        router.executeStringSelectAction(selectEvent, action, null);
        verify(roleActionExecutor).executeRoleAction(hook, guild, member, user, channel, "msg_sel_1", action, null, "");

        // 2. member null, retrieval throws exception
        when(memberRestAction.complete()).thenThrow(new RuntimeException("Member not found"));
        router.executeStringSelectAction(selectEvent, action, null);
        verify(hook).editOriginal(contains("can only be used within a Discord server"));
    }

    @Test
    @DisplayName("executeButtonAction: member already non-null does not call retrieveMember")
    void executeButtonAction_memberNonNull() {
        when(buttonEvent.getMember()).thenReturn(member);
        when(buttonEvent.getGuild()).thenReturn(guild);
        when(buttonEvent.getUser()).thenReturn(user);
        when(buttonEvent.getHook()).thenReturn(hook);
        when(buttonEvent.getMessageChannel()).thenReturn(channel);
        when(buttonEvent.getMessageId()).thenReturn("msg_btn_2");
        when(guild.getId()).thenReturn("g1");
        when(user.getId()).thenReturn("u1");

        EmbedAction action = EmbedAction.builder().actionId("a_btn").actionType(ActionType.TICKET).build();
        router.executeButtonAction(buttonEvent, action, null);

        verify(guild, never()).retrieveMember(any());
        verify(ticketActionExecutor).executeTicketAction(hook, guild, member, user, channel, "msg_btn_2", action, null, null);
    }

    @Test
    @DisplayName("executeComponentAction: rejects when clickingMember or guild is null")
    void executeComponentAction_nullGuildOrClickingMember() {
        EmbedAction action = EmbedAction.builder().actionId("a1").build();

        // guild is null
        router.executeComponentAction(hook, null, member, user, channel, "m1", action, null, null);
        verify(hook).editOriginal("❌ This interactive component can only be used within a Discord server.");

        // clickingMember is null
        router.executeComponentAction(hook, guild, null, user, channel, "m1", action, null, null);
        verify(hook, atLeastOnce()).editOriginal("❌ This interactive component can only be used within a Discord server.");
    }
}
