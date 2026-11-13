// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rednecksgaming.common.exception.ConflictException;
import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.common.exception.GlobalExceptionHandler;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.identity.controller.WhitelistController;
import com.rednecksgaming.identity.domain.AuthProvider;
import com.rednecksgaming.identity.dto.UpdateWhitelistedUserRequest;
import com.rednecksgaming.identity.dto.WhitelistUserRequest;
import com.rednecksgaming.identity.dto.WhitelistedUserDto;
import com.rednecksgaming.identity.service.WhitelistService;
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

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class WhitelistControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private WhitelistService whitelistService;

    @InjectMocks
    private WhitelistController whitelistController;

    private final UsernamePasswordAuthenticationToken authPrincipal =
            new UsernamePasswordAuthenticationToken(1L, null, List.of());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(whitelistController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/whitelist returns list of whitelisted personnel")
    void testGetWhitelistedUsers() throws Exception {
        WhitelistedUserDto dto = WhitelistedUserDto.builder()
                .id(10L)
                .email("agent@rng.com")
                .userName("Agent Smith")
                .provider("EMAIL")
                .role("ROLE_USER")
                .designations(List.of("Ministry of Growth, GFX and External Relations"))
                .roles(List.of("Agent"))
                .status("ACTIVE")
                .build();

        when(whitelistService.getWhitelistedUsers(1L, null)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/whitelist")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].email", is("agent@rng.com")));
    }

    @Test
    @DisplayName("GET /api/v1/whitelist?ministry=... returns filtered personnel by ministry")
    void testGetWhitelistedUsers_withMinistryFilter() throws Exception {
        WhitelistedUserDto techDto = WhitelistedUserDto.builder()
                .id(11L)
                .email("tech@rng.com")
                .userName("Tech Lead")
                .provider("EMAIL")
                .role("ROLE_USER")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Tech Specialist"))
                .status("ACTIVE")
                .build();

        when(whitelistService.getWhitelistedUsers(1L, "Ministry of Tech")).thenReturn(List.of(techDto));

        mockMvc.perform(get("/api/v1/whitelist")
                        .param("ministry", "Ministry of Tech")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].email", is("tech@rng.com")));
    }

    @Test
    @DisplayName("POST /api/v1/whitelist successfully creates new whitelisted user")
    void testCreateWhitelistedUser_success() throws Exception {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("new@rng.com")
                .userName("New User")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        WhitelistedUserDto response = WhitelistedUserDto.builder()
                .id(20L)
                .email("new@rng.com")
                .userName("New User")
                .provider("EMAIL")
                .role("ROLE_USER")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .status("ACTIVE")
                .build();

        when(whitelistService.createWhitelistedUser(eq(1L), any(WhitelistUserRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/whitelist")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(20)))
                .andExpect(jsonPath("$.message", is("User successfully added to whitelist")));
    }

    @Test
    @DisplayName("POST /api/v1/whitelist returns 400 Bad Request on validation failure")
    void testCreateWhitelistedUser_validationError() throws Exception {
        WhitelistUserRequest invalidRequest = WhitelistUserRequest.builder()
                .email("invalid-email-format")
                .userName("") // Blank name
                .designations(List.of()) // Empty designations
                .roles(List.of()) // Empty roles
                .build();

        mockMvc.perform(post("/api/v1/whitelist")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/whitelist returns 409 Conflict when email already exists")
    void testCreateWhitelistedUser_conflict() throws Exception {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("existing@rng.com")
                .userName("Existing User")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        when(whitelistService.createWhitelistedUser(eq(1L), any(WhitelistUserRequest.class)))
                .thenThrow(new ConflictException("User with email existing@rng.com is already whitelisted"));

        mockMvc.perform(post("/api/v1/whitelist")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("User with email existing@rng.com is already whitelisted")));
    }

    @Test
    @DisplayName("PUT /api/v1/whitelist/{id} successfully updates whitelisted user")
    void testUpdateWhitelistedUser_success() throws Exception {
        UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                .userName("Updated Name")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Senior Dev"))
                .build();

        WhitelistedUserDto response = WhitelistedUserDto.builder()
                .id(20L)
                .email("dev@rng.com")
                .userName("Updated Name")
                .provider("EMAIL")
                .role("ROLE_USER")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Senior Dev"))
                .status("ACTIVE")
                .build();

        when(whitelistService.updateWhitelistedUser(eq(1L), eq(20L), any(UpdateWhitelistedUserRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/whitelist/20")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.userName", is("Updated Name")))
                .andExpect(jsonPath("$.message", is("Whitelisted user updated successfully")));
    }

    @Test
    @DisplayName("PUT /api/v1/whitelist/{id} returns 400 Bad Request on invalid request body")
    void testUpdateWhitelistedUser_validationError() throws Exception {
        UpdateWhitelistedUserRequest invalidRequest = UpdateWhitelistedUserRequest.builder()
                .userName("Updated Name")
                .designations(List.of()) // Empty designations
                .roles(List.of()) // Empty roles
                .build();

        mockMvc.perform(put("/api/v1/whitelist/20")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("PUT /api/v1/whitelist/{id} returns 404 when target user is not found")
    void testUpdateWhitelistedUser_notFound() throws Exception {
        UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                .userName("Updated Name")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Senior Dev"))
                .build();

        when(whitelistService.updateWhitelistedUser(eq(1L), eq(999L), any(UpdateWhitelistedUserRequest.class)))
                .thenThrow(new ResourceNotFoundException("Whitelisted user not found with ID: 999"));

        mockMvc.perform(put("/api/v1/whitelist/999")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("PUT /api/v1/whitelist/{id} returns 403 Forbidden on authorization boundary violation")
    void testUpdateWhitelistedUser_forbidden() throws Exception {
        UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                .userName("Target User")
                .designations(List.of("Supreme"))
                .roles(List.of("High Command"))
                .build();

        when(whitelistService.updateWhitelistedUser(eq(1L), eq(20L), any(UpdateWhitelistedUserRequest.class)))
                .thenThrow(new ForbiddenException("Ministers cannot modify High Command accounts"));

        mockMvc.perform(put("/api/v1/whitelist/20")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("DELETE /api/v1/whitelist/{id} successfully deletes whitelisted user")
    void testDeleteWhitelistedUser_success() throws Exception {
        doNothing().when(whitelistService).deleteWhitelistedUser(1L, 20L);

        mockMvc.perform(delete("/api/v1/whitelist/20")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Whitelisted user removed successfully")));

        verify(whitelistService).deleteWhitelistedUser(1L, 20L);
    }

    @Test
    @DisplayName("DELETE /api/v1/whitelist/{id} returns 403 when deleting Chief High Command or self")
    void testDeleteWhitelistedUser_forbidden() throws Exception {
        doThrow(new ForbiddenException("Administrators cannot delete their own account"))
                .when(whitelistService).deleteWhitelistedUser(1L, 1L);

        mockMvc.perform(delete("/api/v1/whitelist/1")
                        .principal(authPrincipal)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Administrators cannot delete their own account")));
    }

    @Test
    @DisplayName("GET /api/v1/whitelist/hierarchy returns canonical designations and roles mapping")
    void testGetPersonnelHierarchy() throws Exception {
        mockMvc.perform(get("/api/v1/whitelist/hierarchy")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.Supreme").isArray())
                .andExpect(jsonPath("$.data['Ministry of Tech']").isArray());
    }
}
