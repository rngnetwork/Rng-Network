package com.rng.identity.config;

import com.rng.identity.domain.AuthProvider;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DatabaseSeederUnitTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DatabaseSeeder databaseSeeder;

    @Test
    @DisplayName("seedDefaultUserPasswords encodes uninitialized password and synchronizes roles")
    void seedDefaultUserPasswords_uninitializedPassword_updatesUser() {
        User user = User.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .provider(AuthProvider.EMAIL)
                .password(null)
                .role("ROLE_USER")
                .designations("Unassigned")
                .roles("Unassigned")
                .build();

        when(userRepository.findByEmail("arzenic@rednecksgaming.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(DatabaseSeeder.DEFAULT_RAW_PASSWORD)).thenReturn("$2a$10$encodedAdminSecret");

        databaseSeeder.seedDefaultUserPasswords();

        assertThat(user.getPassword()).isEqualTo("$2a$10$encodedAdminSecret");
        assertThat(user.getRole()).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(user.getDesignations()).isEqualTo("Supreme");
        assertThat(user.getRoles()).isEqualTo("High Command, Chief High Command");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("seedDefaultUserPasswords skips password update if already matches encoded hash")
    void seedDefaultUserPasswords_matchingPassword_doesNotReEncode() {
        User user = User.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .provider(AuthProvider.EMAIL)
                .password("$2a$10$alreadyEncoded")
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command, Chief High Command")
                .build();

        when(userRepository.findByEmail("arzenic@rednecksgaming.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(DatabaseSeeder.DEFAULT_RAW_PASSWORD, "$2a$10$alreadyEncoded")).thenReturn(true);

        databaseSeeder.seedDefaultUserPasswords();

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("seedDefaultUserPasswords handles missing seeded user gracefully")
    void seedDefaultUserPasswords_userNotFound_handlesGracefully() {
        when(userRepository.findByEmail("arzenic@rednecksgaming.com")).thenReturn(Optional.empty());

        databaseSeeder.seedDefaultUserPasswords();

        verify(userRepository, never()).save(any());
    }
}
