// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.common.security.TokenService;
import com.rednecksgaming.identity.domain.AuthProvider;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.personnel.perms.domain.RolePermissions;
import com.rednecksgaming.personnel.perms.dto.UpdateRolePermissionsRequest;
import com.rednecksgaming.personnel.perms.repository.RolePermissionsRepository;
import com.rednecksgaming.server.client.DiscordServerClient;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.dto.discord.DiscordGuildDto;
import com.rednecksgaming.server.repository.ServerRepository;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class GranularPermissionsEnforcementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RolePermissionsRepository rolePermissionsRepository;

    @Autowired
    private ServerRepository serverRepository;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private CacheManager cacheManager;

    @MockitoBean
    private DiscordServerClient discordClient;

    private User r9User;
    private User multiRoleStaff;
    private String r9Token;
    private String multiRoleToken;

    @BeforeEach
    void setUp() {
        evictAllPermsCaches();

        serverRepository.saveAndFlush(Server.builder().id("srv-1").slug("server-1").name("Server 1").build());
        serverRepository.saveAndFlush(Server.builder().id("srv-2").slug("server-2").name("Server 2").build());

        when(discordClient.getBotGuilds()).thenReturn(List.of(
                DiscordGuildDto.builder().id("srv-1").name("Server 1").approximateMemberCount(100).approximatePresenceCount(20).build(),
                DiscordGuildDto.builder().id("srv-2").name("Server 2").approximateMemberCount(50).approximatePresenceCount(10).build()
        ));

        r9User = userRepository.saveAndFlush(User.builder()
                .email("r9.chief@rng.gg")
                .fullName("Chief")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_CHIEF_HIGH_COMMAND")
                .designations("Supreme")
                .roles("des_supreme:Chief High Command")
                .status("ACTIVE")
                .build());

        multiRoleStaff = userRepository.saveAndFlush(User.builder()
                .email("staff.multi@rng.gg")
                .fullName("Multi Role Staff")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Tech, Ministry of Finances")
                .roles("des_tech:Junior Dev, des_finances:Regional treasurer")
                .status("ACTIVE")
                .build());

        r9Token = tokenService.generateAccessToken(r9User.getId(), r9User.getEmail(), r9User.getRole());
        multiRoleToken = tokenService.generateAccessToken(multiRoleStaff.getId(), multiRoleStaff.getEmail(), multiRoleStaff.getRole());
    }

    @Test
    @DisplayName("Toggling Server 1 OFF hides it from /api/v1/servers and returns 403 on /api/v1/servers/server-1")
    void shouldFilterDisabledServerAndBlockDirectApiAccess() throws Exception {
        RolePermissions juniorDev = rolePermissionsRepository.findById("des_tech:Junior Dev").orElseThrow();
        Map<String, Object> perms = new LinkedHashMap<>(juniorDev.getPermissions());
        perms.put("dashboard", Map.of("enabled", true));
        perms.put("dashboard.servers", Map.of(
                "enabled", true,
                "dashboard.servers.[serverId]", Map.of(
                        "server-1", Map.of("enabled", false),
                        "server-2", Map.of("enabled", true)
                )
        ));
        juniorDev.setPermissions(perms);
        rolePermissionsRepository.saveAndFlush(juniorDev);
        evictAllPermsCaches();

        mockMvc.perform(get("/api/v1/servers").header("Authorization", "Bearer " + multiRoleToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].slug", hasItem("server-2")))
                .andExpect(jsonPath("$.data[*].slug", not(hasItem("server-1"))));

        mockMvc.perform(get("/api/v1/servers/server-1").header("Authorization", "Bearer " + multiRoleToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value(1003));
    }

    @Test
    @DisplayName("Multi-role additive union combines permissions across roles and allows granted R9-R0 edits")
    void shouldComputeAdditiveUnionAndAllowGrantedUnrestrictedRoleEdit() throws Exception {
        RolePermissions roleA = rolePermissionsRepository.findById("des_tech:Junior Dev").orElseThrow();
        Map<String, Object> permsA = new LinkedHashMap<>(roleA.getPermissions());
        permsA.put("dashboard", Map.of("enabled", true));
        permsA.put("dashboard.whitelist", Map.of("enabled", true, "fullAccess", false));
        roleA.setPermissions(permsA);
        rolePermissionsRepository.saveAndFlush(roleA);

        RolePermissions roleB = rolePermissionsRepository.findById("des_finances:Regional treasurer").orElseThrow();
        Map<String, Object> permsB = new LinkedHashMap<>(roleB.getPermissions());
        permsB.put("dashboard.personnel", Map.of(
                "enabled", true,
                "dashboard.personnel.roles", Map.of("enabled", false),
                "dashboard.personnel.perms", Map.of("enabled", true)
        ));
        roleB.setPermissions(permsB);
        rolePermissionsRepository.saveAndFlush(roleB);
        evictAllPermsCaches();

        mockMvc.perform(get("/api/v1/whitelist").header("Authorization", "Bearer " + multiRoleToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/personnel/perms/explorer").header("Authorization", "Bearer " + multiRoleToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/personnel/hierarchy/matrix").header("Authorization", "Bearer " + multiRoleToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value(1003));

        RolePermissions r9Role = rolePermissionsRepository.findById("des_supreme:Chief High Command").orElseThrow();
        UpdateRolePermissionsRequest updateReq = new UpdateRolePermissionsRequest(r9Role.getPermissions(), r9Role.getVersion());

        mockMvc.perform(put("/api/v1/personnel/perms/des_supreme:Chief High Command")
                        .header("Authorization", "Bearer " + multiRoleToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("R9 preview mode enforces previewed role gates while keeping safety allowlist open, and rejects non-R9/R8 preview")
    void shouldEnforcePreviewModeAndSafetyAllowlist() throws Exception {
        mockMvc.perform(get("/api/v1/personnel/perms/me")
                        .header("Authorization", "Bearer " + r9Token)
                        .header("X-Preview-Role-Id", "des_tech:Junior Dev"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isPreviewMode").value(true));

        mockMvc.perform(get("/api/v1/personnel/perms/preview-options")
                        .header("Authorization", "Bearer " + r9Token)
                        .header("X-Preview-Role-Id", "des_tech:Junior Dev"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + r9Token)
                        .header("X-Preview-Role-Id", "des_tech:Junior Dev"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/whitelist")
                        .header("Authorization", "Bearer " + r9Token)
                        .header("X-Preview-Role-Id", "des_tech:Junior Dev"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value(1003));

        mockMvc.perform(get("/api/v1/personnel/perms/me")
                        .header("Authorization", "Bearer " + multiRoleToken)
                        .header("X-Preview-Role-Id", "des_supreme:Chief High Command"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value(1003));
    }

    @Test
    @DisplayName("Whitelist fullAccess=true elevates R4 operator to global whitelist visibility")
    void shouldElevateWhitelistVisibilityWhenFullAccessEnabled() throws Exception {
        RolePermissions roleA = rolePermissionsRepository.findById("des_tech:Junior Dev").orElseThrow();
        Map<String, Object> permsA = new LinkedHashMap<>(roleA.getPermissions());
        permsA.put("dashboard", Map.of("enabled", true));
        permsA.put("dashboard.whitelist", Map.of("enabled", true, "fullAccess", true));
        roleA.setPermissions(permsA);
        rolePermissionsRepository.saveAndFlush(roleA);
        evictAllPermsCaches();

        mockMvc.perform(get("/api/v1/whitelist").header("Authorization", "Bearer " + multiRoleToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].email", hasItem("r9.chief@rng.gg")));
    }

    private void evictAllPermsCaches() {
        Cache permsCache = cacheManager.getCache("personnel:role_perms");
        if (permsCache != null) {
            permsCache.clear();
        }
        Cache guildsCache = cacheManager.getCache("guilds:summary");
        if (guildsCache != null) {
            guildsCache.clear();
        }
    }
}
