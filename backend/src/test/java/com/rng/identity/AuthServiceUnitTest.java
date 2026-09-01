package com.rng.identity;

import com.rng.common.dto.DiscordUserDto;
import com.rng.common.exception.BadCredentialsException;
import com.rng.common.exception.ConflictException;
import com.rng.common.exception.ForbiddenException;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.common.exception.UnauthorizedException;
import com.rng.common.security.DiscordClient;
import com.rng.common.security.SecurityConstants;
import com.rng.common.security.TokenService;
import com.rng.identity.domain.AuthProvider;
import com.rng.identity.domain.User;
import com.rng.identity.dto.*;
import com.rng.identity.repository.UserRepository;
import com.rng.identity.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceUnitTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenService tokenService;

    @Mock
    private DiscordClient discordClient;

    @Mock
    private HttpServletResponse httpServletResponse;

    @InjectMocks
    private AuthService authService;

    @Nested
    @DisplayName("Email & Password Authentication and Auto-Registration")
    class EmailPasswordAuthentication {

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   "})
        @DisplayName("First-time login: Automatically registers and BCrypt-hashes password into PostgreSQL")
        void authenticateEmailPassword_uninitializedPassword_autoRegistersAndIssuesPre2Fa(String initialPassword) {
            User user = User.builder()
                    .id(100L)
                    .email("cadet@rng.com")
                    .provider(AuthProvider.EMAIL)
                    .password(initialPassword)
                    .discordLinked(false)
                    .build();

            LoginRequest request = new LoginRequest("cadet@rng.com", "InitialPassword#2026!");

            when(userRepository.findByEmail("cadet@rng.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.encode("InitialPassword#2026!")).thenReturn("$2a$10$hashedBcryptInitialPassword");
            when(tokenService.generatePre2FaToken(100L, "cadet@rng.com")).thenReturn("mock-pre-2fa-token");

            Pre2FaResponse response = authService.authenticateEmailPassword(request);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("mock-pre-2fa-token");
            assertThat(response.isRequiresDiscord2Fa()).isTrue();
            assertThat(response.isDiscordLinked()).isFalse();
            assertThat(response.getUserEmail()).isEqualTo("cadet@rng.com");

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getPassword()).isEqualTo("$2a$10$hashedBcryptInitialPassword");
        }

        @Test
        @DisplayName("Subsequent login: Successfully authenticates against pre-existing BCrypt hash")
        void authenticateEmailPassword_existingPassword_success() {
            User user = User.builder()
                    .id(101L)
                    .email("staff@rng.com")
                    .provider(AuthProvider.EMAIL)
                    .password("$2a$10$existingHash")
                    .discordLinked(true)
                    .build();

            LoginRequest request = new LoginRequest("staff@rng.com", "CorrectPassword123!");

            when(userRepository.findByEmail("staff@rng.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("CorrectPassword123!", "$2a$10$existingHash")).thenReturn(true);
            when(tokenService.generatePre2FaToken(101L, "staff@rng.com")).thenReturn("mock-pre-2fa-token");

            Pre2FaResponse response = authService.authenticateEmailPassword(request);

            assertThat(response.getToken()).isEqualTo("mock-pre-2fa-token");
            assertThat(response.isDiscordLinked()).isTrue();
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Rejects login when email is not found in database whitelist")
        void authenticateEmailPassword_unknownEmail_throwsBadCredentials() {
            when(userRepository.findByEmail("stranger@rng.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.authenticateEmailPassword(new LoginRequest("stranger@rng.com", "AnyPass")))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("Invalid email or password");
        }

        @Test
        @DisplayName("Rejects login when user provider is GOOGLE")
        void authenticateEmailPassword_googleProvider_throwsBadCredentials() {
            User googleUser = User.builder()
                    .id(102L)
                    .email("google.user@rng.com")
                    .provider(AuthProvider.GOOGLE)
                    .build();

            when(userRepository.findByEmail("google.user@rng.com")).thenReturn(Optional.of(googleUser));

            assertThatThrownBy(() -> authService.authenticateEmailPassword(new LoginRequest("google.user@rng.com", "AnyPass")))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("Google Sign-In");
        }

        @Test
        @DisplayName("Rejects login when password does not match BCrypt hash")
        void authenticateEmailPassword_wrongPassword_throwsBadCredentials() {
            User user = User.builder()
                    .id(103L)
                    .email("staff@rng.com")
                    .provider(AuthProvider.EMAIL)
                    .password("$2a$10$hashedPass")
                    .build();

            when(userRepository.findByEmail("staff@rng.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("WrongPass", "$2a$10$hashedPass")).thenReturn(false);

            assertThatThrownBy(() -> authService.authenticateEmailPassword(new LoginRequest("staff@rng.com", "WrongPass")))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("Invalid email or password");
        }
    }

    @Nested
    @DisplayName("Discord OAuth2 Two-Factor Authentication")
    class Discord2Fa {

        @Test
        @DisplayName("First-time Discord linking binds Snowflake ID, syncs avatar and issues full session")
        void processDiscord2Fa_firstTimeLink_success() {
            User user = User.builder()
                    .id(104L)
                    .email("firstlink@rng.com")
                    .role("ROLE_HIGH_COMMAND")
                    .discordLinked(false)
                    .build();

            DiscordUserDto discordUser = DiscordUserDto.builder()
                    .id("987654321012345678")
                    .username("RNG_Commander")
                    .email("firstlink@rng.com")
                    .avatar("a_avatarhash123")
                    .build();

            when(userRepository.findById(104L)).thenReturn(Optional.of(user));
            when(discordClient.fetchDiscordUser("valid-discord-code")).thenReturn(discordUser);
            when(userRepository.existsByDiscordId("987654321012345678")).thenReturn(false);
            when(tokenService.generateAccessToken(104L, "firstlink@rng.com", "ROLE_HIGH_COMMAND")).thenReturn("mock-access-token");
            when(tokenService.generateRefreshToken(104L)).thenReturn("mock-refresh-token");

            AuthResponse response = authService.processDiscord2Fa(104L, "pre2fa-jti-uuid", "valid-discord-code", httpServletResponse);

            assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
            assertThat(response.getRole()).isEqualTo("ROLE_HIGH_COMMAND");
            assertThat(user.isDiscordLinked()).isTrue();
            assertThat(user.getDiscordId()).isEqualTo("987654321012345678");
            assertThat(user.getDiscordUsername()).isEqualTo("RNG_Commander");
            assertThat(user.getDiscordAvatar()).isEqualTo("a_avatarhash123");

            verify(tokenService).revokeJti("pre2fa-jti-uuid");
            verify(userRepository).save(user);
            verify(httpServletResponse).addHeader(eq("Set-Cookie"), contains("rng_refresh_token=mock-refresh-token"));
        }

        @Test
        @DisplayName("Subsequent 2FA: Verifies Snowflake ID parity and syncs latest Discord metadata")
        void processDiscord2Fa_subsequentLink_success() {
            User user = User.builder()
                    .id(105L)
                    .email("linked@rng.com")
                    .role("ROLE_MINISTER")
                    .discordLinked(true)
                    .discordId("987654321012345678")
                    .discordUsername("OldUsername")
                    .build();

            DiscordUserDto discordUser = DiscordUserDto.builder()
                    .id("987654321012345678")
                    .username("UpdatedUsername")
                    .email("linked@rng.com")
                    .avatar("new_avatar_hash")
                    .build();

            when(userRepository.findById(105L)).thenReturn(Optional.of(user));
            when(discordClient.fetchDiscordUser("code-123")).thenReturn(discordUser);
            when(tokenService.generateAccessToken(105L, "linked@rng.com", "ROLE_MINISTER")).thenReturn("access-token-jwt");
            when(tokenService.generateRefreshToken(105L)).thenReturn("refresh-token-jwt");

            AuthResponse response = authService.processDiscord2Fa(105L, null, "code-123", httpServletResponse);

            assertThat(response.getAccessToken()).isEqualTo("access-token-jwt");
            assertThat(user.getDiscordUsername()).isEqualTo("UpdatedUsername");
            assertThat(user.getDiscordAvatar()).isEqualTo("new_avatar_hash");
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Throws ConflictException when linking Discord Snowflake that belongs to another user")
        void processDiscord2Fa_duplicateDiscordId_throwsConflict() {
            User user = User.builder()
                    .id(106L)
                    .email("target@rng.com")
                    .discordLinked(false)
                    .build();

            DiscordUserDto discordUser = new DiscordUserDto("987654321012345678", "DuplicateUser", "avatar", null);

            when(userRepository.findById(106L)).thenReturn(Optional.of(user));
            when(discordClient.fetchDiscordUser("code")).thenReturn(discordUser);
            when(userRepository.existsByDiscordId("987654321012345678")).thenReturn(true);

            assertThatThrownBy(() -> authService.processDiscord2Fa(106L, "jti", "code", httpServletResponse))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("already linked to another registered user");
        }

        @Test
        @DisplayName("Throws ConflictException when authenticating with a different Discord account than linked")
        void processDiscord2Fa_discordIdMismatch_throwsConflict() {
            User user = User.builder()
                    .id(107L)
                    .email("user@rng.com")
                    .discordLinked(true)
                    .discordId("111111111111111111")
                    .build();

            DiscordUserDto discordUser = new DiscordUserDto("222222222222222222", "DifferentDiscord", "avatar", null);

            when(userRepository.findById(107L)).thenReturn(Optional.of(user));
            when(discordClient.fetchDiscordUser("code")).thenReturn(discordUser);

            assertThatThrownBy(() -> authService.processDiscord2Fa(107L, "jti", "code", httpServletResponse))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("Linked Discord account mismatch");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when userId is missing")
        void processDiscord2Fa_userNotFound_throwsResourceNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.processDiscord2Fa(999L, "jti", "code", httpServletResponse))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("Token Refresh & Session Maintenance")
    class TokenRefresh {

        @Test
        @DisplayName("Successfully refreshes access token using valid refresh token")
        void refreshAccessToken_validToken_success() {
            User user = User.builder().id(200L).email("refresh@rng.com").role("ROLE_HIGH_COMMAND").build();

            when(tokenService.validateToken("valid-refresh-token")).thenReturn(true);
            when(tokenService.getUserIdFromToken("valid-refresh-token")).thenReturn(200L);
            when(userRepository.findById(200L)).thenReturn(Optional.of(user));
            when(tokenService.generateAccessToken(200L, "refresh@rng.com", "ROLE_HIGH_COMMAND")).thenReturn("new-access-jwt");

            AuthResponse response = authService.refreshAccessToken("valid-refresh-token");

            assertThat(response.getAccessToken()).isEqualTo("new-access-jwt");
            assertThat(response.getUserEmail()).isEqualTo("refresh@rng.com");
        }

        @Test
        @DisplayName("Throws UnauthorizedException on null or invalid refresh token")
        void refreshAccessToken_invalidToken_throwsUnauthorized() {
            when(tokenService.validateToken("expired-refresh-token")).thenReturn(false);

            assertThatThrownBy(() -> authService.refreshAccessToken("expired-refresh-token"))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("Invalid or expired refresh token");

            assertThatThrownBy(() -> authService.refreshAccessToken(null))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        @DisplayName("Throws UnauthorizedException if user from refresh token no longer exists")
        void refreshAccessToken_userDeleted_throwsUnauthorized() {
            when(tokenService.validateToken("valid-token")).thenReturn(true);
            when(tokenService.getUserIdFromToken("valid-token")).thenReturn(404L);
            when(userRepository.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refreshAccessToken("valid-token"))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("User not found");
        }

        @Test
        @DisplayName("Logout clears refresh cookie with Max-Age 0")
        void logout_clearsCookie() {
            authService.logout(httpServletResponse);
            verify(httpServletResponse).addHeader(eq("Set-Cookie"), contains("Max-Age=0"));
        }
    }

    @Nested
    @DisplayName("Discord-Verified Password Recovery Subsystem")
    class PasswordRecovery {

        @Test
        @DisplayName("Stage 1: Generates OAuth2 authorization URL with SCOPE_RESET_REQUEST state token")
        void initiateForgotPassword_validUser_returnsDiscordOAuthUrl() {
            User user = User.builder()
                    .id(300L)
                    .email("recovery@rng.com")
                    .provider(AuthProvider.EMAIL)
                    .discordLinked(true)
                    .discordId("112233445566778899")
                    .build();

            ReflectionTestUtils.setField(authService, "discordClientId", "test-discord-client-id");
            ReflectionTestUtils.setField(authService, "discordRedirectUri", "http://localhost:3000/auth/discord/callback");

            when(userRepository.findByEmail("recovery@rng.com")).thenReturn(Optional.of(user));
            when(tokenService.generateResetRequestToken(300L, "recovery@rng.com")).thenReturn("mock-state-jwt");

            ForgotPasswordInitiateResponse response = authService.initiateForgotPassword(new ForgotPasswordInitiateRequest("recovery@rng.com"));

            assertThat(response).isNotNull();
            assertThat(response.getDiscordAuthUrl()).contains("client_id=test-discord-client-id");
            assertThat(response.getDiscordAuthUrl()).contains("state=mock-state-jwt");
            assertThat(response.getDiscordAuthUrl()).contains("scope=identify");
        }

        @Test
        @DisplayName("Stage 1: Rejects password recovery for unregistered email")
        void initiateForgotPassword_unregisteredEmail_throwsResourceNotFound() {
            when(userRepository.findByEmail("nonexistent@rng.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.initiateForgotPassword(new ForgotPasswordInitiateRequest("nonexistent@rng.com")))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("No account found with the provided email address");
        }

        @Test
        @DisplayName("Stage 1: Rejects password recovery for Google-provisioned account")
        void initiateForgotPassword_googleAccount_throwsBadCredentials() {
            User googleUser = User.builder()
                    .id(301L)
                    .email("google@rng.com")
                    .provider(AuthProvider.GOOGLE)
                    .build();

            when(userRepository.findByEmail("google@rng.com")).thenReturn(Optional.of(googleUser));

            assertThatThrownBy(() -> authService.initiateForgotPassword(new ForgotPasswordInitiateRequest("google@rng.com")))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("Google Sign-In");
        }

        @Test
        @DisplayName("Stage 1: Rejects password recovery when no Discord account is linked")
        void initiateForgotPassword_unlinkedDiscord_throwsBadCredentials() {
            User unlinkedUser = User.builder()
                    .id(302L)
                    .email("unlinked@rng.com")
                    .provider(AuthProvider.EMAIL)
                    .discordId(null)
                    .build();

            when(userRepository.findByEmail("unlinked@rng.com")).thenReturn(Optional.of(unlinkedUser));

            assertThatThrownBy(() -> authService.initiateForgotPassword(new ForgotPasswordInitiateRequest("unlinked@rng.com")))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("no Discord account is linked");
        }

        @Test
        @DisplayName("Stage 2: Verifies code, asserts Snowflake parity, revokes state JTI, and issues reset token")
        void verifyForgotPasswordDiscord_validCode_issuesResetToken() {
            User user = User.builder()
                    .id(300L)
                    .email("recovery@rng.com")
                    .discordId("112233445566778899")
                    .build();

            DiscordUserDto discordUser = new DiscordUserDto("112233445566778899", "RecoveryUser", "avatar", null);

            when(tokenService.validateToken("mock-state-jwt")).thenReturn(true);
            when(tokenService.getScopeFromToken("mock-state-jwt")).thenReturn(SecurityConstants.SCOPE_RESET_REQUEST);
            when(tokenService.getUserIdFromToken("mock-state-jwt")).thenReturn(300L);
            when(tokenService.getJtiFromToken("mock-state-jwt")).thenReturn("state-jti-uuid");
            when(userRepository.findById(300L)).thenReturn(Optional.of(user));
            when(discordClient.fetchDiscordUser("mock-oauth-code")).thenReturn(discordUser);
            when(tokenService.generateResetPasswordToken(300L, "recovery@rng.com")).thenReturn("mock-reset-pw-jwt");

            ForgotPasswordVerifyResponse response = authService.verifyForgotPasswordDiscord(
                    new ForgotPasswordVerifyRequest("mock-oauth-code", "mock-state-jwt")
            );

            assertThat(response).isNotNull();
            assertThat(response.getResetToken()).isEqualTo("mock-reset-pw-jwt");
            assertThat(response.getEmail()).isEqualTo("recovery@rng.com");
            verify(tokenService).revokeJti("state-jti-uuid");
        }

        @Test
        @DisplayName("Stage 2: Rejects invalid or expired state token")
        void verifyForgotPasswordDiscord_invalidStateToken_throwsUnauthorized() {
            when(tokenService.validateToken("invalid-state")).thenReturn(false);

            assertThatThrownBy(() -> authService.verifyForgotPasswordDiscord(new ForgotPasswordVerifyRequest("code", "invalid-state")))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("Invalid or expired password reset state token");
        }

        @Test
        @DisplayName("Stage 2: Rejects state token with wrong scope")
        void verifyForgotPasswordDiscord_wrongScope_throwsForbidden() {
            when(tokenService.validateToken("valid-token")).thenReturn(true);
            when(tokenService.getScopeFromToken("valid-token")).thenReturn(SecurityConstants.SCOPE_PRE_2FA);

            assertThatThrownBy(() -> authService.verifyForgotPasswordDiscord(new ForgotPasswordVerifyRequest("code", "valid-token")))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Invalid token scope for password reset verification");
        }

        @Test
        @DisplayName("Stage 2: Rejects when authenticated Discord Snowflake does not match linked account")
        void verifyForgotPasswordDiscord_snowflakeMismatch_throwsForbidden() {
            User user = User.builder()
                    .id(300L)
                    .email("recovery@rng.com")
                    .discordId("112233445566778899")
                    .build();

            DiscordUserDto wrongDiscordUser = new DiscordUserDto("999999999999999999", "Impostor", "avatar", null);

            when(tokenService.validateToken("mock-state-jwt")).thenReturn(true);
            when(tokenService.getScopeFromToken("mock-state-jwt")).thenReturn(SecurityConstants.SCOPE_RESET_REQUEST);
            when(tokenService.getUserIdFromToken("mock-state-jwt")).thenReturn(300L);
            when(tokenService.getJtiFromToken("mock-state-jwt")).thenReturn("state-jti-uuid");
            when(userRepository.findById(300L)).thenReturn(Optional.of(user));
            when(discordClient.fetchDiscordUser("mock-oauth-code")).thenReturn(wrongDiscordUser);

            assertThatThrownBy(() -> authService.verifyForgotPasswordDiscord(new ForgotPasswordVerifyRequest("mock-oauth-code", "mock-state-jwt")))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Authenticated Discord account does not match the linked account");
        }

        @Test
        @DisplayName("Stage 3: Resets password, BCrypt-hashes into PostgreSQL, and revokes reset token JTI")
        void resetPassword_validRequest_updatesPasswordAndRevokesJti() {
            User user = User.builder()
                    .id(300L)
                    .email("recovery@rng.com")
                    .password("$2a$10$oldHash")
                    .build();

            when(tokenService.validateToken("mock-reset-token")).thenReturn(true);
            when(userRepository.findById(300L)).thenReturn(Optional.of(user));
            when(passwordEncoder.encode("NewSecurePassword#2026!")).thenReturn("$2a$10$newBcryptHash");
            when(tokenService.getJtiFromToken("mock-reset-token")).thenReturn("reset-jti-uuid");

            authService.resetPassword(300L, "mock-reset-token", new ResetPasswordRequest("NewSecurePassword#2026!"));

            assertThat(user.getPassword()).isEqualTo("$2a$10$newBcryptHash");
            verify(userRepository).save(user);
            verify(tokenService).revokeJti("reset-jti-uuid");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"short", "1234567"})
        @DisplayName("Stage 3: Rejects passwords shorter than 8 characters")
        void resetPassword_shortPassword_throwsBadCredentials(String weakPassword) {
            assertThatThrownBy(() -> authService.resetPassword(300L, "token", new ResetPasswordRequest(weakPassword)))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessageContaining("Password must be at least 8 characters long");
        }
    }
}
