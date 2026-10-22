package com.rednecksgaming.embed.execution;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import com.rednecksgaming.embed.service.DiscordDispatchService;
import com.rednecksgaming.embed.service.EmbedTemplateRenderer;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.interactions.callbacks.IReplyCallback;
import net.dv8tion.jda.api.requests.restaction.CacheRestAction;
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
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DmActionExecutorTest {

    @Mock
    private InteractionLogRepository interactionLogRepository;

    @Mock
    private EmbedTemplateRepository embedTemplateRepository;

    @Mock
    private TemplateVariableInterpolator interpolator;

    @Mock
    private RoleActionExecutor roleActionExecutor;

    @Mock
    private EmbedTemplateRenderer embedTemplateRenderer;

    @Mock
    private DiscordDispatchService discordDispatchService;

    @Mock
    private InteractionHook hook;

    @Mock
    private Guild guild;

    @Mock
    private Member clickingMember;

    @Mock
    private Member targetMember;

    @Mock
    private User user;

    @Mock
    private User targetUser;

    @Mock
    private Role targetRole;

    @Mock
    private TextChannel textChannel;

    @Mock
    private PrivateChannel privateChannel;

    @Mock
    private CacheRestAction<PrivateChannel> pcRestAction;

    @Mock
    private MessageCreateAction messageCreateAction;

    @Mock
    private WebhookMessageEditAction<net.dv8tion.jda.api.entities.Message> editAction;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private DmActionExecutor executor;

    @BeforeEach
    void setUp() {
        executor = new DmActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                embedTemplateRenderer,
                discordDispatchService
        );
        lenient().when(hook.editOriginal(anyString())).thenReturn(editAction);
        lenient().when(guild.getId()).thenReturn("g1");
        lenient().when(guild.getName()).thenReturn("RNG Command");
        lenient().when(user.getId()).thenReturn("u1");
        lenient().when(user.getName()).thenReturn("Alice");
    }

    @Test
    @DisplayName("executeDmAction: sends embed DM via REST API v10 when template configured")
    void executeDmAction_embedViaRestApi() {
        EmbedAction action = EmbedAction.builder()
                .actionId("dm_tpl_act")
                .responseEmbedTemplateId("tpl_welcome")
                .build();

        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(clickingMember);
        when(clickingMember.getUser()).thenReturn(user);

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_welcome").build();
        when(embedTemplateRepository.findByTemplateId("tpl_welcome")).thenReturn(Optional.of(template));

        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(invocation -> {
            Consumer<PrivateChannel> success = invocation.getArgument(0);
            success.accept(privateChannel);
            return null;
        }).when(pcRestAction).queue(any(), any());

        when(privateChannel.getId()).thenReturn("pc_123");
        Map<String, String> vars = Map.of("user", "Alice");
        when(interpolator.buildTemplateVariables(isNull(), eq(guild), eq(clickingMember), eq(clickingMember), any(), eq(textChannel), eq(true)))
                .thenReturn(vars);
        Map<String, Object> wirePayload = Map.of("content", "Welcome!");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(template, vars)).thenReturn(wirePayload);

        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_1", action, null, null);

        verify(discordDispatchService).dispatchToChannel("pc_123", wirePayload, null);
        verify(hook).editOriginal("✅ Direct message sent! Please check your private messages.");
        verify(interactionLogRepository).save(argThat(log -> "SUCCESS".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeDmAction: falls back to JDA pc.sendMessage when REST API fails, and handles 50007 closed DMs")
    void executeDmAction_embedJdaFallbackAndClosedDms() {
        EmbedAction action = EmbedAction.builder()
                .actionId("dm_err")
                .responseEmbedTemplateId("tpl_welcome")
                .build();

        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(clickingMember);
        when(clickingMember.getUser()).thenReturn(user);

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_welcome").build();
        when(embedTemplateRepository.findByTemplateId("tpl_welcome")).thenReturn(Optional.of(template));

        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(invocation -> {
            Consumer<PrivateChannel> success = invocation.getArgument(0);
            success.accept(privateChannel);
            return null;
        }).when(pcRestAction).queue(any(), any());

        when(privateChannel.getId()).thenReturn("pc_123");
        Map<String, Object> wirePayload = Map.of("content", "Welcome!");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(any(), any())).thenReturn(wirePayload);
        doThrow(new RuntimeException("Cloudflare blocked")).when(discordDispatchService).dispatchToChannel(anyString(), anyMap(), any());

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(any(), any())).thenReturn(msgData);
        when(privateChannel.sendMessage(msgData)).thenReturn(messageCreateAction);

        // Subcase A: JDA pc.sendMessage succeeds
        doAnswer(invocation -> {
            Consumer<net.dv8tion.jda.api.entities.Message> success = invocation.getArgument(0);
            success.accept(mock(net.dv8tion.jda.api.entities.Message.class));
            return null;
        }).when(messageCreateAction).queue(any(), any());

        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_1", action, null, null);
        verify(hook).editOriginal("✅ Direct message sent! Please check your private messages.");

        // Subcase B: JDA pc.sendMessage fails with error 50007 (Closed DMs)
        doAnswer(invocation -> {
            Consumer<Throwable> failure = invocation.getArgument(1);
            failure.accept(new RuntimeException("Error 50007: Cannot send messages to this user"));
            return null;
        }).when(messageCreateAction).queue(any(), any());

        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_1", action, null, null);
        verify(hook).editOriginal(contains("Could not send a DM. Please enable direct messages from server members"));
        verify(interactionLogRepository).save(argThat(log -> "FALLBACK".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeDmAction: handles openPrivateChannel failure for embed DM")
    void executeDmAction_openPrivateChannelError() {
        EmbedAction action = EmbedAction.builder()
                .actionId("dm_open_err")
                .responseEmbedTemplateId("tpl_welcome")
                .build();

        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(clickingMember);
        when(clickingMember.getUser()).thenReturn(user);

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_welcome").build();
        when(embedTemplateRepository.findByTemplateId("tpl_welcome")).thenReturn(Optional.of(template));

        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(invocation -> {
            Consumer<Throwable> failure = invocation.getArgument(1);
            failure.accept(new RuntimeException("Cannot open private channel"));
            return null;
        }).when(pcRestAction).queue(any(), any());

        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_1", action, null, null);
        verify(hook).editOriginal(contains("Could not open private channel. Please check your Discord Privacy Settings."));
        verify(interactionLogRepository).save(argThat(log -> "FALLBACK".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeDmAction: sends plain text DM and handles success, error, and openPrivateChannel failure")
    void executeDmAction_plainTextDm() {
        EmbedAction action = EmbedAction.builder()
                .actionId("dm_text")
                .dmContent("Hello in DMs!")
                .build();

        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(clickingMember);
        when(clickingMember.getUser()).thenReturn(user);
        when(interpolator.interpolate(eq("Hello in DMs!"), any(), any(), any(), any(), any(), any(), eq(true)))
                .thenReturn("Hello in DMs!");

        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(invocation -> {
            Consumer<PrivateChannel> success = invocation.getArgument(0);
            success.accept(privateChannel);
            return null;
        }).when(pcRestAction).queue(any(), any());

        when(privateChannel.sendMessage("Hello in DMs!")).thenReturn(messageCreateAction);

        // Success
        doAnswer(invocation -> {
            Consumer<net.dv8tion.jda.api.entities.Message> success = invocation.getArgument(0);
            success.accept(mock(net.dv8tion.jda.api.entities.Message.class));
            return null;
        }).when(messageCreateAction).queue(any(), any());

        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_1", action, null, null);
        verify(hook).editOriginal("✅ Direct message sent! Please check your private messages.");

        // Closed DMs failure on sendMessage
        doAnswer(invocation -> {
            Consumer<Throwable> failure = invocation.getArgument(1);
            failure.accept(new RuntimeException("Error 50007"));
            return null;
        }).when(messageCreateAction).queue(any(), any());

        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_1", action, null, null);
        verify(hook).editOriginal(contains("Could not send a DM. Please enable direct messages from server members in your Privacy Settings. Message:\n\nHello in DMs!"));

        // openPrivateChannel failure
        doAnswer(invocation -> {
            Consumer<Throwable> failure = invocation.getArgument(1);
            failure.accept(new RuntimeException("Privacy block"));
            return null;
        }).when(pcRestAction).queue(any(), any());

        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_1", action, null, null);
        verify(hook).editOriginal(contains("Could not open private channel. Please check your Discord Privacy Settings. Message:\n\nHello in DMs!"));
    }

    @Test
    @DisplayName("executeDmActionSynchronous: delivers DM synchronously and handles closed DM exceptions")
    void executeDmActionSynchronous_successAndClosedDms() {
        EmbedAction action = EmbedAction.builder()
                .actionId("dm_sync")
                .dmContent("Sync DM!")
                .build();

        IReplyCallback interaction = mock(IReplyCallback.class);
        when(hook.getInteraction()).thenReturn(interaction);
        when(interaction.getMessageChannel()).thenReturn(textChannel);

        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(clickingMember);
        when(clickingMember.getUser()).thenReturn(user);

        when(interpolator.interpolate(eq("Sync DM!"), any(), any(), any(), any(), any(), isNull(), eq(true)))
                .thenReturn("Sync DM!");

        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);
        when(privateChannel.sendMessage("Sync DM!")).thenReturn(messageCreateAction);

        // Success
        ActionExecutionResult result = executor.executeDmActionSynchronous(action, guild, clickingMember, hook, null);
        assertThat(result.isSuccess()).isTrue();
        verify(hook).editOriginal("✅ Direct message sent! Please check your private messages.");

        // Throws exception (e.g. 50007 closed DMs)
        when(pcRestAction.complete()).thenThrow(new RuntimeException("Discord 50007: Closed DMs"));
        ActionExecutionResult resultError = executor.executeDmActionSynchronous(action, guild, clickingMember, hook, null);
        assertThat(resultError.isSuccess()).isTrue();
        verify(hook).editOriginal(contains("Could not send a DM. Please enable direct messages in your Privacy Settings. Message:\n\nSync DM!"));

        // Null hook
        ActionExecutionResult resultNullHook = executor.executeDmActionSynchronous(action, guild, clickingMember, null, null);
        assertThat(resultNullHook.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("dispatchDMLogsWithFallback: delivers directly to user via REST and JDA when DMs are open")
    void dispatchDMLogsWithFallback_dmsOpen() {
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);
        when(privateChannel.getId()).thenReturn("pc_chan_456");

        EmbedTemplate dmTpl = EmbedTemplate.builder().templateId("dm_tpl").build();
        Map<String, String> vars = Map.of("ticket", "t1");
        Map<String, Object> wirePayload = Map.of("content", "DM logs");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(dmTpl, vars)).thenReturn(wirePayload);

        // REST dispatch to private channel
        ActionExecutionResult resultRest = executor.dispatchDMLogsWithFallback(user, textChannel, dmTpl, vars, null);
        assertThat(resultRest.isSuccess()).isTrue();
        assertThat(resultRest.isDmDelivered()).isTrue();
        verify(discordDispatchService).dispatchToChannel("pc_chan_456", wirePayload, null);

        // JDA pc.sendMessage
        MessageCreateData logData = mock(MessageCreateData.class);
        when(privateChannel.sendMessage(logData)).thenReturn(messageCreateAction);
        when(messageCreateAction.complete()).thenReturn(mock(net.dv8tion.jda.api.entities.Message.class));

        ActionExecutionResult resultJda = executor.dispatchDMLogsWithFallback(user, textChannel, logData);
        assertThat(resultJda.isSuccess()).isTrue();
        assertThat(resultJda.isDmDelivered()).isTrue();
        verify(privateChannel).sendMessage(logData);
    }

    @Test
    @DisplayName("dispatchDMLogsWithFallback: posts directly into provisioned ticket channel when user DMs are closed (Error 50007)")
    void dispatchDMLogsWithFallback_closedDmsFallbackToTicketChannel() {
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenThrow(new RuntimeException("Error 50007: Cannot send messages to this user"));

        EmbedTemplate dmTpl = EmbedTemplate.builder().templateId("dm_tpl").build();
        Map<String, String> vars = Map.of("ticket", "t1");
        Map<String, Object> wirePayload = Map.of("content", "DM logs fallback");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(dmTpl, vars)).thenReturn(wirePayload);
        when(textChannel.getId()).thenReturn("ticket_chan_789");

        // REST dispatch to ticket channel
        ActionExecutionResult resultRestFallback = executor.dispatchDMLogsWithFallback(user, textChannel, dmTpl, vars, null);
        assertThat(resultRestFallback.isSuccess()).isTrue();
        assertThat(resultRestFallback.isDmDelivered()).isFalse();
        verify(discordDispatchService).dispatchToChannel("ticket_chan_789", wirePayload, null);

        // JDA ticketChannel.sendMessage
        MessageCreateData logData = mock(MessageCreateData.class);
        when(textChannel.sendMessage(logData)).thenReturn(messageCreateAction);

        ActionExecutionResult resultJdaFallback = executor.dispatchDMLogsWithFallback(user, textChannel, logData);
        assertThat(resultJdaFallback.isSuccess()).isTrue();
        assertThat(resultJdaFallback.isDmDelivered()).isFalse();
        verify(textChannel).sendMessage(logData);
    }

    @Test
    @DisplayName("dispatchDMLogsWithFallback: handles null user, null private channel, and null ticket channel gracefully")
    void dispatchDMLogsWithFallback_failureCases() {
        // User null
        ActionExecutionResult nullUserResult = executor.dispatchDMLogsWithFallback(null, null, null);
        assertThat(nullUserResult.isSuccess()).isFalse();
        assertThat(nullUserResult.getErrorMessage()).contains("User cannot be null");

        // Private channel null and ticket channel null
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(null);
        ActionExecutionResult nullPcResult = executor.dispatchDMLogsWithFallback(user, null, null);
        assertThat(nullPcResult.isSuccess()).isFalse();
        assertThat(nullPcResult.isDmDelivered()).isFalse();
    }

    @Test
    @DisplayName("executeDmAction: template not found falls through to raw content, and covers targetMember user null")
    void executeDmAction_templateNotFoundAndTargetMemberUserNull() {
        // Target member has null user -> targetUser becomes clickingMember/user
        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(targetMember);
        when(targetMember.getUser()).thenReturn(null);
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(inv -> {
            Consumer<PrivateChannel> sc = inv.getArgument(0);
            sc.accept(privateChannel);
            return null;
        }).when(pcRestAction).queue(any(), any());
        when(privateChannel.sendMessage(anyString())).thenReturn(messageCreateAction);

        // 1. Template not found falls through to dmContent
        EmbedAction actionNotFound = EmbedAction.builder()
                .actionId("dm_not_found")
                .responseEmbedTemplateId("tpl_missing")
                .dmContent("Fallback text")
                .build();
        when(embedTemplateRepository.findByTemplateId("tpl_missing")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findById("tpl_missing")).thenReturn(Optional.empty());
        when(interpolator.interpolate(eq("Fallback text"), any(), any(), any(), any(), any(), any(), eq(true)))
                .thenReturn("Fallback text");

        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_nf", actionNotFound, null, null);
        verify(privateChannel).sendMessage("Fallback text");

        // 2. dmContent is blank, replyContent is present
        EmbedAction actionReplyFallback = EmbedAction.builder()
                .actionId("dm_reply_fallback")
                .dmContent("   ")
                .replyContent("Reply text")
                .build();
        when(interpolator.interpolate(eq("Reply text"), any(), any(), any(), any(), any(), any(), eq(true)))
                .thenReturn("Reply text");

        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_rf", actionReplyFallback, null, null);
        verify(privateChannel).sendMessage("Reply text");

        // 3. Both dmContent and replyContent blank -> default verification text
        EmbedAction actionBothBlank = EmbedAction.builder()
                .actionId("dm_both_blank")
                .dmContent("")
                .replyContent("")
                .build();
        when(interpolator.interpolate(eq(""), any(), any(), any(), any(), any(), any(), eq(true)))
                .thenReturn("");

        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_bb", actionBothBlank, null, null);
        verify(privateChannel).sendMessage("Thank you for verifying on **RNG Command**!");
    }

    @Test
    @DisplayName("executeDmAction: services absent (no REST service, no template renderer)")
    void executeDmAction_servicesAbsent() {
        DmActionExecutor minimalExecutor = new DmActionExecutor(
                interactionLogRepository, embedTemplateRepository, interpolator, roleActionExecutor, null, null
        );

        EmbedAction action = EmbedAction.builder()
                .actionId("dm_min")
                .responseEmbedTemplateId("tpl_min")
                .build();

        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(clickingMember);
        when(clickingMember.getUser()).thenReturn(user);

        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_min").build();
        when(embedTemplateRepository.findByTemplateId("tpl_min")).thenReturn(Optional.of(tpl));
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(inv -> {
            Consumer<PrivateChannel> sc = inv.getArgument(0);
            sc.accept(privateChannel);
            return null;
        }).when(pcRestAction).queue(any(), any());

        // Without renderer and without dispatch service, does not crash and finishes cleanly
        minimalExecutor.executeDmAction(hook, guild, clickingMember, user, textChannel, "msg_min", action, null, null);
    }

    @Test
    @DisplayName("executeDmActionSynchronous: extended branches (interaction exception, null target, null guild, hook null on error)")
    void executeDmActionSynchronous_extendedBranches() {
        // 1. hook.getInteraction().getMessageChannel() throws exception
        IReplyCallback interaction = mock(IReplyCallback.class);
        when(hook.getInteraction()).thenReturn(interaction);
        when(interaction.getMessageChannel()).thenThrow(new RuntimeException("Channel not accessible"));

        EmbedAction action = EmbedAction.builder()
                .actionId("dm_ex")
                .dmContent("")
                .replyContent("")
                .build();
        when(roleActionExecutor.resolveTargetMember(null, clickingMember, null)).thenReturn(null);
        when(clickingMember.getUser()).thenReturn(null);
        when(interpolator.interpolate(eq(""), isNull(), eq(clickingMember), isNull(), any(), isNull(), isNull(), eq(true)))
                .thenReturn("");

        // guild is null -> default verification text uses "server"
        ActionExecutionResult res1 = executor.executeDmActionSynchronous(action, null, clickingMember, hook, null);
        assertThat(res1.isSuccess()).isTrue();

        // 2. targetUser != null, openPrivateChannel throws exception with hook == null
        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(targetMember);
        when(targetMember.getUser()).thenReturn(targetUser);
        when(targetUser.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenThrow(new RuntimeException("Closed DMs"));
        when(interpolator.interpolate(eq(""), eq(guild), eq(clickingMember), eq(targetMember), any(), isNull(), isNull(), eq(true)))
                .thenReturn("Custom msg");

        ActionExecutionResult res2 = executor.executeDmActionSynchronous(action, guild, clickingMember, null, null);
        assertThat(res2.isSuccess()).isTrue();

        // 3. rawContent fallback to replyContent
        EmbedAction replyOnlyAction = EmbedAction.builder().dmContent(null).replyContent("Reply only").build();
        doReturn(privateChannel).when(pcRestAction).complete();
        when(privateChannel.sendMessage("Reply only")).thenReturn(messageCreateAction);
        when(interpolator.interpolate(eq("Reply only"), eq(guild), eq(clickingMember), eq(targetMember), any(), isNull(), isNull(), eq(true)))
                .thenReturn("Reply only");

        ActionExecutionResult res3 = executor.executeDmActionSynchronous(replyOnlyAction, guild, clickingMember, hook, null);
        assertThat(res3.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("dispatchDMLogsWithFallback: null restAction, REST failure fallback to JDA, and ticket channel exceptions")
    void dispatchDMLogsWithFallback_extendedBranches() {
        // 1. restAction is null -> throws IllegalStateException -> no ticket channel -> returns failure
        when(user.openPrivateChannel()).thenReturn(null);
        ActionExecutionResult res1 = executor.dispatchDMLogsWithFallback(user, null, null);
        assertThat(res1.isSuccess()).isFalse();
        assertThat(res1.getErrorMessage()).contains("RestAction for openPrivateChannel is null");

        // 2. Primary REST dispatch throws, falls back to pc.sendMessage
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);
        when(privateChannel.getId()).thenReturn("pc_err");
        EmbedTemplate dmTpl = EmbedTemplate.builder().templateId("t_err").build();
        Map<String, String> vars = Map.of();
        when(embedTemplateRenderer.renderInterpolatedWirePayload(dmTpl, vars)).thenReturn(Map.of());
        doThrow(new RuntimeException("REST DM failed")).when(discordDispatchService).dispatchToChannel("pc_err", Map.of(), null);

        MessageCreateData logData = mock(MessageCreateData.class);
        when(privateChannel.sendMessage(logData)).thenReturn(messageCreateAction);
        when(messageCreateAction.complete()).thenReturn(mock(net.dv8tion.jda.api.entities.Message.class));

        ActionExecutionResult res2 = executor.dispatchDMLogsWithFallback(user, textChannel, dmTpl, vars, logData);
        assertThat(res2.isSuccess()).isTrue();
        assertThat(res2.isDmDelivered()).isTrue();
        verify(privateChannel).sendMessage(logData);

        // 3. Fallback to ticket channel: REST throws, falls back to ticketChannel.sendMessage
        when(pcRestAction.complete()).thenThrow(new RuntimeException("Closed DMs"));
        when(textChannel.getId()).thenReturn("ticket_fail");
        doThrow(new RuntimeException("REST Ticket failed")).when(discordDispatchService).dispatchToChannel("ticket_fail", Map.of(), null);
        when(textChannel.sendMessage(logData)).thenReturn(messageCreateAction);

        ActionExecutionResult res3 = executor.dispatchDMLogsWithFallback(user, textChannel, dmTpl, vars, logData);
        assertThat(res3.isSuccess()).isTrue();
        assertThat(res3.isDmDelivered()).isFalse();
        verify(textChannel).sendMessage(logData);

        // 4. Fallback ticketChannel.sendMessage also throws -> returns failure
        doThrow(new RuntimeException("Channel deleted")).when(textChannel).sendMessage(logData);
        ActionExecutionResult res4 = executor.dispatchDMLogsWithFallback(user, textChannel, null, null, logData);
        assertThat(res4.isSuccess()).isFalse();
    }

    @Test
    @DisplayName("resolveTemplate and recordAuditLog reflection coverage")
    void helperMethods_coverage() {
        // resolveTemplate null / blank
        Optional<EmbedTemplate> t1 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", (String) null);
        assertThat(t1).isEmpty();
        Optional<EmbedTemplate> t2 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", "   ");
        assertThat(t2).isEmpty();

        // resolveTemplate findById fallback
        when(embedTemplateRepository.findByTemplateId("id_fallback")).thenReturn(Optional.empty());
        EmbedTemplate tpl = EmbedTemplate.builder().id("id_fallback").build();
        when(embedTemplateRepository.findById("id_fallback")).thenReturn(Optional.of(tpl));
        Optional<EmbedTemplate> t3 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(executor, "resolveTemplate", "id_fallback");
        assertThat(t3).contains(tpl);

        // recordAuditLog null action
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(
                executor, "recordAuditLog", null, "g1", "c1", "m1", "u1", "user", "SUCCESS", "details"
        );
        verify(interactionLogRepository).save(argThat(log -> "unknown".equals(log.getActionId()) && log.getActionType() == null));

        // recordAuditLog exception handling
        doThrow(new RuntimeException("DB error")).when(interactionLogRepository).save(any());
        EmbedAction action = EmbedAction.builder().actionId("act1").build();
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(
                executor, "recordAuditLog", action, "g1", "c1", "m1", "u1", "user", "FAILED", "details"
        ); // Does not throw
    }

    @Test
    @DisplayName("dispatchDMLogsWithFallback: REST dispatch throws, falls back to JDA sendMessage; and fallback ticketChannel throws fallbackEx")
    void dispatchDMLogsWithFallback_restCatchesAndFallbackEx() {
        // 1. Primary REST dispatch throws -> catch block (lines 221-222) -> calls pc.sendMessage
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);
        when(privateChannel.getId()).thenReturn("pc_catch");

        EmbedTemplate dmTpl = EmbedTemplate.builder().templateId("t_catch").build();
        Map<String, String> vars = Map.of("x", "y");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(dmTpl, vars)).thenReturn(Map.of("data", "1"));
        doThrow(new RuntimeException("Cloudflare DM block"))
                .when(discordDispatchService).dispatchToChannel(eq("pc_catch"), anyMap(), isNull());

        MessageCreateData logData = mock(MessageCreateData.class);
        when(privateChannel.sendMessage(logData)).thenReturn(messageCreateAction);
        when(messageCreateAction.complete()).thenReturn(mock(net.dv8tion.jda.api.entities.Message.class));

        ActionExecutionResult res1 = executor.dispatchDMLogsWithFallback(user, textChannel, dmTpl, vars, logData);
        assertThat(res1.isSuccess()).isTrue();
        assertThat(res1.isDmDelivered()).isTrue();
        verify(privateChannel).sendMessage(logData);

        // 2. Fallback to ticket channel: REST throws (lines 239-240) -> falls through to ticketChannel.sendMessage
        doReturn(pcRestAction).when(user).openPrivateChannel();
        doThrow(new RuntimeException("Closed DMs")).when(pcRestAction).complete();
        when(textChannel.getId()).thenReturn("tc_catch");
        doThrow(new RuntimeException("REST Ticket block"))
                .when(discordDispatchService).dispatchToChannel(eq("tc_catch"), anyMap(), isNull());
        when(textChannel.sendMessage(logData)).thenReturn(messageCreateAction);

        ActionExecutionResult res2 = executor.dispatchDMLogsWithFallback(user, textChannel, dmTpl, vars, logData);
        assertThat(res2.isSuccess()).isTrue();
        assertThat(res2.isDmDelivered()).isFalse();
        verify(textChannel).sendMessage(logData);

        // 3. Fallback ticketChannel.sendMessage throws -> catch block (lines 248-250)
        doThrow(new RuntimeException("Ticket channel deleted")).when(textChannel).sendMessage(logData);
        ActionExecutionResult res3 = executor.dispatchDMLogsWithFallback(user, textChannel, dmTpl, vars, logData);
        assertThat(res3.isSuccess()).isFalse();
        assertThat(res3.isDmDelivered()).isFalse();
    }

    @Test
    @DisplayName("executeDmActionSynchronous: hook is null when message succeeds, and interaction is null")
    void executeDmActionSynchronous_hookNullOnSuccessAndInteractionNull() {
        EmbedAction action = EmbedAction.builder()
                .actionId("dm_sync_null_hook")
                .dmContent("Hello")
                .build();

        // 1. hook == null on success
        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(clickingMember);
        when(clickingMember.getUser()).thenReturn(user);
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);
        when(privateChannel.sendMessage("Hello")).thenReturn(messageCreateAction);
        when(interpolator.interpolate(eq("Hello"), eq(guild), eq(clickingMember), eq(clickingMember), any(), isNull(), isNull(), eq(true)))
                .thenReturn("Hello");

        ActionExecutionResult res1 = executor.executeDmActionSynchronous(action, guild, clickingMember, null, null);
        assertThat(res1.isSuccess()).isTrue();

        // 2. hook != null but hook.getInteraction() == null
        InteractionHook mockHook = mock(InteractionHook.class);
        when(mockHook.getInteraction()).thenReturn(null);
        when(mockHook.editOriginal(anyString())).thenReturn(editAction);
        ActionExecutionResult res2 = executor.executeDmActionSynchronous(action, guild, clickingMember, mockHook, null);
        assertThat(res2.isSuccess()).isTrue();
        verify(mockHook).editOriginal(anyString());
    }

    @Test
    @DisplayName("executeDmAction: targetMember with null user and blank templateId/dmContent")
    void executeDmAction_targetMemberNullUserAndBlankFields() {
        Member mockMemberWithoutUser = mock(Member.class);
        when(mockMemberWithoutUser.getUser()).thenReturn(null);
        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(mockMemberWithoutUser);

        EmbedAction action = EmbedAction.builder()
                .actionId("dm_blank_fields")
                .responseEmbedTemplateId("   ")
                .dmContent("   ")
                .replyContent("Fallback reply")
                .build();

        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(invocation -> {
            Consumer<PrivateChannel> success = invocation.getArgument(0);
            success.accept(privateChannel);
            return null;
        }).when(pcRestAction).queue(any(), any());
        when(privateChannel.sendMessage("Fallback reply")).thenReturn(messageCreateAction);
        when(interpolator.interpolate(eq("Fallback reply"), eq(guild), eq(clickingMember), eq(mockMemberWithoutUser), any(), eq(textChannel), isNull(), eq(true)))
                .thenReturn("Fallback reply");

        // Execute async
        executor.executeDmAction(hook, guild, clickingMember, user, textChannel, "m_blank", action, null, null);
        verify(user).openPrivateChannel();
        verify(privateChannel).sendMessage("Fallback reply");
    }

    @Test
    @DisplayName("executeDmAction: discordDispatchService absent falls back to JDA sendMessage")
    void executeDmAction_discordDispatchAbsent() {
        DmActionExecutor executorNoDispatch = new DmActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                embedTemplateRenderer,
                null
        );

        EmbedAction action = EmbedAction.builder()
                .actionId("dm_no_disp")
                .responseEmbedTemplateId("tpl_dm_no_disp")
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_dm_no_disp").build();
        when(embedTemplateRepository.findByTemplateId("tpl_dm_no_disp")).thenReturn(Optional.of(tpl));

        when(roleActionExecutor.resolveTargetMember(guild, clickingMember, null)).thenReturn(clickingMember);
        when(clickingMember.getUser()).thenReturn(user);
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        doAnswer(invocation -> {
            Consumer<PrivateChannel> success = invocation.getArgument(0);
            success.accept(privateChannel);
            return null;
        }).when(pcRestAction).queue(any(), any());

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(tpl), any())).thenReturn(msgData);
        when(privateChannel.sendMessage(msgData)).thenReturn(messageCreateAction);

        executorNoDispatch.executeDmAction(hook, guild, clickingMember, user, textChannel, "m_no_disp", action, null, null);
        verify(embedTemplateRenderer).renderToMessageData(eq(tpl), any());
    }

    @Test
    @DisplayName("executeDmActionSynchronous: blank content, null guild, targetMember null user, operator null user")
    void executeDmActionSynchronous_blankContentAndNullGuildAndNullUsers() {
        EmbedAction action = EmbedAction.builder()
                .actionId("dm_sync_blank_guild_null")
                .dmContent("   ")
                .replyContent("   ")
                .build();

        Member mockTarget = mock(Member.class);
        when(mockTarget.getUser()).thenReturn(null);
        when(roleActionExecutor.resolveTargetMember(isNull(), any(), any())).thenReturn(mockTarget);

        Member mockOp = mock(Member.class);
        when(mockOp.getUser()).thenReturn(null);

        when(interpolator.interpolate(eq("   "), isNull(), eq(mockOp), eq(mockTarget), any(), isNull(), isNull(), eq(true)))
                .thenReturn("   ");

        // guild is null, targetUser resolves to null -> skips targetUser block
        ActionExecutionResult res = executor.executeDmActionSynchronous(action, null, mockOp, null, null);
        assertThat(res.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("dispatchDMLogsWithFallback: logData is null on success, and with empty dispatch service")
    void dispatchDMLogsWithFallback_logDataNullAndEmptyDispatchService() {
        // 1. logData is null
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);

        ActionExecutionResult res1 = executor.dispatchDMLogsWithFallback(user, textChannel, null);
        assertThat(res1.isSuccess()).isTrue();
        assertThat(res1.isDmDelivered()).isTrue();

        // 2. With empty dispatch service
        DmActionExecutor executorNoDispatch = new DmActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                embedTemplateRenderer,
                null
        );

        EmbedTemplate dmTpl = EmbedTemplate.builder().templateId("t_no_disp").build();
        MessageCreateData logData = mock(MessageCreateData.class);
        when(privateChannel.sendMessage(logData)).thenReturn(messageCreateAction);
        when(messageCreateAction.complete()).thenReturn(mock(net.dv8tion.jda.api.entities.Message.class));

        ActionExecutionResult res2 = executorNoDispatch.dispatchDMLogsWithFallback(user, textChannel, dmTpl, Map.of(), logData);
        assertThat(res2.isSuccess()).isTrue();
        assertThat(res2.isDmDelivered()).isTrue();
        verify(privateChannel).sendMessage(logData);

        // 3. Fallback to ticket channel with empty dispatch service
        doThrow(new RuntimeException("Closed DMs")).when(pcRestAction).complete();
        when(textChannel.sendMessage(logData)).thenReturn(messageCreateAction);

        ActionExecutionResult res3 = executorNoDispatch.dispatchDMLogsWithFallback(user, textChannel, dmTpl, Map.of(), logData);
        assertThat(res3.isSuccess()).isTrue();
        assertThat(res3.isDmDelivered()).isFalse();
        verify(textChannel).sendMessage(logData);
    }
}
