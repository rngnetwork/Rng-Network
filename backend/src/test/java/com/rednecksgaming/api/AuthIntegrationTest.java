// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.common.dto.DiscordUserDto;
import com.rednecksgaming.common.security.DiscordClient;
import com.rednecksgaming.common.security.SecurityConstants;
import com.rednecksgaming.common.security.TokenService;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.dto.Discord2FaRequest;
import com.rednecksgaming.identity.dto.LoginRequest;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.security.oauth2.CustomOAuth2User;
import com.rednecksgaming.security.oauth2.OAuth2AuthenticationSuccessHandler;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @MockitoBean
    private DiscordClient discordClient;

    @BeforeEach
    void setUp() {
        User user = userRepository.findByEmail("testuser@rng.com").orElseGet(() -> {
            User newUser = User.builder()
                    .email("testuser@rng.com")
                    .fullName("Test User")
                    .provider(com.rednecksgaming.identity.domain.AuthProvider.EMAIL)
                    .role("ROLE_USER")
                    .status("ACTIVE")
                    .discordLinked(false)
                    .build();
            return userRepository.save(newUser);
        });
        user.setPassword(passwordEncoder.encode("password123"));
        user.setDiscordLinked(false);
        user.setDiscordId(null);
        user.setDiscordUsername(null);
        user.setDiscordAvatar(null);
        userRepository.save(user);


    }

    @Test
    @DisplayName("Email Login Success - Issues Pre-2FA Token")
    void testEmailLoginSuccess() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("testuser@rng.com")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.token", notNullValue()))
                .andExpect(jsonPath("$.data.requiresDiscord2Fa", is(true)))
                .andExpect(jsonPath("$.data.userEmail", is("testuser@rng.com")));
    }

    @Test
    @DisplayName("Email Login Failure - Invalid Password")
    void testEmailLoginInvalidPassword() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("testuser@rng.com")
                .password("wrongpassword")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("Pre-2FA Scope Enforcement - Restricted Endpoint Access Denied")
    void testPre2FaScopeEnforcement() throws Exception {
        // Step 1: Login to get Pre-2FA token
        LoginRequest loginRequest = LoginRequest.builder()
                .email("testuser@rng.com")
                .password("password123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String pre2FaToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // Step 2: Attempt accessing /api/v1/users/me with Pre-2FA token -> should return 403 Forbidden
        mockMvc.perform(get("/api/v1/users/me")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + pre2FaToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Complete Flow - Pre-2FA Login -> Discord 2FA Upgrade -> Profile Access -> Refresh -> Logout")
    void testCompleteAuthenticationFlow() throws Exception {
        // Mock Discord client profile return
        DiscordUserDto mockDiscordUser = DiscordUserDto.builder()
                .id("discord_99887766")
                .username("TestDiscordUser#1234")
                .email("testuser@rng.com")
                .avatar("mock_avatar_hash_123")
                .build();
        when(discordClient.fetchDiscordUser(anyString())).thenReturn(mockDiscordUser);
        when(discordClient.fetchDiscordUser(anyString(), any())).thenReturn(mockDiscordUser);

        // 1. Email Login -> Pre-2FA Token
        LoginRequest loginRequest = LoginRequest.builder()
                .email("testuser@rng.com")
                .password("password123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String pre2FaToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // 2. Discord 2FA Upgrade -> Full Access Token + Refresh Cookie
        Discord2FaRequest discordRequest = Discord2FaRequest.builder()
                .code("mock_discord_oauth2_code_123")
                .build();

        MvcResult twoFactorResult = mockMvc.perform(post("/api/v1/auth/discord/2fa")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + pre2FaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(discordRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(cookie().exists(SecurityConstants.REFRESH_TOKEN_COOKIE_NAME))
                .andReturn();

        String accessToken = objectMapper.readTree(twoFactorResult.getResponse().getContentAsString())
                .get("data").get("accessToken").asText();
        Cookie refreshCookie = twoFactorResult.getResponse().getCookie(SecurityConstants.REFRESH_TOKEN_COOKIE_NAME);

        // 3. Attempt reusing same single-use Pre-2FA Token -> Revoked (401 Unauthorized)
        mockMvc.perform(post("/api/v1/auth/discord/2fa")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + pre2FaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(discordRequest)))
                .andExpect(status().isUnauthorized());

        // 4. Access Protected Endpoint /api/v1/users/me with Full Access Token
        mockMvc.perform(get("/api/v1/users/me")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("testuser@rng.com")))
                .andExpect(jsonPath("$.data.discordAvatar", is("mock_avatar_hash_123")))
                .andExpect(jsonPath("$.data.discordLinked", is(true)));

        // 5. Refresh Access Token using Refresh Cookie
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()));

        // 6. Logout -> Cookie Cleared
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge(SecurityConstants.REFRESH_TOKEN_COOKIE_NAME, 0));
    }

    @Test
    @DisplayName("Google OAuth2 Success Handler - Issues Pre-2FA Token Redirect")
    void testGoogleOAuth2SuccessHandler() throws Exception {
        User user = userRepository.findByEmail("testuser@rng.com").orElseThrow();
        CustomOAuth2User principal = new CustomOAuth2User(user, Map.of("email", "testuser@rng.com", "sub", "google_sub_12345"));
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        oAuth2AuthenticationSuccessHandler.onAuthenticationSuccess(request, response, auth);

        assertThat(response.getRedirectedUrl()).startsWith("http://localhost:3000/auth/2fa?token=");
        assertThat(response.getRedirectedUrl()).contains("email=testuser@rng.com");
    }

    @Test
    @DisplayName("Discord 2FA - Returning User Avatar & Username Auto-Sync")
    void testReturningUserDiscord2FaUpdatesAvatar() throws Exception {
        User user = userRepository.findByEmail("testuser@rng.com").orElseThrow();
        user.setDiscordId("discord_99887766");
        user.setDiscordUsername("OldUsername");
        user.setDiscordAvatar("old_avatar_hash");
        user.setDiscordLinked(true);
        userRepository.save(user);



        DiscordUserDto updatedDiscordUser = DiscordUserDto.builder()
                .id("discord_99887766")
                .username("NewUpdatedUsername")
                .email("testuser@rng.com")
                .avatar("a_new_animated_avatar_hash")
                .build();
        when(discordClient.fetchDiscordUser(anyString())).thenReturn(updatedDiscordUser);
        when(discordClient.fetchDiscordUser(anyString(), any())).thenReturn(updatedDiscordUser);

        String pre2FaToken = tokenService.generatePre2FaToken(user.getId(), user.getEmail());
        Discord2FaRequest request = Discord2FaRequest.builder()
                .code("mock_discord_code")
                .build();

        mockMvc.perform(post("/api/v1/auth/discord/2fa")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, "Bearer " + pre2FaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        User updatedUser = userRepository.findByEmail("testuser@rng.com").orElseThrow();
        assertThat(updatedUser.getDiscordUsername()).isEqualTo("NewUpdatedUsername");
        assertThat(updatedUser.getDiscordAvatar()).isEqualTo("a_new_animated_avatar_hash");
    }

    @Test
    @DisplayName("First-Time Email Login: NULL password automatically registered with BCrypt and issues Pre-2FA token")
    void testFirstTimeLoginPasswordAutoRegistration() throws Exception {
        User newlyWhitelisted = userRepository.save(User.builder()
                .email("newwhitelisted@rng.com")
                .fullName("New Whitelisted User")
                .provider(com.rednecksgaming.identity.domain.AuthProvider.EMAIL)
                .password(null) // No password initially
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Junior Dev")
                .status("ACTIVE")
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("newwhitelisted@rng.com")
                .password("myFirstSecretPassword!99")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.token", notNullValue()))
                .andExpect(jsonPath("$.data.requiresDiscord2Fa", is(true)))
                .andExpect(jsonPath("$.data.userEmail", is("newwhitelisted@rng.com")));

        // Verify password was registered and encoded in DB
        User updated = userRepository.findByEmail("newwhitelisted@rng.com").orElseThrow();
        assertThat(updated.getPassword()).isNotNull();
        assertThat(passwordEncoder.matches("myFirstSecretPassword!99", updated.getPassword())).isTrue();
    }

    @Test
    @DisplayName("High Command Seeded User: Can login with db#*whitelisted68527 and authenticate")
    void testHighCommandSeededUserLogin() throws Exception {
        User highCommand = userRepository.findByEmail("arzenic@rednecksgaming.com").orElseGet(() -> {
            return userRepository.save(User.builder()
                    .email("arzenic@rednecksgaming.com")
                    .fullName("Arzenic")
                    .provider(com.rednecksgaming.identity.domain.AuthProvider.EMAIL)
                    .role("ROLE_HIGH_COMMAND")
                    .designations("Supreme")
                    .roles("High Command")
                    .status("ACTIVE")
                    .build());
        });
        highCommand.setPassword(passwordEncoder.encode("db#*whitelisted68527"));
        userRepository.save(highCommand);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("arzenic@rednecksgaming.com")
                .password("db#*whitelisted68527")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.token", notNullValue()))
                .andExpect(jsonPath("$.data.userEmail", is("arzenic@rednecksgaming.com")));
    }

    @Test
    @DisplayName("Provider Security: Account whitelisted with GOOGLE provider is rejected on Email/Password login")
    void testGoogleProviderUserCannotLoginWithEmailPassword() throws Exception {
        userRepository.save(User.builder()
                .email("googleonly@rng.com")
                .fullName("Google Only User")
                .provider(com.rednecksgaming.identity.domain.AuthProvider.GOOGLE)
                .password(null)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Junior Dev")
                .status("ACTIVE")
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("googleonly@rng.com")
                .password("anyPasswordAttempt123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("This account is configured for Google Sign-In")));
    }

    @Test
    @DisplayName("Forgot Password: Initiate returns Discord auth URL for eligible email user")
    void testInitiateForgotPasswordSuccess() throws Exception {
        User linkedUser = userRepository.save(User.builder()
                .email("recover@rng.com")
                .fullName("Recover User")
                .provider(com.rednecksgaming.identity.domain.AuthProvider.EMAIL)
                .password(passwordEncoder.encode("oldpass123"))
                .role("ROLE_USER")
                .status("ACTIVE")
                .discordId("987654321098765432")
                .discordLinked(true)
                .build());

        com.rednecksgaming.identity.dto.ForgotPasswordInitiateRequest request =
                com.rednecksgaming.identity.dto.ForgotPasswordInitiateRequest.builder()
                        .email("recover@rng.com")
                        .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.discordAuthUrl", containsString("discord.com/oauth2/authorize")))
                .andExpect(jsonPath("$.data.discordAuthUrl", containsString("scope=identify")));
    }

    @Test
    @DisplayName("Forgot Password: Initiate fails when Discord account is not linked")
    void testInitiateForgotPasswordUnlinkedFails() throws Exception {
        userRepository.save(User.builder()
                .email("unlinked_recovery@rng.com")
                .fullName("Unlinked User")
                .provider(com.rednecksgaming.identity.domain.AuthProvider.EMAIL)
                .password(passwordEncoder.encode("oldpass123"))
                .role("ROLE_USER")
                .status("ACTIVE")
                .discordId("UNLINKED")
                .discordLinked(false)
                .build());

        com.rednecksgaming.identity.dto.ForgotPasswordInitiateRequest request =
                com.rednecksgaming.identity.dto.ForgotPasswordInitiateRequest.builder()
                        .email("unlinked_recovery@rng.com")
                        .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Account cannot be recovered via Discord because no Discord account is linked")));
    }

    @Test
    @DisplayName("Forgot Password: Full Verification and Password Reset Flow")
    void testVerifyAndResetPasswordFlow() throws Exception {
        User recoverUser = userRepository.save(User.builder()
                .email("fullflow@rng.com")
                .fullName("Full Flow User")
                .provider(com.rednecksgaming.identity.domain.AuthProvider.EMAIL)
                .password(passwordEncoder.encode("OldPassword123!"))
                .role("ROLE_USER")
                .status("ACTIVE")
                .discordId("555444333222111000")
                .discordLinked(true)
                .build());

        // 1. Generate valid reset request state token
        String stateToken = tokenService.generateResetRequestToken(recoverUser.getId(), recoverUser.getEmail());

        // 2. Mock Discord OAuth2 exchange returning matching Discord Snowflake ID
        when(discordClient.fetchDiscordUser("valid-code"))
                .thenReturn(new DiscordUserDto("555444333222111000", "FullFlowDiscord", "avatar_hash", null));

        com.rednecksgaming.identity.dto.ForgotPasswordVerifyRequest verifyRequest =
                com.rednecksgaming.identity.dto.ForgotPasswordVerifyRequest.builder()
                        .code("valid-code")
                        .state(stateToken)
                        .build();

        MvcResult verifyResult = mockMvc.perform(post("/api/v1/auth/forgot-password/verify-discord")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.resetToken", notNullValue()))
                .andExpect(jsonPath("$.data.email", is("fullflow@rng.com")))
                .andReturn();

        Map responseMap = objectMapper.readValue(verifyResult.getResponse().getContentAsString(), Map.class);
        Map dataMap = (Map) responseMap.get("data");
        String resetToken = (String) dataMap.get("resetToken");

        // 3. Reset password using reset token
        com.rednecksgaming.identity.dto.ResetPasswordRequest resetRequest =
                com.rednecksgaming.identity.dto.ResetPasswordRequest.builder()
                        .newPassword("BrandNewPassword999!")
                        .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password/reset")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, SecurityConstants.TOKEN_TYPE_HEADER + resetToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Password has been reset successfully")));

        // 4. Verify password was updated in database and can be used to log in
        User updatedUser = userRepository.findByEmail("fullflow@rng.com").orElseThrow();
        assertThat(passwordEncoder.matches("BrandNewPassword999!", updatedUser.getPassword())).isTrue();

        // 5. Verify single-use reset token was revoked (replay attempt fails)
        mockMvc.perform(post("/api/v1/auth/forgot-password/reset")
                        .header(SecurityConstants.AUTHORIZATION_HEADER, SecurityConstants.TOKEN_TYPE_HEADER + resetToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isUnauthorized());
    }
}
