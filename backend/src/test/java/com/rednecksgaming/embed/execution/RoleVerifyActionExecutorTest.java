// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.execution;

import com.rednecksgaming.embed.domain.ActionType;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.domain.ResponseType;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import com.rednecksgaming.embed.service.DiscordDispatchService;
import com.rednecksgaming.embed.service.EmbedTemplateRenderer;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.SelfMember;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.interactions.Interaction;
import net.dv8tion.jda.api.requests.RestAction;
import net.dv8tion.jda.api.requests.restaction.AuditableRestAction;
import net.dv8tion.jda.api.requests.restaction.CacheRestAction;
import net.dv8tion.jda.api.requests.restaction.MessageCreateAction;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleVerifyActionExecutorTest {

    @Mock
    private InteractionLogRepository interactionLogRepository;

    @Mock
    private EmbedTemplateRepository embedTemplateRepository;

    @Mock
    private TemplateVariableInterpolator interpolator;

    @Mock
    private EmbedTemplateRenderer embedTemplateRenderer;

    @Mock
    private DiscordDispatchService discordDispatchService;

    @Mock
    private InteractionHook hook;

    @Mock
    private Interaction interaction;

    @Mock
    private Guild guild;

    @Mock
    private Member member;

    @Mock
    private SelfMember botMember;

    @Mock
    private User user;

    @Mock
    private MessageChannel channel;

    @Mock
    private PrivateChannel privateChannel;

    @Mock
    private Role targetRole;

    @Mock
    private WebhookMessageEditAction<Message> editAction;

    @Mock
    private AuditableRestAction<Void> auditableRestAction;

    @Mock
    private RestAction<Void> deleteAction;

    @Mock
    private CacheRestAction<PrivateChannel> openPcAction;

    private RoleVerifyActionExecutor executor;

    @BeforeEach
    void setUp() {
        executor = new RoleVerifyActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                embedTemplateRenderer,
                discordDispatchService
        );
        lenient().when(hook.editOriginal(anyString())).thenReturn(editAction);
        lenient().when(hook.editOriginal(any(MessageEditData.class))).thenReturn(editAction);
        lenient().when(guild.getId()).thenReturn("111222333");
        lenient().when(guild.getName()).thenReturn("Rednecks Gaming");
        lenient().when(user.getId()).thenReturn("444555666");
        lenient().when(user.getName()).thenReturn("TestUser");
        lenient().when(channel.getId()).thenReturn("777888999");
    }

    @Test
    @DisplayName("executeRoleVerifyAction: early returns when member is null")
    void executeRoleVerifyAction_nullMember() {
        EmbedAction action = EmbedAction.builder().actionId("act_v1").roleId("123456789").build();
        executor.executeRoleVerifyAction(hook, guild, null, user, channel, "m1", action, Collections.emptyMap());

        verify(hook).editOriginal(contains("Target member is no longer in this server"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: rejects when roleId is blank")
    void executeRoleVerifyAction_blankRoleId() {
        EmbedAction action = EmbedAction.builder().actionId("act_v1").roleId("   ").build();
        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(hook).editOriginal(contains("Verification role ID is not configured"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: rejects when role not found on guild")
    void executeRoleVerifyAction_roleNotFound() {
        when(guild.getRoleById("123456789")).thenReturn(null);
        EmbedAction action = EmbedAction.builder().actionId("act_v1").roleId("123456789").build();

        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(hook).editOriginal(contains("The configured verification role does not exist on this server"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: rejects @everyone role")
    void executeRoleVerifyAction_publicRole() {
        when(guild.getRoleById("123456789")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(true);
        EmbedAction action = EmbedAction.builder().actionId("act_v1").roleId("123456789").build();

        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(hook).editOriginal(contains("Cannot assign or modify the @everyone public role"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: rejects managed role")
    void executeRoleVerifyAction_managedRole() {
        when(guild.getRoleById("123456789")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(true);
        when(targetRole.getName()).thenReturn("BotIntegration");
        EmbedAction action = EmbedAction.builder().actionId("act_v1").roleId("123456789").build();

        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(hook).editOriginal(contains("Cannot assign managed integration/bot role"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: rejects when bot lacks MANAGE_ROLES permission")
    void executeRoleVerifyAction_botLacksPermission() {
        when(guild.getRoleById("123456789")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(false);
        EmbedAction action = EmbedAction.builder().actionId("act_v1").roleId("123456789").build();

        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(hook).editOriginal(contains("Bot lacks 'Manage Roles' permission"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: rejects when bot hierarchy check fails")
    void executeRoleVerifyAction_botHierarchyViolation() {
        when(guild.getRoleById("123456789")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Admin");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(false);
        EmbedAction action = EmbedAction.builder().actionId("act_v1").roleId("123456789").build();

        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(hook).editOriginal(contains("is higher than or equal to the bot's highest role"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: is idempotent when member already has role (ephemeral mode)")
    void executeRoleVerifyAction_idempotentAlreadyVerified() {
        when(guild.getRoleById("123456789")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Verified");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(member.getRoles()).thenReturn(List.of(targetRole));
        EmbedAction action = EmbedAction.builder()
                .actionId("act_v1")
                .roleId("123456789")
                .responseType(ResponseType.EPHEMERAL_EMBED)
                .build();

        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(hook).editOriginal(contains("already verified"));
        verify(guild, never()).addRoleToMember(any(Member.class), any(Role.class));
        verify(interactionLogRepository).save(argThat(log -> "NOOP".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: deletes public deferral when already verified in PUBLIC_EMBED mode")
    void executeRoleVerifyAction_alreadyVerified_publicModeDeletesDeferral() {
        when(guild.getRoleById("123456789")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Verified");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(member.getRoles()).thenReturn(List.of(targetRole));
        when(hook.deleteOriginal()).thenReturn(deleteAction);
        when(user.openPrivateChannel()).thenReturn(openPcAction);

        EmbedAction action = EmbedAction.builder()
                .actionId("act_v1")
                .roleId("123456789")
                .responseType(ResponseType.PUBLIC_EMBED)
                .build();

        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(hook).deleteOriginal();
        verify(user).openPrivateChannel();
        verify(guild, never()).addRoleToMember(any(Member.class), any(Role.class));
        verify(interactionLogRepository).save(argThat(log -> "NOOP".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: successfully assigns role and delivers ephemeral response when no template")
    @SuppressWarnings("unchecked")
    void executeRoleVerifyAction_success() {
        when(guild.getRoleById("123456789")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Verified");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(member.getRoles()).thenReturn(Collections.emptyList());
        when(member.getUser()).thenReturn(user);

        when(guild.addRoleToMember(member, targetRole)).thenReturn(auditableRestAction);
        doAnswer(inv -> {
            Consumer<Void> successCallback = inv.getArgument(0);
            successCallback.accept(null);
            return null;
        }).when(auditableRestAction).queue(any(), any());

        EmbedAction action = EmbedAction.builder()
                .actionId("act_v1")
                .roleId("123456789")
                .responseType(ResponseType.EPHEMERAL_EMBED)
                .build();

        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(hook).editOriginal(contains("You have been successfully verified! Granted role @Verified"));
        verify(interactionLogRepository).save(argThat(log -> "SUCCESS".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleVerifyActionSynchronous: rejects on invalid role and succeeds when valid")
    void executeRoleVerifyActionSynchronous_coverage() {
        EmbedAction badAction = EmbedAction.builder().roleId(null).build();
        ActionExecutionResult res1 = executor.executeRoleVerifyActionSynchronous(badAction, guild, member, hook, null);
        assertThat(res1.isSuccess()).isFalse();

        when(guild.getRoleById("999")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Verified");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(member.getRoles()).thenReturn(Collections.emptyList());
        when(member.getUser()).thenReturn(user);
        when(guild.addRoleToMember(member, targetRole)).thenReturn(auditableRestAction);

        EmbedAction validAction = EmbedAction.builder()
                .roleId("999")
                .responseType(ResponseType.EPHEMERAL_EMBED)
                .build();
        ActionExecutionResult res2 = executor.executeRoleVerifyActionSynchronous(validAction, guild, member, hook, null);
        assertThat(res2.isSuccess()).isTrue();
        assertThat(res2.getResponseMessage()).isEqualTo("Role verified");
    }

    @Test
    @DisplayName("executeRoleVerifyActionSynchronous: dispatches public embed to interaction hook when configured")
    void executeRoleVerifyActionSynchronous_publicEmbedDelivery() {
        when(guild.getRoleById("999")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Verified");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(member.getRoles()).thenReturn(Collections.emptyList());
        when(member.getUser()).thenReturn(user);
        when(guild.addRoleToMember(member, targetRole)).thenReturn(auditableRestAction);

        when(hook.getId()).thenReturn("h1");
        when(hook.getToken()).thenReturn("tok1");

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_welcome").name("Welcome").build();
        when(embedTemplateRepository.findByTemplateId("tpl_welcome")).thenReturn(Optional.of(template));

        EmbedAction validAction = EmbedAction.builder()
                .actionId("act_v1")
                .roleId("999")
                .responseType(ResponseType.PUBLIC_EMBED)
                .responseEmbedTemplateId("tpl_welcome")
                .build();

        ActionExecutionResult res = executor.executeRoleVerifyActionSynchronous(validAction, guild, member, hook, null);
        assertThat(res.isSuccess()).isTrue();

        verify(discordDispatchService).editOriginalInteraction(eq("h1"), eq("tok1"), anyMap());
    }

    @Test
    @DisplayName("executeRoleVerifyActionSynchronous: falls back to JDA hook.editOriginal when REST dispatch fails")
    void executeRoleVerifyActionSynchronous_publicEmbedDelivery_jdaFallback() {
        when(guild.getRoleById("999")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Verified");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(member.getRoles()).thenReturn(Collections.emptyList());
        when(member.getUser()).thenReturn(user);
        when(guild.addRoleToMember(member, targetRole)).thenReturn(auditableRestAction);

        when(hook.getId()).thenReturn("h1");
        when(hook.getToken()).thenReturn("tok1");

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_welcome").name("Welcome").build();
        when(embedTemplateRepository.findByTemplateId("tpl_welcome")).thenReturn(Optional.of(template));
        MessageCreateData dummyMsg = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(template), anyMap())).thenReturn(dummyMsg);
        doThrow(new RuntimeException("REST error")).when(discordDispatchService).editOriginalInteraction(anyString(), anyString(), anyMap());

        EmbedAction validAction = EmbedAction.builder()
                .actionId("act_v1")
                .roleId("999")
                .responseType(ResponseType.PUBLIC_EMBED)
                .responseEmbedTemplateId("tpl_welcome")
                .build();

        ActionExecutionResult res = executor.executeRoleVerifyActionSynchronous(validAction, guild, member, hook, null);
        assertThat(res.isSuccess()).isTrue();

        verify(hook).editOriginal(any(MessageEditData.class));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: dispatches wire payload to DM via discordDispatchService when DM_EMBED")
    @SuppressWarnings("unchecked")
    void executeRoleVerifyAction_dmEmbed_dispatchesWirePayloadViaRest() {
        when(guild.getRoleById("123456789")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Verified");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(member.getRoles()).thenReturn(Collections.emptyList());
        when(member.getUser()).thenReturn(user);

        when(guild.addRoleToMember(member, targetRole)).thenReturn(auditableRestAction);
        doAnswer(inv -> {
            Consumer<Void> successCallback = inv.getArgument(0);
            successCallback.accept(null);
            return null;
        }).when(auditableRestAction).queue(any(), any());

        when(user.openPrivateChannel()).thenReturn(openPcAction);
        doAnswer(inv -> {
            Consumer<PrivateChannel> successConsumer = inv.getArgument(0);
            successConsumer.accept(privateChannel);
            return null;
        }).when(openPcAction).queue(any(), any());
        when(privateChannel.getId()).thenReturn("dm_chan_1");

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_welcome").name("Welcome").build();
        when(embedTemplateRepository.findByTemplateId("tpl_welcome")).thenReturn(Optional.of(template));
        Map<String, Object> wirePayload = Map.of("flags", 32768);
        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(template), anyMap())).thenReturn(wirePayload);

        EmbedAction action = EmbedAction.builder()
                .actionId("act_v1")
                .roleId("123456789")
                .responseType(ResponseType.DM_EMBED)
                .responseEmbedTemplateId("tpl_welcome")
                .build();

        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(discordDispatchService).dispatchToChannel(eq("dm_chan_1"), eq(wirePayload), isNull());
        verify(hook).editOriginal(contains("Verification complete! Granted role @Verified. Please check your private messages."));
    }

    @Test
    @DisplayName("executeRoleVerifyAction: falls back to JDA pc.sendMessage when REST DM dispatch throws exception")
    @SuppressWarnings("unchecked")
    void executeRoleVerifyAction_dmEmbed_fallbackToJdaWhenRestFails() {
        when(guild.getRoleById("123456789")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Verified");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(member.getRoles()).thenReturn(Collections.emptyList());
        when(member.getUser()).thenReturn(user);

        when(guild.addRoleToMember(member, targetRole)).thenReturn(auditableRestAction);
        doAnswer(inv -> {
            Consumer<Void> successCallback = inv.getArgument(0);
            successCallback.accept(null);
            return null;
        }).when(auditableRestAction).queue(any(), any());

        when(user.openPrivateChannel()).thenReturn(openPcAction);
        doAnswer(inv -> {
            Consumer<PrivateChannel> successConsumer = inv.getArgument(0);
            successConsumer.accept(privateChannel);
            return null;
        }).when(openPcAction).queue(any(), any());
        when(privateChannel.getId()).thenReturn("dm_chan_1");

        EmbedTemplate template = EmbedTemplate.builder().templateId("tpl_welcome").name("Welcome").build();
        when(embedTemplateRepository.findByTemplateId("tpl_welcome")).thenReturn(Optional.of(template));
        Map<String, Object> wirePayload = Map.of("flags", 32768);
        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(template), anyMap())).thenReturn(wirePayload);
        doThrow(new RuntimeException("REST DM error")).when(discordDispatchService).dispatchToChannel(anyString(), anyMap(), any());

        MessageCreateData dummyMsg = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(template), anyMap())).thenReturn(dummyMsg);
        MessageCreateAction sendMsgAction = mock(MessageCreateAction.class);
        when(privateChannel.sendMessage(dummyMsg)).thenReturn(sendMsgAction);

        EmbedAction action = EmbedAction.builder()
                .actionId("act_v1")
                .roleId("123456789")
                .responseType(ResponseType.DM_EMBED)
                .responseEmbedTemplateId("tpl_welcome")
                .build();

        executor.executeRoleVerifyAction(hook, guild, member, user, channel, "m1", action, Collections.emptyMap());

        verify(discordDispatchService).dispatchToChannel(eq("dm_chan_1"), eq(wirePayload), isNull());
        verify(privateChannel).sendMessage(dummyMsg);
        verify(sendMsgAction).queue(any(), any());
    }
}
