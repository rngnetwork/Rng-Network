// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.personnel.perms.dto.EffectivePermissionsDto;
import com.rednecksgaming.personnel.perms.dto.PermsExplorerResponseDto;
import com.rednecksgaming.personnel.perms.dto.PreviewRoleOptionDto;
import com.rednecksgaming.personnel.perms.dto.RolePermissionsDto;
import com.rednecksgaming.personnel.perms.dto.UpdateRolePermissionsRequest;
import com.rednecksgaming.personnel.perms.service.RolePermissionsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RolePermissionsControllerTest {

    @Mock
    private RolePermissionsService service;

    @Mock
    private UserRepository userRepository;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private Authentication auth;
    private User operator;

    @BeforeEach
    void setUp() {
        RolePermissionsController controller = new RolePermissionsController(service, userRepository);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new RolePermissionsExceptionHandler())
                .build();

        operator = new User();
        operator.setId(42L);
        operator.setEmail("chief@rng.gg");
        operator.setRole("ROLE_CHIEF_HIGH_COMMAND");

        auth = new UsernamePasswordAuthenticationToken(
                42L,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_CHIEF_HIGH_COMMAND"))
        );
    }

    @Test
    @DisplayName("GET /api/v1/personnel/perms/explorer returns explorer payload")
    void shouldReturnExplorer() throws Exception {
        when(service.getExplorer()).thenReturn(new PermsExplorerResponseDto(List.of(), List.of(), Map.of()));

        mockMvc.perform(get("/api/v1/personnel/perms/explorer").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.folders").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/personnel/perms/me extracts Long userId and forwards X-Preview-Role-Id")
    void shouldReturnEffectivePermissionsWithPreviewHeader() throws Exception {
        when(userRepository.findById(42L)).thenReturn(Optional.of(operator));
        EffectivePermissionsDto effective = new EffectivePermissionsDto(
                "42",
                Set.of("des_tech:Junior Dev"),
                true,
                "des_tech:Junior Dev",
                "Junior Dev",
                9,
                Map.of("dashboard", Map.of("enabled", false))
        );
        when(service.computeEffectivePermissions(operator, "des_tech:Junior Dev")).thenReturn(effective);

        mockMvc.perform(get("/api/v1/personnel/perms/me")
                        .principal(auth)
                        .header("X-Preview-Role-Id", "des_tech:Junior Dev"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isPreviewMode").value(true))
                .andExpect(jsonPath("$.data.previewRoleId").value("des_tech:Junior Dev"));
    }

    @Test
    @DisplayName("GET /api/v1/personnel/perms/preview-options maps AccessDeniedException to 403 errorCode 1003")
    void shouldMapAccessDeniedTo1003() throws Exception {
        when(userRepository.findById(42L)).thenReturn(Optional.of(operator));
        when(service.getPreviewRoleOptions(operator))
                .thenThrow(new AccessDeniedException("Role preview options are restricted to R9 and R8 personnel"));

        mockMvc.perform(get("/api/v1/personnel/perms/preview-options").principal(auth))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(1003));
    }

    @Test
    @DisplayName("PUT /api/v1/personnel/perms/{roleId} maps optimistic lock to 409/1001 and validation failure to 400/1004")
    void shouldHandleUpdateErrorsAndSuccess() throws Exception {
        when(userRepository.findById(42L)).thenReturn(Optional.of(operator));
        when(service.updateRolePermissions(eq("des_tech:Minister"), any(UpdateRolePermissionsRequest.class), eq("chief@rng.gg")))
                .thenThrow(new OptimisticLockingFailureException("Version conflict"));

        UpdateRolePermissionsRequest validRequest = new UpdateRolePermissionsRequest(
                Map.of("dashboard", Map.of("enabled", true)),
                0L
        );
        mockMvc.perform(put("/api/v1/personnel/perms/des_tech:Minister")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(1001));

        UpdateRolePermissionsRequest invalidRequest = new UpdateRolePermissionsRequest(Map.of(), null);
        mockMvc.perform(put("/api/v1/personnel/perms/des_tech:Minister")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(1004));
    }

    @Test
    @DisplayName("POST /api/v1/personnel/perms/reset/{roleId} returns 200 on success and 404/1002 when missing")
    void shouldHandleResetAndNotFound() throws Exception {
        when(userRepository.findById(42L)).thenReturn(Optional.of(operator));
        RolePermissionsDto dto = new RolePermissionsDto(
                "des_tech:Minister", "des_tech", "Ministry of Tech", "Minister", 5, "R5",
                Map.of("dashboard", Map.of("enabled", false)), Map.of(), 1L, "chief@rng.gg", Instant.now()
        );
        when(service.resetToDefault("des_tech:Minister", "chief@rng.gg")).thenReturn(dto);
        when(service.getRolePermissions("des_unknown:None")).thenThrow(new NoSuchElementException("Not found"));

        mockMvc.perform(post("/api/v1/personnel/perms/reset/des_tech:Minister").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roleId").value("des_tech:Minister"));

        mockMvc.perform(get("/api/v1/personnel/perms/des_unknown:None").principal(auth))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(1002));
    }
}
