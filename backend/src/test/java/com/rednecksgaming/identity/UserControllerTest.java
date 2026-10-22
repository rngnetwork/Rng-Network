package com.rednecksgaming.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rednecksgaming.common.exception.GlobalExceptionHandler;
import com.rednecksgaming.identity.controller.UserController;
import com.rednecksgaming.identity.dto.ActiveSessionDto;
import com.rednecksgaming.identity.dto.UserResponse;
import com.rednecksgaming.identity.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private UserController userController;

    private final UsernamePasswordAuthenticationToken authPrincipal =
            new UsernamePasswordAuthenticationToken(1L, null, List.of());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/users/me returns authenticated user profile")
    void testGetCurrentUser() throws Exception {
        UserResponse response = UserResponse.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .fullName("Arzenic")
                .provider("EMAIL")
                .discordId("123456789012345678")
                .discordUsername("Arzenic#0001")
                .discordLinked(true)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("Chief High Command, High Command")
                .designationList(List.of("Supreme"))
                .roleList(List.of("Chief High Command", "High Command"))
                .status("ACTIVE")
                .build();

        when(authService.getCurrentUser(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/me")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.email", is("arzenic@rednecksgaming.com")))
                .andExpect(jsonPath("$.data.role", is("ROLE_HIGH_COMMAND")))
                .andExpect(jsonPath("$.data.discordLinked", is(true)));
    }

    @Test
    @DisplayName("GET /api/v1/users/me/sessions returns active sessions")
    void testGetActiveSessions() throws Exception {
        ActiveSessionDto session = ActiveSessionDto.builder()
                .id("current")
                .ipAddress("127.0.0.1")
                .userAgent("Mozilla/5.0")
                .createdAt(Instant.now())
                .lastActiveAt(Instant.now())
                .current(true)
                .build();

        when(authService.getActiveSessions(eq(1L), any(HttpServletRequest.class))).thenReturn(List.of(session));

        mockMvc.perform(get("/api/v1/users/me/sessions")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is("current")))
                .andExpect(jsonPath("$.data[0].current", is(true)));
    }

    @Test
    @DisplayName("DELETE /api/v1/users/me/sessions/{sessionId} successfully revokes session")
    void testRevokeSession() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me/sessions/session-abc-123")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Session revoked")));
    }
}
