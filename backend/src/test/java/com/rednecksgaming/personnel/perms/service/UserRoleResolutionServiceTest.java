// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.service;

import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.personnel.perms.domain.RolePermissions;
import com.rednecksgaming.personnel.perms.repository.RolePermissionsRepository;
import com.rednecksgaming.personnel.roles.domain.MatrixDesignation;
import com.rednecksgaming.personnel.roles.repository.MatrixDesignationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserRoleResolutionServiceTest {

    @Mock
    private MatrixDesignationRepository designationRepository;

    @Mock
    private RolePermissionsRepository rolePermissionsRepository;

    private UserRoleResolutionService resolutionService;

    @BeforeEach
    void setUp() {
        resolutionService = new UserRoleResolutionService(designationRepository, rolePermissionsRepository);
    }

    private void stubCatalogData() {
        when(designationRepository.findAll()).thenReturn(List.of(
                new MatrixDesignation("des_supreme", "Supreme", 0),
                new MatrixDesignation("des_tech", "Ministry of Tech", 1),
                new MatrixDesignation("des_finance", "Ministry of Finance", 2)
        ));

        when(rolePermissionsRepository.findAll()).thenReturn(List.of(
                new RolePermissions("des_supreme:Chief High Command", "des_supreme", "Chief High Command", 9, Map.of(), "SEED"),
                new RolePermissions("des_supreme:High Command", "des_supreme", "High Command", 8, Map.of(), "SEED"),
                new RolePermissions("des_tech:Minister", "des_tech", "Minister", 5, Map.of(), "SEED"),
                new RolePermissions("des_finance:Minister", "des_finance", "Minister", 5, Map.of(), "SEED"),
                new RolePermissions("des_finance:Regional Treasurer", "des_finance", "Regional Treasurer", 2, Map.of(), "SEED")
        ));
    }

    @Test
    @DisplayName("Resolves explicit designation-prefixed multi-role assignments")
    void shouldResolvePrefixedMultiRoleAssignments() {
        stubCatalogData();
        User user = new User();
        user.setRoles("des_tech:Minister, des_finance:Regional Treasurer");
        user.setRole("ROLE_MINISTER");

        Set<String> resolved = resolutionService.resolveRoleIds(user);
        assertThat(resolved).containsExactly("des_tech:Minister", "des_finance:Regional Treasurer");
    }

    @Test
    @DisplayName("Resolves whitelist designation display-name prefixed roles with and without whitespace")
    void shouldResolveWhitelistDisplayNamePrefixedMultiRoles() {
        stubCatalogData();
        User user = new User();
        user.setDesignations("Supreme, Ministry of Tech");
        user.setRoles("Supreme: High Command, Ministry of Tech:Minister");
        user.setRole("ROLE_HIGH_COMMAND");

        Set<String> resolved = resolutionService.resolveRoleIds(user);
        assertThat(resolved).containsExactly("des_supreme:High Command", "des_tech:Minister");
    }

    @Test
    @DisplayName("Resolves case-insensitive prefixed roles and safely handles malformed colons")
    void shouldResolveCaseInsensitivePrefixedRolesAndEdgeColons() {
        stubCatalogData();
        User user = new User();
        user.setDesignations("Ministry of Tech");
        user.setRoles("ministry of tech: minister, :Regional Treasurer, Supreme:");
        user.setRole("ROLE_USER");

        Set<String> resolved = resolutionService.resolveRoleIds(user);
        assertThat(resolved).containsExactly("des_tech:Minister", "des_finance:Regional Treasurer");
    }

    @Test
    @DisplayName("Resolves unprefixed legacy role names using user's designation context")
    void shouldResolveUnprefixedRoleViaUserDesignation() {
        stubCatalogData();
        User user = new User();
        user.setDesignations("Ministry of Tech:Minister");
        user.setRoles("Minister");
        user.setRole("ROLE_MINISTER");

        Set<String> resolved = resolutionService.resolveRoleIds(user);
        assertThat(resolved).containsExactly("des_tech:Minister");
    }

    @Test
    @DisplayName("Falls back to Spring Security role when explicit roles CSV is null or empty")
    void shouldFallbackToSpringRoleWhenRolesEmpty() {
        stubCatalogData();
        User highCommand = new User();
        highCommand.setRole("ROLE_HIGH_COMMAND");
        highCommand.setRoles(null);
        assertThat(resolutionService.resolveRoleIds(highCommand))
                .containsExactly("des_supreme:High Command");

        User minister = new User();
        minister.setRole("ROLE_MINISTER");
        minister.setDesignations("Ministry of Finance:Minister");
        minister.setRoles("");
        assertThat(resolutionService.resolveRoleIds(minister))
                .containsExactly("des_finance:Minister");

        User basicUser = new User();
        basicUser.setRole("ROLE_USER");
        assertThat(resolutionService.resolveRoleIds(basicUser)).isEmpty();
    }

    @Test
    @DisplayName("Computes max rank weight across Spring role and resolved RolePermissions rows")
    void shouldComputeMaxRankWeight() {
        User user = new User();
        user.setRole("ROLE_USER");

        RolePermissions rp = new RolePermissions("des_supreme:High Command", "des_supreme", "High Command", 8, Map.of(), "SEED");
        assertThat(resolutionService.resolveMaxRankWeight(user, List.of(rp))).isEqualTo(8);
    }

    @Test
    @DisplayName("Uses RolePermissions rankWeight even when lower than legacy default")
    void shouldUseRolePermissionsWeightEvenWhenLowerThanLegacyDefault() {
        User user = new User();
        user.setRole("ROLE_USER");
        user.setRoles("Custom Dept:Custom Intern");

        RolePermissions rankZeroRole = new RolePermissions(
                "des_custom:Custom Intern", "des_custom", "Custom Intern", 0, Map.of(), "ADMIN"
        );
        assertThat(resolutionService.resolveMaxRankWeight(user, List.of(rankZeroRole))).isEqualTo(0);

        RolePermissions rankSevenRole = new RolePermissions(
                "des_custom:Custom Director", "des_custom", "Custom Director", 7, Map.of(), "ADMIN"
        );
        assertThat(resolutionService.resolveMaxRankWeight(user, List.of(rankSevenRole))).isEqualTo(7);
    }
}
