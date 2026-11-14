// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.execution;

import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.domain.RoleSubtype;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import com.rednecksgaming.embed.service.DiscordDispatchService;
import com.rednecksgaming.embed.service.EmbedTemplateRenderer;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.interactions.callbacks.IReplyCallback;
import net.dv8tion.jda.api.requests.restaction.AuditableRestAction;
import net.dv8tion.jda.api.requests.restaction.CacheRestAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageCreateAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageEditAction;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleActionExecutorTest {

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
    private Guild guild;

    @Mock
    private Member operator;

    @Mock
    private Member targetMember;

    @Mock
    private net.dv8tion.jda.api.entities.SelfMember botMember;

    @Mock
    private User user;

    @Mock
    private User targetUser;

    @Mock
    private MessageChannel channel;

    @Mock
    private Role targetRole;

    @Mock
    private Role operatorRole;

    @Mock
    private Role publicRole;

    @Mock
    private WebhookMessageEditAction<Message> editAction;

    @Mock
    private WebhookMessageCreateAction<Message> createAction;

    @Mock
    private AuditableRestAction<Void> auditableVoidAction;

    @Mock
    private CacheRestAction<Member> cacheRestAction;

    private RoleActionExecutor executor;

    @BeforeEach
    void setUp() {
        executor = new RoleActionExecutor(
                interactionLogRepository,
                embedTemplateRepository,
                interpolator,
                embedTemplateRenderer,
                discordDispatchService
        );
        lenient().when(hook.editOriginal(anyString())).thenReturn(editAction);
        lenient().when(guild.getId()).thenReturn("guild_1");
        lenient().when(user.getId()).thenReturn("user_1");
        lenient().when(user.getName()).thenReturn("Tester");
        lenient().when(channel.getId()).thenReturn("chan_1");
    }

    @Test
    @DisplayName("canOperatorAssignRole enforces hierarchy, owner exemption, and null checks")
    void canOperatorAssignRole_coverage() {
        assertThat(executor.canOperatorAssignRole(null, targetRole)).isFalse();
        assertThat(executor.canOperatorAssignRole(operator, null)).isFalse();

        when(operator.isOwner()).thenReturn(true);
        assertThat(executor.canOperatorAssignRole(operator, targetRole)).isTrue();

        when(operator.isOwner()).thenReturn(false);
        when(operator.getRoles()).thenReturn(null);
        assertThat(executor.canOperatorAssignRole(operator, targetRole)).isFalse();

        when(operator.getRoles()).thenReturn(Collections.emptyList());
        assertThat(executor.canOperatorAssignRole(operator, targetRole)).isFalse();

        when(operator.getRoles()).thenReturn(List.of(operatorRole));
        when(operatorRole.getPosition()).thenReturn(10);
        when(targetRole.getPosition()).thenReturn(5);
        assertThat(executor.canOperatorAssignRole(operator, targetRole)).isTrue();

        when(targetRole.getPosition()).thenReturn(10);
        assertThat(executor.canOperatorAssignRole(operator, targetRole)).isFalse();

        when(targetRole.getPosition()).thenReturn(15);
        assertThat(executor.canOperatorAssignRole(operator, targetRole)).isFalse();
    }

    @Test
    @DisplayName("executeRoleAction rejects when target member is missing or left server")
    void executeRoleAction_targetMemberNotFound() {
        Map<String, String> sessionData = Map.of("targetUser", "u_left");
        when(guild.getMemberById("u_left")).thenReturn(null);
        when(guild.retrieveMemberById("u_left")).thenReturn(cacheRestAction);
        when(cacheRestAction.complete()).thenThrow(new RuntimeException("Member left"));

        EmbedAction action = EmbedAction.builder().actionId("act_r1").build();

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", action, sessionData, null);

        verify(hook).editOriginal(contains("Target member is no longer in this server"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleAction rejects when target role not found")
    void executeRoleAction_targetRoleNotFound() {
        EmbedAction action = EmbedAction.builder().actionId("act_r2").roleId("missing_role").build();
        when(guild.getRoleById("missing_role")).thenReturn(null);

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", action, null, null);

        verify(hook).editOriginal(contains("The requested role does not exist on this server"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleAction rejects @everyone public role")
    void executeRoleAction_publicRole() {
        EmbedAction action = EmbedAction.builder().actionId("act_r3").roleId("role_pub").build();
        when(guild.getRoleById("role_pub")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(true);

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", action, null, null);

        verify(hook).editOriginal(contains("Cannot assign or modify the @everyone public role"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleAction rejects managed integration role")
    void executeRoleAction_managedRole() {
        EmbedAction action = EmbedAction.builder().actionId("act_r4").roleId("role_mng").build();
        when(guild.getRoleById("role_mng")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(true);
        when(targetRole.getName()).thenReturn("PatreonBot");

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", action, null, null);

        verify(hook).editOriginal(contains("Cannot assign managed integration/bot role"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleAction rejects when bot member is unresolvable")
    void executeRoleAction_botMemberUnresolvable() {
        EmbedAction action = EmbedAction.builder().actionId("act_r5").roleId("role_ok").build();
        when(guild.getRoleById("role_ok")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(guild.getSelfMember()).thenThrow(new RuntimeException("Cache missing"));
        when(guild.getJDA()).thenReturn(null);

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", action, null, null);

        verify(hook).editOriginal(contains("Unable to verify bot permissions in this server"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("executeRoleAction rejects when bot lacks MANAGE_ROLES or cannot interact with role")
    void executeRoleAction_botPermissionsAndHierarchyViolation() {
        EmbedAction action = EmbedAction.builder().actionId("act_r6").roleId("role_ok").build();
        when(guild.getRoleById("role_ok")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        doReturn(botMember).when(guild).getSelfMember();

        // Subcase A: Bot lacks MANAGE_ROLES
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(false);
        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", action, null, null);
        verify(hook).editOriginal(contains("Bot lacks 'Manage Roles' permission"));

        // Subcase B: Bot cannot interact
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(false);
        when(targetRole.getName()).thenReturn("GrandMaster");
        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", action, null, null);
        verify(hook).editOriginal(contains("Role hierarchy error"));
    }

    @Test
    @DisplayName("executeRoleAction handles NOOP when ADD and already has role, or REMOVE and does not have role")
    void executeRoleAction_noopCases() {
        EmbedAction addAction = EmbedAction.builder()
                .actionId("act_add")
                .roleId("role_1")
                .roleSubtype(RoleSubtype.ADD)
                .replyContent("Already added!")
                .build();
        when(guild.getRoleById("role_1")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);

        when(operator.getRoles()).thenReturn(List.of(targetRole));
        when(interpolator.interpolate(eq("Already added!"), any(), any(), any(), any(), any(), any()))
                .thenReturn("Already added!");

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", addAction, null, null);
        verify(hook).editOriginal("Already added!");
        verify(interactionLogRepository).save(argThat(log -> "NOOP".equals(log.getStatus())));

        // Test with blank custom reply content for ADD
        addAction.setReplyContent("");
        when(interpolator.interpolate(eq(""), any(), any(), any(), any(), any(), any())).thenReturn("");
        when(operator.getAsMention()).thenReturn("<@op>");
        when(targetRole.getName()).thenReturn("Knight");
        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", addAction, null, null);
        verify(hook).editOriginal(contains("already has the role @Knight"));

        // Test REMOVE when member does not have role
        EmbedAction removeAction = EmbedAction.builder()
                .actionId("act_remove")
                .roleId("role_1")
                .roleSubtype(RoleSubtype.REMOVE)
                .replyContent("Does not have role!")
                .build();
        when(operator.getRoles()).thenReturn(Collections.emptyList());
        when(interpolator.interpolate(eq("Does not have role!"), any(), any(), any(), any(), any(), any()))
                .thenReturn("Does not have role!");

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", removeAction, null, null);
        verify(hook).editOriginal("Does not have role!");

        // Test REMOVE with blank reply content
        removeAction.setReplyContent("");
        when(interpolator.interpolate(eq(""), any(), any(), any(), any(), any(), any())).thenReturn("");
        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", removeAction, null, null);
        verify(hook).editOriginal(contains("does not have the role @Knight"));
    }

    @Test
    @DisplayName("executeRoleAction queues addRoleToMember and handles both success and error callbacks")
    void executeRoleAction_addRoleCallbacks() {
        EmbedAction addAction = EmbedAction.builder()
                .actionId("act_add_cb")
                .roleId("role_1")
                .roleSubtype(RoleSubtype.ADD)
                .replyContent("")
                .build();
        when(guild.getRoleById("role_1")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Vip");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(operator.getRoles()).thenReturn(Collections.emptyList());
        when(operator.getAsMention()).thenReturn("<@op>");
        when(operator.getUser()).thenReturn(user);

        when(guild.addRoleToMember(operator, targetRole)).thenReturn(auditableVoidAction);
        when(interpolator.interpolate(eq(""), any(), any(), any(), any(), any(), any())).thenReturn("");

        // Trigger success callback
        doAnswer(invocation -> {
            Consumer<Void> success = invocation.getArgument(0);
            success.accept(null);
            return null;
        }).when(auditableVoidAction).queue(any(), any());

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", addAction, null, null);
        verify(hook).editOriginal("✅ Granted role @Vip to <@op>.");
        verify(interactionLogRepository).save(argThat(log -> "SUCCESS".equals(log.getStatus())));

        // Trigger error callback
        doAnswer(invocation -> {
            Consumer<Throwable> failure = invocation.getArgument(1);
            failure.accept(new RuntimeException("Rate limited 429"));
            return null;
        }).when(auditableVoidAction).queue(any(), any());

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", addAction, null, null);
        verify(hook).editOriginal(contains("Failed to assign role: Rate limited 429"));
    }

    @Test
    @DisplayName("executeRoleAction queues removeRoleToMember (TOGGLE when having role) and handles callbacks")
    void executeRoleAction_removeRoleCallbacks() {
        EmbedAction toggleAction = EmbedAction.builder()
                .actionId("act_toggle_rm")
                .roleId("role_1")
                .roleSubtype(null) // Defaults to TOGGLE
                .replyContent("Removed customized!")
                .build();
        when(guild.getRoleById("role_1")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Vip");
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(operator.getRoles()).thenReturn(List.of(targetRole));
        when(operator.getUser()).thenReturn(user);

        when(guild.removeRoleFromMember(operator, targetRole)).thenReturn(auditableVoidAction);
        when(interpolator.interpolate(eq("Removed customized!"), any(), any(), any(), any(), any(), any()))
                .thenReturn("Removed customized!");

        // Success callback
        doAnswer(invocation -> {
            Consumer<Void> success = invocation.getArgument(0);
            success.accept(null);
            return null;
        }).when(auditableVoidAction).queue(any(), any());

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", toggleAction, null, null);
        verify(hook).editOriginal("Removed customized!");
        verify(interactionLogRepository).save(argThat(log -> "SUCCESS".equals(log.getStatus())));

        // Error callback
        doAnswer(invocation -> {
            Consumer<Throwable> failure = invocation.getArgument(1);
            failure.accept(new RuntimeException("Network timeout"));
            return null;
        }).when(auditableVoidAction).queue(any(), any());

        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", toggleAction, null, null);
        verify(hook).editOriginal(contains("Failed to remove role: Network timeout"));
    }

    @Test
    @DisplayName("executeRoleActionSynchronous: validates hierarchy, manages roles, and succeeds with intermediate template")
    void executeRoleActionSynchronous_withIntermediateTemplate() {
        EmbedAction action = EmbedAction.builder()
                .actionId("act_sync")
                .roleId("role_10")
                .responseEmbedTemplateId("tpl_step_2")
                .build();

        when(guild.getRoleById("role_10")).thenReturn(targetRole);
        when(targetRole.getPosition()).thenReturn(5);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getId()).thenReturn("role_10");

        when(operator.isOwner()).thenReturn(false);
        when(operator.getRoles()).thenReturn(List.of(operatorRole));
        when(operatorRole.getPosition()).thenReturn(20);

        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);

        when(guild.addRoleToMember(operator, targetRole)).thenReturn(auditableVoidAction);

        EmbedTemplate intermediateTemplate = EmbedTemplate.builder().id("tpl_step_2").build();
        when(embedTemplateRepository.findById("tpl_step_2")).thenReturn(Optional.of(intermediateTemplate));

        MessageCreateData renderedData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(intermediateTemplate), anyMap())).thenReturn(renderedData);
        when(hook.sendMessage(renderedData)).thenReturn(createAction);
        Message intermediateMsg = mock(Message.class);
        when(createAction.complete()).thenReturn(intermediateMsg);
        when(intermediateMsg.getId()).thenReturn("msg_intermediate_99");

        ActionExecutionResult result = executor.executeRoleActionSynchronous(action, guild, operator, hook, new HashMap<>());

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.isTerminal()).isFalse();
        assertThat(result.getNewGeneratedMessageId()).isEqualTo("msg_intermediate_99");
    }

    @Test
    @DisplayName("executeRoleActionSynchronous: rejects on hierarchy, @everyone, managed, and bot permission errors")
    void executeRoleActionSynchronous_rejections() {
        EmbedAction action = EmbedAction.builder().actionId("act_sync").roleId("role_1").build();

        // 1. Target member not found
        Map<String, String> sessionData = Map.of("targetUser", "u_absent");
        when(guild.getMemberById("u_absent")).thenReturn(null);
        when(guild.retrieveMemberById("u_absent")).thenReturn(cacheRestAction);
        when(cacheRestAction.complete()).thenThrow(new RuntimeException("Left"));
        ActionExecutionResult r1 = executor.executeRoleActionSynchronous(action, guild, operator, hook, sessionData);
        assertThat(r1.isSuccess()).isFalse();
        assertThat(r1.getErrorMessage()).contains("Target member not found");

        // 2. Target role null
        when(guild.getRoleById("role_1")).thenReturn(null);
        ActionExecutionResult r2 = executor.executeRoleActionSynchronous(action, guild, operator, hook, null);
        assertThat(r2.isSuccess()).isFalse();
        assertThat(r2.getErrorMessage()).contains("Target role not found");

        // 3. Operator hierarchy violation
        when(guild.getRoleById("role_1")).thenReturn(targetRole);
        when(targetRole.getPosition()).thenReturn(50);
        when(operator.isOwner()).thenReturn(false);
        when(operator.getRoles()).thenReturn(List.of(operatorRole));
        when(operatorRole.getPosition()).thenReturn(10);
        ActionExecutionResult r3 = executor.executeRoleActionSynchronous(action, guild, operator, hook, null);
        assertThat(r3.isSuccess()).isFalse();
        assertThat(r3.getErrorMessage()).contains("Role hierarchy violation");

        // 4. @everyone public role
        when(operatorRole.getPosition()).thenReturn(100);
        when(targetRole.isPublicRole()).thenReturn(true);
        ActionExecutionResult r4 = executor.executeRoleActionSynchronous(action, guild, operator, hook, null);
        assertThat(r4.isSuccess()).isFalse();
        assertThat(r4.getErrorMessage()).contains("Attempted to assign @everyone");

        // 5. Managed role
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(true);
        when(targetRole.getName()).thenReturn("IntegrationRole");
        ActionExecutionResult r5 = executor.executeRoleActionSynchronous(action, guild, operator, hook, null);
        assertThat(r5.isSuccess()).isFalse();
        assertThat(r5.getErrorMessage()).contains("Attempted to assign managed role");

        // 6. Bot lacks MANAGE_ROLES
        when(targetRole.isManaged()).thenReturn(false);
        doReturn(botMember).when(guild).getSelfMember();
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(false);
        ActionExecutionResult r6 = executor.executeRoleActionSynchronous(action, guild, operator, hook, null);
        assertThat(r6.isSuccess()).isFalse();
        assertThat(r6.getErrorMessage()).contains("Bot lacks MANAGE_ROLES permission");

        // 7. Bot hierarchy violation
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(false);
        ActionExecutionResult r7 = executor.executeRoleActionSynchronous(action, guild, operator, hook, null);
        assertThat(r7.isSuccess()).isFalse();
        assertThat(r7.getErrorMessage()).contains("Bot role hierarchy violation");
    }

    @Test
    @DisplayName("executeRoleActionSynchronous: succeeds with confirmationMessage when intermediate template missing")
    void executeRoleActionSynchronous_successWithConfirmationMessage() {
        EmbedAction action = EmbedAction.builder()
                .actionId("act_sync_succ")
                .roleId("role_1")
                .responseEmbedTemplateId("tpl_not_found")
                .confirmationMessage("Role confirmed!")
                .build();

        when(guild.getRoleById("role_1")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Supporter");
        when(targetRole.getAsMention()).thenReturn(null);

        when(operator.isOwner()).thenReturn(true);
        when(guild.getSelfMember()).thenReturn(null); // bot member null branch
        when(guild.addRoleToMember(operator, targetRole)).thenReturn(auditableVoidAction);

        when(embedTemplateRepository.findById("tpl_not_found")).thenReturn(Optional.empty());

        IReplyCallback interaction = mock(IReplyCallback.class);
        when(hook.getInteraction()).thenReturn(interaction);
        when(interaction.getMessageChannel()).thenReturn(channel);

        when(interpolator.interpolate(eq("Role confirmed!"), eq(guild), eq(operator), eq(operator), eq(targetRole), eq(channel), isNull()))
                .thenReturn("Role confirmed!");

        ActionExecutionResult result = executor.executeRoleActionSynchronous(action, guild, operator, hook, null);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getResponseMessage()).isEqualTo("Role assigned");
        verify(hook).editOriginal("Role confirmed!");
    }

    @Test
    @DisplayName("resolveTargetRole: parses targetRole, target_role, roleId, role_id, selected_option, and comma-separated selected_options")
    void resolveTargetRole_allSessionKeys() {
        when(guild.getRoleById("r_opt")).thenReturn(targetRole);

        // 1. targetRole
        assertThat(executor.resolveTargetRole(guild, null, Map.of("targetRole", "r_opt"))).isEqualTo(targetRole);
        // 2. target_role
        assertThat(executor.resolveTargetRole(guild, null, Map.of("target_role", "r_opt"))).isEqualTo(targetRole);
        // 3. roleId
        assertThat(executor.resolveTargetRole(guild, null, Map.of("roleId", "r_opt"))).isEqualTo(targetRole);
        // 4. role_id
        assertThat(executor.resolveTargetRole(guild, null, Map.of("role_id", "r_opt"))).isEqualTo(targetRole);
        // 5. selected_option
        assertThat(executor.resolveTargetRole(guild, null, Map.of("selected_option", "r_opt"))).isEqualTo(targetRole);

        // 6. selected_options comma separated
        when(guild.getRoleById("r_first")).thenReturn(null);
        when(guild.getRoleById("r_second")).thenReturn(targetRole);
        assertThat(executor.resolveTargetRole(guild, null, Map.of("selected_options", "r_first, r_second"))).isEqualTo(targetRole);

        // 7. Guild null
        assertThat(executor.resolveTargetRole(null, null, null)).isNull();
    }

    @Test
    @DisplayName("resolveBotMember: uses JDA.getSelfUser when getSelfMember throws exception")
    void resolveBotMember_fallbackToJDA() {
        when(guild.getSelfMember()).thenThrow(new RuntimeException("Cache missing"));
        JDA jda = mock(JDA.class);
        net.dv8tion.jda.api.entities.SelfUser selfUser = mock(net.dv8tion.jda.api.entities.SelfUser.class);
        when(guild.getJDA()).thenReturn(jda);
        doReturn(selfUser).when(jda).getSelfUser();
        when(guild.retrieveMember(selfUser)).thenReturn(cacheRestAction);
        when(cacheRestAction.complete()).thenReturn(botMember);

        Member resolved = executor.resolveBotMember(guild);
        assertThat(resolved).isEqualTo(botMember);

        // When retrieveMember throws
        when(cacheRestAction.complete()).thenThrow(new RuntimeException("Failed retrieval"));
        assertThat(executor.resolveBotMember(guild)).isNull();
    }

    @Test
    @DisplayName("recordAuditLog: handles null action and repository errors cleanly")
    void recordAuditLog_errorHandling() {
        doThrow(new RuntimeException("Mongo write error"))
                .when(interactionLogRepository).save(any(InteractionLog.class));

        // Calling through executeRoleAction when target member not found
        executor.executeRoleAction(hook, guild, operator, user, channel, "msg_1", null, Map.of("targetUser", "u_none"), null);
        // Should not bubble exception
    }

    @Test
    @DisplayName("executeRoleActionSynchronous: all rejections with hook == null")
    void executeRoleActionSynchronous_rejectionsWithHookNull() {
        EmbedAction action = EmbedAction.builder().roleId("r1").build();

        // 1. targetMember is null
        ActionExecutionResult r1 = executor.executeRoleActionSynchronous(action, guild, null, null, null);
        assertThat(r1.isSuccess()).isFalse();
        assertThat(r1.getErrorMessage()).contains("Target member not found");

        // 2. targetRole is null
        EmbedAction noRoleAction = EmbedAction.builder().build();
        when(guild.getRoleById(anyString())).thenReturn(null);
        ActionExecutionResult r2 = executor.executeRoleActionSynchronous(noRoleAction, guild, operator, null, null);
        assertThat(r2.isSuccess()).isFalse();
        assertThat(r2.getErrorMessage()).contains("Target role not found");

        // 3. canOperatorAssignRole is false
        when(guild.getRoleById("r1")).thenReturn(targetRole);
        when(operator.isOwner()).thenReturn(false);
        when(operator.getRoles()).thenReturn(Collections.emptyList());
        ActionExecutionResult r3 = executor.executeRoleActionSynchronous(action, guild, operator, null, null);
        assertThat(r3.isSuccess()).isFalse();
        assertThat(r3.getErrorMessage()).contains("Role hierarchy violation");

        // 4. targetRole.isPublicRole() is true
        when(operator.isOwner()).thenReturn(true);
        when(targetRole.isPublicRole()).thenReturn(true);
        ActionExecutionResult r4 = executor.executeRoleActionSynchronous(action, guild, operator, null, null);
        assertThat(r4.isSuccess()).isFalse();
        assertThat(r4.getErrorMessage()).contains("Attempted to assign @everyone");

        // 5. targetRole.isManaged() is true
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(true);
        when(targetRole.getName()).thenReturn("ManagedBot");
        ActionExecutionResult r5 = executor.executeRoleActionSynchronous(action, guild, operator, null, null);
        assertThat(r5.isSuccess()).isFalse();
        assertThat(r5.getErrorMessage()).contains("Attempted to assign managed role");

        // 6. botMember lacks MANAGE_ROLES
        when(targetRole.isManaged()).thenReturn(false);
        when(guild.getSelfMember()).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(false);
        ActionExecutionResult r6 = executor.executeRoleActionSynchronous(action, guild, operator, null, null);
        assertThat(r6.isSuccess()).isFalse();
        assertThat(r6.getErrorMessage()).contains("Bot lacks MANAGE_ROLES permission");

        // 7. botMember cannot interact with targetRole
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(false);
        ActionExecutionResult r7 = executor.executeRoleActionSynchronous(action, guild, operator, null, null);
        assertThat(r7.isSuccess()).isFalse();
        assertThat(r7.getErrorMessage()).contains("Bot role hierarchy violation");
    }

    @Test
    @DisplayName("executeRoleActionSynchronous: default feedback message and intermediate template variants")
    void executeRoleActionSynchronous_defaultFeedbackAndIntermediate() {
        EmbedAction blankFeedbackAction = EmbedAction.builder()
                .roleId("r1")
                .replyContent("")
                .confirmationMessage("")
                .build();

        when(guild.getRoleById("r1")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("VIP");
        when(targetRole.getAsMention()).thenReturn(null);
        when(operator.isOwner()).thenReturn(true);
        when(operator.getAsMention()).thenReturn(null);
        when(operator.getEffectiveName()).thenReturn("OpName");
        when(guild.getSelfMember()).thenReturn(null);
        when(guild.addRoleToMember(operator, targetRole)).thenReturn(auditableVoidAction);

        // 1. Hits line 277: feedbackMsg = "✅ Granted role @VIP to OpName."
        ActionExecutionResult res1 = executor.executeRoleActionSynchronous(blankFeedbackAction, guild, operator, hook, null);
        assertThat(res1.isSuccess()).isTrue();
        verify(hook).editOriginal("✅ Granted role @VIP to OpName.");

        // 2. Intermediate template when hook.sendMessage returns null
        EmbedAction intermediateAction = EmbedAction.builder()
                .roleId("r1")
                .responseEmbedTemplateId("tpl_inter")
                .build();
        EmbedTemplate interTpl = EmbedTemplate.builder().id("tpl_inter").build();
        when(embedTemplateRepository.findById("tpl_inter")).thenReturn(Optional.of(interTpl));
        when(embedTemplateRenderer.renderToMessageData(eq(interTpl), anyMap())).thenReturn(mock(MessageCreateData.class));
        when(hook.sendMessage(any(MessageCreateData.class))).thenReturn(null);

        ActionExecutionResult res2 = executor.executeRoleActionSynchronous(intermediateAction, guild, operator, hook, null);
        assertThat(res2.isSuccess()).isTrue();
        assertThat(res2.getNewGeneratedMessageId()).isNull();

        // 3. Success when hook == null
        ActionExecutionResult res3 = executor.executeRoleActionSynchronous(blankFeedbackAction, guild, operator, null, null);
        assertThat(res3.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("executeRoleAction: async callback failures and non-blank messages")
    void executeRoleAction_callbacksAndNonBlankMessages() {
        EmbedAction action = EmbedAction.builder()
                .roleId("r1")
                .roleSubtype(RoleSubtype.ADD)
                .replyContent("Custom role msg")
                .build();

        when(guild.getRoleById("r1")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(guild.getSelfMember()).thenReturn(botMember);
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(operator.getRoles()).thenReturn(Collections.emptyList());

        // 1. ADD success with custom replyContent
        when(guild.addRoleToMember(operator, targetRole)).thenReturn(auditableVoidAction);
        doAnswer(inv -> {
            Consumer<Void> sc = inv.getArgument(0);
            sc.accept(null);
            return null;
        }).when(auditableVoidAction).queue(any(), any());
        when(operator.getUser()).thenReturn(user);
        when(interpolator.interpolate(eq("Custom role msg"), any(), any(), any(), any(), any(), any())).thenReturn("Custom role msg");

        executor.executeRoleAction(hook, guild, operator, user, channel, "m_add", action, null, null);
        verify(hook).editOriginal("Custom role msg");

        // 2. ADD failure callback
        doAnswer(inv -> {
            Consumer<Throwable> fc = inv.getArgument(1);
            fc.accept(new RuntimeException("Add failed"));
            return null;
        }).when(auditableVoidAction).queue(any(), any());

        executor.executeRoleAction(hook, guild, operator, user, channel, "m_add_fail", action, null, null);
        verify(hook).editOriginal(contains("Failed to assign role: Add failed"));

        // 3. REMOVE success with custom replyContent and failure callback
        EmbedAction removeAction = EmbedAction.builder()
                .roleId("r1")
                .roleSubtype(RoleSubtype.REMOVE)
                .replyContent("Custom remove msg")
                .build();
        when(operator.getRoles()).thenReturn(List.of(targetRole));
        when(guild.removeRoleFromMember(operator, targetRole)).thenReturn(auditableVoidAction);
        doAnswer(inv -> {
            Consumer<Void> sc = inv.getArgument(0);
            sc.accept(null);
            return null;
        }).when(auditableVoidAction).queue(any(), any());
        when(interpolator.interpolate(eq("Custom remove msg"), any(), any(), any(), any(), any(), any())).thenReturn("Custom remove msg");

        executor.executeRoleAction(hook, guild, operator, user, channel, "m_rem", removeAction, null, null);
        verify(hook).editOriginal("Custom remove msg");

        doAnswer(inv -> {
            Consumer<Throwable> fc = inv.getArgument(1);
            fc.accept(new RuntimeException("Remove failed"));
            return null;
        }).when(auditableVoidAction).queue(any(), any());

        executor.executeRoleAction(hook, guild, operator, user, channel, "m_rem_fail", removeAction, null, null);
        verify(hook).editOriginal(contains("Failed to remove role: Remove failed"));

        // 4. NOOP already has role with non-blank message
        when(operator.getRoles()).thenReturn(List.of(targetRole));
        executor.executeRoleAction(hook, guild, operator, user, channel, "m_noop_has", action, null, null);
        verify(hook, atLeastOnce()).editOriginal("Custom role msg");

        // 5. NOOP does not have role with non-blank message
        when(operator.getRoles()).thenReturn(Collections.emptyList());
        executor.executeRoleAction(hook, guild, operator, user, channel, "m_noop_nohas", removeAction, null, null);
        verify(hook, atLeastOnce()).editOriginal("Custom remove msg");
    }

    @Test
    @DisplayName("resolveTargetMember, resolveTargetRole, and resolveBotMember edge cases")
    void helperMethods_extendedEdgeCases() {
        // resolveTargetMember target_user key with blank ID
        assertThat(executor.resolveTargetMember(guild, operator, Map.of("target_user", "   "))).isEqualTo(operator);
        // resolveTargetMember guild null
        assertThat(executor.resolveTargetMember(null, operator, Map.of("targetUser", "u1"))).isNull();
        // resolveTargetMember retrieveMemberById null
        when(guild.getMemberById("u_null_action")).thenReturn(null);
        when(guild.retrieveMemberById("u_null_action")).thenReturn(null);
        assertThat(executor.resolveTargetMember(guild, operator, Map.of("targetUser", "u_null_action"))).isEqualTo(operator);

        // resolveTargetRole roleId throws exception
        when(guild.getRoleById("r_bad")).thenThrow(new IllegalArgumentException("Invalid snowflake"));
        EmbedAction badRoleAction = EmbedAction.builder().roleId("r_bad").build();
        assertThat(executor.resolveTargetRole(guild, badRoleAction, null)).isNull();

        // resolveTargetRole selected_options with blanks and exceptions
        when(guild.getRoleById("r_bad_opt")).thenThrow(new IllegalArgumentException("Invalid"));
        Map<String, String> opts = Map.of("selected_options", " , , r_bad_opt, ");
        assertThat(executor.resolveTargetRole(guild, null, opts)).isNull();

        // resolveBotMember guild null
        assertThat(executor.resolveBotMember(null)).isNull();

        // resolveBotMember getSelfMember throws and JDA null / selfUser null
        when(guild.getSelfMember()).thenThrow(new RuntimeException("Self member unavailable"));
        when(guild.getJDA()).thenReturn(null);
        assertThat(executor.resolveBotMember(guild)).isNull();

        JDA mockJda = mock(JDA.class);
        when(guild.getJDA()).thenReturn(mockJda);
        when(mockJda.getSelfUser()).thenReturn(null);
        assertThat(executor.resolveBotMember(guild)).isNull();
    }
}
