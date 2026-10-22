package com.rednecksgaming.identity;

import com.rednecksgaming.identity.config.DatabaseSeeder;
import com.rednecksgaming.identity.domain.AuthProvider;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DatabaseSeederTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DatabaseSeeder databaseSeeder;

    @Test
    @DisplayName("seedDefaultUserPasswords: user not found does not save or encode")
    void testUserNotFound_doesNothing() {
        when(userRepository.findByEmail("arzenic@rednecksgaming.com")).thenReturn(Optional.empty());

        databaseSeeder.seedDefaultUserPasswords();

        verify(userRepository, never()).save(any(User.class));
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    @DisplayName("seedDefaultUserPasswords: user exists with null password and out-of-date roles - encodes and updates all")
    void testUserExists_nullPassword_updatesAll() {
        User user = User.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .provider(AuthProvider.EMAIL)
                .password(null)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Junior Dev")
                .build();

        when(userRepository.findByEmail("arzenic@rednecksgaming.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(DatabaseSeeder.DEFAULT_RAW_PASSWORD)).thenReturn("$2a$10$encodedPasswordHash");

        databaseSeeder.seedDefaultUserPasswords();

        assertThat(user.getPassword()).isEqualTo("$2a$10$encodedPasswordHash");
        assertThat(user.getRole()).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(user.getDesignations()).isEqualTo("Supreme");
        assertThat(user.getRoles()).isEqualTo("High Command, Chief High Command");

        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("seedDefaultUserPasswords: user exists with mismatch password - encodes and updates")
    void testUserExists_mismatchedPassword_updatesPassword() {
        User user = User.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .provider(AuthProvider.EMAIL)
                .password("$2a$10$oldOutdatedPasswordHash")
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command, Chief High Command")
                .build();

        when(userRepository.findByEmail("arzenic@rednecksgaming.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(DatabaseSeeder.DEFAULT_RAW_PASSWORD, "$2a$10$oldOutdatedPasswordHash")).thenReturn(false);
        when(passwordEncoder.encode(DatabaseSeeder.DEFAULT_RAW_PASSWORD)).thenReturn("$2a$10$newPasswordHash");

        databaseSeeder.seedDefaultUserPasswords();

        assertThat(user.getPassword()).isEqualTo("$2a$10$newPasswordHash");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("seedDefaultUserPasswords: user is fully up-to-date with matching password - no save performed")
    void testUserAlreadyUpToDate_noSave() {
        User user = User.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .provider(AuthProvider.EMAIL)
                .password("$2a$10$matchingPasswordHash")
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command, Chief High Command")
                .build();

        when(userRepository.findByEmail("arzenic@rednecksgaming.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(DatabaseSeeder.DEFAULT_RAW_PASSWORD, "$2a$10$matchingPasswordHash")).thenReturn(true);

        databaseSeeder.seedDefaultUserPasswords();

        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("seedDefaultUserPasswords: Google provider user bypasses password encoding check")
    void testGoogleProviderUser_bypassesPasswordEncoding() {
        User user = User.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .provider(AuthProvider.GOOGLE)
                .password(null)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command, Chief High Command")
                .build();

        when(userRepository.findByEmail("arzenic@rednecksgaming.com")).thenReturn(Optional.of(user));

        databaseSeeder.seedDefaultUserPasswords();

        verify(passwordEncoder, never()).matches(any(), any());
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("seedDefaultUserPasswords: updates when only designations mismatch")
    void testDesignationsMismatch_updates() {
        User user = User.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .provider(AuthProvider.GOOGLE)
                .role("ROLE_HIGH_COMMAND")
                .designations("Chancellory")
                .roles("High Command, Chief High Command")
                .build();

        when(userRepository.findByEmail("arzenic@rednecksgaming.com")).thenReturn(Optional.of(user));

        databaseSeeder.seedDefaultUserPasswords();

        assertThat(user.getDesignations()).isEqualTo("Supreme");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("seedDefaultUserPasswords: updates when only roles mismatch")
    void testRolesMismatch_updates() {
        User user = User.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .provider(AuthProvider.GOOGLE)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .build();

        when(userRepository.findByEmail("arzenic@rednecksgaming.com")).thenReturn(Optional.of(user));

        databaseSeeder.seedDefaultUserPasswords();

        assertThat(user.getRoles()).isEqualTo("High Command, Chief High Command");
        verify(userRepository).save(user);
    }
}
