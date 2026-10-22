package com.rednecksgaming.embed.execution;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.domain.ResponseType;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import com.rednecksgaming.embed.service.DiscordDispatchService;
import com.rednecksgaming.embed.service.EmbedTemplateRenderer;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.interactions.callbacks.IReplyCallback;
import net.dv8tion.jda.api.requests.restaction.CacheRestAction;
import net.dv8tion.jda.api.requests.restaction.MessageCreateAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageCreateAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageEditAction;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import net.dv8tion.jda.api.utils.messages.MessageEditData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReplyActionExecutorTest {

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
    private User user;

    @Mock
    private TextChannel textChannel;

    @Mock
    private PrivateChannel privateChannel;

    @Mock
    private Role targetRole;

    @Mock
    private WebhookMessageEditAction<Message> editAction;

    @Mock
    private WebhookMessageCreateAction<Message> webhookCreateAction;

    @Mock
    private MessageCreateAction channelMessageCreateAction;

    @Mock
    private CacheRestAction<PrivateChannel> pcRestAction;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private ReplyActionExecutor executor;

    @BeforeEach
    void setUp() {
        executor = new ReplyActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                embedTemplateRenderer,
                discordDispatchService
        );
        lenient().when(hook.editOriginal(any(MessageEditData.class))).thenReturn(editAction);
        lenient().when(hook.editOriginal(anyString())).thenReturn(editAction);
        lenient().when(guild.getId()).thenReturn("guild_1");
        lenient().when(user.getId()).thenReturn("user_1");
        lenient().when(user.getName()).thenReturn("Jane");
        lenient().when(textChannel.getId()).thenReturn("chan_1");
        lenient().when(interpolator.interpolate(any(), any(), any(), any(), any(), any(), any())).thenReturn("");
        lenient().when(interpolator.interpolate(any(), any(), any(), any(), any(), any(), any(), anyBoolean())).thenReturn("");
        lenient().when(interpolator.buildTemplateVariables(any(), any(), any(), any(), any(), any(), anyBoolean())).thenReturn(Collections.emptyMap());
    }

    @Test
    @DisplayName("executeReplyAction: sends rich embed follow-up via Discord REST API v10 when configured")
    void executeReplyAction_withTemplateViaRestApi() {
        EmbedAction action = EmbedAction.builder()
                .actionId("act_rep_tpl")
                .responseEmbedTemplateId("tpl_123")
                .build();

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_123").build();
        when(embedTemplateRepository.findByTemplateId("tpl_123")).thenReturn(Optional.of(template));
        when(hook.getId()).thenReturn("hook_id");
        when(hook.getToken()).thenReturn("hook_tok");

        Map<String, String> vars = Map.of("user", "<@user_1>");
        when(interpolator.buildTemplateVariables(isNull(), eq(guild), eq(clickingMember), any(), any(), eq(textChannel), eq(false)))
                .thenReturn(vars);
        Map<String, Object> wirePayload = Map.of("content", "interpolated wire");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(template, vars)).thenReturn(wirePayload);

        executor.executeReplyAction(hook, guild, clickingMember, user, textChannel, "msg_1", action, null, null);

        verify(discordDispatchService).editOriginalInteraction("hook_id", "hook_tok", wirePayload);
        verify(interactionLogRepository).save(argThat(log -> "SUCCESS".equals(log.getStatus()) && log.getDetails().contains("Sent embed reply")));
    }

    @Test
    @DisplayName("executeReplyAction: falls back to JDA editOriginal when REST API v10 fails")
    void executeReplyAction_fallbackToJdaOnRestApiFailure() {
        EmbedAction action = EmbedAction.builder()
                .actionId("act_rep_fallback")
                .responseEmbedTemplateId("tpl_123")
                .build();

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_123").build();
        when(embedTemplateRepository.findByTemplateId("tpl_123")).thenReturn(Optional.of(template));
        when(hook.getId()).thenReturn("hook_id");
        when(hook.getToken()).thenReturn("hook_tok");

        Map<String, String> vars = Map.of("user", "<@user_1>");
        when(interpolator.buildTemplateVariables(any(), any(), any(), any(), any(), any(), anyBoolean())).thenReturn(vars);
        Map<String, Object> wirePayload = Map.of("flags", 32768);
        when(embedTemplateRenderer.renderInterpolatedWirePayload(template, vars)).thenReturn(wirePayload);
        doThrow(new RuntimeException("Cloudflare 1015")).when(discordDispatchService).editOriginalInteraction(anyString(), anyString(), anyMap());

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(template, vars)).thenReturn(msgData);

        executor.executeReplyAction(hook, guild, clickingMember, user, textChannel, "msg_1", action, null, null);

        verify(hook).editOriginal(any(MessageEditData.class));
        verify(interactionLogRepository).save(argThat(log -> log.getDetails().contains("via JDA fallback")));
    }

    @Test
    @DisplayName("executeReplyAction: delivers text reply with custom content and handles blank default")
    void executeReplyAction_textReplies() {
        EmbedAction customAction = EmbedAction.builder()
                .actionId("act_text_custom")
                .replyContent("Thanks {user}!")
                .build();

        when(interpolator.interpolate(eq("Thanks {user}!"), eq(guild), eq(clickingMember), any(), any(), eq(textChannel), isNull()))
                .thenReturn("Thanks <@user_1>!");

        executor.executeReplyAction(hook, guild, clickingMember, user, textChannel, "msg_1", customAction, null, null);
        verify(hook).editOriginal("Thanks <@user_1>!");

        // Blank content default
        EmbedAction blankAction = EmbedAction.builder().actionId("act_text_blank").replyContent("").build();
        when(interpolator.interpolate(eq(""), any(), any(), any(), any(), any(), isNull())).thenReturn("");

        executor.executeReplyAction(hook, guild, clickingMember, user, textChannel, "msg_1", blankAction, null, null);
        verify(hook).editOriginal("✅ Action acknowledged.");
    }

    @Test
    @DisplayName("executeReplyActionSynchronous: dispatches simple text feedback when no template configured")
    void executeReplyActionSynchronous_simpleText() {
        EmbedAction action = EmbedAction.builder()
                .actionId("act_sync_rep")
                .confirmationMessage("Your request has been logged.")
                .build();

        IReplyCallback interaction = mock(IReplyCallback.class);
        when(hook.getInteraction()).thenReturn(interaction);
        when(interaction.getMessageChannel()).thenReturn(textChannel);

        when(interpolator.interpolate(eq("Your request has been logged."), any(), any(), any(), any(), any(), isNull()))
                .thenReturn("Your request has been logged.");

        ActionExecutionResult result = executor.executeReplyActionSynchronous(action, guild, clickingMember, hook, null);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getResponseMessage()).isEqualTo("Reply acknowledged");
        verify(hook).editOriginal("Your request has been logged.");

        // Hook null check
        ActionExecutionResult resultNullHook = executor.executeReplyActionSynchronous(action, guild, clickingMember, null, null);
        assertThat(resultNullHook.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: PUBLIC_EMBED delivers via REST API channel dispatch")
    void dispatchFollowUpTemplateMessage_publicEmbedViaRest() {
        EmbedAction action = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_pub")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_pub").build();
        when(embedTemplateRepository.findByTemplateId("tpl_pub")).thenReturn(Optional.of(template));

        Map<String, String> vars = Map.of("server", "RNG");
        when(interpolator.buildTemplateVariables(isNull(), eq(guild), eq(clickingMember), isNull(), isNull(), eq(textChannel), eq(false)))
                .thenReturn(vars);
        Map<String, Object> wirePayload = Map.of("content", "wire");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(template, vars)).thenReturn(wirePayload);

        ObjectNode jsonNode = objectMapper.createObjectNode();
        jsonNode.put("id", "discord_msg_777");
        when(discordDispatchService.dispatchToChannel("chan_1", wirePayload, null)).thenReturn(jsonNode);

        ActionExecutionResult result = executor.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, textChannel, hook);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.isTerminal()).isFalse();
        assertThat(result.getNewGeneratedMessageId()).isEqualTo("discord_msg_777");
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: PUBLIC_EMBED falls back to channel.sendMessage and hook.sendMessage")
    void dispatchFollowUpTemplateMessage_publicEmbedJdaFallbacks() {
        EmbedAction action = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_pub")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_pub").build();
        when(embedTemplateRepository.findByTemplateId("tpl_pub")).thenReturn(Optional.of(template));

        when(discordDispatchService.dispatchToChannel(anyString(), anyMap(), any())).thenThrow(new RuntimeException("Rest API down"));

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(template), anyMap())).thenReturn(msgData);

        // Case A: channel.sendMessage succeeds
        Message sentMessage = mock(Message.class);
        when(sentMessage.getId()).thenReturn("msg_jda_1");
        when(textChannel.sendMessage(msgData)).thenReturn(channelMessageCreateAction);
        when(channelMessageCreateAction.complete()).thenReturn(sentMessage);

        ActionExecutionResult result = executor.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, textChannel, hook);
        assertThat(result.getNewGeneratedMessageId()).isEqualTo("msg_jda_1");

        // Case B: channel.sendMessage throws, hook.sendMessage succeeds
        when(channelMessageCreateAction.complete()).thenThrow(new RuntimeException("Channel permission denied"));
        when(hook.sendMessage(msgData)).thenReturn(webhookCreateAction);
        Message hookSentMsg = mock(Message.class);
        when(hookSentMsg.getId()).thenReturn("msg_hook_2");
        when(webhookCreateAction.complete()).thenReturn(hookSentMsg);

        ActionExecutionResult resultFallback = executor.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, textChannel, hook);
        assertThat(resultFallback.getNewGeneratedMessageId()).isEqualTo("msg_hook_2");
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: DM_EMBED delivers via PrivateChannel REST and JDA")
    void dispatchFollowUpTemplateMessage_dmEmbedDelivery() {
        EmbedAction action = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_dm")
                .responseType(ResponseType.DM_EMBED)
                .build();

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_dm").build();
        when(embedTemplateRepository.findByTemplateId("tpl_dm")).thenReturn(Optional.of(template));
        when(clickingMember.getUser()).thenReturn(user);
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);
        when(privateChannel.getId()).thenReturn("pc_chan_99");

        Map<String, String> vars = Map.of("key", "val");
        when(interpolator.buildTemplateVariables(any(), any(), any(), any(), any(), any(), eq(true))).thenReturn(vars);
        Map<String, Object> wirePayload = Map.of("flags", 0);
        when(embedTemplateRenderer.renderInterpolatedWirePayload(template, vars)).thenReturn(wirePayload);

        // REST API succeeds
        ObjectNode dmResultNode = objectMapper.createObjectNode();
        dmResultNode.put("id", "dm_msg_101");
        when(discordDispatchService.dispatchToChannel("pc_chan_99", wirePayload, null)).thenReturn(dmResultNode);

        ActionExecutionResult result = executor.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, textChannel, hook);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getNewGeneratedMessageId()).isEqualTo("dm_msg_101");

        // REST API throws, falls back to pc.sendMessage
        when(discordDispatchService.dispatchToChannel("pc_chan_99", wirePayload, null)).thenThrow(new RuntimeException("DM REST 400"));
        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(template, vars)).thenReturn(msgData);
        when(privateChannel.sendMessage(msgData)).thenReturn(channelMessageCreateAction);
        Message jdaDmMsg = mock(Message.class);
        when(jdaDmMsg.getId()).thenReturn("dm_msg_jda_102");
        when(channelMessageCreateAction.complete()).thenReturn(jdaDmMsg);

        ActionExecutionResult resultJda = executor.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, textChannel, hook);
        assertThat(resultJda.getNewGeneratedMessageId()).isEqualTo("dm_msg_jda_102");
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: handles ephemeral fallback via hook when DM fails or EPHEMERAL_EMBED")
    void dispatchFollowUpTemplateMessage_ephemeralHookFallback() {
        EmbedAction action = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_eph")
                .responseType(ResponseType.EPHEMERAL_EMBED)
                .build();

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_eph").build();
        when(embedTemplateRepository.findByTemplateId("tpl_eph")).thenReturn(Optional.of(template));
        when(hook.getId()).thenReturn("hook_id");
        when(hook.getToken()).thenReturn("hook_tok");

        Map<String, Object> wirePayload = Map.of("flags", 64);
        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(template), anyMap())).thenReturn(wirePayload);

        // REST editOriginalInteraction succeeds
        ActionExecutionResult result = executor.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, textChannel, hook);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.isTerminal()).isFalse();

        // REST throws, falls back to hook.editOriginal
        doThrow(new RuntimeException("Edit failed")).when(discordDispatchService).editOriginalInteraction(anyString(), anyString(), anyMap());
        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(template), anyMap())).thenReturn(msgData);

        ActionExecutionResult resultJda = executor.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, textChannel, hook);
        assertThat(resultJda.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: handles missing template, missing renderer, and null response template ID")
    void dispatchFollowUpTemplateMessage_edgeCases() {
        // Null responseEmbedTemplateId
        EmbedAction nullTplAction = EmbedAction.builder().build();
        assertThat(executor.dispatchFollowUpTemplateMessage(nullTplAction, guild, clickingMember, null, null, textChannel, hook).getResponseMessage())
                .contains("No response template configured");

        // Template not found in repo
        EmbedAction missingTplAction = EmbedAction.builder().responseEmbedTemplateId("tpl_404").build();
        when(embedTemplateRepository.findByTemplateId("tpl_404")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findById("tpl_404")).thenReturn(Optional.empty());

        ActionExecutionResult missingResult = executor.dispatchFollowUpTemplateMessage(missingTplAction, guild, clickingMember, null, null, textChannel, hook);
        assertThat(missingResult.isSuccess()).isFalse();
        assertThat(missingResult.getErrorMessage()).contains("Response template not found");

        // Renderer unavailable
        ReplyActionExecutor noRendererExecutor = new ReplyActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                null,
                discordDispatchService
        );
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_ok").build();
        when(embedTemplateRepository.findByTemplateId("tpl_ok")).thenReturn(Optional.of(tpl));
        EmbedAction validAction = EmbedAction.builder().responseEmbedTemplateId("tpl_ok").build();

        ActionExecutionResult noRendererResult = noRendererExecutor.dispatchFollowUpTemplateMessage(validAction, guild, clickingMember, null, null, textChannel, hook);
        assertThat(noRendererResult.isSuccess()).isFalse();
        assertThat(noRendererResult.getErrorMessage()).contains("EmbedTemplateRenderer unavailable");
    }

    @Test
    @DisplayName("recordAuditLog handles repository exception silently")
    void recordAuditLog_repositoryExceptionSilentlyHandled() {
        doThrow(new RuntimeException("Database offline")).when(interactionLogRepository).save(any(InteractionLog.class));
        EmbedAction action = EmbedAction.builder().actionId("act_log").build();
        executor.executeReplyAction(hook, guild, clickingMember, user, textChannel, "msg_1", action, null, null);
        // Does not throw
    }

    @Test
    @DisplayName("executeReplyAction with PrivateChannel, missing template, and no dispatch service")
    void executeReplyAction_privateChannelAndFallthrough() {
        // 1. PrivateChannel (isDm = true) and no dispatch service
        ReplyActionExecutor noDispatchExecutor = new ReplyActionExecutor(
                interactionLogRepository, embedTemplateRepository, interpolator, roleActionExecutor, embedTemplateRenderer, null
        );

        EmbedAction action = EmbedAction.builder()
                .actionId("act_dm_chan")
                .responseEmbedTemplateId("tpl_dm_chan")
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_dm_chan").build();
        when(embedTemplateRepository.findByTemplateId("tpl_dm_chan")).thenReturn(Optional.of(tpl));

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(tpl), anyMap())).thenReturn(msgData);

        noDispatchExecutor.executeReplyAction(hook, guild, clickingMember, user, privateChannel, "m_pc", action, null, null);
        verify(hook).editOriginal(any(MessageEditData.class));

        // 2. Template not found falls through to interpolate
        EmbedAction actionNotFound = EmbedAction.builder()
                .actionId("act_nf")
                .responseEmbedTemplateId("tpl_nf")
                .replyContent("Fallback reply")
                .build();
        when(embedTemplateRepository.findByTemplateId("tpl_nf")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findById("tpl_nf")).thenReturn(Optional.empty());
        when(interpolator.interpolate(eq("Fallback reply"), eq(guild), eq(clickingMember), any(), any(), eq(textChannel), isNull()))
                .thenReturn("Fallback reply");

        executor.executeReplyAction(hook, guild, clickingMember, user, textChannel, "m_nf", actionNotFound, null, null);
        verify(hook).editOriginal("Fallback reply");
    }

    @Test
    @DisplayName("executeReplyActionSynchronous: extended branches (delegation, fallback feedback, interaction error)")
    void executeReplyActionSynchronous_extendedBranches() {
        // 1. Delegates to follow up when responseEmbedTemplateId is present
        EmbedAction actionWithTpl = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_sync")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_sync").build();
        when(embedTemplateRepository.findByTemplateId("tpl_sync")).thenReturn(Optional.of(tpl));

        IReplyCallback interaction = mock(IReplyCallback.class);
        when(hook.getInteraction()).thenReturn(interaction);
        net.dv8tion.jda.api.entities.channel.unions.MessageChannelUnion channelUnion = mock(net.dv8tion.jda.api.entities.channel.unions.MessageChannelUnion.class);
        when(channelUnion.getId()).thenReturn("chan_1");
        when(interaction.getMessageChannel()).thenReturn(channelUnion);

        ObjectNode node = objectMapper.createObjectNode();
        node.put("id", "msg_sync_1");
        Map<String, String> vars = Map.of("var", "val");
        when(interpolator.buildTemplateVariables(any(), any(), any(), any(), any(), any(), anyBoolean())).thenReturn(vars);
        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(tpl), any())).thenReturn(Map.of("data", "1"));
        when(discordDispatchService.dispatchToChannel(eq("chan_1"), any(), any())).thenReturn(node);

        ActionExecutionResult res1 = executor.executeReplyActionSynchronous(actionWithTpl, guild, clickingMember, hook, null);
        assertThat(res1.isSuccess()).isTrue();
        assertThat(res1.getNewGeneratedMessageId()).isEqualTo("msg_sync_1");

        // 2. replyContent is blank, confirmationMessage is blank -> default message
        EmbedAction actionBlank = EmbedAction.builder().replyContent("").confirmationMessage("").build();
        ActionExecutionResult res2 = executor.executeReplyActionSynchronous(actionBlank, guild, clickingMember, hook, null);
        assertThat(res2.isSuccess()).isTrue();
        verify(hook).editOriginal("✅ Action acknowledged.");

        // 3. hook.getInteraction().getMessageChannel() throws exception
        when(interaction.getMessageChannel()).thenThrow(new RuntimeException("No message channel"));
        EmbedAction actionWithReply = EmbedAction.builder().replyContent("Reply!").build();
        when(interpolator.interpolate(eq("Reply!"), eq(guild), eq(clickingMember), any(), any(), isNull(), isNull()))
                .thenReturn("Reply!");

        ActionExecutionResult res3 = executor.executeReplyActionSynchronous(actionWithReply, guild, clickingMember, hook, null);
        assertThat(res3.isSuccess()).isTrue();
        verify(hook).editOriginal("Reply!");
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: PUBLIC_TEXT, null response type, channel without id, and channel == null")
    void dispatchFollowUpTemplateMessage_publicTextAndNullChannel() {
        EmbedAction actionPublicText = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_pub_txt")
                .responseType(ResponseType.PUBLIC_TEXT)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_pub_txt").build();
        when(embedTemplateRepository.findByTemplateId("tpl_pub_txt")).thenReturn(Optional.of(tpl));

        // 1. Dispatch result without "id" field
        Map<String, Object> wire = Map.of("content", "text");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(tpl), anyMap())).thenReturn(wire);
        ObjectNode noIdNode = objectMapper.createObjectNode();
        when(discordDispatchService.dispatchToChannel("chan_1", wire, null)).thenReturn(noIdNode);

        ActionExecutionResult res1 = executor.dispatchFollowUpTemplateMessage(actionPublicText, guild, clickingMember, null, null, textChannel, hook);
        assertThat(res1.isSuccess()).isTrue();
        assertThat(res1.getNewGeneratedMessageId()).isNull();

        // 2. channel == null, hook != null -> sends via hook.sendMessage
        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(tpl), anyMap())).thenReturn(msgData);
        when(hook.sendMessage(msgData)).thenReturn(webhookCreateAction);
        Message hookMsg = mock(Message.class);
        when(hookMsg.getId()).thenReturn("hook_chan_null");
        when(webhookCreateAction.complete()).thenReturn(hookMsg);

        ActionExecutionResult res2 = executor.dispatchFollowUpTemplateMessage(actionPublicText, guild, clickingMember, null, null, null, hook);
        assertThat(res2.isSuccess()).isTrue();
        assertThat(res2.getNewGeneratedMessageId()).isEqualTo("hook_chan_null");

        // 3. Null action and blank responseEmbedTemplateId
        assertThat(executor.dispatchFollowUpTemplateMessage(null, guild, clickingMember, null, null, textChannel, hook).getResponseMessage())
                .contains("No response template configured");
        EmbedAction blankAction = EmbedAction.builder().responseEmbedTemplateId("   ").build();
        assertThat(executor.dispatchFollowUpTemplateMessage(blankAction, guild, clickingMember, null, null, textChannel, hook).getResponseMessage())
                .contains("No response template configured");
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: DM_EMBED target member fallback, no dispatch service, and complete failure")
    void dispatchFollowUpTemplateMessage_dmEmbedExtended() {
        EmbedAction actionDm = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_dm_ext")
                .responseType(ResponseType.DM_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_dm_ext").build();
        when(embedTemplateRepository.findByTemplateId("tpl_dm_ext")).thenReturn(Optional.of(tpl));

        // 1. operator user is null, targetMember user is present
        Member mockTarget = mock(Member.class);
        User mockTargetUser = mock(User.class);
        when(mockTarget.getUser()).thenReturn(mockTargetUser);
        when(mockTargetUser.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);
        when(privateChannel.getId()).thenReturn("pc_ext_1");

        ObjectNode dmNode = objectMapper.createObjectNode();
        dmNode.put("id", "dm_ext_id");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(tpl), anyMap())).thenReturn(Map.of());
        when(discordDispatchService.dispatchToChannel("pc_ext_1", Map.of(), null)).thenReturn(dmNode);

        ActionExecutionResult res1 = executor.dispatchFollowUpTemplateMessage(actionDm, guild, null, mockTarget, null, null, hook);
        assertThat(res1.isSuccess()).isTrue();
        assertThat(res1.getNewGeneratedMessageId()).isEqualTo("dm_ext_id");

        // 2. Both operator and targetMember user null -> falls through to hook
        ActionExecutionResult res2 = executor.dispatchFollowUpTemplateMessage(actionDm, guild, null, null, null, null, hook);
        assertThat(res2.isSuccess()).isTrue();

        // 3. Hook is null on ephemeral failure -> returns failure
        ActionExecutionResult res3 = executor.dispatchFollowUpTemplateMessage(actionDm, guild, null, null, null, null, null);
        assertThat(res3.isSuccess()).isFalse();
        assertThat(res3.getErrorMessage()).contains("Failed to dispatch follow-up template message");

        // 4. Hook delivery throws exception in catch block -> returns failure
        when(hook.getId()).thenReturn("h_fail");
        when(hook.getToken()).thenReturn("t_fail");
        doThrow(new RuntimeException("Hook exploded")).when(discordDispatchService).editOriginalInteraction(anyString(), anyString(), anyMap());

        ActionExecutionResult res4 = executor.dispatchFollowUpTemplateMessage(actionDm, guild, null, null, null, null, hook);
        assertThat(res4.isSuccess()).isFalse();
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: DM_EMBED openPrivateChannel throws exception, falls back to hook")
    void dispatchFollowUpTemplateMessage_dmEmbedOpenPrivateChannelThrows() {
        EmbedAction actionDm = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_dm_throw")
                .responseType(ResponseType.DM_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_dm_throw").build();
        when(embedTemplateRepository.findByTemplateId("tpl_dm_throw")).thenReturn(Optional.of(tpl));

        when(clickingMember.getUser()).thenReturn(user);
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenThrow(new RuntimeException("Closed DMs"));

        when(hook.getId()).thenReturn("h1");
        when(hook.getToken()).thenReturn("t1");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(tpl), anyMap())).thenReturn(Map.of());

        ActionExecutionResult res = executor.dispatchFollowUpTemplateMessage(actionDm, guild, clickingMember, null, null, null, hook);
        assertThat(res.isSuccess()).isTrue();
        verify(discordDispatchService).editOriginalInteraction(eq("h1"), eq("t1"), anyMap());
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: DM_EMBED openPrivateChannel returns null pc, falls back to hook")
    void dispatchFollowUpTemplateMessage_dmEmbedPcNull() {
        EmbedAction actionDm = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_dm_pc_null")
                .responseType(ResponseType.DM_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_dm_pc_null").build();
        when(embedTemplateRepository.findByTemplateId("tpl_dm_pc_null")).thenReturn(Optional.of(tpl));

        when(clickingMember.getUser()).thenReturn(user);
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(null);

        when(hook.getId()).thenReturn("h_pc_null");
        when(hook.getToken()).thenReturn("t_pc_null");
        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(tpl), anyMap())).thenReturn(Map.of());

        ActionExecutionResult res = executor.dispatchFollowUpTemplateMessage(actionDm, guild, clickingMember, null, null, null, hook);
        assertThat(res.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: DM_EMBED with empty dispatch service and null sentMsg")
    void dispatchFollowUpTemplateMessage_dmEmbedEmptyDispatchServiceAndNullSentMsg() {
        ReplyActionExecutor executorNoDispatch = new ReplyActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                embedTemplateRenderer,
                null
        );

        EmbedAction actionDm = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_dm_no_dispatch")
                .responseType(ResponseType.DM_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_dm_no_dispatch").build();
        when(embedTemplateRepository.findByTemplateId("tpl_dm_no_dispatch")).thenReturn(Optional.of(tpl));

        when(clickingMember.getUser()).thenReturn(user);
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(tpl), anyMap())).thenReturn(msgData);
        when(privateChannel.sendMessage(msgData)).thenReturn(channelMessageCreateAction);
        when(channelMessageCreateAction.complete()).thenReturn(null); // sentMsg == null

        ActionExecutionResult res = executorNoDispatch.dispatchFollowUpTemplateMessage(actionDm, guild, clickingMember, null, null, null, hook);
        assertThat(res.isSuccess()).isTrue();
        assertThat(res.getNewGeneratedMessageId()).isNull();
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: DM_EMBED REST dispatch throws, falls back to JDA pc.sendMessage")
    void dispatchFollowUpTemplateMessage_dmEmbedDispatchThrowsFallsBackToJda() {
        EmbedAction actionDm = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_dm_disp_throw")
                .responseType(ResponseType.DM_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_dm_disp_throw").build();
        when(embedTemplateRepository.findByTemplateId("tpl_dm_disp_throw")).thenReturn(Optional.of(tpl));

        when(clickingMember.getUser()).thenReturn(user);
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);
        when(privateChannel.getId()).thenReturn("pc_throw_chan");

        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(tpl), anyMap())).thenReturn(Map.of());
        doThrow(new RuntimeException("Cloudflare error"))
                .when(discordDispatchService).dispatchToChannel(eq("pc_throw_chan"), anyMap(), isNull());

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(tpl), anyMap())).thenReturn(msgData);
        when(privateChannel.sendMessage(msgData)).thenReturn(channelMessageCreateAction);
        Message mockSent = mock(Message.class);
        when(mockSent.getId()).thenReturn("sent_pc_msg_1");
        when(channelMessageCreateAction.complete()).thenReturn(mockSent);

        ActionExecutionResult res = executor.dispatchFollowUpTemplateMessage(actionDm, guild, clickingMember, null, null, null, hook);
        assertThat(res.isSuccess()).isTrue();
        assertThat(res.getNewGeneratedMessageId()).isEqualTo("sent_pc_msg_1");
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: DM_EMBED REST dispatch returns node without id")
    void dispatchFollowUpTemplateMessage_dmEmbedDispatchNoId() {
        EmbedAction actionDm = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_dm_no_id")
                .responseType(ResponseType.DM_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_dm_no_id").build();
        when(embedTemplateRepository.findByTemplateId("tpl_dm_no_id")).thenReturn(Optional.of(tpl));

        when(clickingMember.getUser()).thenReturn(user);
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(privateChannel);
        when(privateChannel.getId()).thenReturn("pc_no_id_chan");

        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(tpl), anyMap())).thenReturn(Map.of());
        ObjectNode emptyNode = objectMapper.createObjectNode();
        when(discordDispatchService.dispatchToChannel(eq("pc_no_id_chan"), anyMap(), isNull())).thenReturn(emptyNode);

        ActionExecutionResult res = executor.dispatchFollowUpTemplateMessage(actionDm, guild, clickingMember, null, null, null, hook);
        assertThat(res.isSuccess()).isTrue();
        assertThat(res.getNewGeneratedMessageId()).isNull();
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: PUBLIC_EMBED with empty dispatch service, null sentMsg, and null responseType")
    void dispatchFollowUpTemplateMessage_publicEmbedEmptyDispatchAndNullSentMsg() {
        ReplyActionExecutor executorNoDispatch = new ReplyActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                embedTemplateRenderer,
                null
        );

        // responseType == null -> falls back to PUBLIC_EMBED
        EmbedAction action = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_null_rtype")
                .responseType(null)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_null_rtype").build();
        when(embedTemplateRepository.findByTemplateId("tpl_null_rtype")).thenReturn(Optional.of(tpl));

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(tpl), anyMap())).thenReturn(msgData);
        when(textChannel.sendMessage(msgData)).thenReturn(channelMessageCreateAction);
        when(channelMessageCreateAction.complete()).thenReturn(null); // sentMsg == null

        ActionExecutionResult res = executorNoDispatch.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, textChannel, hook);
        assertThat(res.isSuccess()).isTrue();
        assertThat(res.getNewGeneratedMessageId()).isNull();
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: PUBLIC_EMBED channel.sendMessage throws and hook is null -> returns failure")
    void dispatchFollowUpTemplateMessage_publicEmbedChannelThrowsHookNull() {
        ReplyActionExecutor executorNoDispatch = new ReplyActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                embedTemplateRenderer,
                null
        );

        EmbedAction action = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_chan_throw")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_chan_throw").build();
        when(embedTemplateRepository.findByTemplateId("tpl_chan_throw")).thenReturn(Optional.of(tpl));

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(tpl), anyMap())).thenReturn(msgData);
        when(textChannel.sendMessage(msgData)).thenReturn(channelMessageCreateAction);
        when(channelMessageCreateAction.complete()).thenThrow(new RuntimeException("Forbidden"));

        ActionExecutionResult res = executorNoDispatch.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, textChannel, null);
        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getErrorMessage()).contains("Failed to dispatch follow-up template message");
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: PUBLIC_EMBED channel is null and hook is null -> returns failure")
    void dispatchFollowUpTemplateMessage_publicEmbedChannelNullHookNull() {
        EmbedAction action = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_both_null")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_both_null").build();
        when(embedTemplateRepository.findByTemplateId("tpl_both_null")).thenReturn(Optional.of(tpl));

        ActionExecutionResult res = executor.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, null, null);
        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getErrorMessage()).contains("Failed to dispatch follow-up template message");
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: PUBLIC_EMBED REST returns node without id")
    void dispatchFollowUpTemplateMessage_publicEmbedRestNoId() {
        EmbedAction action = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_pub_no_id")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_pub_no_id").build();
        when(embedTemplateRepository.findByTemplateId("tpl_pub_no_id")).thenReturn(Optional.of(tpl));

        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(tpl), anyMap())).thenReturn(Map.of());
        ObjectNode emptyNode = objectMapper.createObjectNode();
        when(discordDispatchService.dispatchToChannel(eq("chan_1"), anyMap(), isNull())).thenReturn(emptyNode);

        ActionExecutionResult res = executor.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, textChannel, hook);
        assertThat(res.isSuccess()).isTrue();
        assertThat(res.getNewGeneratedMessageId()).isNull();
    }

    @Test
    @DisplayName("dispatchFollowUpTemplateMessage: channel instanceof PrivateChannel evaluates isDm true")
    void dispatchFollowUpTemplateMessage_privateChannelIsDm() {
        PrivateChannel pc = mock(PrivateChannel.class);
        when(pc.getId()).thenReturn("pc_chan_direct");

        EmbedAction action = EmbedAction.builder()
                .responseEmbedTemplateId("tpl_pc_direct")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_pc_direct").build();
        when(embedTemplateRepository.findByTemplateId("tpl_pc_direct")).thenReturn(Optional.of(tpl));

        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(tpl), anyMap())).thenReturn(Map.of());
        ObjectNode resNode = objectMapper.createObjectNode();
        resNode.put("id", "msg_pc_direct");
        when(discordDispatchService.dispatchToChannel(eq("pc_chan_direct"), anyMap(), isNull())).thenReturn(resNode);

        ActionExecutionResult res = executor.dispatchFollowUpTemplateMessage(action, guild, clickingMember, null, null, pc, hook);
        assertThat(res.isSuccess()).isTrue();
        assertThat(res.getNewGeneratedMessageId()).isEqualTo("msg_pc_direct");
    }

    @Test
    @DisplayName("executeReplyAction: discordDispatchService absent falls back to JDA renderToMessageData")
    void executeReplyAction_discordDispatchAbsentFallbackToJda() {
        ReplyActionExecutor executorNoDispatch = new ReplyActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                roleActionExecutor,
                embedTemplateRenderer,
                null
        );

        EmbedAction action = EmbedAction.builder()
                .actionId("act_no_disp")
                .responseEmbedTemplateId("tpl_no_disp")
                .build();
        EmbedTemplate tpl = EmbedTemplate.builder().templateId("tpl_no_disp").build();
        when(embedTemplateRepository.findByTemplateId("tpl_no_disp")).thenReturn(Optional.of(tpl));

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(tpl), anyMap())).thenReturn(msgData);

        executorNoDispatch.executeReplyAction(hook, guild, clickingMember, user, textChannel, "msg_123", action, Map.of(), null);

        verify(hook).editOriginal(any(MessageEditData.class));
        verify(interactionLogRepository).save(argThat(log -> "Sent embed reply via JDA fallback".equals(log.getDetails())));
    }

    @Test
    @DisplayName("executeReplyActionSynchronous: hook is null and hook.getInteraction() is null")
    void executeReplyActionSynchronous_hookNullAndInteractionNull() {
        EmbedAction action = EmbedAction.builder()
                .actionId("act_sync_null_hook")
                .replyContent("Sync reply")
                .build();

        // 1. hook == null
        ActionExecutionResult res1 = executor.executeReplyActionSynchronous(action, guild, clickingMember, null, null);
        assertThat(res1.isSuccess()).isTrue();

        // 2. hook != null but hook.getInteraction() == null
        InteractionHook mockHook = mock(InteractionHook.class);
        when(mockHook.getInteraction()).thenReturn(null);
        when(mockHook.editOriginal(anyString())).thenReturn(editAction);

        ActionExecutionResult res2 = executor.executeReplyActionSynchronous(action, guild, clickingMember, mockHook, null);
        assertThat(res2.isSuccess()).isTrue();
        verify(mockHook).editOriginal(anyString());
    }

    @Test
    @DisplayName("resolveTemplate and recordAuditLog helper methods")
    void helperMethods_coverage() {
        // resolveTemplate null / blank
        Optional<EmbedTemplate> t1 = executor.resolveTemplate(null);
        assertThat(t1).isEmpty();
        Optional<EmbedTemplate> t2 = executor.resolveTemplate("   ");
        assertThat(t2).isEmpty();

        // resolveTemplate findById fallback
        when(embedTemplateRepository.findByTemplateId("id_fallback")).thenReturn(Optional.empty());
        EmbedTemplate tpl = EmbedTemplate.builder().id("id_fallback").build();
        when(embedTemplateRepository.findById("id_fallback")).thenReturn(Optional.of(tpl));
        Optional<EmbedTemplate> t3 = executor.resolveTemplate("id_fallback");
        assertThat(t3).contains(tpl);

        // recordAuditLog null action
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(
                executor, "recordAuditLog", null, "g1", "c1", "m1", "u1", "user", "SUCCESS", "details"
        );
        verify(interactionLogRepository).save(argThat(log -> "unknown".equals(log.getActionId()) && log.getActionType() == null));

        // recordAuditLog exception handling
        doThrow(new RuntimeException("Mongo down")).when(interactionLogRepository).save(any());
        EmbedAction action = EmbedAction.builder().actionId("a_rep").build();
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(
                executor, "recordAuditLog", action, "g1", "c1", "m1", "u1", "user", "FAILED", "details"
        ); // Does not throw
    }
}
