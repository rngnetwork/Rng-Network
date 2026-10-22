package com.rednecksgaming.identity;

import com.rednecksgaming.identity.domain.AuthProvider;
import com.rednecksgaming.identity.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class UserTest {

    @Test
    @DisplayName("getDesignationList handles null, blank, and comma-separated values")
    void testGetDesignationList() {
        User user = new User();
        assertThat(user.getDesignationList()).isEmpty();

        user.setDesignations("   ");
        assertThat(user.getDesignationList()).isEmpty();

        user.setDesignations("Supreme,  Ministry of Tech , , Ministry of Finances ");
        assertThat(user.getDesignationList())
                .containsExactly("Supreme", "Ministry of Tech", "Ministry of Finances");
    }

    @Test
    @DisplayName("getRoleList handles null, blank, and comma-separated values")
    void testGetRoleList() {
        User user = new User();
        assertThat(user.getRoleList()).isEmpty();

        user.setRoles("   ");
        assertThat(user.getRoleList()).isEmpty();

        user.setRoles("Chief High Command,  High Command , , Minister ");
        assertThat(user.getRoleList())
                .containsExactly("Chief High Command", "High Command", "Minister");
    }

    @Test
    @DisplayName("isActive checks ACTIVE status case-insensitively")
    void testIsActive() {
        User user = User.builder().status("ACTIVE").build();
        assertThat(user.isActive()).isTrue();

        user.setStatus("active");
        assertThat(user.isActive()).isTrue();

        user.setStatus("SUSPENDED");
        assertThat(user.isActive()).isFalse();

        user.setStatus(null);
        assertThat(user.isActive()).isFalse();
    }

    @Test
    @DisplayName("User getters, setters, and builder")
    void testUserBuilderAndGetters() {
        User user = User.builder()
                .id(1L)
                .email("test@rng.com")
                .fullName("Test User")
                .provider(AuthProvider.EMAIL)
                .googleId("google-123")
                .discordId("discord-456")
                .discordUsername("User#1234")
                .discordAvatar("avatar.png")
                .discordLinked(true)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Junior Dev")
                .status("ACTIVE")
                .build();

        assertThat(user.getId()).isEqualTo(1L);
        assertThat(user.getEmail()).isEqualTo("test@rng.com");
        assertThat(user.getFullName()).isEqualTo("Test User");
        assertThat(user.getProvider()).isEqualTo(AuthProvider.EMAIL);
        assertThat(user.getGoogleId()).isEqualTo("google-123");
        assertThat(user.getDiscordId()).isEqualTo("discord-456");
        assertThat(user.getDiscordUsername()).isEqualTo("User#1234");
        assertThat(user.getDiscordAvatar()).isEqualTo("avatar.png");
        assertThat(user.isDiscordLinked()).isTrue();
        assertThat(user.getRole()).isEqualTo("ROLE_USER");
        assertThat(user.getDesignations()).isEqualTo("Ministry of Tech");
        assertThat(user.getRoles()).isEqualTo("Junior Dev");
        assertThat(user.getStatus()).isEqualTo("ACTIVE");
    }
}
