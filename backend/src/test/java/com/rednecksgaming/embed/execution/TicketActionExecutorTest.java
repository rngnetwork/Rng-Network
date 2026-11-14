// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.execution;

import com.rednecksgaming.embed.domain.CompoundOperation;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.domain.ResponseType;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import com.rednecksgaming.embed.service.EmbedTemplateRenderer;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.SelfMember;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.requests.restaction.CacheRestAction;
import net.dv8tion.jda.api.requests.restaction.ChannelAction;
import net.dv8tion.jda.api.requests.restaction.MessageCreateAction;
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
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketActionExecutorTest {

    @Mock
    private InteractionLogRepository interactionLogRepository;

    @Mock
    private EmbedTemplateRepository embedTemplateRepository;

    @Mock
    private TemplateVariableInterpolator interpolator;

    @Mock
    private RoleActionExecutor roleActionExecutor;

    @Mock
    private DmActionExecutor dmActionExecutor;

    @Mock
    private ReplyActionExecutor replyActionExecutor;

    @Mock
    private EmbedTemplateRenderer embedTemplateRenderer;

    @Mock
    private InteractionHook hook;

    @Mock
    private Guild guild;

    @Mock
    private Member clickingMember;

    @Mock
    private Member targetMember;

    @Mock
    private SelfMember botMember;

    @Mock
    private User user;

    @Mock
    private User targetUser;

    @Mock
    private Role publicRole;

    @Mock
    private Role targetRole;

    @Mock
    private TextChannel ticketChannel;

    @Mock
    private ChannelAction<TextChannel> channelAction;

    @Mock
    private MessageCreateAction messageCreateAction;

    @Mock
    private CacheRestAction<PrivateChannel> pcRestAction;

    @Mock
    private PrivateChannel privateChannel;

    @Mock
    private WebhookMessageEditAction<net.dv8tion.jda.api.entities.Message> editAction;

    private TicketActionExecutor executor;

    @BeforeEach
    void setUp() {
        executor = new TicketActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                dmActionExecutor,
                replyActionExecutor,
                embedTemplateRenderer
        );
        lenient().when(hook.editOriginal(anyString())).thenReturn(editAction);
        lenient().when(guild.getId()).thenReturn("g1");
        lenient().when(user.getId()).thenReturn("u1");
        lenient().when(user.getName()).thenReturn("Applicant");
        lenient().when(interpolator.interpolate(any(), any(), any(), any(), any(), any(), any())).thenReturn("");
        lenient().when(interpolator.interpolate(any(), any(), any(), any(), any(), any(), any(), anyBoolean())).thenReturn("");
    }

    @Test
    @DisplayName("executeTicketAction rejects when bot lacks MANAGE_CHANNEL permission")
    void executeTicketAction_botLacksPermission() {
        EmbedAction action = EmbedAction.builder().actionId("t1").build();
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(false);

        executor.executeTicketAction(hook, guild, clickingMember, user, ticketChannel, "m1", action, null, null);

        verify(hook).editOriginal(contains("Bot lacks 'Manage Channels' permission"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeTicketAction succeeds and creates channel with custom welcome message and caller DM")
    void executeTicketAction_successWithDm() {
        EmbedAction action = EmbedAction.builder()
                .actionId("t2")
                .channelPrefix("apply-")
                .welcomeMessage("Welcome to applications!")
                .dmContent("Ticket opened: check your private channel.")
                .build();

        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(eq(guild), eq(clickingMember), any())).thenReturn(targetMember);
        when(roleActionExecutor.resolveTargetRole(eq(guild), eq(action), any())).thenReturn(targetRole);

        when(interpolator.resolveTicketChannelName(eq("apply-"), anyString(), eq(clickingMember), eq(targetMember)))
                .thenReturn("apply-001");

        when(guild.createTextChannel("apply-001")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);

        // Queue callback trigger
        doAnswer(invocation -> {
            Consumer<TextChannel> success = invocation.getArgument(0);
            success.accept(ticketChannel);
            return null;
        }).when(channelAction).queue(any(), any());

        when(interpolator.interpolate(eq("Welcome to applications!"), any(), any(), any(), any(), any(), any()))
                .thenReturn("Welcome to applications!");
        when(ticketChannel.sendMessage("Welcome to applications!")).thenReturn(messageCreateAction);

        when(interpolator.interpolate(eq("Ticket opened: check your private channel."), any(), any(), any(), any(), any(), any(), eq(true)))
                .thenReturn("Ticket opened: check your private channel.");
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(invocation -> {
            Consumer<PrivateChannel> success = invocation.getArgument(0);
            success.accept(privateChannel);
            return null;
        }).when(pcRestAction).queue(any());

        when(privateChannel.sendMessage("Ticket opened: check your private channel.")).thenReturn(messageCreateAction);
        when(ticketChannel.getAsMention()).thenReturn("<#ticket_001>");

        executor.executeTicketAction(hook, guild, clickingMember, user, ticketChannel, "m2", action, null, null);

        verify(ticketChannel).sendMessage("Welcome to applications!");
        verify(privateChannel).sendMessage("Ticket opened: check your private channel.");
        verify(hook).editOriginal("✅ Support ticket created: <#ticket_001>");
        verify(interactionLogRepository).save(argThat(log -> "SUCCESS".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeTicketAction handles channel creation error callback")
    void executeTicketAction_channelCreationError() {
        EmbedAction action = EmbedAction.builder().actionId("t_err").build();
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("ticket-err");

        when(guild.createTextChannel("ticket-err")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);

        doAnswer(invocation -> {
            Consumer<Throwable> failure = invocation.getArgument(1);
            failure.accept(new RuntimeException("Maximum channels reached"));
            return null;
        }).when(channelAction).queue(any(), any());

        executor.executeTicketAction(hook, guild, clickingMember, user, ticketChannel, "m3", action, null, null);

        verify(hook).editOriginal(contains("Failed to create support ticket channel: Maximum channels reached"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeTicketAction handles blank welcome message and failed DM openPrivateChannel")
    void executeTicketAction_blankWelcomeAndDmFailure() {
        EmbedAction action = EmbedAction.builder()
                .actionId("t_def")
                .welcomeMessage("")
                .dmContent("DM text")
                .build();

        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(eq(guild), eq(clickingMember), any())).thenReturn(clickingMember);
        when(clickingMember.getAsMention()).thenReturn("<@applicant>");
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("ticket-def");

        when(guild.createTextChannel("ticket-def")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);

        doAnswer(invocation -> {
            Consumer<TextChannel> success = invocation.getArgument(0);
            success.accept(ticketChannel);
            return null;
        }).when(channelAction).queue(any(), any());

        when(interpolator.interpolate(eq(""), any(), any(), any(), any(), any(), any())).thenReturn("");
        when(ticketChannel.sendMessage(contains("Welcome <@applicant> to your support ticket"))).thenReturn(messageCreateAction);

        when(interpolator.interpolate(eq("DM text"), any(), any(), any(), any(), any(), any(), eq(true))).thenReturn("DM text");
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(invocation -> {
            Consumer<PrivateChannel> success = invocation.getArgument(0);
            success.accept(privateChannel);
            return null;
        }).when(pcRestAction).queue(any());
        MessageCreateAction dmMessageAction = mock(MessageCreateAction.class);
        when(privateChannel.sendMessage("DM text")).thenReturn(dmMessageAction);
        doAnswer(invocation -> {
            Consumer<Throwable> failure = invocation.getArgument(1);
            failure.accept(new RuntimeException("DMs closed"));
            return null;
        }).when(dmMessageAction).queue(any(), any());

        executor.executeTicketAction(hook, guild, clickingMember, user, ticketChannel, "m4", action, null, null);

        verify(ticketChannel).sendMessage(contains("Welcome <@applicant> to your support ticket"));
    }

    @Test
    @DisplayName("executeTicketActionSynchronous rejects when bot lacks permission")
    void executeTicketActionSynchronous_botLacksPermission() {
        EmbedAction action = EmbedAction.builder().build();
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(false);

        ActionExecutionResult result = executor.executeTicketActionSynchronous(action, guild, clickingMember, hook, null);
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Bot lacks MANAGE_CHANNEL permission");
    }

    @Test
    @DisplayName("executeTicketActionSynchronous handles channelAction.complete() exception")
    void executeTicketActionSynchronous_completeThrows() {
        EmbedAction action = EmbedAction.builder().channelPrefix("support-").build();
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(clickingMember);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("support-01");

        when(guild.createTextChannel("support-01")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenThrow(new RuntimeException("Rate limited on channel create"));

        ActionExecutionResult result = executor.executeTicketActionSynchronous(action, guild, clickingMember, hook, null);
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Failed to create ticket channel");
    }

    @Test
    @DisplayName("executeTicketActionSynchronous: executes compound SEND_DM_TEMPLATE operation")
    void executeTicketActionSynchronous_withCompoundDmTemplate() {
        EmbedAction action = EmbedAction.builder()
                .channelPrefix("vip-")
                .compoundOperations(List.of(
                        CompoundOperation.builder()
                                .operationType(CompoundOperation.OperationType.SEND_DM_TEMPLATE)
                                .templateId("dm_tpl_vip")
                                .build()
                ))
                .build();

        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(clickingMember);
        when(clickingMember.getUser()).thenReturn(user);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("vip-001");

        when(guild.createTextChannel("vip-001")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);
        when(ticketChannel.sendMessage(anyString())).thenReturn(messageCreateAction);

        EmbedTemplate dmTpl = EmbedTemplate.builder().templateId("dm_tpl_vip").build();
        when(embedTemplateRepository.findByTemplateId("dm_tpl_vip")).thenReturn(Optional.of(dmTpl));

        Map<String, String> vars = Map.of("ticket", "001");
        when(interpolator.buildTemplateVariables(anyString(), eq(guild), eq(clickingMember), eq(clickingMember), any(), eq(ticketChannel), eq(true)))
                .thenReturn(vars);
        MessageCreateData dmData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(dmTpl, vars)).thenReturn(dmData);

        ActionExecutionResult result = executor.executeTicketActionSynchronous(action, guild, clickingMember, hook, null);

        assertThat(result.isSuccess()).isTrue();
        verify(dmActionExecutor).dispatchDMLogsWithFallback(user, ticketChannel, dmTpl, vars, dmData);
    }

    @Test
    @DisplayName("executeTicketActionSynchronous: executes direct DM content with fallback when no follow-up template")
    void executeTicketActionSynchronous_directDmContentWithoutFollowUp() {
        EmbedAction action = EmbedAction.builder()
                .channelPrefix("help-")
                .dmContent("Ticket opened successfully!")
                .responseType(ResponseType.PUBLIC_EMBED) // Not DM_EMBED
                .build();

        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(clickingMember);
        when(clickingMember.getUser()).thenReturn(user);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("help-001");

        when(guild.createTextChannel("help-001")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);
        when(ticketChannel.sendMessage(anyString())).thenReturn(messageCreateAction);

        when(interpolator.interpolate(eq("Ticket opened successfully!"), any(), any(), any(), any(), any(), isNull()))
                .thenReturn("Ticket opened successfully!");

        ActionExecutionResult result = executor.executeTicketActionSynchronous(action, guild, clickingMember, hook, null);

        assertThat(result.isSuccess()).isTrue();
        verify(dmActionExecutor).dispatchDMLogsWithFallback(eq(user), eq(ticketChannel), any(MessageCreateData.class));
    }

    @Test
    @DisplayName("executeTicketActionSynchronous: delegates to replyActionExecutor when responseEmbedTemplateId is present")
    void executeTicketActionSynchronous_delegatesToReplyActionExecutorForFollowUp() {
        EmbedAction action = EmbedAction.builder()
                .channelPrefix("ticket-")
                .responseEmbedTemplateId("tpl_followup")
                .build();

        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(clickingMember);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("ticket-100");

        when(guild.createTextChannel("ticket-100")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);
        when(ticketChannel.sendMessage(anyString())).thenReturn(messageCreateAction);

        when(replyActionExecutor.dispatchFollowUpTemplateMessage(eq(action), eq(guild), eq(clickingMember), eq(clickingMember), any(), eq(ticketChannel), eq(hook)))
                .thenReturn(ActionExecutionResult.intermediate("msg_followup_99"));

        ActionExecutionResult result = executor.executeTicketActionSynchronous(action, guild, clickingMember, hook, null);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getNewGeneratedMessageId()).isEqualTo("msg_followup_99");
    }

    @Test
    @DisplayName("executeTicketAction handles botMember == null")
    void executeTicketAction_botMemberNull() {
        EmbedAction action = EmbedAction.builder().actionId("t_bot_null").build();
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(null);

        executor.executeTicketAction(hook, guild, clickingMember, user, ticketChannel, "m1", action, null, null);

        verify(hook).editOriginal(contains("Bot lacks 'Manage Channels' permission"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeTicketAction with distinct targetMember and dmSuccess callback")
    void executeTicketAction_distinctTargetMemberAndDmSuccess() {
        EmbedAction action = EmbedAction.builder()
                .actionId("t_target")
                .channelPrefix("vip-")
                .welcomeMessage("Welcome VIP")
                .dmContent("DM text")
                .build();

        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(eq(guild), eq(clickingMember), any())).thenReturn(targetMember);
        when(roleActionExecutor.resolveTargetRole(eq(guild), eq(action), any())).thenReturn(targetRole);

        when(interpolator.resolveTicketChannelName(eq("vip-"), anyString(), eq(clickingMember), eq(targetMember)))
                .thenReturn("vip-002");

        when(guild.createTextChannel("vip-002")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);

        doAnswer(invocation -> {
            Consumer<TextChannel> success = invocation.getArgument(0);
            success.accept(ticketChannel);
            return null;
        }).when(channelAction).queue(any(), any());

        when(interpolator.interpolate(eq("Welcome VIP"), any(), any(), any(), any(), any(), any()))
                .thenReturn("Welcome VIP");
        when(ticketChannel.sendMessage("Welcome VIP")).thenReturn(messageCreateAction);

        when(interpolator.interpolate(eq("DM text"), any(), any(), any(), any(), any(), any(), eq(true))).thenReturn("DM text");
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(invocation -> {
            Consumer<PrivateChannel> success = invocation.getArgument(0);
            success.accept(privateChannel);
            return null;
        }).when(pcRestAction).queue(any());

        MessageCreateAction dmMessageAction = mock(MessageCreateAction.class);
        when(privateChannel.sendMessage("DM text")).thenReturn(dmMessageAction);
        doAnswer(invocation -> {
            Consumer<net.dv8tion.jda.api.entities.Message> success = invocation.getArgument(0);
            net.dv8tion.jda.api.entities.Message mockMsg = mock(net.dv8tion.jda.api.entities.Message.class);
            success.accept(mockMsg);
            return null;
        }).when(dmMessageAction).queue(any(), any());

        when(ticketChannel.getAsMention()).thenReturn("<#vip_002>");

        executor.executeTicketAction(hook, guild, clickingMember, user, ticketChannel, "m5", action, null, null);

        verify(ticketChannel).sendMessage("Welcome VIP");
        verify(hook).editOriginal("✅ Support ticket created: <#vip_002>");
    }

    @Test
    @DisplayName("executeTicketAction with null and blank dmContent")
    void executeTicketAction_nullAndBlankDmContent() {
        EmbedAction actionNullDm = EmbedAction.builder().actionId("t_nulldm").dmContent(null).build();
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(null);
        when(roleActionExecutor.resolveTargetRole(any(), any(), any())).thenReturn(null);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("ticket-null");
        when(guild.createTextChannel("ticket-null")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        doAnswer(invocation -> {
            Consumer<TextChannel> success = invocation.getArgument(0);
            success.accept(ticketChannel);
            return null;
        }).when(channelAction).queue(any(), any());
        when(ticketChannel.sendMessage(anyString())).thenReturn(messageCreateAction);
        when(ticketChannel.getAsMention()).thenReturn("<#ticket_null>");

        executor.executeTicketAction(hook, guild, clickingMember, user, ticketChannel, "m6", actionNullDm, null, null);
        verify(user, never()).openPrivateChannel();

        EmbedAction actionBlankDm = EmbedAction.builder().actionId("t_blankdm").dmContent("   ").build();
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("ticket-blank");
        when(guild.createTextChannel("ticket-blank")).thenReturn(channelAction);
        executor.executeTicketAction(hook, guild, clickingMember, user, ticketChannel, "m7", actionBlankDm, null, null);
        verify(user, never()).openPrivateChannel();
    }

    @Test
    @DisplayName("executeTicketActionSynchronous: botMember == null and permission check with null hook")
    void executeTicketActionSynchronous_botMemberNullAndHookNull() {
        EmbedAction action = EmbedAction.builder().build();

        // 1. botMember == null proceeds without failing
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(null);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(null);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("t-nullbot");
        when(guild.createTextChannel("t-nullbot")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);
        when(ticketChannel.sendMessage(anyString())).thenReturn(messageCreateAction);
        when(ticketChannel.getId()).thenReturn("ch_nullbot");

        ActionExecutionResult result1 = executor.executeTicketActionSynchronous(action, guild, clickingMember, null, null);
        assertThat(result1.isSuccess()).isTrue();
        assertThat(result1.isTerminal()).isTrue();

        // 2. botMember lacks permission and hook is null
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(false);
        ActionExecutionResult result2 = executor.executeTicketActionSynchronous(action, guild, clickingMember, null, null);
        assertThat(result2.isSuccess()).isFalse();
        assertThat(result2.getErrorMessage()).contains("Bot lacks MANAGE_CHANNEL permission");
    }

    @Test
    @DisplayName("executeTicketActionSynchronous: distinct targetMember, blank welcome, and hook == null in catch")
    void executeTicketActionSynchronous_distinctTargetMemberAndCatchHookNull() {
        EmbedAction action = EmbedAction.builder().channelPrefix("support-").welcomeMessage("").build();
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(targetMember);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("support-dist");

        when(guild.createTextChannel("support-dist")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);

        // When complete throws and hook is null
        when(channelAction.complete()).thenThrow(new RuntimeException("Guild channel limit reached"));
        ActionExecutionResult failResult = executor.executeTicketActionSynchronous(action, guild, clickingMember, null, null);
        assertThat(failResult.isSuccess()).isFalse();
    }

    @Test
    @DisplayName("executeTicketActionSynchronous: blank welcome message uses default greeting")
    void executeTicketActionSynchronous_blankWelcomeDefault() {
        EmbedAction action = EmbedAction.builder().channelPrefix("support-").welcomeMessage("").build();
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(targetMember);
        when(clickingMember.getAsMention()).thenReturn("<@op>");
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("support-blank");

        when(guild.createTextChannel("support-blank")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);
        when(interpolator.interpolate(eq(""), any(), any(), any(), any(), any(), isNull())).thenReturn("");
        when(ticketChannel.sendMessage(contains("Welcome <@op> to your support ticket"))).thenReturn(messageCreateAction);
        when(ticketChannel.getId()).thenReturn("ch_blank");

        ActionExecutionResult successResult = executor.executeTicketActionSynchronous(action, guild, clickingMember, null, null);
        assertThat(successResult.isSuccess()).isTrue();
        verify(ticketChannel).sendMessage(contains("Welcome <@op> to your support ticket"));
    }

    @Test
    @DisplayName("executeTicketActionSynchronous: compound operations edge cases (null template, empty renderer, fallback recipient)")
    void executeTicketActionSynchronous_compoundOpsEdgeCases() {
        EmbedAction actionWithEmptyTpl = EmbedAction.builder()
                .channelPrefix("vip-")
                .compoundOperations(List.of(
                        CompoundOperation.builder().operationType(CompoundOperation.OperationType.SEND_DM_TEMPLATE).templateId("not_found").build()
                ))
                .build();

        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(targetMember);
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("vip-comp");
        when(guild.createTextChannel("vip-comp")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);
        when(ticketChannel.sendMessage(anyString())).thenReturn(messageCreateAction);
        when(embedTemplateRepository.findByTemplateId("not_found")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findById("not_found")).thenReturn(Optional.empty());

        // Template not found: does not throw, finishes cleanly
        ActionExecutionResult res1 = executor.executeTicketActionSynchronous(actionWithEmptyTpl, guild, clickingMember, hook, null);
        assertThat(res1.isSuccess()).isTrue();

        // Template found, but operator user is null and targetMember user is present
        when(clickingMember.getUser()).thenReturn(null);
        when(targetMember.getUser()).thenReturn(targetUser);
        EmbedTemplate dmTpl = EmbedTemplate.builder().templateId("tpl_target").build();
        when(embedTemplateRepository.findByTemplateId("tpl_target")).thenReturn(Optional.of(dmTpl));
        EmbedAction actionWithTargetRecipient = EmbedAction.builder()
                .channelPrefix("vip-")
                .compoundOperations(List.of(
                        CompoundOperation.builder().operationType(CompoundOperation.OperationType.SEND_DM_TEMPLATE).templateId("tpl_target").build()
                ))
                .build();

        Map<String, String> vars = Map.of("k", "v");
        when(interpolator.buildTemplateVariables(anyString(), any(), any(), any(), any(), any(), eq(true))).thenReturn(vars);
        MessageCreateData data = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(dmTpl, vars)).thenReturn(data);

        ActionExecutionResult res2 = executor.executeTicketActionSynchronous(actionWithTargetRecipient, guild, clickingMember, hook, null);
        assertThat(res2.isSuccess()).isTrue();
        verify(dmActionExecutor).dispatchDMLogsWithFallback(targetUser, ticketChannel, dmTpl, vars, data);

        // Both operator user and targetMember user null -> dmRecipient == null
        when(targetMember.getUser()).thenReturn(null);
        ActionExecutionResult res3 = executor.executeTicketActionSynchronous(actionWithTargetRecipient, guild, clickingMember, hook, null);
        assertThat(res3.isSuccess()).isTrue();

        // Empty compound operations list
        EmbedAction emptyOpsAction = EmbedAction.builder().compoundOperations(Collections.emptyList()).build();
        ActionExecutionResult res4 = executor.executeTicketActionSynchronous(emptyOpsAction, guild, clickingMember, hook, null);
        assertThat(res4.isSuccess()).isTrue();

        // Non-empty compound operations list with different operation type
        EmbedAction otherOpAction = EmbedAction.builder()
                .compoundOperations(List.of(CompoundOperation.builder().operationType(CompoundOperation.OperationType.CREATE_TICKET).build()))
                .build();
        ActionExecutionResult res5 = executor.executeTicketActionSynchronous(otherOpAction, guild, clickingMember, hook, null);
        assertThat(res5.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("executeTicketActionSynchronous: direct dmContent with hasFollowUpDm branches")
    void executeTicketActionSynchronous_directDmFollowUpBranches() {
        when(roleActionExecutor.resolveBotMember(guild)).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(true);
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(null);
        when(clickingMember.getUser()).thenReturn(null); // operator user null
        when(interpolator.resolveTicketChannelName(any(), anyString(), any(), any())).thenReturn("dm-branch");
        when(guild.createTextChannel("dm-branch")).thenReturn(channelAction);
        when(guild.getPublicRole()).thenReturn(publicRole);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);
        when(channelAction.complete()).thenReturn(ticketChannel);
        when(ticketChannel.sendMessage(anyString())).thenReturn(messageCreateAction);

        // 1. hasFollowUpDm == true because responseEmbedTemplateId is set and responseType is null -> skips direct DM
        EmbedAction actionFollowUpNull = EmbedAction.builder()
                .dmContent("DM text")
                .responseEmbedTemplateId("tpl_followup")
                .responseType(null)
                .build();
        when(replyActionExecutor.dispatchFollowUpTemplateMessage(eq(actionFollowUpNull), any(), any(), any(), any(), any(), any()))
                .thenReturn(ActionExecutionResult.success("dispatched"));

        executor.executeTicketActionSynchronous(actionFollowUpNull, guild, clickingMember, hook, null);
        verify(dmActionExecutor, never()).dispatchDMLogsWithFallback(any(), any(), any(MessageCreateData.class));

        // 2. hasFollowUpDm == true because responseEmbedTemplateId is set and responseType == DM_EMBED -> skips direct DM
        EmbedAction actionFollowUpDm = EmbedAction.builder()
                .dmContent("DM text")
                .responseEmbedTemplateId("tpl_followup")
                .responseType(ResponseType.DM_EMBED)
                .build();
        when(replyActionExecutor.dispatchFollowUpTemplateMessage(eq(actionFollowUpDm), any(), any(), any(), any(), any(), any()))
                .thenReturn(ActionExecutionResult.success("dispatched"));

        executor.executeTicketActionSynchronous(actionFollowUpDm, guild, clickingMember, hook, null);
        verify(dmActionExecutor, never()).dispatchDMLogsWithFallback(any(), any(), any(MessageCreateData.class));

        // 3. hasFollowUpDm == false, operator user is null, targetMember user is present
        when(roleActionExecutor.resolveTargetMember(any(), any(), any())).thenReturn(targetMember);
        when(targetMember.getUser()).thenReturn(targetUser);
        EmbedAction actionDirectTarget = EmbedAction.builder()
                .dmContent("Ticket opened")
                .responseEmbedTemplateId("") // blank responseEmbedTemplateId
                .build();
        when(interpolator.interpolate(eq("Ticket opened"), any(), any(), any(), any(), any(), isNull())).thenReturn("Ticket opened");

        executor.executeTicketActionSynchronous(actionDirectTarget, guild, clickingMember, hook, null);
        verify(dmActionExecutor).dispatchDMLogsWithFallback(eq(targetUser), eq(ticketChannel), any(MessageCreateData.class));

        // 4. dmContent non-blank but both operator and targetMember user are null -> dmRecipient == null
        when(targetMember.getUser()).thenReturn(null);
        executor.executeTicketActionSynchronous(actionDirectTarget, guild, clickingMember, hook, null);
    }

    @Test
    @DisplayName("resolveTemplate reflection coverage for null, blank, findByTemplateId, and findById")
    void resolveTemplate_coverage() {
        // Null
        Optional<EmbedTemplate> t1 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", (String) null);
        assertThat(t1).isEmpty();

        // Blank
        Optional<EmbedTemplate> t2 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", "   ");
        assertThat(t2).isEmpty();

        // Found by templateId
        EmbedTemplate tpl1 = EmbedTemplate.builder().templateId("t1").build();
        when(embedTemplateRepository.findByTemplateId("t1")).thenReturn(Optional.of(tpl1));
        Optional<EmbedTemplate> res1 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", "t1");
        assertThat(res1).contains(tpl1);

        // Found by id fallback
        when(embedTemplateRepository.findByTemplateId("mongo_id")).thenReturn(Optional.empty());
        EmbedTemplate tpl2 = EmbedTemplate.builder().id("mongo_id").build();
        when(embedTemplateRepository.findById("mongo_id")).thenReturn(Optional.of(tpl2));
        Optional<EmbedTemplate> res2 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", "mongo_id");
        assertThat(res2).contains(tpl2);

        // Not found by either
        when(embedTemplateRepository.findByTemplateId("none")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findById("none")).thenReturn(Optional.empty());
        Optional<EmbedTemplate> res3 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", "none");
        assertThat(res3).isEmpty();
    }

    @Test
    @DisplayName("recordAuditLog handles null action and repository exceptions gracefully")
    void recordAuditLog_coverage() {
        // Null action
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(
                executor, "recordAuditLog", null, "g1", "c1", "m1", "u1", "user", "SUCCESS", "details"
        );
        verify(interactionLogRepository).save(argThat(log -> "unknown".equals(log.getActionId()) && log.getActionType() == null));

        // Repository exception
        doThrow(new RuntimeException("Mongo down")).when(interactionLogRepository).save(any());
        EmbedAction action = EmbedAction.builder().actionId("a1").build();
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(
                executor, "recordAuditLog", action, "g1", "c1", "m1", "u1", "user", "FAILED", "details"
        ); // Does not throw
    }
}
