// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms;

import com.rednecksgaming.personnel.perms.controller.GranularPermissionsInterceptor;
import com.rednecksgaming.personnel.perms.controller.RolePermissionsController;
import com.rednecksgaming.personnel.perms.service.RolePermissionsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class RolePermissionsSmokeTest {

    @Autowired
    private RolePermissionsController controller;

    @Autowired
    private RolePermissionsService service;

    @Autowired
    private GranularPermissionsInterceptor interceptor;

    @Test
    @DisplayName("Tier 3B Smoke: Full web context boots with RolePermissions beans and 28 seeded roles")
    void shouldBootFullWebContextWithSeededRoles() {
        assertThat(controller).isNotNull();
        assertThat(service).isNotNull();
        assertThat(interceptor).isNotNull();
        assertThat(service.getAllRolePermissions()).hasSize(28);
    }
}
