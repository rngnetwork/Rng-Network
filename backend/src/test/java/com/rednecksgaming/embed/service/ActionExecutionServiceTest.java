package com.rednecksgaming.embed.service;

import com.rednecksgaming.embed.domain.ActionType;
import com.rednecksgaming.embed.domain.CompoundOperation;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.domain.ResponseType;
import com.rednecksgaming.embed.domain.RoleSubtype;
import com.rednecksgaming.embed.dto.ActionExecutionResult;
import com.rednecksgaming.embed.repository.EmbedActionRepository;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.exceptions.ErrorResponseException;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.requests.ErrorResponse;
import net.dv8tion.jda.api.requests.RestAction;
import net.dv8tion.jda.api.requests.restaction.AuditableRestAction;
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
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActionExecutionServiceTest {

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
    private DiscordDispatchService discordDispatchService;

    @Mock
    private ButtonInteractionEvent buttonEvent;

    @Mock
    private InteractionHook hook;

    @Mock
    private Guild guild;

    @Mock
    private Member clickingMember;

    @Mock
    private net.dv8tion.jda.api.entities.SelfMember botMember;

    @Mock
    private User user;

    @Mock
    private MessageChannel channel;

    @Mock
    private Role targetRole;

    @Mock
    private WebhookMessageEditAction<net.dv8tion.jda.api.entities.Message> editAction;

    @Mock
    private AuditableRestAction<Void> voidAction;

    @Mock
    private CacheRestAction<Member> memberRestAction;

    @Mock
    private CacheRestAction<PrivateChannel> dmRestAction;

    @Mock
    private MessageCreateAction messageCreateAction;

    @Mock
    private net.dv8tion.jda.api.requests.restaction.ChannelAction<TextChannel> channelAction;

    private ActionExecutionServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ActionExecutionServiceImpl(
                interactionLogRepository,
                embedTemplateRepository,
                embedActionRepository,
                embedTemplateRenderer,
                redisTemplate);

        lenient().when(buttonEvent.getHook()).thenReturn(hook);
        lenient().when(buttonEvent.getGuild()).thenReturn(guild);
        lenient().when(buttonEvent.getMember()).thenReturn(clickingMember);
        lenient().when(buttonEvent.getUser()).thenReturn(user);
        lenient().when(buttonEvent.getMessageChannel()).thenReturn(channel);
        lenient().when(buttonEvent.getMessageId()).thenReturn("msg_123");

        lenient().when(guild.getId()).thenReturn("guild_1");
        lenient().when(guild.getName()).thenReturn("RNG Test Guild");
        lenient().when(guild.getSelfMember()).thenReturn(botMember);
        lenient().when(user.getId()).thenReturn("user_1");
        lenient().when(user.getName()).thenReturn("JaneDoe");
        lenient().when(channel.getId()).thenReturn("chan_1");
        lenient().when(clickingMember.getId()).thenReturn("user_1");
        lenient().when(clickingMember.getUser()).thenReturn(user);
        lenient().when(clickingMember.getAsMention()).thenReturn("<@user_1>");

        lenient().when(hook.editOriginal(anyString())).thenReturn(editAction);
    }

    @Test
    @DisplayName("ROLE action rejects when target role does not exist on guild")
    void executeRole_roleNotFound() {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_1")
                .actionType(ActionType.ROLE)
                .roleId("role_missing")
                .build();

        when(guild.getRoleById("role_missing")).thenReturn(null);

        service.executeButtonAction(buttonEvent, action, Collections.emptyMap());

        verify(hook).editOriginal(contains("does not exist"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
        verify(redisTemplate).delete("interaction:session:guild_1:user_1:msg_123");
    }

    @Test
    @DisplayName("ROLE action rejects when target role is @everyone public role")
    void executeRole_publicRoleRejected() {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_2")
                .actionType(ActionType.ROLE)
                .roleId("role_everyone")
                .build();

        when(guild.getRoleById("role_everyone")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(true);

        service.executeButtonAction(buttonEvent, action, Collections.emptyMap());

        verify(hook).editOriginal(contains("Cannot assign or modify the @everyone public role"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("ROLE action rejects when target role is managed integration role")
    void executeRole_managedRoleRejected() {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_3")
                .actionType(ActionType.ROLE)
                .roleId("role_managed")
                .build();

        when(guild.getRoleById("role_managed")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(true);
        when(targetRole.getName()).thenReturn("Integration Bot");

        service.executeButtonAction(buttonEvent, action, Collections.emptyMap());

        verify(hook).editOriginal(contains("Cannot assign managed integration/bot role"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("ROLE action rejects when bot lacks MANAGE_ROLES permission")
    void executeRole_botLacksPermission() {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_4")
                .actionType(ActionType.ROLE)
                .roleId("role_valid")
                .build();

        when(guild.getRoleById("role_valid")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(false);

        service.executeButtonAction(buttonEvent, action, Collections.emptyMap());

        verify(hook).editOriginal(contains("Bot lacks 'Manage Roles' permission"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("ROLE action rejects when bot cannot interact with role due to hierarchy")
    void executeRole_hierarchyViolation() {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_5")
                .actionType(ActionType.ROLE)
                .roleId("role_higher")
                .build();

        when(guild.getRoleById("role_higher")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Chief Marshal");
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(false);

        service.executeButtonAction(buttonEvent, action, Collections.emptyMap());

        verify(hook).editOriginal(contains("Role hierarchy error"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
    }

    @Test
    @DisplayName("ROLE action successfully executes add role and cleans up session")
    void executeRole_success() {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role_6")
                .actionType(ActionType.ROLE)
                .roleSubtype(RoleSubtype.ADD)
                .roleId("role_member")
                .replyContent("Welcome {user} to {target_role}!")
                .build();

        when(guild.getRoleById("role_member")).thenReturn(targetRole);
        when(targetRole.isPublicRole()).thenReturn(false);
        when(targetRole.isManaged()).thenReturn(false);
        when(targetRole.getName()).thenReturn("Member");
        when(botMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);
        when(botMember.canInteract(targetRole)).thenReturn(true);
        when(clickingMember.getRoles()).thenReturn(Collections.emptyList());
        when(guild.addRoleToMember(eq(clickingMember), eq(targetRole))).thenReturn(voidAction);
        doAnswer(invocation -> {
            java.util.function.Consumer<Void> successConsumer = invocation.getArgument(0);
            if (successConsumer != null) {
                successConsumer.accept(null);
            }
            return null;
        }).when(voidAction).queue(any(), any());

        service.executeButtonAction(buttonEvent, action, Collections.emptyMap());

        verify(guild).addRoleToMember(clickingMember, targetRole);
        verify(hook).editOriginal("Welcome <@user_1> to @Member!");
        verify(interactionLogRepository).save(argThat(log -> "SUCCESS".equals(log.getStatus())));
        verify(redisTemplate).delete("interaction:session:guild_1:user_1:msg_123");
    }

    @Test
    @DisplayName("REPLY action interpolates variables and delivers response")
    void executeReply_success() {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_reply_1")
                .actionType(ActionType.REPLY)
                .replyContent("Hello {user} from {server} in {channel}!")
                .build();

        service.executeButtonAction(buttonEvent, action, Collections.emptyMap());

        verify(hook).editOriginal("Hello <@user_1> from RNG Test Guild in <#chan_1>!");
        verify(interactionLogRepository).save(argThat(log -> "SUCCESS".equals(log.getStatus())));
        verify(redisTemplate).delete("interaction:session:guild_1:user_1:msg_123");
    }

    @Test
    @DisplayName("TICKET action rejects when bot lacks MANAGE_CHANNEL permission")
    void executeTicket_botLacksPermission() {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_ticket_1")
                .actionType(ActionType.TICKET)
                .channelPrefix("ticket-")
                .build();

        when(botMember.hasPermission(Permission.MANAGE_CHANNEL)).thenReturn(false);

        service.executeButtonAction(buttonEvent, action, Collections.emptyMap());

        verify(hook).editOriginal(contains("Bot lacks 'Manage Channels' permission"));
        verify(interactionLogRepository).save(argThat(log -> "FAILED".equals(log.getStatus())));
        verify(redisTemplate).delete("interaction:session:guild_1:user_1:msg_123");
    }

    @Test
    @DisplayName("Should block role grant when operator role position is lower than target role")
    void should_enforce_operator_role_hierarchy() {
        Member operator = mock(Member.class);
        Role operatorRole = mock(Role.class);
        when(operatorRole.getPosition()).thenReturn(5);
        when(operator.getRoles()).thenReturn(List.of(operatorRole));

        Role testTargetRole = mock(Role.class);
        when(testTargetRole.getPosition()).thenReturn(10); // Target higher than operator

        boolean permitted = service.canOperatorAssignRole(operator, testTargetRole);
        assertThat(permitted).isFalse();
    }

    @Test
    @DisplayName("Should allow role grant when operator is server owner")
    void should_allow_role_grant_when_operator_is_owner() {
        Member operator = mock(Member.class);
        when(operator.isOwner()).thenReturn(true);

        Role testTargetRole = mock(Role.class);
        boolean permitted = service.canOperatorAssignRole(operator, testTargetRole);
        assertThat(permitted).isTrue();
    }

    @Test
    @DisplayName("Should allow role grant when operator highest role outranks target role")
    void should_allow_role_grant_when_operator_outranks_target_role() {
        Member operator = mock(Member.class);
        Role operatorRole = mock(Role.class);
        when(operatorRole.getPosition()).thenReturn(20);
        when(operator.getRoles()).thenReturn(List.of(operatorRole));

        Role testTargetRole = mock(Role.class);
        when(testTargetRole.getPosition()).thenReturn(10); // Target lower than operator
        boolean permitted = service.canOperatorAssignRole(operator, testTargetRole);
        assertThat(permitted).isTrue();
    }

    @Test
    @DisplayName("Should abort role grant when target member has left the Discord server")
    void should_abort_role_grant_when_target_member_left_server() {
        Guild mockGuild = mock(Guild.class);
        when(mockGuild.getId()).thenReturn("guild-999");
        when(mockGuild.getMemberById("user-left")).thenReturn(null);
        when(mockGuild.retrieveMemberById("user-left")).thenReturn(memberRestAction);
        when(memberRestAction.complete()).thenThrow(new RuntimeException("Target member left server"));

        InteractionHook mockHook = mock(InteractionHook.class);
        when(mockHook.editOriginal(anyString())).thenReturn(editAction);
        Map<String, String> sessionData = Map.of("targetUser", "user-left");

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role")
                .actionType(ActionType.ROLE)
                .build();
        when(embedActionRepository.findByActionId("rng_act_role")).thenReturn(Optional.of(action));

        ActionExecutionResult result = service.executeComponentAction(
                "rng_act_role", mockGuild, mock(Member.class), mockHook, sessionData);

        assertThat(result.isSuccess()).isFalse();
        verify(mockHook).editOriginal("❌ Target member is no longer in this server.");
    }

    @Test
    @DisplayName("Should reject executeComponentAction when operator hierarchy is violated")
    void should_reject_executeComponentAction_when_operator_hierarchy_violated() {
        Guild mockGuild = mock(Guild.class);
        Member operator = mock(Member.class);
        Role operatorRole = mock(Role.class);
        when(operatorRole.getPosition()).thenReturn(5);
        when(operator.getRoles()).thenReturn(List.of(operatorRole));

        Member targetMember = mock(Member.class);
        when(mockGuild.getMemberById("user-222")).thenReturn(targetMember);

        Role targetRoleMock = mock(Role.class);
        when(targetRoleMock.getPosition()).thenReturn(10);
        when(mockGuild.getRoleById("role-333")).thenReturn(targetRoleMock);

        InteractionHook mockHook = mock(InteractionHook.class);
        WebhookMessageEditAction editAct = mock(WebhookMessageEditAction.class);
        when(mockHook.editOriginal(anyString())).thenReturn(editAct);

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_role")
                .actionType(ActionType.ROLE)
                .build();
        when(embedActionRepository.findByActionId("rng_act_role")).thenReturn(Optional.of(action));

        Map<String, String> sessionData = Map.of(
                "targetUser", "user-222",
                "targetRole", "role-333"
        );

        ActionExecutionResult result = service.executeComponentAction(
                "rng_act_role", mockGuild, operator, mockHook, sessionData);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Role hierarchy violation");
        verify(mockHook).editOriginal(contains("Hierarchy violation"));
    }

    @Test
    @DisplayName("Should deliver audit logs directly into ticket channel when user DMs are closed")
    void should_deliver_logs_to_ticket_channel_when_dm_fails_with_50007() {
        User mockUser = mock(User.class);
        when(mockUser.openPrivateChannel()).thenReturn(dmRestAction);
        when(dmRestAction.complete()).thenThrow(new RuntimeException("Cannot send to user (DMs disabled)"));

        TextChannel ticketChannel = mock(TextChannel.class);
        when(ticketChannel.sendMessage(any(MessageCreateData.class))).thenReturn(messageCreateAction);

        ActionExecutionResult result = service.dispatchDMLogsWithFallback(mockUser, ticketChannel, mock(MessageCreateData.class));
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.isDmDelivered()).isFalse();
        verify(ticketChannel).sendMessage(any(MessageCreateData.class));
    }

    @Test
    @DisplayName("Should successfully deliver audit logs directly via DM when user DMs are open")
    void should_deliver_logs_via_dm_when_dms_open() {
        User mockUser = mock(User.class);
        PrivateChannel privateChannel = mock(PrivateChannel.class);
        when(mockUser.openPrivateChannel()).thenReturn(dmRestAction);
        when(dmRestAction.complete()).thenReturn(privateChannel);

        when(privateChannel.sendMessage(any(MessageCreateData.class))).thenReturn(messageCreateAction);

        TextChannel ticketChannel = mock(TextChannel.class);

        ActionExecutionResult result = service.dispatchDMLogsWithFallback(mockUser, ticketChannel, mock(MessageCreateData.class));
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.isDmDelivered()).isTrue();
        verify(privateChannel).sendMessage(any(MessageCreateData.class));
        verify(ticketChannel, never()).sendMessage(any(MessageCreateData.class));
    }

    @Test
    @DisplayName("Should execute compound action creating dual-member ACL ticket channel")
    void should_execute_compound_action_with_dual_member_acl() {
        Guild mockGuild = mock(Guild.class);
        Member operator = mock(Member.class);
        when(operator.getUser()).thenReturn(mock(User.class));
        when(operator.getAsMention()).thenReturn("<@operator>");

        Member targetMember = mock(Member.class);
        when(targetMember.getAsMention()).thenReturn("<@target>");
        when(mockGuild.getMemberById("user-target")).thenReturn(targetMember);
        when(mockGuild.getName()).thenReturn("RNG War Guild");

        Role publicRole = mock(Role.class);
        when(mockGuild.getPublicRole()).thenReturn(publicRole);

        when(mockGuild.createTextChannel(anyString())).thenReturn(channelAction);
        when(channelAction.addPermissionOverride(any(), any(), any())).thenReturn(channelAction);

        TextChannel createdTicket = mock(TextChannel.class);
        when(createdTicket.getId()).thenReturn("chan-ticket-999");
        when(channelAction.complete()).thenReturn(createdTicket);

        InteractionHook mockHook = mock(InteractionHook.class);
        when(mockHook.editOriginal(anyString())).thenReturn(editAction);

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_ticket")
                .actionType(ActionType.TICKET)
                .channelPrefix("ticket-")
                .compoundOperations(List.of(
                        CompoundOperation.builder()
                                .operationType(CompoundOperation.OperationType.SEND_DM_TEMPLATE)
                                .templateId("tpl_dm_logs")
                                .build()
                ))
                .build();
        when(embedActionRepository.findByActionId("rng_act_ticket")).thenReturn(Optional.of(action));

        EmbedTemplate dmTpl = EmbedTemplate.builder()
                .templateId("tpl_dm_logs")
                .name("Ticket Logs")
                .build();
        when(embedTemplateRepository.findById("tpl_dm_logs")).thenReturn(Optional.of(dmTpl));

        MessageCreateData msgData = mock(MessageCreateData.class);
        when(embedTemplateRenderer.renderToMessageData(eq(dmTpl), anyMap())).thenReturn(msgData);

        CacheRestAction<PrivateChannel> dmRestAction = mock(CacheRestAction.class);
        when(operator.getUser().openPrivateChannel()).thenReturn(dmRestAction);
        PrivateChannel pc = mock(PrivateChannel.class);
        when(dmRestAction.complete()).thenReturn(pc);
        MessageCreateAction createAction = mock(MessageCreateAction.class);
        when(pc.sendMessage(any(MessageCreateData.class))).thenReturn(createAction);

        Map<String, String> sessionData = Map.of("targetUser", "user-target");

        ActionExecutionResult result = service.executeCompoundAction(
                "rng_act_ticket", mockGuild, operator, mockHook, sessionData);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getChannelId()).isEqualTo("chan-ticket-999");
        assertThat(result.getTicketId()).isNotNull();
        verify(channelAction, atLeastOnce()).addPermissionOverride(eq(publicRole), any(), any());
        verify(channelAction, atLeastOnce()).addPermissionOverride(eq(operator), any(), any());
        verify(channelAction, atLeastOnce()).addPermissionOverride(eq(targetMember), any(), any());
        verify(mockHook).editOriginal(contains("Created ticket"));
    }

    @Test
    @DisplayName("Should dispatch Components V2 wire payload via Discord REST API v10 when discordDispatchService is present")
    void should_dispatch_components_v2_follow_up_embed_via_discord_rest_api() {
        ActionExecutionServiceImpl customService = new ActionExecutionServiceImpl(
                interactionLogRepository,
                embedTemplateRepository,
                embedActionRepository,
                embedTemplateRenderer,
                redisTemplate,
                discordDispatchService
        );

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_reply_v2")
                .actionType(ActionType.REPLY)
                .responseType(ResponseType.PUBLIC_EMBED)
                .responseEmbedTemplateId("tpl_follow_v2")
                .build();
        when(embedActionRepository.findByActionId("rng_act_reply_v2")).thenReturn(Optional.of(action));

        EmbedTemplate followUpTpl = EmbedTemplate.builder()
                .templateId("tpl_follow_v2")
                .name("Follow-Up V2")
                .payload(Map.of("flags", 32768, "components", List.of(Map.of("type", 17))))
                .build();
        when(embedTemplateRepository.findById("tpl_follow_v2")).thenReturn(Optional.of(followUpTpl));

        Map<String, Object> wirePayload = Map.of("flags", 32768, "components", List.of(Map.of("type", 17)));
        when(embedTemplateRenderer.renderInterpolatedWirePayload(eq(followUpTpl), anyMap())).thenReturn(wirePayload);

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.JsonNode responseNode = mapper.createObjectNode().put("id", "msg_snowflake_v2");
        when(discordDispatchService.dispatchToChannel(eq("chan_1"), eq(wirePayload), isNull())).thenReturn(responseNode);

        net.dv8tion.jda.api.interactions.Interaction mockInteraction = mock(net.dv8tion.jda.api.interactions.Interaction.class);
        when(hook.getInteraction()).thenReturn(mockInteraction);
        when(mockInteraction.getMessageChannel()).thenReturn(channel);

        ActionExecutionResult result = customService.executeComponentAction(
                "rng_act_reply_v2", guild, clickingMember, hook, Map.of());

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getNewGeneratedMessageId()).isEqualTo("msg_snowflake_v2");
        verify(discordDispatchService).dispatchToChannel(eq("chan_1"), eq(wirePayload), isNull());
    }

    @Test
    @DisplayName("DM follow-up embed formats targetRole as @RoleName to avoid @unknown-role in DMs")
    void should_format_role_as_name_in_dm_embed_to_avoid_unknown_role() {
        ActionExecutionServiceImpl customService = new ActionExecutionServiceImpl(
                interactionLogRepository,
                embedTemplateRepository,
                embedActionRepository,
                embedTemplateRenderer,
                redisTemplate,
                discordDispatchService
        );

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_dm_role_embed")
                .actionType(ActionType.REPLY)
                .responseType(ResponseType.DM_EMBED)
                .responseEmbedTemplateId("tpl_dm_role_logs")
                .roleId("role_vip_99")
                .build();
        when(embedActionRepository.findByActionId("rng_act_dm_role_embed")).thenReturn(Optional.of(action));

        Role mockRole = mock(Role.class);
        when(mockRole.getName()).thenReturn("Fn staff !!");
        lenient().when(mockRole.getAsMention()).thenReturn("<@&role_vip_99>");
        when(guild.getRoleById("role_vip_99")).thenReturn(mockRole);

        EmbedTemplate followUpTpl = EmbedTemplate.builder()
                .templateId("tpl_dm_role_logs")
                .name("DM Role Logs")
                .payload(Map.of("content", "Role Given: {targetRole}"))
                .build();
        when(embedTemplateRepository.findById("tpl_dm_role_logs")).thenReturn(Optional.of(followUpTpl));

        net.dv8tion.jda.api.requests.restaction.CacheRestAction<net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel> pcRestAction = mock(net.dv8tion.jda.api.requests.restaction.CacheRestAction.class);
        net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel pc = mock(net.dv8tion.jda.api.entities.channel.concrete.PrivateChannel.class);
        when(user.openPrivateChannel()).thenReturn(pcRestAction);
        when(pcRestAction.complete()).thenReturn(pc);
        when(pc.getId()).thenReturn("dm_chan_123");

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.JsonNode responseNode = mapper.createObjectNode().put("id", "msg_dm_snowflake");
        when(discordDispatchService.dispatchToChannel(eq("dm_chan_123"), any(), isNull())).thenReturn(responseNode);

        customService.executeComponentAction("rng_act_dm_role_embed", guild, clickingMember, hook, Map.of("targetRole", "role_vip_99"));

        org.mockito.ArgumentCaptor<Map<String, String>> varsCaptor = org.mockito.ArgumentCaptor.forClass(Map.class);
        verify(embedTemplateRenderer).renderInterpolatedWirePayload(eq(followUpTpl), varsCaptor.capture());

        Map<String, String> capturedVars = varsCaptor.getValue();
        assertThat(capturedVars.get("targetRole")).isEqualTo("@Fn staff !!");
        assertThat(capturedVars.get("targetRoleName")).isEqualTo("Fn staff !!");
    }

    @Test
    @DisplayName("Public server follow-up embed formats targetRole as <@&roleId> to mention role on server")
    void should_format_role_as_mention_in_public_server_embed() {
        ActionExecutionServiceImpl customService = new ActionExecutionServiceImpl(
                interactionLogRepository,
                embedTemplateRepository,
                embedActionRepository,
                embedTemplateRenderer,
                redisTemplate,
                discordDispatchService
        );

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_public_role_embed")
                .actionType(ActionType.REPLY)
                .responseType(ResponseType.PUBLIC_EMBED)
                .responseEmbedTemplateId("tpl_public_role_logs")
                .roleId("role_vip_99")
                .build();
        when(embedActionRepository.findByActionId("rng_act_public_role_embed")).thenReturn(Optional.of(action));

        Role mockRole = mock(Role.class);
        when(mockRole.getName()).thenReturn("Fn staff !!");
        when(mockRole.getAsMention()).thenReturn("<@&role_vip_99>");
        when(guild.getRoleById("role_vip_99")).thenReturn(mockRole);

        EmbedTemplate followUpTpl = EmbedTemplate.builder()
                .templateId("tpl_public_role_logs")
                .name("Public Server Role Logs")
                .payload(Map.of("content", "Role Given: {targetRole}"))
                .build();
        when(embedTemplateRepository.findById("tpl_public_role_logs")).thenReturn(Optional.of(followUpTpl));

        net.dv8tion.jda.api.interactions.Interaction mockInteraction = mock(net.dv8tion.jda.api.interactions.Interaction.class);
        when(hook.getInteraction()).thenReturn(mockInteraction);
        when(mockInteraction.getMessageChannel()).thenReturn(channel);

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.JsonNode responseNode = mapper.createObjectNode().put("id", "msg_public_snowflake");
        when(discordDispatchService.dispatchToChannel(eq("chan_1"), any(), isNull())).thenReturn(responseNode);

        customService.executeComponentAction("rng_act_public_role_embed", guild, clickingMember, hook, Map.of("targetRole", "role_vip_99"));

        org.mockito.ArgumentCaptor<Map<String, String>> varsCaptor = org.mockito.ArgumentCaptor.forClass(Map.class);
        verify(embedTemplateRenderer).renderInterpolatedWirePayload(eq(followUpTpl), varsCaptor.capture());

        Map<String, String> capturedVars = varsCaptor.getValue();
        assertThat(capturedVars.get("targetRole")).isEqualTo("<@&role_vip_99>");
        assertThat(capturedVars.get("targetRoleName")).isEqualTo("Fn staff !!");
    }
}
