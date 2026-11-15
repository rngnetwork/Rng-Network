// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.common.exception.GlobalExceptionHandler;
import com.rednecksgaming.personnel.roles.dto.*;
import com.rednecksgaming.personnel.roles.service.DesignationRoleService;
import com.rednecksgaming.personnel.roles.service.RoleMatrixService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RoleHierarchyControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private RoleMatrixService matrixService;

    @Mock
    private DesignationRoleService designationRoleService;

    @InjectMocks
    private RoleHierarchyController controller;

    private UsernamePasswordAuthenticationToken highCommandAuth;
    private UsernamePasswordAuthenticationToken chiefHighCommandAuth;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        highCommandAuth = new UsernamePasswordAuthenticationToken(
                "hc_user",
                "credentials",
                List.of(new SimpleGrantedAuthority("ROLE_HIGH_COMMAND"))
        );

        chiefHighCommandAuth = new UsernamePasswordAuthenticationToken(
                "chc_user",
                "credentials",
                List.of(new SimpleGrantedAuthority("ROLE_CHIEF_HIGH_COMMAND"))
        );
    }

    @Test
    @DisplayName("GET /api/v1/personnel/hierarchy/matrix returns 200 OK with matrix data")
    void testGetMatrix() throws Exception {
        RoleHierarchyMatrixDto matrixDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.getFullMatrix()).thenReturn(matrixDto);

        mockMvc.perform(get("/api/v1/personnel/hierarchy/matrix")
                        .principal(highCommandAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/personnel/hierarchy/matrix/roles adds role and returns 201 Created")
    void testAddRole() throws Exception {
        AddRoleRequest req = new AddRoleRequest(5, "des_tech", "Senior Dev");
        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.addRole(any(AddRoleRequest.class))).thenReturn(refreshedDto);

        mockMvc.perform(post("/api/v1/personnel/hierarchy/matrix/roles")
                        .principal(highCommandAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/personnel/hierarchy/matrix/roles rejects Rank 9 mutation for regular High Command with 403")
    void testAddRoleRank9ClearanceGating() throws Exception {
        AddRoleRequest req = new AddRoleRequest(9, "des_supreme", "Supreme Role");

        mockMvc.perform(post("/api/v1/personnel/hierarchy/matrix/roles")
                        .principal(highCommandAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/personnel/hierarchy/matrix/roles permits Rank 9 mutation for Chief High Command with 201")
    void testAddRoleRank9ChiefHighCommandAllowed() throws Exception {
        AddRoleRequest req = new AddRoleRequest(9, "des_supreme", "Supreme Role");
        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.addRole(any(AddRoleRequest.class))).thenReturn(refreshedDto);

        mockMvc.perform(post("/api/v1/personnel/hierarchy/matrix/roles")
                        .principal(chiefHighCommandAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PATCH /api/v1/personnel/hierarchy/matrix/roles/{roleId} returns 200 OK")
    void testUpdateRole() throws Exception {
        UpdateRoleRequest req = new UpdateRoleRequest("Lead Dev");
        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.updateRole(eq(10L), eq("Lead Dev"))).thenReturn(refreshedDto);

        mockMvc.perform(patch("/api/v1/personnel/hierarchy/matrix/roles/10")
                        .principal(highCommandAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /api/v1/personnel/hierarchy/matrix/roles/{roleId} returns 200 OK")
    void testDeleteRole() throws Exception {
        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.deleteRole(10L)).thenReturn(refreshedDto);

        mockMvc.perform(delete("/api/v1/personnel/hierarchy/matrix/roles/10")
                        .principal(highCommandAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/personnel/hierarchy/matrix/designations returns 201 Created")
    void testAddDesignation() throws Exception {
        AddDesignationRequest req = new AddDesignationRequest("Ministry of Defense");
        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.addDesignation(any(AddDesignationRequest.class))).thenReturn(refreshedDto);

        mockMvc.perform(post("/api/v1/personnel/hierarchy/matrix/designations")
                        .principal(highCommandAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PATCH /api/v1/personnel/hierarchy/matrix/designations/{designationId} returns 200 OK")
    void testUpdateDesignation() throws Exception {
        UpdateDesignationRequest req = new UpdateDesignationRequest("Ministry of Tech Refined");
        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.updateDesignation(eq("des_tech"), any(UpdateDesignationRequest.class))).thenReturn(refreshedDto);

        mockMvc.perform(patch("/api/v1/personnel/hierarchy/matrix/designations/des_tech")
                        .principal(highCommandAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /api/v1/personnel/hierarchy/matrix/designations/{designationId} returns 200 OK")
    void testDeleteDesignation() throws Exception {
        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.deleteDesignation("des_tech")).thenReturn(refreshedDto);

        mockMvc.perform(delete("/api/v1/personnel/hierarchy/matrix/designations/des_tech")
                        .principal(highCommandAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/personnel/hierarchy/matrix/ranks returns 201 Created")
    void testAddRank() throws Exception {
        AddRankRequest req = new AddRankRequest(10, "R10");
        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.addRank(any(AddRankRequest.class))).thenReturn(refreshedDto);

        mockMvc.perform(post("/api/v1/personnel/hierarchy/matrix/ranks")
                        .principal(highCommandAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PATCH /api/v1/personnel/hierarchy/matrix/ranks/{rankWeight} returns 200 OK")
    void testUpdateRank() throws Exception {
        UpdateRankRequest req = new UpdateRankRequest(10, "R10_UPDATED");
        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.updateRank(eq(10), any(UpdateRankRequest.class))).thenReturn(refreshedDto);

        mockMvc.perform(patch("/api/v1/personnel/hierarchy/matrix/ranks/10")
                        .principal(highCommandAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /api/v1/personnel/hierarchy/matrix/ranks/{rankWeight} returns 200 OK")
    void testDeleteRank() throws Exception {
        RoleHierarchyMatrixDto refreshedDto = new RoleHierarchyMatrixDto(List.of(), List.of(), Collections.emptyMap());
        when(matrixService.deleteRank(10)).thenReturn(refreshedDto);

        mockMvc.perform(delete("/api/v1/personnel/hierarchy/matrix/ranks/10")
                        .principal(highCommandAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /api/v1/personnel/hierarchy/designation-roles returns 200 OK")
    void testGetDesignationRoles() throws Exception {
        DesignationRolesResponse response = new DesignationRolesResponse(List.of());
        when(designationRoleService.getDesignationRoles()).thenReturn(response);

        mockMvc.perform(get("/api/v1/personnel/hierarchy/designation-roles")
                        .principal(highCommandAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
