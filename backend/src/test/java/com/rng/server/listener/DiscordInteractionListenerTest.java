package com.rng.server.listener;

import com.rng.embed.domain.ActionPayload;
import com.rng.embed.domain.ActionType;
import com.rng.embed.dto.EmbedActionDto;
import com.rng.embed.service.EmbedActionService;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.User;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.interactions.InteractionHook;
import net.dv8tion.jda.api.requests.RestAction;
import net.dv8tion.jda.api.requests.restaction.AuditableRestAction;
import net.dv8tion.jda.api.requests.restaction.interactions.ReplyCallbackAction;
import net.dv8tion.jda.api.requests.restaction.WebhookMessageEditAction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DiscordInteractionListenerTest {

    @Mock
    private EmbedActionService actionService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ZSetOperations<String, String> zSetOperations;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private ButtonInteractionEvent buttonEvent;

    @Mock
    private Guild guild;

    @Mock
    private Member member;

    @Mock
    private Member selfMember;

    @Mock
    private User user;

    @Mock
    private Role targetRole;

    @Mock
    private ReplyCallbackAction replyCallbackAction;

    @Mock
    private InteractionHook hook;

    @Mock
    private WebhookMessageEditAction webhookEditAction;

    @Mock
    private AuditableRestAction roleRestAction;

    private DiscordGatewayEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new DiscordGatewayEventListener(cacheManager, actionService, redisTemplate);
        doAnswer(inv -> {
            java.util.function.Consumer<InteractionHook> consumer = inv.getArgument(0);
            consumer.accept(hook);
            return null;
        }).when(replyCallbackAction).queue(any());
    }

    @Test
    @DisplayName("onButtonInteraction processes ROLE toggle action when permissions and hierarchy are valid")
    void testButtonInteraction_roleToggle_success() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_1234567890abcdef");
        when(buttonEvent.getGuild()).thenReturn(guild);
        when(buttonEvent.getMember()).thenReturn(member);
        when(buttonEvent.getUser()).thenReturn(user);
        when(buttonEvent.deferReply(true)).thenReturn(replyCallbackAction);
        when(buttonEvent.getHook()).thenReturn(hook);
        when(hook.editOriginal(anyString())).thenReturn(webhookEditAction);

        when(guild.getId()).thenReturn("guild_999");
        when(guild.getSelfMember()).thenReturn(selfMember);
        when(selfMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);

        when(member.getId()).thenReturn("user_111");
        when(member.getRoles()).thenReturn(List.of()); // Member currently does not have the role

        when(guild.getRoleById("role_555")).thenReturn(targetRole);
        when(targetRole.getName()).thenReturn("Verified");
        when(targetRole.isManaged()).thenReturn(false);
        when(selfMember.canInteract(targetRole)).thenReturn(true);
        when(guild.addRoleToMember(eq(member), eq(targetRole))).thenReturn(roleRestAction);
        doAnswer(inv -> {
            java.util.function.Consumer<Void> success = inv.getArgument(0);
            success.accept(null);
            return null;
        }).when(roleRestAction).queue(any(), any());

        ActionPayload payload = ActionPayload.builder()
                .roleSubtype("TOGGLE")
                .roleId("role_555")
                .roleName("Verified")
                .successMessage("Role **Verified** added!")
                .build();

        EmbedActionDto actionDto = EmbedActionDto.builder()
                .actionId("rng_act_1234567890abcdef")
                .serverId("guild_999")
                .name("Verify Role")
                .actionType(ActionType.ROLE)
                .payload(payload)
                .build();

        when(actionService.getAction("guild_999", "rng_act_1234567890abcdef")).thenReturn(actionDto);

        // Execute interaction
        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).deferReply(true);
        verify(replyCallbackAction).queue(any());
        verify(guild).addRoleToMember(member, targetRole);
        verify(roleRestAction).queue(any(), any());
        verify(hook).editOriginal(contains("Role **Verified** added!"));
    }

    @Test
    @DisplayName("onButtonInteraction rejects with hierarchy error when bot cannot interact with role")
    void testButtonInteraction_roleHierarchyError() {
        when(buttonEvent.getComponentId()).thenReturn("rng_act_1234567890abcdef");
        when(buttonEvent.getGuild()).thenReturn(guild);
        when(buttonEvent.getMember()).thenReturn(member);
        when(buttonEvent.deferReply(true)).thenReturn(replyCallbackAction);
        when(buttonEvent.getHook()).thenReturn(hook);
        when(hook.editOriginal(anyString())).thenReturn(webhookEditAction);

        when(guild.getId()).thenReturn("guild_999");
        when(guild.getSelfMember()).thenReturn(selfMember);
        when(selfMember.hasPermission(Permission.MANAGE_ROLES)).thenReturn(true);

        when(guild.getRoleById("role_admin")).thenReturn(targetRole);
        when(targetRole.getName()).thenReturn("Admin");
        when(targetRole.isManaged()).thenReturn(false);
        when(selfMember.canInteract(targetRole)).thenReturn(false); // Bot cannot interact!

        ActionPayload payload = ActionPayload.builder()
                .roleSubtype("ADD")
                .roleId("role_admin")
                .build();

        EmbedActionDto actionDto = EmbedActionDto.builder()
                .actionId("rng_act_1234567890abcdef")
                .serverId("guild_999")
                .actionType(ActionType.ROLE)
                .payload(payload)
                .build();

        when(actionService.getAction("guild_999", "rng_act_1234567890abcdef")).thenReturn(actionDto);

        listener.onButtonInteraction(buttonEvent);

        verify(buttonEvent).deferReply(true);
        verify(hook).editOriginal(contains("Bot hierarchy error"));
        verify(guild, never()).addRoleToMember(any(), any());
    }
}
