// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity;

import com.rednecksgaming.common.dto.DiscordUserDto;
import com.rednecksgaming.common.exception.BadCredentialsException;
import com.rednecksgaming.common.exception.ConflictException;
import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.common.exception.UnauthorizedException;
import com.rednecksgaming.common.security.DiscordClient;
import com.rednecksgaming.common.security.SecurityConstants;
import com.rednecksgaming.common.security.TokenService;
import com.rednecksgaming.identity.domain.AuthProvider;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.dto.*;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.identity.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
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

    // =========================================================================
    // authenticateEmailPassword Tests
    // =========================================================================

    @Test
    @DisplayName("authenticateEmailPassword: throws BadCredentialsException when email not found")
    void authenticateEmailPassword_userNotFound_throwsBadCredentials() {
        when(userRepository.findByEmail("ghost@rng.com")).thenReturn(Optional.empty());

        LoginRequest request = LoginRequest.builder()
                .email("ghost@rng.com")
                .password("password123")
                .build();

        assertThatThrownBy(() -> authService.authenticateEmailPassword(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("authenticateEmailPassword: throws UnauthorizedException when user account is inactive")
    void authenticateEmailPassword_inactiveUser_throwsUnauthorized() {
        User inactiveUser = User.builder()
                .id(10L)
                .email("banned@rng.com")
                .provider(AuthProvider.EMAIL)
                .status("SUSPENDED")
                .build();

        when(userRepository.findByEmail("banned@rng.com")).thenReturn(Optional.of(inactiveUser));

        LoginRequest request = LoginRequest.builder()
                .email("banned@rng.com")
                .password("password123")
                .build();

        assertThatThrownBy(() -> authService.authenticateEmailPassword(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Account is inactive or suspended");
    }

    @Test
    @DisplayName("authenticateEmailPassword: throws BadCredentialsException when account is Google configured")
    void authenticateEmailPassword_googleProvider_throwsBadCredentials() {
        User googleUser = User.builder()
                .id(1L)
                .email("google@rng.com")
                .provider(AuthProvider.GOOGLE)
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail("google@rng.com")).thenReturn(Optional.of(googleUser));

        LoginRequest request = LoginRequest.builder()
                .email("google@rng.com")
                .password("password123")
                .build();

        assertThatThrownBy(() -> authService.authenticateEmailPassword(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("This account is configured for Google Sign-In");
    }

    @Test
    @DisplayName("authenticateEmailPassword: first-time login initializes password and issues pre-2FA token")
    void authenticateEmailPassword_firstLogin_encodesPasswordAndIssuesToken() {
        User firstTimeUser = User.builder()
                .id(2L)
                .email("new@rng.com")
                .provider(AuthProvider.EMAIL)
                .password(null)
                .status("ACTIVE")
                .discordLinked(false)
                .build();

        when(userRepository.findByEmail("new@rng.com")).thenReturn(Optional.of(firstTimeUser));
        when(passwordEncoder.encode("InitialSecretPass123!")).thenReturn("$2a$10$encodedHash");
        when(tokenService.generatePre2FaToken(2L, "new@rng.com")).thenReturn("pre-2fa-jwt-token");

        LoginRequest request = LoginRequest.builder()
                .email("new@rng.com")
                .password("InitialSecretPass123!")
                .build();

        Pre2FaResponse response = authService.authenticateEmailPassword(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("pre-2fa-jwt-token");
        assertThat(response.isRequiresDiscord2Fa()).isTrue();
        assertThat(response.isDiscordLinked()).isFalse();
        assertThat(firstTimeUser.getPassword()).isEqualTo("$2a$10$encodedHash");

        verify(userRepository).save(firstTimeUser);
    }

    @Test
    @DisplayName("authenticateEmailPassword: first-time login with blank password string initializes password")
    void authenticateEmailPassword_blankPasswordString_encodesPassword() {
        User userWithBlankPassword = User.builder()
                .id(2L)
                .email("blank@rng.com")
                .provider(AuthProvider.EMAIL)
                .password("   ")
                .status("ACTIVE")
                .discordLinked(true)
                .build();

        when(userRepository.findByEmail("blank@rng.com")).thenReturn(Optional.of(userWithBlankPassword));
        when(passwordEncoder.encode("MyNewSecretPass")).thenReturn("$2a$10$encodedBlank");
        when(tokenService.generatePre2FaToken(2L, "blank@rng.com")).thenReturn("pre-2fa-token");

        LoginRequest request = LoginRequest.builder()
                .email("blank@rng.com")
                .password("MyNewSecretPass")
                .build();

        Pre2FaResponse response = authService.authenticateEmailPassword(request);

        assertThat(response.isDiscordLinked()).isTrue();
        verify(userRepository).save(userWithBlankPassword);
    }

    @Test
    @DisplayName("authenticateEmailPassword: password mismatch throws BadCredentialsException")
    void authenticateEmailPassword_passwordMismatch_throwsBadCredentials() {
        User user = User.builder()
                .id(3L)
                .email("staff@rng.com")
                .provider(AuthProvider.EMAIL)
                .password("$2a$10$storedHash")
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail("staff@rng.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "$2a$10$storedHash")).thenReturn(false);

        LoginRequest request = LoginRequest.builder()
                .email("staff@rng.com")
                .password("WrongPassword")
                .build();

        assertThatThrownBy(() -> authService.authenticateEmailPassword(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("authenticateEmailPassword: valid existing password issues pre-2FA token")
    void authenticateEmailPassword_validPassword_returnsPre2FaResponse() {
        User user = User.builder()
                .id(4L)
                .email("staff@rng.com")
                .provider(AuthProvider.EMAIL)
                .password("$2a$10$storedHash")
                .status("ACTIVE")
                .discordLinked(true)
                .build();

        when(userRepository.findByEmail("staff@rng.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("CorrectPassword", "$2a$10$storedHash")).thenReturn(true);
        when(tokenService.generatePre2FaToken(4L, "staff@rng.com")).thenReturn("pre-2fa-valid-token");

        LoginRequest request = LoginRequest.builder()
                .email("staff@rng.com")
                .password("CorrectPassword")
                .build();

        Pre2FaResponse response = authService.authenticateEmailPassword(request);

        assertThat(response.getToken()).isEqualTo("pre-2fa-valid-token");
        assertThat(response.isDiscordLinked()).isTrue();
        assertThat(response.getUserEmail()).isEqualTo("staff@rng.com");
    }

    // =========================================================================
    // processDiscord2Fa Tests
    // =========================================================================

    @Test
    @DisplayName("processDiscord2Fa (4-arg overload) delegates with null redirectUri")
    void processDiscord2Fa_fourArgOverload_delegates() {
        User user = User.builder()
                .id(5L)
                .email("staff@rng.com")
                .role("ROLE_USER")
                .discordId("111222333")
                .discordLinked(true)
                .status("ACTIVE")
                .build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(discordClient.fetchDiscordUser("oauth-code", null))
                .thenReturn(new DiscordUserDto("111222333", "Staff", "avatar1", null));
        when(tokenService.generateAccessToken(5L, "staff@rng.com", "ROLE_USER")).thenReturn("access-token");
        when(tokenService.generateRefreshToken(5L)).thenReturn("refresh-token");

        MockHttpServletResponse response = new MockHttpServletResponse();
        AuthResponse authResponse = authService.processDiscord2Fa(5L, "jti-123", "oauth-code", response);

        assertThat(authResponse).isNotNull();
        assertThat(authResponse.getAccessToken()).isEqualTo("access-token");
        verify(tokenService).revokeJti("jti-123");
    }

    @Test
    @DisplayName("processDiscord2Fa: skips JTI revocation when pre2FaJti is null")
    void processDiscord2Fa_nullJti_doesNotRevoke() {
        User user = User.builder()
                .id(5L)
                .email("staff@rng.com")
                .role("ROLE_USER")
                .discordId("111222333")
                .discordLinked(true)
                .status("ACTIVE")
                .build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(discordClient.fetchDiscordUser("oauth-code", "http://callback"))
                .thenReturn(new DiscordUserDto("111222333", "Staff", "avatar1", null));
        when(tokenService.generateAccessToken(5L, "staff@rng.com", "ROLE_USER")).thenReturn("access-token");
        when(tokenService.generateRefreshToken(5L)).thenReturn("refresh-token");

        MockHttpServletResponse response = new MockHttpServletResponse();
        authService.processDiscord2Fa(5L, null, "oauth-code", "http://callback", response);

        verify(tokenService, never()).revokeJti(any());
    }

    @Test
    @DisplayName("processDiscord2Fa: throws ResourceNotFoundException when user is not found")
    void processDiscord2Fa_userNotFound_throwsNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        MockHttpServletResponse response = new MockHttpServletResponse();
        assertThatThrownBy(() -> authService.processDiscord2Fa(999L, "jti", "code", response))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("processDiscord2Fa: throws UnauthorizedException when user is inactive")
    void processDiscord2Fa_inactiveUser_throwsUnauthorized() {
        User inactiveUser = User.builder()
                .id(6L)
                .email("suspended@rng.com")
                .status("INACTIVE")
                .build();

        when(userRepository.findById(6L)).thenReturn(Optional.of(inactiveUser));

        MockHttpServletResponse response = new MockHttpServletResponse();
        assertThatThrownBy(() -> authService.processDiscord2Fa(6L, "jti", "code", response))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Account is inactive or suspended");
    }

    @Test
    @DisplayName("processDiscord2Fa: linked user with mismatching Discord Snowflake throws ConflictException")
    void processDiscord2Fa_linkedAccountMismatch_throwsConflict() {
        User user = User.builder()
                .id(7L)
                .email("staff@rng.com")
                .discordId("111222333444")
                .discordLinked(true)
                .status("ACTIVE")
                .build();

        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(discordClient.fetchDiscordUser("code", null))
                .thenReturn(new DiscordUserDto("999888777666", "Imposter", "avatar", null));

        MockHttpServletResponse response = new MockHttpServletResponse();
        assertThatThrownBy(() -> authService.processDiscord2Fa(7L, "jti", "code", response))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Linked Discord account mismatch");
    }

    @Test
    @DisplayName("processDiscord2Fa: unlinked user attempting to link already-linked snowflake throws ConflictException")
    void processDiscord2Fa_snowflakeAlreadyLinkedToOtherAccount_throwsConflict() {
        User unlinkedUser = User.builder()
                .id(8L)
                .email("staff2@rng.com")
                .discordLinked(false)
                .status("ACTIVE")
                .build();

        when(userRepository.findById(8L)).thenReturn(Optional.of(unlinkedUser));
        when(discordClient.fetchDiscordUser("code", null))
                .thenReturn(new DiscordUserDto("555444333222", "OtherUser", "avatar", null));
        when(userRepository.existsByDiscordId("555444333222")).thenReturn(true);

        MockHttpServletResponse response = new MockHttpServletResponse();
        assertThatThrownBy(() -> authService.processDiscord2Fa(8L, "jti", "code", response))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Discord account is already linked to another registered user.");
    }

    @Test
    @DisplayName("processDiscord2Fa: unlinked user links Discord account and receives tokens and cookie")
    void processDiscord2Fa_unlinkedUser_linksAccountAndSucceeds() {
        User unlinkedUser = User.builder()
                .id(9L)
                .email("staff3@rng.com")
                .role("ROLE_USER")
                .discordLinked(false)
                .status("ACTIVE")
                .build();

        when(userRepository.findById(9L)).thenReturn(Optional.of(unlinkedUser));
        when(discordClient.fetchDiscordUser("code", "http://callback"))
                .thenReturn(DiscordUserDto.builder()
                        .id("777888999000")
                        .username("NewDiscordUser")
                        .avatar("new_avatar.png")
                        .build());
        when(userRepository.existsByDiscordId("777888999000")).thenReturn(false);
        when(tokenService.generateAccessToken(9L, "staff3@rng.com", "ROLE_USER")).thenReturn("access-token-9");
        when(tokenService.generateRefreshToken(9L)).thenReturn("refresh-token-9");

        MockHttpServletResponse response = new MockHttpServletResponse();
        AuthResponse result = authService.processDiscord2Fa(9L, "jti-9", "code", "http://callback", response);

        assertThat(unlinkedUser.isDiscordLinked()).isTrue();
        assertThat(unlinkedUser.getDiscordId()).isEqualTo("777888999000");
        assertThat(unlinkedUser.getDiscordUsername()).isEqualTo("NewDiscordUser");
        assertThat(unlinkedUser.getDiscordAvatar()).isEqualTo("new_avatar.png");
        assertThat(result.getAccessToken()).isEqualTo("access-token-9");
        assertThat(response.getHeader("Set-Cookie")).contains("refresh_token=refresh-token-9");
        verify(userRepository).save(unlinkedUser);
    }

    // =========================================================================
    // refreshAccessToken Tests
    // =========================================================================

    @Test
    @DisplayName("refreshAccessToken: throws UnauthorizedException when refresh token is null")
    void refreshAccessToken_nullToken_throwsUnauthorized() {
        assertThatThrownBy(() -> authService.refreshAccessToken(null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid or expired refresh token");
    }

    @Test
    @DisplayName("refreshAccessToken: throws UnauthorizedException when token validation fails")
    void refreshAccessToken_invalidToken_throwsUnauthorized() {
        when(tokenService.validateToken("bad-refresh-token")).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshAccessToken("bad-refresh-token"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid or expired refresh token");
    }

    @Test
    @DisplayName("refreshAccessToken: throws UnauthorizedException when user not found")
    void refreshAccessToken_userNotFound_throwsUnauthorized() {
        when(tokenService.validateToken("valid-refresh-token")).thenReturn(true);
        when(tokenService.getUserIdFromToken("valid-refresh-token")).thenReturn(999L);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refreshAccessToken("valid-refresh-token"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("refreshAccessToken: throws UnauthorizedException when user account is inactive")
    void refreshAccessToken_inactiveUser_throwsUnauthorized() {
        User inactive = User.builder()
                .id(10L)
                .email("inactive@rng.com")
                .status("BANNED")
                .build();

        when(tokenService.validateToken("valid-refresh-token")).thenReturn(true);
        when(tokenService.getUserIdFromToken("valid-refresh-token")).thenReturn(10L);
        when(userRepository.findById(10L)).thenReturn(Optional.of(inactive));

        assertThatThrownBy(() -> authService.refreshAccessToken("valid-refresh-token"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Account is inactive or suspended");
    }

    @Test
    @DisplayName("refreshAccessToken: issues new access token successfully")
    void refreshAccessToken_success_returnsAuthResponse() {
        User activeUser = User.builder()
                .id(11L)
                .email("user11@rng.com")
                .role("ROLE_HIGH_COMMAND")
                .status("ACTIVE")
                .build();

        when(tokenService.validateToken("valid-refresh-token")).thenReturn(true);
        when(tokenService.getUserIdFromToken("valid-refresh-token")).thenReturn(11L);
        when(userRepository.findById(11L)).thenReturn(Optional.of(activeUser));
        when(tokenService.generateAccessToken(11L, "user11@rng.com", "ROLE_HIGH_COMMAND")).thenReturn("new-access-jwt");

        AuthResponse authResponse = authService.refreshAccessToken("valid-refresh-token");

        assertThat(authResponse).isNotNull();
        assertThat(authResponse.getAccessToken()).isEqualTo("new-access-jwt");
        assertThat(authResponse.getUserEmail()).isEqualTo("user11@rng.com");
        assertThat(authResponse.getRole()).isEqualTo("ROLE_HIGH_COMMAND");
    }

    // =========================================================================
    // logout Tests
    // =========================================================================

    @Test
    @DisplayName("logout: clears refresh token cookie with maxAge=0")
    void logout_clearsCookie() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        authService.logout(response);

        assertThat(response.getHeader("Set-Cookie"))
                .contains("refresh_token=")
                .contains("Max-Age=0");
    }

    // =========================================================================
    // getCurrentUser & getActiveSessions Tests
    // =========================================================================

    @Test
    @DisplayName("getCurrentUser: throws ResourceNotFoundException when user does not exist")
    void getCurrentUser_userNotFound_throwsNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getCurrentUser(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("getCurrentUser: returns fully mapped UserResponse")
    void getCurrentUser_userFound_returnsResponse() {
        User user = User.builder()
                .id(15L)
                .email("commander@rng.com")
                .fullName("Commander Jack")
                .provider(AuthProvider.EMAIL)
                .discordId("987654321")
                .discordUsername("CommanderJack")
                .discordAvatar("avatar.png")
                .discordLinked(true)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .status("ACTIVE")
                .build();

        when(userRepository.findById(15L)).thenReturn(Optional.of(user));

        UserResponse response = authService.getCurrentUser(15L);

        assertThat(response.getId()).isEqualTo(15L);
        assertThat(response.getEmail()).isEqualTo("commander@rng.com");
        assertThat(response.getFullName()).isEqualTo("Commander Jack");
        assertThat(response.getProvider()).isEqualTo("EMAIL");
        assertThat(response.getDiscordId()).isEqualTo("987654321");
        assertThat(response.isDiscordLinked()).isTrue();
        assertThat(response.getDesignationList()).containsExactly("Supreme");
        assertThat(response.getRoleList()).containsExactly("High Command");
    }

    @Test
    @DisplayName("getActiveSessions: populates session from request headers with fallback values")
    void getActiveSessions_returnsCurrentSession() {
        MockHttpServletRequest requestWithHeaders = new MockHttpServletRequest();
        requestWithHeaders.setRemoteAddr("192.168.1.50");
        requestWithHeaders.addHeader("User-Agent", "Mozilla/5.0");

        List<ActiveSessionDto> sessions = authService.getActiveSessions(15L, requestWithHeaders);
        assertThat(sessions).hasSize(1);
        assertThat(sessions.get(0).getIpAddress()).isEqualTo("192.168.1.50");
        assertThat(sessions.get(0).getUserAgent()).isEqualTo("Mozilla/5.0");
        assertThat(sessions.get(0).isCurrent()).isTrue();

        MockHttpServletRequest blankRequest = new MockHttpServletRequest();
        blankRequest.setRemoteAddr(null);
        List<ActiveSessionDto> fallbackSessions = authService.getActiveSessions(15L, blankRequest);
        assertThat(fallbackSessions.get(0).getIpAddress()).isEqualTo("127.0.0.1");
        assertThat(fallbackSessions.get(0).getUserAgent()).isEqualTo("Browser");
    }

    // =========================================================================
    // Forgot Password & Reset Password Tests
    // =========================================================================

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
    @DisplayName("resetPassword: throws BadCredentialsException when new password is too short or null")
    void resetPassword_shortPassword_throwsBadCredentials() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .newPassword("short")
                .build();

        assertThatThrownBy(() -> authService.resetPassword(6L, "mock-token", request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Password must be at least 8 characters long");

        ResetPasswordRequest nullRequest = ResetPasswordRequest.builder()
                .newPassword(null)
                .build();

        assertThatThrownBy(() -> authService.resetPassword(6L, "mock-token", nullRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Password must be at least 8 characters long");
    }

    @Test
    @DisplayName("resetPassword: throws ResourceNotFoundException when user is not found")
    void resetPassword_userNotFound_throwsNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .newPassword("ValidPassword123!")
                .build();

        assertThatThrownBy(() -> authService.resetPassword(999L, "token", request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
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

    @Test
    @DisplayName("resetPassword: with null token does not attempt token revocation")
    void resetPassword_nullToken_doesNotRevokeToken() {
        User user = User.builder()
                .id(7L)
                .email("staff@rng.com")
                .password("old-hashed-password")
                .build();

        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewSecretPassword123!")).thenReturn("new-bcrypt-hashed-password");

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .newPassword("NewSecretPassword123!")
                .build();

        authService.resetPassword(7L, null, request);

        assertThat(user.getPassword()).isEqualTo("new-bcrypt-hashed-password");
        verify(tokenService, never()).revokeJti(any());
        verify(userRepository).save(user);
    }
}
