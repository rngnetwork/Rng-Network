// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.service;

import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.personnel.perms.domain.RolePermissions;
import com.rednecksgaming.personnel.perms.dto.EffectivePermissionsDto;
import com.rednecksgaming.personnel.perms.dto.PermsExplorerResponseDto;
import com.rednecksgaming.personnel.perms.dto.PreviewRoleOptionDto;
import com.rednecksgaming.personnel.perms.dto.RolePermissionsDto;
import com.rednecksgaming.personnel.perms.dto.UpdateRolePermissionsRequest;
import com.rednecksgaming.personnel.perms.event.RolePermissionsUpdatedEvent;
import com.rednecksgaming.personnel.perms.mapper.RolePermissionsMapper;
import com.rednecksgaming.personnel.perms.repository.RolePermissionsRepository;
import com.rednecksgaming.personnel.roles.domain.MatrixDesignation;
import com.rednecksgaming.personnel.roles.repository.MatrixDesignationRepository;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.repository.ServerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RolePermissionsServiceTest {

    @Mock
    private RolePermissionsRepository rolePermissionsRepository;

    @Mock
    private MatrixDesignationRepository designationRepository;

    @Mock
    private ServerRepository serverRepository;

    @Mock
    private UserRoleResolutionService roleResolutionService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private RolePermissionsService service;

    @BeforeEach
    void setUp() {
        PermsTextFormatter formatter = new PermsTextFormatter();
        PermsSchemaNormalizer normalizer = new PermsSchemaNormalizer();
        RolePermissionsMapper mapper = new RolePermissionsMapper(formatter);
        AdditiveUnionResolver unionResolver = new AdditiveUnionResolver();

        service = new RolePermissionsService(
                rolePermissionsRepository,
                designationRepository,
                serverRepository,
                mapper,
                normalizer,
                formatter,
                unionResolver,
                roleResolutionService,
                new ConcurrentMapCacheManager("personnel:role_perms"),
                eventPublisher
        );
    }

    @Test
    @DisplayName("Builds explorer tree with normalized server entries and backend-formatted labels")
    void shouldBuildExplorerWithServersAndLabels() {
        when(designationRepository.findAllByOrderByPositionAsc()).thenReturn(List.of(
                new MatrixDesignation("des_supreme", "Supreme", 0)
        ));
        Server server = Server.builder().id("111").slug("rednecks-gaming").name("Rednecks Gaming").iconHash("abc").build();
        when(serverRepository.findAll()).thenReturn(List.of(server));
        RolePermissions r9 = new RolePermissions(
                "des_supreme:Chief High Command", "des_supreme", "Chief High Command", 9,
                Map.of("dashboard", Map.of("enabled", true)), "SEED"
        );
        r9.setVersion(0L);
        when(rolePermissionsRepository.findAll()).thenReturn(List.of(r9));

        PermsExplorerResponseDto explorer = service.getExplorer();

        assertThat(explorer.folders()).hasSize(1);
        assertThat(explorer.folders().getFirst().files()).hasSize(1);
        assertThat(explorer.servers()).hasSize(1);
        assertThat(explorer.servers().getFirst().iconUrl()).isEqualTo("https://cdn.discordapp.com/icons/111/abc.png");
        assertThat(explorer.labels()).containsEntry("rednecks-gaming", "Rednecks Gaming");
    }

    @Test
    @DisplayName("Allows unrestricted R9-R0 updates, enforces optimistic locking, and publishes eviction event")
    void shouldUpdateAndEnforceOptimisticLock() {
        RolePermissions r9 = new RolePermissions(
                "des_supreme:Chief High Command", "des_supreme", "Chief High Command", 9,
                Map.of("dashboard", Map.of("enabled", true)), "SEED"
        );
        r9.setVersion(2L);
        when(rolePermissionsRepository.findById("des_supreme:Chief High Command")).thenReturn(Optional.of(r9));
        when(rolePermissionsRepository.saveAndFlush(any(RolePermissions.class))).thenAnswer(inv -> inv.getArgument(0));
        when(designationRepository.findAllByOrderByPositionAsc()).thenReturn(List.of());
        when(serverRepository.findAll()).thenReturn(List.of());

        assertThatThrownBy(() -> service.updateRolePermissions(
                "des_supreme:Chief High Command",
                new UpdateRolePermissionsRequest(Map.of("dashboard", Map.of("enabled", false)), 1L),
                "operator@rng.gg"
        )).isInstanceOf(OptimisticLockingFailureException.class);

        RolePermissionsDto updated = service.updateRolePermissions(
                "des_supreme:Chief High Command",
                new UpdateRolePermissionsRequest(Map.of("dashboard", Map.of("enabled", true)), 2L),
                "operator@rng.gg"
        );
        assertThat(updated.updatedBy()).isEqualTo("operator@rng.gg");
        verify(eventPublisher).publishEvent(any(RolePermissionsUpdatedEvent.class));
    }

    @Test
    @DisplayName("Resets R9/R8 to all true and R7-R0 to all false")
    void shouldResetRoleToRankDefault() {
        RolePermissions r2 = new RolePermissions(
                "des_tech:Senior Dev", "des_tech", "Senior Dev", 2,
                Map.of("dashboard", Map.of("enabled", true)), "op@rng.gg"
        );
        when(rolePermissionsRepository.findById("des_tech:Senior Dev")).thenReturn(Optional.of(r2));
        when(rolePermissionsRepository.saveAndFlush(any(RolePermissions.class))).thenAnswer(inv -> inv.getArgument(0));
        when(designationRepository.findAllByOrderByPositionAsc()).thenReturn(List.of());
        when(serverRepository.findAll()).thenReturn(List.of());

        RolePermissionsDto reset = service.resetToDefault("des_tech:Senior Dev", "op@rng.gg");
        assertThat(reset.permissions().get("dashboard")).isEqualTo(Map.of("enabled", false));
    }

    @Test
    @DisplayName("Enforces R9/R8 preview authorization and computes additive union in non-preview mode")
    void shouldEvaluateUnionAndPreviewMode() {
        User r8User = new User();
        r8User.setId(10L);
        r8User.setRole("ROLE_HIGH_COMMAND");

        RolePermissions r8 = new RolePermissions(
                "des_supreme:High Command", "des_supreme", "High Command", 8,
                Map.of("dashboard", Map.of("enabled", true)), "SEED"
        );
        RolePermissions r1 = new RolePermissions(
                "des_tech:Junior Dev", "des_tech", "Junior Dev", 1,
                Map.of("dashboard", Map.of("enabled", false)), "SEED"
        );

        when(serverRepository.findAll()).thenReturn(List.of());
        when(roleResolutionService.resolveRoleIds(r8User)).thenReturn(Set.of("des_supreme:High Command"));
        when(rolePermissionsRepository.findAllByRoleIdIn(Set.of("des_supreme:High Command"))).thenReturn(List.of(r8));
        when(roleResolutionService.resolveMaxRankWeight(r8User, List.of(r8))).thenReturn(8);
        when(rolePermissionsRepository.findById("des_tech:Junior Dev")).thenReturn(Optional.of(r1));
        when(rolePermissionsRepository.findById("missing:Role")).thenReturn(Optional.empty());

        EffectivePermissionsDto preview = service.computeEffectivePermissions(r8User, "des_tech:Junior Dev");
        assertThat(preview.isPreviewMode()).isTrue();
        assertThat(preview.previewRoleId()).isEqualTo("des_tech:Junior Dev");
        assertThat(preview.callerMaxRankWeight()).isEqualTo(8);

        assertThatThrownBy(() -> service.computeEffectivePermissions(r8User, "missing:Role"))
                .isInstanceOf(NoSuchElementException.class);

        User r4User = new User();
        r4User.setId(20L);
        r4User.setRole("ROLE_USER");
        when(roleResolutionService.resolveRoleIds(r4User)).thenReturn(Set.of());
        when(roleResolutionService.resolveMaxRankWeight(r4User, List.of())).thenReturn(4);

        assertThatThrownBy(() -> service.computeEffectivePermissions(r4User, "des_tech:Junior Dev"))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> service.getPreviewRoleOptions(r4User))
                .isInstanceOf(AccessDeniedException.class);

        when(designationRepository.findAllByOrderByPositionAsc()).thenReturn(List.of());
        when(rolePermissionsRepository.findAll()).thenReturn(List.of(r8, r1));
        List<PreviewRoleOptionDto> options = service.getPreviewRoleOptions(r8User);
        assertThat(options).hasSize(2);
        assertThat(options.getFirst().roleId()).isEqualTo("des_supreme:High Command");
    }

    @Test
    @DisplayName("Resolves user rank weight, hierarchy rank weights map, and role token weights dynamically")
    void shouldResolveDynamicUserAndHierarchyWeights() {
        User customUser = new User();
        customUser.setId(99L);
        customUser.setRole("ROLE_USER");
        customUser.setDesignations("Security Ops");
        customUser.setRoles("Security Ops:Custom Lead");

        RolePermissions customRp = new RolePermissions(
                "des_security:Custom Lead", "des_security", "Custom Lead", 7, Map.of(), "ADMIN"
        );
        RolePermissions internRp = new RolePermissions(
                "des_security:Custom Intern", "des_security", "Custom Intern", 0, Map.of(), "ADMIN"
        );

        when(roleResolutionService.resolveRoleIds(customUser)).thenReturn(Set.of("des_security:Custom Lead"));
        when(rolePermissionsRepository.findAllByRoleIdIn(Set.of("des_security:Custom Lead"))).thenReturn(List.of(customRp));
        when(roleResolutionService.resolveMaxRankWeight(customUser, List.of(customRp))).thenReturn(7);

        assertThat(service.resolveUserRankWeight(customUser)).isEqualTo(7);

        when(designationRepository.findAllByOrderByPositionAsc()).thenReturn(List.of(
                new MatrixDesignation("des_security", "Security Ops", 1)
        ));
        when(rolePermissionsRepository.findAll()).thenReturn(List.of(customRp, internRp));

        Map<String, Integer> weights = service.getHierarchyRankWeights();
        assertThat(weights)
                .containsEntry("Security Ops:Custom Lead", 7)
                .containsEntry("Security Ops:Custom Intern", 0);

        assertThat(service.resolveRoleTokensMaxRankWeight(List.of("Security Ops:Custom Lead"))).isEqualTo(7);
        assertThat(service.resolveRoleTokensMaxRankWeight(List.of("Security Ops:Custom Intern"))).isEqualTo(0);
    }
}
