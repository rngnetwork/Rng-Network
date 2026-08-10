package com.rng.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.dto.DiscordUserDto;
import com.rng.common.security.DiscordClient;
import com.rng.common.security.SecurityConstants;
import com.rng.common.security.TokenService;
import com.rng.identity.domain.User;
import com.rng.identity.dto.Discord2FaRequest;
import com.rng.identity.dto.LoginRequest;
import com.rng.identity.repository.UserRepository;
import com.rng.security.oauth2.CustomOAuth2User;
import com.rng.security.oauth2.OAuth2AuthenticationSuccessHandler;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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

    @MockBean
    private DiscordClient discordClient;

    @BeforeEach
    void setUp() {
        User user = userRepository.findByEmail("testuser@rng.com").orElse(null);
        if (user != null) {
            user.setPassword(passwordEncoder.encode("password123"));
            userRepository.save(user);
        }
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
                .build();
        when(discordClient.fetchDiscordUser(anyString())).thenReturn(mockDiscordUser);

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
}
