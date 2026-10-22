package com.rednecksgaming.embed.execution;

import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.embed.domain.CompoundOperation;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedActionRepository;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.service.EmbedTemplateRenderer;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.requests.restaction.ChannelAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageEditAction;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompoundActionExecutorTest {

    @Mock
    private EmbedActionRepository embedActionRepository;

    @Mock
    private EmbedTemplateRepository embedTemplateRepository;

    @Mock
    private TemplateVariableInterpolator interpolator;

    @Mock
    private RoleActionExecutor roleActionExecutor;

    @Mock
    private DmActionExecutor dmActionExecutor;

    @Mock
    private EmbedTemplateRenderer embedTemplateRenderer;

    @Mock
    private Guild guild;

    @Mock
    private Member operator;

    @Mock
    private Member targetMember;

    @Mock
    private Member botMember;

    @Mock
    private Role publicRole;

    @Mock
    private Role targetRole;

    @Mock
    private TextChannel ticketChannel;

    @Mock
    private InteractionHook hook;

    @Mock
    private User operatorUser;

    @Mock
    private User targetUser;

    @Mock
    private ChannelAction<TextChannel> channelAction;

    @Mock
    private WebhookMessageEditAction<net.dv8tion.jda.api.entities.Message> editAction;

    private CompoundActionExecutor executor;

    @BeforeEach
    void setUp() {
        executor = new CompoundActionExecutor(
                embedActionRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                dmActionExecutor,
                embedTemplateRenderer
        );
        lenient().when(hook.editOriginal(anyString())).thenReturn(editAction);
    }

    @Test
    @DisplayName("executeCompoundAction throws ResourceNotFoundException when action does not exist")
    void executeCompoundAction_actionNotFound() {
        when(embedActionRepository.findByActionId("act_404")).thenReturn(Optional.empty());
        when(embedActionRepository.findById("act_404")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> executor.executeCompoundAction("act_404", guild, operator, hook, Collections.emptyMap()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Action not found: act_404");
    }

    @Test
    @DisplayName("executeCompoundAction returns failure when bot lacks MANAGE_CHANNEL permission")
    void executeCompoundAction_botLacksPermission() {
        EmbedAction action = EmbedAction.builder().actionId("act_ticket").build();
        when(embedActionRepository.findByActionId("act_ticket")).thenReturn(Optional.of(action));
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(false);

        ActionExecutionResult result = executor.executeCompoundAction("act_ticket", guild, operator, hook, Collections.emptyMap());

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Bot lacks MANAGE_CHANNEL permission");
        verify(hook).editOriginal(contains("Bot lacks 'Manage Channels' permission"));

        // When hook is null, no exception should be thrown
        ActionExecutionResult resultNullHook = executor.executeCompoundAction("act_ticket", guild, operator, null, Collections.emptyMap());
        assertThat(resultNullHook.isSuccess()).isFalse();
    }

    @Test
    @DisplayName("executeCompoundAction returns failure when text channel creation fails")
    void executeCompoundAction_channelCreationThrows() {
        EmbedAction action = EmbedAction.builder()
                .actionId("act_ticket_err")
                .channelPrefix("support-")
                .build();
        when(embedActionRepository.findByActionId("act_ticket_err")).thenReturn(Optional.of(action));
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(guild, operator, Collections.emptyMap())).thenReturn(operator);
        when(roleActionExecutor.resolveTargetRole(guild, action, Collections.emptyMap())).thenReturn(targetRole);
        when(interpolator.resolveTicketChannelName(eq("support-"), anyString(), eq(operator), eq(operator))).thenReturn("support-001");

        when(guild.createTextChannel("support-001")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenThrow(new RuntimeException("Discord API 50035"));

        ActionExecutionResult result = executor.executeCompoundAction("act_ticket_err", guild, operator, hook, Collections.emptyMap());

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Failed to create ticket channel");
        verify(hook).editOriginal(contains("Failed to create support ticket channel"));

        // When hook is null
        ActionExecutionResult resultNullHook = executor.executeCompoundAction("act_ticket_err", guild, operator, null, Collections.emptyMap());
        assertThat(resultNullHook.isSuccess()).isFalse();
    }

    @Test
    @DisplayName("executeCompoundAction succeeds with distinct target member, executes SEND_DM_TEMPLATE, and resolves action by id fallback")
    void executeCompoundAction_successWithDmAndTargetMember() {
        EmbedAction action = EmbedAction.builder()
                .id("obj_id_123")
                .actionId("act_chained")
                .channelPrefix("ticket-")
                .compoundOperations(List.of(
                        CompoundOperation.builder()
                                .operationType(CompoundOperation.OperationType.CREATE_TICKET)
                                .build(),
                        CompoundOperation.builder()
                                .operationType(CompoundOperation.OperationType.SEND_DM_TEMPLATE)
                                .templateId("dm_tpl_001")
                                .build()
                ))
                .build();

        // Test fallback lookup by MongoDB _id
        when(embedActionRepository.findByActionId("obj_id_123")).thenReturn(Optional.empty());
        when(embedActionRepository.findById("obj_id_123")).thenReturn(Optional.of(action));

        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(eq(guild), eq(operator), any())).thenReturn(targetMember);
        when(roleActionExecutor.resolveTargetRole(eq(guild), eq(action), any())).thenReturn(targetRole);

        when(operator.getUser()).thenReturn(operatorUser);

        when(interpolator.resolveTicketChannelName(eq("ticket-"), anyString(), eq(operator), eq(targetMember)))
                .thenReturn("ticket-target-abc");

        when(guild.createTextChannel("ticket-target-abc")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);
        when(ticketChannel.getId()).thenReturn("chan_ticket_999");

        EmbedTemplate dmTemplate = EmbedTemplate.builder().templateId("dm_tpl_001").build();
        when(embedTemplateRepository.findByTemplateId("dm_tpl_001")).thenReturn(Optional.of(dmTemplate));

        Map<String, String> vars = Map.of("ticketId", "123456");
        when(interpolator.buildTemplateVariables(anyString(), eq(guild), eq(operator), eq(targetMember), eq(targetRole), eq(ticketChannel), eq(true)))
                .thenReturn(vars);
        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(dmTemplate, vars)).thenReturn(msgData);

        ActionExecutionResult result = executor.executeCompoundAction("obj_id_123", guild, operator, hook, Map.of("key", "val"));

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getChannelId()).isEqualTo("chan_ticket_999");
        assertThat(result.isTerminal()).isTrue();
        assertThat(result.getTicketId()).hasSize(6);

        verify(dmActionExecutor).dispatchDMLogsWithFallback(operatorUser, ticketChannel, dmTemplate, vars, msgData);
        verify(hook).editOriginal("✅ Created ticket #ticket-target-abc");
    }

    @Test
    @DisplayName("executeCompoundAction dispatches DM to targetUser when operator user is null")
    void executeCompoundAction_dmToTargetUserWhenOperatorUserNull() {
        EmbedAction action = EmbedAction.builder()
                .actionId("act_dm_target")
                .compoundOperations(List.of(
                        CompoundOperation.builder()
                                .operationType(CompoundOperation.OperationType.SEND_DM_TEMPLATE)
                                .templateId("dm_tpl_by_id")
                                .build()
                ))
                .build();

        when(embedActionRepository.findByActionId("act_dm_target")).thenReturn(Optional.of(action));
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(eq(guild), eq(operator), any())).thenReturn(targetMember);
        when(roleActionExecutor.resolveTargetRole(eq(guild), eq(action), any())).thenReturn(targetRole);

        when(operator.getUser()).thenReturn(null);
        when(targetMember.getUser()).thenReturn(targetUser);

        when(interpolator.resolveTicketChannelName(any(), anyString(), eq(operator), eq(targetMember)))
                .thenReturn("ticket-123456");

        when(guild.createTextChannel("ticket-123456")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);

        // Fallback resolution for template by _id
        when(embedTemplateRepository.findByTemplateId("dm_tpl_by_id")).thenReturn(Optional.empty());
        EmbedTemplate dmTemplate = EmbedTemplate.builder().id("dm_tpl_by_id").build();
        when(embedTemplateRepository.findById("dm_tpl_by_id")).thenReturn(Optional.of(dmTemplate));

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(dmTemplate), any())).thenReturn(msgData);

        ActionExecutionResult result = executor.executeCompoundAction("act_dm_target", guild, operator, null, Collections.emptyMap());

        assertThat(result.isSuccess()).isTrue();
        verify(dmActionExecutor).dispatchDMLogsWithFallback(eq(targetUser), eq(ticketChannel), eq(dmTemplate), any(), eq(msgData));
    }

    @Test
    @DisplayName("executeCompoundAction handles blank templateId, null renderer, or null recipient gracefully")
    void executeCompoundAction_edgeCasesInDmOperations() {
        // Test with executor without renderer
        CompoundActionExecutor executorNoRenderer = new CompoundActionExecutor(
                embedActionRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                dmActionExecutor,
                null
        );

        EmbedAction action = EmbedAction.builder()
                .actionId("act_no_op")
                .compoundOperations(List.of(
                        CompoundOperation.builder()
                                .operationType(CompoundOperation.OperationType.SEND_DM_TEMPLATE)
                                .templateId("") // blank template ID
                                .build(),
                        CompoundOperation.builder()
                                .operationType(CompoundOperation.OperationType.SEND_DM_TEMPLATE)
                                .templateId("valid_tpl")
                                .build()
                ))
                .build();

        when(embedActionRepository.findByActionId("act_no_op")).thenReturn(Optional.of(action));
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(null); // bot member null branch
        when(roleActionExecutor.resolveTargetMember(eq(guild), eq(operator), any())).thenReturn(null);
        when(interpolator.resolveTicketChannelName(any(), anyString(), eq(operator), isNull())).thenReturn("ticket-def");

        when(guild.createTextChannel("ticket-def")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);

        ActionExecutionResult result = executorNoRenderer.executeCompoundAction("act_no_op", guild, operator, hook, Collections.emptyMap());
        assertThat(result.isSuccess()).isTrue();
        verify(dmActionExecutor, never()).dispatchDMLogsWithFallback(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("executeCompoundAction handles null compoundOperations gracefully")
    void executeCompoundAction_nullCompoundOperations() {
        EmbedAction action = EmbedAction.builder()
                .actionId("act_null_ops")
                .compoundOperations(null)
                .build();

        when(embedActionRepository.findByActionId("act_null_ops")).thenReturn(Optional.of(action));
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(null);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(null);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("ticket-null-ops");

        when(guild.createTextChannel("ticket-null-ops")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);

        ActionExecutionResult result = executor.executeCompoundAction("act_null_ops", guild, operator, hook, Collections.emptyMap());
        assertThat(result.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("executeCompoundAction: action found by findById fallback and non-matching operations")
    void executeCompoundAction_findByIdFallbackAndNonMatchingOps() {
        when(embedActionRepository.findByActionId("act_by_id")).thenReturn(Optional.empty());
        EmbedAction action = EmbedAction.builder()
                .id("act_by_id")
                .actionId("act_by_id")
                .compoundOperations(List.of(
                        CompoundOperation.builder().operationType(CompoundOperation.OperationType.CREATE_TICKET).build()
                ))
                .build();
        when(embedActionRepository.findById("act_by_id")).thenReturn(Optional.of(action));

        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(null);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(null);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("ticket-ops");
        when(guild.createTextChannel("ticket-ops")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);

        ActionExecutionResult result = executor.executeCompoundAction("act_by_id", guild, operator, hook, Collections.emptyMap());
        assertThat(result.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("executeCompoundAction: channel creation throws with guild == null and hook == null")
    void executeCompoundAction_channelThrowsGuildNullHookNull() {
        EmbedAction action = EmbedAction.builder().actionId("act_null_g").build();
        when(embedActionRepository.findByActionId("act_null_g")).thenReturn(Optional.of(action));
        when(roleActionExecutor.resolveBotMember(null)).thenReturn(null);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(null);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("ticket-ng");

        // When guild is null, trying to create channel will cause an exception
        ActionExecutionResult result = executor.executeCompoundAction("act_null_g", null, operator, null, Collections.emptyMap());
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Failed to create ticket channel");
    }

    @Test
    @DisplayName("resolveTemplate coverage via reflection for null, blank, and not found")
    void resolveTemplate_coverage() {
        Optional<EmbedTemplate> t1 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", (String) null);
        assertThat(t1).isEmpty();

        Optional<EmbedTemplate> t2 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", "   ");
        assertThat(t2).isEmpty();

        when(embedTemplateRepository.findByTemplateId("none")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findById("none")).thenReturn(Optional.empty());
        Optional<EmbedTemplate> t3 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", "none");
        assertThat(t3).isEmpty();
    }
}
