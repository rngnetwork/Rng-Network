package com.rng.server;

import com.rng.server.client.DiscordServerClient;
import com.rng.server.domain.Server;
import com.rng.server.dto.ServerRoleDto;
import com.rng.server.repository.ServerRepository;
import com.rng.server.service.ServerService;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.awt.Color;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServerRoleTest {

    @Mock
    private ServerRepository serverRepository;

    @Mock
    private DiscordServerClient discordClient;

    @Mock
    private JDA jda;

    @Mock
    private Guild guild;

    @Mock
    private Member selfMember;

    @Mock
    private Role role1;

    @Mock
    private Role role2;

    @Test
    @DisplayName("getServerRoles returns roles mapped from JDA gateway with hierarchy flags")
    void testGetServerRoles_fromJda() {
        Server server = Server.builder()
                .id("123456789")
                .slug("test-server")
                .name("Test Server")
                .build();

        when(serverRepository.findByIdOrSlug("test-server")).thenReturn(Optional.of(server));
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        when(jda.getGuildById("123456789")).thenReturn(guild);
        when(guild.getSelfMember()).thenReturn(selfMember);

        // Role 1: Assignable Member role
        when(role1.getId()).thenReturn("role_1");
        when(role1.getName()).thenReturn("Member");
        when(role1.getColor()).thenReturn(new Color(0x3498db));
        when(role1.getColorRaw()).thenReturn(0x3498db);
        when(role1.getPosition()).thenReturn(5);
        when(role1.isManaged()).thenReturn(false);
        when(selfMember.canInteract(role1)).thenReturn(true);

        // Role 2: Unassignable Admin role above bot
        when(role2.getId()).thenReturn("role_2");
        when(role2.getName()).thenReturn("Supreme");
        when(role2.getColor()).thenReturn(null);
        when(role2.getPosition()).thenReturn(20);
        when(role2.isManaged()).thenReturn(false);
        when(selfMember.canInteract(role2)).thenReturn(false);

        when(guild.getRoles()).thenReturn(List.of(role1, role2));

        ServerService service = new ServerService(serverRepository, discordClient, null, jda);
        List<ServerRoleDto> roles = service.getServerRoles("test-server");

        assertThat(roles).hasSize(2);
        ServerRoleDto r1 = roles.get(0);
        assertThat(r1.getId()).isEqualTo("role_1");
        assertThat(r1.getName()).isEqualTo("Member");
        assertThat(r1.getColor()).isEqualTo("#3498DB");
        assertThat(r1.isAssignableByBot()).isTrue();

        ServerRoleDto r2 = roles.get(1);
        assertThat(r2.getId()).isEqualTo("role_2");
        assertThat(r2.getName()).isEqualTo("Supreme");
        assertThat(r2.getColor()).isEqualTo("#99AAB5");
        assertThat(r2.isAssignableByBot()).isFalse();
    }
}
