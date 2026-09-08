package com.rng.identity;

import com.rng.identity.service.AuthService;
import com.rng.common.dto.DiscordUserDto;
import com.rng.common.exception.BadCredentialsException;
import com.rng.common.exception.ForbiddenException;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.common.exception.UnauthorizedException;
import com.rng.common.security.DiscordClient;
import com.rng.common.security.SecurityConstants;
import com.rng.common.security.TokenService;
import com.rng.identity.domain.AuthProvider;
import com.rng.identity.domain.User;
import com.rng.identity.dto.ForgotPasswordInitiateRequest;
import com.rng.identity.dto.ForgotPasswordInitiateResponse;
import com.rng.identity.dto.ForgotPasswordVerifyRequest;
import com.rng.identity.dto.ForgotPasswordVerifyResponse;
import com.rng.identity.dto.ResetPasswordRequest;
import com.rng.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenService tokenService;

    @Mock
    private DiscordClient discordClient;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "discordClientId", "test-discord-client-id");
        ReflectionTestUtils.setField(authService, "discordRedirectUri", "http://localhost:3000/auth/discord/callback");
    }

    @Test
    @DisplayName("initiateForgotPassword: throws ResourceNotFoundException when email does not exist")
    void initiateForgotPassword_emailNotFound_throwsNotFound() {
        when(userRepository.findByEmail("nonexistent@rng.com")).thenReturn(Optional.empty());

        ForgotPasswordInitiateRequest request = ForgotPasswordInitiateRequest.builder()
                .email("nonexistent@rng.com")
                .build();

        assertThatThrownBy(() -> authService.initiateForgotPassword(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("No account found with the provided email address.");
    }

    @Test
    @DisplayName("initiateForgotPassword: throws BadCredentialsException when provider is GOOGLE")
    void initiateForgotPassword_googleProvider_throwsBadCredentials() {
        User googleUser = User.builder()
                .id(1L)
                .email("google@rng.com")
                .provider(AuthProvider.GOOGLE)
                .build();

        when(userRepository.findByEmail("google@rng.com")).thenReturn(Optional.of(googleUser));

        ForgotPasswordInitiateRequest request = ForgotPasswordInitiateRequest.builder()
                .email("google@rng.com")
                .build();

        assertThatThrownBy(() -> authService.initiateForgotPassword(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("This account is configured for Google Sign-In");
    }

    @Test
    @DisplayName("initiateForgotPassword: throws BadCredentialsException when discord account is not linked")
    void initiateForgotPassword_unlinkedDiscord_throwsBadCredentials() {
        User unlinkedUser = User.builder()
                .id(2L)
                .email("unlinked@rng.com")
                .provider(AuthProvider.EMAIL)
                .discordId("UNLINKED")
                .build();

        when(userRepository.findByEmail("unlinked@rng.com")).thenReturn(Optional.of(unlinkedUser));

        ForgotPasswordInitiateRequest request = ForgotPasswordInitiateRequest.builder()
                .email("unlinked@rng.com")
                .build();

        assertThatThrownBy(() -> authService.initiateForgotPassword(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Account cannot be recovered via Discord because no Discord account is linked");
    }

    @Test
    @DisplayName("initiateForgotPassword: returns Discord auth URL when user is eligible")
    void initiateForgotPassword_success_returnsAuthUrl() {
        User validUser = User.builder()
                .id(3L)
                .email("staff@rng.com")
                .provider(AuthProvider.EMAIL)
                .discordId("123456789012345678")
                .build();

        when(userRepository.findByEmail("staff@rng.com")).thenReturn(Optional.of(validUser));
        when(tokenService.generateResetRequestToken(3L, "staff@rng.com")).thenReturn("mock-state-jwt");

        ForgotPasswordInitiateRequest request = ForgotPasswordInitiateRequest.builder()
                .email("staff@rng.com")
                .build();

        ForgotPasswordInitiateResponse response = authService.initiateForgotPassword(request);

        assertThat(response).isNotNull();
        assertThat(response.getDiscordAuthUrl())
                .contains("client_id=test-discord-client-id")
                .contains("state=mock-state-jwt")
                .contains("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fdiscord%2Fcallback");
    }

    @Test
    @DisplayName("verifyForgotPasswordDiscord: throws UnauthorizedException when state token is invalid")
    void verifyForgotPasswordDiscord_invalidStateToken_throwsUnauthorized() {
        when(tokenService.validateToken("invalid-state-jwt")).thenReturn(false);

        ForgotPasswordVerifyRequest request = ForgotPasswordVerifyRequest.builder()
                .code("mock-discord-code")
                .state("invalid-state-jwt")
                .build();

        assertThatThrownBy(() -> authService.verifyForgotPasswordDiscord(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid or expired password reset state token.");
    }

    @Test
    @DisplayName("verifyForgotPasswordDiscord: throws ForbiddenException when token scope is invalid")
    void verifyForgotPasswordDiscord_invalidScope_throwsForbidden() {
        when(tokenService.validateToken("valid-token")).thenReturn(true);
        when(tokenService.getScopeFromToken("valid-token")).thenReturn(SecurityConstants.SCOPE_PRE_2FA);

        ForgotPasswordVerifyRequest request = ForgotPasswordVerifyRequest.builder()
                .code("mock-discord-code")
                .state("valid-token")
                .build();

        assertThatThrownBy(() -> authService.verifyForgotPasswordDiscord(request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Invalid token scope for password reset verification.");
    }

    @Test
    @DisplayName("verifyForgotPasswordDiscord: throws ForbiddenException when Discord Snowflake ID mismatches")
    void verifyForgotPasswordDiscord_discordIdMismatch_throwsForbidden() {
        User validUser = User.builder()
                .id(4L)
                .email("staff@rng.com")
                .discordId("111222333444555666")
                .build();

        when(tokenService.validateToken("valid-reset-state")).thenReturn(true);
        when(tokenService.getScopeFromToken("valid-reset-state")).thenReturn(SecurityConstants.SCOPE_RESET_REQUEST);
        when(tokenService.getUserIdFromToken("valid-reset-state")).thenReturn(4L);
        when(tokenService.getJtiFromToken("valid-reset-state")).thenReturn("state-jti-123");
        when(userRepository.findById(4L)).thenReturn(Optional.of(validUser));

        DiscordUserDto attackerDiscord = new DiscordUserDto("999888777666555444", "Attacker", "att_avatar", null);
        when(discordClient.fetchDiscordUser("discord-code")).thenReturn(attackerDiscord);

        ForgotPasswordVerifyRequest request = ForgotPasswordVerifyRequest.builder()
                .code("discord-code")
                .state("valid-reset-state")
                .build();

        assertThatThrownBy(() -> authService.verifyForgotPasswordDiscord(request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Authenticated Discord account does not match the linked account.");

        verify(tokenService).revokeJti("state-jti-123");
    }

    @Test
    @DisplayName("verifyForgotPasswordDiscord: returns reset password token when Discord identity is verified")
    void verifyForgotPasswordDiscord_success_returnsResetToken() {
        User validUser = User.builder()
                .id(5L)
                .email("staff@rng.com")
                .discordId("111222333444555666")
                .build();

        when(tokenService.validateToken("valid-reset-state")).thenReturn(true);
        when(tokenService.getScopeFromToken("valid-reset-state")).thenReturn(SecurityConstants.SCOPE_RESET_REQUEST);
        when(tokenService.getUserIdFromToken("valid-reset-state")).thenReturn(5L);
        when(tokenService.getJtiFromToken("valid-reset-state")).thenReturn("state-jti-456");
        when(userRepository.findById(5L)).thenReturn(Optional.of(validUser));

        DiscordUserDto validDiscord = new DiscordUserDto("111222333444555666", "StaffUser", "avatar1", null);
        when(discordClient.fetchDiscordUser("valid-discord-code")).thenReturn(validDiscord);
        when(tokenService.generateResetPasswordToken(5L, "staff@rng.com")).thenReturn("mock-reset-password-jwt");

        ForgotPasswordVerifyRequest request = ForgotPasswordVerifyRequest.builder()
                .code("valid-discord-code")
                .state("valid-reset-state")
                .build();

        ForgotPasswordVerifyResponse response = authService.verifyForgotPasswordDiscord(request);

        assertThat(response).isNotNull();
        assertThat(response.getResetToken()).isEqualTo("mock-reset-password-jwt");
        assertThat(response.getEmail()).isEqualTo("staff@rng.com");

        verify(tokenService).revokeJti("state-jti-456");
    }

    @Test
    @DisplayName("resetPassword: throws BadCredentialsException when new password is too short")
    void resetPassword_shortPassword_throwsBadCredentials() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .newPassword("short")
                .build();

        assertThatThrownBy(() -> authService.resetPassword(6L, "mock-token", request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Password must be at least 8 characters long");
    }

    @Test
    @DisplayName("resetPassword: hashes password, updates database, and revokes reset token jti")
    void resetPassword_success_updatesPasswordAndRevokesToken() {
        User user = User.builder()
                .id(7L)
                .email("staff@rng.com")
                .password("old-hashed-password")
                .build();

        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewSecretPassword123!")).thenReturn("new-bcrypt-hashed-password");
        when(tokenService.getJtiFromToken("mock-reset-jwt")).thenReturn("reset-jti-789");

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .newPassword("NewSecretPassword123!")
                .build();

        authService.resetPassword(7L, "mock-reset-jwt", request);

        assertThat(user.getPassword()).isEqualTo("new-bcrypt-hashed-password");
        verify(userRepository).save(user);
        verify(tokenService).revokeJti("reset-jti-789");
    }
}
