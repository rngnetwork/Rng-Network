// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.common.security.TokenService;
import com.rednecksgaming.identity.domain.AuthProvider;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.personnel.perms.repository.RolePermissionsRepository;
import com.rednecksgaming.personnel.roles.domain.MatrixCell;
import com.rednecksgaming.personnel.roles.dto.*;
import com.rednecksgaming.personnel.roles.repository.DesignationRoleRepository;
import com.rednecksgaming.personnel.roles.repository.MatrixCellRepository;
import com.rednecksgaming.personnel.roles.repository.MatrixDesignationRepository;
import com.rednecksgaming.personnel.roles.repository.MatrixRankRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RoleHierarchyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private MatrixRankRepository rankRepository;

    @Autowired
    private MatrixDesignationRepository designationRepository;

    @Autowired
    private MatrixCellRepository cellRepository;

    @Autowired
    private DesignationRoleRepository designationRoleRepository;

    @Autowired
    private RolePermissionsRepository rolePermissionsRepository;

    @Autowired
    private CacheManager cacheManager;

    private User chiefHighCommand;
    private User regularHighCommand;
    private User ministerUser;
    private User regularUser;

    private String chiefHighCommandToken;
    private String regularHighCommandToken;
    private String ministerToken;
    private String regularUserToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        rolePermissionsRepository.findById("des_tech:Minister").ifPresent(ministerPerms -> {
            Map<String, Object> perms = new LinkedHashMap<>(ministerPerms.getPermissions());
            perms.put("dashboard", Map.of("enabled", true));
            perms.put("dashboard.whitelist", Map.of("enabled", true, "fullAccess", false));
            ministerPerms.setPermissions(perms);
            rolePermissionsRepository.saveAndFlush(ministerPerms);
            Cache cache = cacheManager.getCache("personnel:role_perms");
            if (cache != null) {
                cache.evict("des_tech:Minister");
            }
        });

        chiefHighCommand = userRepository.save(User.builder()
                .email("arzenic@rednecksgaming.com")
                .fullName("Arzenic")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_CHIEF_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command, Chief High Command")
                .status("ACTIVE")
                .build());

        regularHighCommand = userRepository.save(User.builder()
                .email("peer.hc@rng.com")
                .fullName("Peer HC")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .status("ACTIVE")
                .build());

        ministerUser = userRepository.save(User.builder()
                .email("minister.tech@rng.com")
                .fullName("Tech Minister")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech")
                .roles("Minister")
                .status("ACTIVE")
                .build());

        regularUser = userRepository.save(User.builder()
                .email("user@rng.com")
                .fullName("Regular Dev")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Junior Dev")
                .status("ACTIVE")
                .build());

        chiefHighCommandToken = tokenService.generateAccessToken(chiefHighCommand.getId(), chiefHighCommand.getEmail(), chiefHighCommand.getRole());
        regularHighCommandToken = tokenService.generateAccessToken(regularHighCommand.getId(), regularHighCommand.getEmail(), regularHighCommand.getRole());
        ministerToken = tokenService.generateAccessToken(ministerUser.getId(), ministerUser.getEmail(), ministerUser.getRole());
        regularUserToken = tokenService.generateAccessToken(regularUser.getId(), regularUser.getEmail(), regularUser.getRole());
    }

    @AfterEach
    void tearDown() {
        rolePermissionsRepository.findById("des_tech:Minister").ifPresent(ministerPerms -> {
            Map<String, Object> perms = new LinkedHashMap<>(ministerPerms.getPermissions());
            perms.put("dashboard", Map.of("enabled", false));
            perms.put("dashboard.whitelist", Map.of("enabled", false, "fullAccess", false));
            ministerPerms.setPermissions(perms);
            rolePermissionsRepository.saveAndFlush(ministerPerms);
            Cache cache = cacheManager.getCache("personnel:role_perms");
            if (cache != null) {
                cache.evict("des_tech:Minister");
            }
        });
    }

    @Test
    @DisplayName("GET /api/v1/personnel/hierarchy/matrix - High Command loads full matrix with V7 pre-seeded data")
    void testLoadMatrix_asHighCommand_returnsCanonicalPreSeededData() throws Exception {
        mockMvc.perform(get("/api/v1/personnel/hierarchy/matrix")
                        .header("Authorization", "Bearer " + regularHighCommandToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.ranks", hasSize(greaterThanOrEqualTo(10))))
                .andExpect(jsonPath("$.data.ranks[0].code").value("R9"))
                .andExpect(jsonPath("$.data.designations", hasSize(greaterThanOrEqualTo(8))))
                .andExpect(jsonPath("$.data.cells.9_des_supreme[0].name").value("Chief High Command"))
                .andExpect(jsonPath("$.data.cells.8_des_supreme[0].name").value("High Command"));
    }

    @Test
    @DisplayName("Designation Lifecycle - High Command creates, updates, and deletes designation column")
    void testDesignationLifecycle_createUpdateDelete() throws Exception {
        AddDesignationRequest addReq = new AddDesignationRequest("Ministry of Security");

        // 1. Create Designation
        mockMvc.perform(post("/api/v1/personnel/hierarchy/matrix/designations")
                        .header("Authorization", "Bearer " + regularHighCommandToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.designations[*].name", hasItem("Ministry of Security")));

        String designationId = "des_ministry_of_security";
        assertThat(designationRepository.findById(designationId)).isPresent();

        // 2. Update Designation
        UpdateDesignationRequest updateReq = new UpdateDesignationRequest("Ministry of Homeland Security");
        mockMvc.perform(patch("/api/v1/personnel/hierarchy/matrix/designations/" + designationId)
                        .header("Authorization", "Bearer " + regularHighCommandToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.designations[*].name", hasItem("Ministry of Homeland Security")));

        // 3. Delete Designation
        mockMvc.perform(delete("/api/v1/personnel/hierarchy/matrix/designations/" + designationId)
                        .header("Authorization", "Bearer " + regularHighCommandToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.designations[*].id", not(hasItem(designationId))));

        assertThat(designationRepository.findById(designationId)).isEmpty();
    }

    @Test
    @DisplayName("Role Lifecycle & Sync Listener - High Command creates, updates, and deletes role with synchronous Table 2 sync")
    void testRoleLifecycle_andSynchronousSyncListener() throws Exception {
        AddRoleRequest addReq = new AddRoleRequest(3, "des_tech", "Cloud Architect");

        // 1. Create Role
        MvcResult result = mockMvc.perform(post("/api/v1/personnel/hierarchy/matrix/roles")
                        .header("Authorization", "Bearer " + regularHighCommandToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cells.3_des_tech[*].name", hasItem("Cloud Architect")))
                .andReturn();

        // Verify synchronous sync listener updated Table 2 (designation_roles)
        assertThat(designationRoleRepository.existsByDesignationIdAndRoleName("des_tech", "Cloud Architect")).isTrue();

        // Resolve generated role ID from database
        MatrixCell createdCell = cellRepository.findAll().stream()
                .filter(c -> "Cloud Architect".equals(c.getRoleName()))
                .findFirst()
                .orElseThrow();
        Long roleId = createdCell.getId();

        // 2. Update Role Name
        UpdateRoleRequest updateReq = new UpdateRoleRequest("Principal Cloud Architect");
        mockMvc.perform(patch("/api/v1/personnel/hierarchy/matrix/roles/" + roleId)
                        .header("Authorization", "Bearer " + regularHighCommandToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cells.3_des_tech[*].name", hasItem("Principal Cloud Architect")));

        assertThat(designationRoleRepository.existsByDesignationIdAndRoleName("des_tech", "Cloud Architect")).isFalse();
        assertThat(designationRoleRepository.existsByDesignationIdAndRoleName("des_tech", "Principal Cloud Architect")).isTrue();

        // 3. Delete Role
        mockMvc.perform(delete("/api/v1/personnel/hierarchy/matrix/roles/" + roleId)
                        .header("Authorization", "Bearer " + regularHighCommandToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cells.3_des_tech[*].name", not(hasItem("Principal Cloud Architect"))));

        assertThat(cellRepository.findById(roleId)).isEmpty();
        assertThat(designationRoleRepository.existsByDesignationIdAndRoleName("des_tech", "Principal Cloud Architect")).isFalse();
    }

    @Test
    @DisplayName("Rank 9 Clearance Gating - Regular High Command forbidden, Chief High Command permitted")
    void testRank9ClearanceGating_regularHcForbidden_chiefHcAllowed() throws Exception {
        AddRoleRequest rank9Req = new AddRoleRequest(9, "des_supreme", "Sovereign Commander");

        // Regular High Command must be rejected with 403 Forbidden
        mockMvc.perform(post("/api/v1/personnel/hierarchy/matrix/roles")
                        .header("Authorization", "Bearer " + regularHighCommandToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rank9Req)))
                .andExpect(status().isForbidden());

        // Chief High Command must succeed with 201 Created
        mockMvc.perform(post("/api/v1/personnel/hierarchy/matrix/roles")
                        .header("Authorization", "Bearer " + chiefHighCommandToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rank9Req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cells.9_des_supreme[*].name", hasItem("Sovereign Commander")));
    }

    @Test
    @DisplayName("Whitelist Hierarchy Endpoint - Ministers allowed, normal users forbidden")
    void testWhitelistHierarchyEndpoint_ministerAllowed_userForbidden() throws Exception {
        // Minister can access dynamic hierarchy map
        mockMvc.perform(get("/api/v1/whitelist/hierarchy")
                        .header("Authorization", "Bearer " + ministerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.Supreme", hasItem("Chief High Command")))
                .andExpect(jsonPath("$.data.Chancellory", hasItem("Chancellor of Rivals")))
                .andExpect(jsonPath("$.data['Ministry of Tech']", hasItem("Senior Dev")));

        // Normal user is rejected with 403 Forbidden
        mockMvc.perform(get("/api/v1/whitelist/hierarchy")
                        .header("Authorization", "Bearer " + regularUserToken))
                .andExpect(status().isForbidden());
    }
}
