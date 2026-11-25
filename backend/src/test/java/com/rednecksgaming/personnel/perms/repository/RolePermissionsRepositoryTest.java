// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.repository;

import com.rednecksgaming.personnel.perms.domain.RolePermissions;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RolePermissionsRepositoryTest {

    @Autowired
    private RolePermissionsRepository repository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Should execute full JSONB create-read-update-delete cycle and enforce @Version optimistic locking")
    void shouldPersistJsonbAndEnforceOptimisticLocking() {
        Map<String, Object> initialPerms = new HashMap<>();
        initialPerms.put("dashboard", Map.of("enabled", true));

        RolePermissions created = new RolePermissions(
                "des_custom:Test Lead",
                "des_custom",
                "Test Lead",
                4,
                initialPerms,
                "seed-operator"
        );

        RolePermissions saved = repository.saveAndFlush(created);
        assertThat(saved.getVersion()).isEqualTo(0L);

        entityManager.flush();
        entityManager.clear();

        Optional<RolePermissions> found = repository.findByDesignationIdAndRoleName("des_custom", "Test Lead");
        assertThat(found).isPresent();
        assertThat(found.get().getRoleId()).isEqualTo("des_custom:Test Lead");

        RolePermissions toUpdate = found.get();
        toUpdate.setPermissions(Map.of("dashboard", Map.of("enabled", false)));
        RolePermissions updated = repository.saveAndFlush(toUpdate);
        assertThat(updated.getVersion()).isEqualTo(1L);

        entityManager.flush();
        entityManager.clear();

        RolePermissions staleDetached = new RolePermissions(
                "des_custom:Test Lead",
                "des_custom",
                "Test Lead",
                4,
                Map.of("dashboard", Map.of("enabled", true)),
                "stale-operator"
        );
        staleDetached.setVersion(0L);

        assertThatThrownBy(() -> repository.saveAndFlush(staleDetached))
                .isInstanceOf(OptimisticLockingFailureException.class);

        entityManager.clear();
        repository.deleteByDesignationIdAndRoleName("des_custom", "Test Lead");
        entityManager.flush();
        assertThat(repository.findById("des_custom:Test Lead")).isEmpty();
    }

    @Test
    @DisplayName("Should query seeded roles sorted ascending and by collection of roleIds")
    void shouldQuerySortedAndByRoleIds() {
        List<RolePermissions> sorted = repository.findAll(Sort.by(Sort.Direction.ASC, "roleId"));
        assertThat(sorted).hasSize(28);
        assertThat(sorted).isSortedAccordingTo((a, b) -> a.getRoleId().compareTo(b.getRoleId()));

        List<RolePermissions> subset = repository.findAllByRoleIdIn(List.of(
                "des_supreme:Chief High Command",
                "des_tech:Minister"
        ));
        assertThat(subset).hasSize(2);
    }

    @Test
    @DisplayName("Should initialize and refresh updatedAt via JPA lifecycle hooks when using no-arg constructor")
    void shouldManageUpdatedAtViaJpaLifecycleHooks() {
        RolePermissions entity = new RolePermissions();
        entity.setRoleId("des_custom:Hook Check");
        entity.setDesignationId("des_custom");
        entity.setRoleName("Hook Check");
        entity.setRankWeight(2);
        entity.setPermissions(Map.of("dashboard", Map.of("enabled", true)));
        entity.setUpdatedAt(null);
        entity.setUpdatedBy("hook-tester");

        RolePermissions persisted = repository.saveAndFlush(entity);
        assertThat(persisted.getUpdatedAt()).isNotNull();

        entityManager.flush();
        entityManager.clear();

        RolePermissions reloaded = repository.findById("des_custom:Hook Check").orElseThrow();
        reloaded.setUpdatedAt(reloaded.getUpdatedAt().minusSeconds(60));
        reloaded.setPermissions(Map.of("dashboard", Map.of("enabled", false)));
        RolePermissions updated = repository.saveAndFlush(reloaded);
        assertThat(updated.getUpdatedAt()).isAfter(persisted.getUpdatedAt().minusSeconds(30));
    }
}
