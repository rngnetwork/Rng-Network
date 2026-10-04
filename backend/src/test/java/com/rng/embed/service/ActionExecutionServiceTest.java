package com.rng.embed.service;

import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.InteractionLog;
import com.rng.embed.domain.RoleSubtype;
import com.rng.embed.repository.EmbedTemplateRepository;
import com.rng.embed.repository.InteractionLogRepository;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.entities.channel.middleman.MessageChannel;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.requests.restaction.AuditableRestAction;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActionExecutionServiceTest {

    @Mock
    private InteractionLogRepository interactionLogRepository;

    @Mock
    private EmbedTemplateRepository embedTemplateRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ButtonInteractionEvent buttonEvent;

    @Mock
    private InteractionHook hook;

    @Mock
    private Guild guild;

    @Mock
    private Member clickingMember;

    @Mock
    private Member botMember;

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

    private ActionExecutionServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ActionExecutionServiceImpl(interactionLogRepository, embedTemplateRepository, redisTemplate);

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
}
