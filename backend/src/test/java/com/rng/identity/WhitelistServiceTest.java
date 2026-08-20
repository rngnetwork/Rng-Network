package com.rng.identity;

import com.rng.common.exception.ConflictException;
import com.rng.common.exception.ForbiddenException;
import com.rng.identity.domain.AuthProvider;
import com.rng.identity.domain.User;
import com.rng.identity.dto.UpdateWhitelistedUserRequest;
import com.rng.identity.dto.WhitelistUserRequest;
import com.rng.identity.dto.WhitelistedUserDto;
import com.rng.identity.repository.UserRepository;
import com.rng.identity.service.WhitelistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WhitelistServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WhitelistService whitelistService;

    private User highCommandUser;
    private User ministerTechUser;
    private User regularDevUser;

    @BeforeEach
    void setUp() {
        highCommandUser = User.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .fullName("Arzenic")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .build();

        ministerTechUser = User.builder()
                .id(2L)
                .email("minister.tech@rng.com")
                .fullName("Tech Minister")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech")
                .roles("Minister")
                .build();

        regularDevUser = User.builder()
                .id(3L)
                .email("dev@rng.com")
                .fullName("Junior Dev")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Junior Dev")
                .build();
    }

    @Test
    @DisplayName("High Command can view all whitelisted users")
    void testHighCommandGetWhitelistedUsers() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.findAll()).thenReturn(List.of(highCommandUser, ministerTechUser, regularDevUser));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(1L);

        assertThat(result).hasSize(3);
    }

    @Test
    @DisplayName("Minister can only view users in their own ministry")
    void testMinisterGetWhitelistedUsersScoped() {
        User internalUser = User.builder()
                .id(4L)
                .email("internal@rng.com")
                .fullName("Agent")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Internal affairs")
                .roles("agent")
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findAll()).thenReturn(List.of(highCommandUser, ministerTechUser, regularDevUser, internalUser));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(2L);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(WhitelistedUserDto::getEmail)
                .containsExactlyInAnyOrder("minister.tech@rng.com", "dev@rng.com");
    }

    @Test
    @DisplayName("High Command can whitelist users with multi-designations and multi-roles")
    void testHighCommandCreateWhitelistedUser() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("chancellor@rng.com")
                .userName("New Chancellor")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Chancellory", "Supreme"))
                .roles(List.of("Chancellor of Rivals", "High Command"))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.existsByEmail("chancellor@rng.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });

        WhitelistedUserDto created = whitelistService.createWhitelistedUser(1L, request);

        assertThat(created.getEmail()).isEqualTo("chancellor@rng.com");
        assertThat(created.getRole()).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(created.getDesignations()).contains("Chancellory", "Supreme");
    }

    @Test
    @DisplayName("Minister cannot assign designations other than their own ministry")
    void testMinisterCannotAssignOtherDesignations() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("test@rng.com")
                .userName("Test User")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Ministry of Internal affairs"))
                .roles(List.of("agent"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.existsByEmail("test@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(2L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers may only assign their own Ministry");
    }

    @Test
    @DisplayName("Minister cannot assign Minister role or High Command role")
    void testMinisterCannotAssignPrivilegedRoles() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("test@rng.com")
                .userName("Test User")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Minister"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.existsByEmail("test@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(2L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cannot assign role 'Minister'");
    }

    @Test
    @DisplayName("Regular users are forbidden from whitelisting")
    void testRegularUserForbidden() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("test@rng.com")
                .userName("Test User")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));
        when(userRepository.existsByEmail("test@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(3L, request))
                .isInstanceOf(ForbiddenException.class);
    }
}
