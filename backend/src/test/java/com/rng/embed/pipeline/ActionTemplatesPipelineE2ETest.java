package com.rng.embed.pipeline;

import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.CompoundOperation;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.EmbedTemplate;
import com.rng.embed.domain.ResponseType;
import com.rng.embed.domain.RoleSubtype;
import com.rng.embed.dto.ActionExecutionResult;
import com.rng.embed.repository.EmbedActionRepository;
import com.rng.embed.repository.EmbedTemplateRepository;
import com.rng.embed.repository.InteractionLogRepository;
import com.rng.embed.service.ActionExecutionServiceImpl;
import com.rng.embed.service.EmbedTemplateRenderer;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.SelfMember;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.requests.restaction.AuditableRestAction;
import net.dv8tion.jda.api.requests.restaction.CacheRestAction;
import net.dv8tion.jda.api.requests.restaction.ChannelAction;
import net.dv8tion.jda.api.requests.restaction.MessageCreateAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageCreateAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageEditAction;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * End-to-end pipeline verification test for Action-Templates-V2 canonical
 * 3-stage interactive chaining pipeline (Dynamic Selectors -> Role Grant
 * with Public Template 2 Reply -> Stage 2 Private Ticket Provisioning with DM Logs Fallback).
 */
@ExtendWith(MockitoExtension.class)
class ActionTemplatesPipelineE2ETest {

    @Mock
    private InteractionLogRepository interactionLogRepository;

    @Mock
    private EmbedTemplateRepository embedTemplateRepository;

    @Mock
    private EmbedActionRepository embedActionRepository;

    @Mock
    private EmbedTemplateRenderer embedTemplateRenderer;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private Guild mockGuild;

    @Mock
    private Member mockOperator;

    @Mock
    private User mockOperatorUser;

    @Mock
    private Member mockTargetMember;

    @Mock
    private User mockTargetUser;

    @Mock
    private Role mockTargetRole;

    @Mock
    private Role mockOperatorRole;

    @Mock
    private SelfMember mockBotMember;

    @Mock
    private InteractionHook mockHook;

    @Mock
    private AuditableRestAction<Void> voidAction;

    @Mock
    private WebhookMessageEditAction<net.dv8tion.jda.api.entities.Message> editAction;

    @Mock
    private ChannelAction<TextChannel> channelAction;

    @Mock
    private TextChannel mockTicketChannel;

    private ActionExecutionServiceImpl actionExecutionService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        actionExecutionService = new ActionExecutionServiceImpl(
                interactionLogRepository,
                embedTemplateRepository,
                embedActionRepository,
                embedTemplateRenderer,
                redisTemplate
        );

        lenient().when(mockGuild.getId()).thenReturn("guild-999");
        lenient().when(mockGuild.getName()).thenReturn("RNG War Network");
        lenient().when(mockGuild.getSelfMember()).thenReturn(mockBotMember);

        lenient().when(mockOperator.getId()).thenReturn("user-111");
        lenient().when(mockOperator.getUser()).thenReturn(mockOperatorUser);
        lenient().when(mockOperator.getAsMention()).thenReturn("<@user-111>");
        lenient().when(mockOperatorUser.getId()).thenReturn("user-111");

        lenient().when(mockTargetMember.getId()).thenReturn("user-222");
        lenient().when(mockTargetMember.getUser()).thenReturn(mockTargetUser);
        lenient().when(mockTargetMember.getAsMention()).thenReturn("<@user-222>");
        lenient().when(mockTargetUser.getId()).thenReturn("user-222");

        lenient().when(mockTargetRole.getId()).thenReturn("role-333");
        lenient().when(mockTargetRole.getName()).thenReturn("Elite Legionnaire");
        lenient().when(mockTargetRole.getPosition()).thenReturn(5);
        lenient().when(mockTargetRole.isPublicRole()).thenReturn(false);
        lenient().when(mockTargetRole.isManaged()).thenReturn(false);
        lenient().when(mockTargetRole.getAsMention()).thenReturn("<@&role-333>");
        lenient().when(mockOperator.isOwner()).thenReturn(false);

        lenient().when(mockOperatorRole.getPosition()).thenReturn(15);
        lenient().when(mockOperator.getRoles()).thenReturn(List.of(mockOperatorRole));

        lenient().when(mockBotMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        lenient().when(mockBotMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        lenient().when(mockBotMember.canInteract(mockTargetRole)).thenReturn(true);

        lenient().when(mockGuild.getRoleById("role-333")).thenReturn(mockTargetRole);
        lenient().when(mockGuild.getMemberById("user-222")).thenReturn(mockTargetMember);
        lenient().when(mockTargetMember.getEffectiveName()).thenReturn("Legionnaire222");
        lenient().when(mockHook.editOriginal(anyString())).thenReturn(editAction);
    }

    @Test
    @DisplayName("Should execute canonical 3-stage action chaining pipeline end-to-end")
    @SuppressWarnings("unchecked")
    void should_execute_canonical_3_stage_action_chain() {
        // --- STAGE 0: Operator dynamic selections saved in Redis session ---
        Map<String, String> sessionData = new HashMap<>();
        sessionData.put("originCaller", "user-111");
        sessionData.put("targetUser", "user-222");
        sessionData.put("targetRole", "role-333");
        sessionData.put("originMessageId", "msg-stage0");

        // --- STAGE 1: Role Grant with Template 2 Intermediate Reply ---
        EmbedTemplate template2 = EmbedTemplate.builder()
                .templateId("tpl_template_2")
                .name("Template 2 Intermediate")
                .description("Role modification public embed")
                .payload(Map.of("content", "Role granted to {targetUser}!"))
                .build();
        when(embedTemplateRepository.findById("tpl_template_2")).thenReturn(Optional.of(template2));

        EmbedAction action1 = EmbedAction.builder()
                .actionId("rng_act_stage1_role")
                .name("Stage 1 Role Grant")
                .actionType(ActionType.ROLE)
                .roleSubtype(RoleSubtype.ADD)
                .requiredUser(true)
                .requiredRole(true)
                .responseType(ResponseType.PUBLIC_EMBED)
                .responseEmbedTemplateId("tpl_template_2")
                .build();
        when(embedActionRepository.findByActionId("rng_act_stage1_role")).thenReturn(Optional.of(action1));

        when(mockGuild.addRoleToMember(eq(mockTargetMember), eq(mockTargetRole))).thenReturn(voidAction);

        MessageCreateData renderedTemplate2 = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(template2), anyMap())).thenReturn(renderedTemplate2);

        WebhookMessageCreateAction<Message> sendMsgAction = mock(WebhookMessageCreateAction.class);
        when(mockHook.sendMessage(renderedTemplate2)).thenReturn(sendMsgAction);
        Message intermediateMsg = mock(Message.class);
        when(intermediateMsg.getId()).thenReturn("msg-intermediate-stage1");
        when(sendMsgAction.complete()).thenReturn(intermediateMsg);

        ActionExecutionResult stage1Result = actionExecutionService.executeComponentAction(
                "rng_act_stage1_role", mockGuild, mockOperator, mockHook, sessionData);

        assertThat(stage1Result.isSuccess()).isTrue();
        assertThat(stage1Result.isTerminal()).isFalse();
        assertThat(stage1Result.getNewGeneratedMessageId()).isEqualTo("msg-intermediate-stage1");
        verify(mockGuild).addRoleToMember(mockTargetMember, mockTargetRole);
        verify(mockHook).sendMessage(renderedTemplate2);

        // --- STAGE 2: Follow-Up Action (Compound Ticket + DM Logs) ---
        EmbedTemplate template3 = EmbedTemplate.builder()
                .templateId("tpl_template_3")
                .name("Template 3 DM Logs")
                .description("Detailed audit logs")
                .payload(Map.of("content", "Log: Role {targetRole} granted."))
                .build();
        when(embedTemplateRepository.findById("tpl_template_3")).thenReturn(Optional.of(template3));

        EmbedAction action2 = EmbedAction.builder()
                .actionId("rng_act_stage2_compound")
                .name("Stage 2 Ticket and DM")
                .actionType(ActionType.TICKET)
                .channelPrefix("ticket-")
                .compoundOperations(List.of(
                        CompoundOperation.builder()
                                .operationType(CompoundOperation.OperationType.CREATE_TICKET)
                                .channelPrefix("ticket-")
                                .membersToAdd(List.of("CALLER", "TARGET_USER"))
                                .build(),
                        CompoundOperation.builder()
                                .operationType(CompoundOperation.OperationType.SEND_DM_TEMPLATE)
                                .templateId("tpl_template_3")
                                .build()
                ))
                .build();
        when(embedActionRepository.findByActionId("rng_act_stage2_compound")).thenReturn(Optional.of(action2));

        Role publicRole = mock(Role.class);
        when(mockGuild.getPublicRole()).thenReturn(publicRole);

        when(mockGuild.createTextChannel(startsWith("ticket-"))).thenReturn(channelAction);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(mockTicketChannel);
        when(mockTicketChannel.getId()).thenReturn("chan-ticket-777");

        MessageCreateData renderedTemplate3 = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(template3), anyMap())).thenReturn(renderedTemplate3);

        CacheRestAction<PrivateChannel> dmRestAction = mock(CacheRestAction.class);
        when(mockOperatorUser.openPrivateChannel()).thenReturn(dmRestAction);
        PrivateChannel pc = mock(PrivateChannel.class);
        when(dmRestAction.complete()).thenReturn(pc);
        MessageCreateAction createMsgAction = mock(MessageCreateAction.class);
        when(pc.sendMessage(any(MessageCreateData.class))).thenReturn(createMsgAction);

        ActionExecutionResult stage2Result = actionExecutionService.executeCompoundAction(
                "rng_act_stage2_compound", mockGuild, mockOperator, mockHook, sessionData);

        assertThat(stage2Result.isSuccess()).isTrue();
        assertThat(stage2Result.isTerminal()).isTrue();
        assertThat(stage2Result.getTicketId()).isNotNull();
        assertThat(stage2Result.getChannelId()).isEqualTo("chan-ticket-777");

        verify(channelAction, atLeastOnce()).addPermissionOverride(eq(publicRole), any(), any());
        verify(channelAction, atLeastOnce()).addPermissionOverride(eq(mockOperator), any(), any());
        verify(channelAction, atLeastOnce()).addPermissionOverride(eq(mockTargetMember), any(), any());
        verify(pc).sendMessage(renderedTemplate3);
    }

    @Test
    @DisplayName("Should strictly reject role grant when operator is below target role in Discord hierarchy")
    void should_strictly_prohibit_role_grant_when_operator_is_below_target_role() {
        Role lowOperatorRole = mock(Role.class);
        when(lowOperatorRole.getPosition()).thenReturn(3); // Below target role position 5
        when(mockOperator.getRoles()).thenReturn(List.of(lowOperatorRole));
        when(mockOperator.isOwner()).thenReturn(false);

        Map<String, String> sessionData = Map.of(
                "targetUser", "user-222",
                "targetRole", "role-333"
        );

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role")
                .actionType(ActionType.ROLE)
                .roleSubtype(RoleSubtype.ADD)
                .build();
        when(embedActionRepository.findByActionId("rng_act_role")).thenReturn(Optional.of(action));

        ActionExecutionResult result = actionExecutionService.executeComponentAction(
                "rng_act_role", mockGuild, mockOperator, mockHook, sessionData);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Role hierarchy violation");
        verify(mockGuild, never()).addRoleToMember(any(Member.class), any(Role.class));
        verify(mockHook).editOriginal(contains("Hierarchy violation"));
    }

    @Test
    @DisplayName("Should permit role grant when operator is server owner regardless of role position")
    void should_permit_role_grant_when_operator_is_server_owner_regardless_of_role_position() {
        when(mockOperator.isOwner()).thenReturn(true); // Discord server owner exception
        lenient().when(mockOperator.getRoles()).thenReturn(Collections.emptyList()); // Zero roles

        boolean permitted = actionExecutionService.canOperatorAssignRole(mockOperator, mockTargetRole);
        assertThat(permitted).isTrue();
    }

    @Test
    @DisplayName("Should fail closed when compulsory target role selection is missing")
    void should_fail_closed_when_compulsory_role_selection_is_missing() {
        Map<String, String> sessionDataWithoutRole = Map.of(
                "targetUser", "user-222"
        );

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role")
                .actionType(ActionType.ROLE)
                .roleSubtype(RoleSubtype.ADD)
                .build();
        when(embedActionRepository.findByActionId("rng_act_role")).thenReturn(Optional.of(action));

        ActionExecutionResult result = actionExecutionService.executeComponentAction(
                "rng_act_role", mockGuild, mockOperator, mockHook, sessionDataWithoutRole);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Target role not found or not selected");
        verify(mockHook).editOriginal(contains("Role configuration error: No target role was selected"));
        verify(mockGuild, never()).addRoleToMember(any(Member.class), any(Role.class));
    }

    @Test
    @DisplayName("Should deliver fallback message to ticket channel when operator DM is closed")
    @SuppressWarnings("unchecked")
    void should_fallback_to_ticket_channel_when_user_dm_is_closed() {
        CacheRestAction<PrivateChannel> dmRestAction = mock(CacheRestAction.class);
        when(mockOperatorUser.openPrivateChannel()).thenReturn(dmRestAction);
        when(dmRestAction.complete()).thenThrow(new RuntimeException("Cannot send to user (DMs disabled)"));

        MessageCreateAction createAction = mock(MessageCreateAction.class);
        when(mockTicketChannel.sendMessage(any(MessageCreateData.class))).thenReturn(createAction);

        MessageCreateData logData = mock(MessageCreateData.class);

        ActionExecutionResult result = actionExecutionService.dispatchDMLogsWithFallback(
                mockOperatorUser, mockTicketChannel, logData);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.isDmDelivered()).isFalse();
        verify(mockTicketChannel).sendMessage(logData);
    }
}
