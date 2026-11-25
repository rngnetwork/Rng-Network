// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.listener;

import com.rednecksgaming.personnel.perms.domain.RolePermissions;
import com.rednecksgaming.personnel.perms.event.RolePermissionsUpdatedEvent;
import com.rednecksgaming.personnel.perms.repository.RolePermissionsRepository;
import com.rednecksgaming.personnel.perms.service.PermsSchemaNormalizer;
import com.rednecksgaming.personnel.roles.domain.MatrixCell;
import com.rednecksgaming.personnel.roles.event.RoleHierarchyMutationEvent;
import com.rednecksgaming.personnel.roles.repository.MatrixCellRepository;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.repository.ServerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Synchronizes {@link RolePermissions} records with live mutations emitted from the role hierarchy matrix.
 */
@Component
public class RoleHierarchyPermissionsSyncListener {

    private static final Logger log = LoggerFactory.getLogger(RoleHierarchyPermissionsSyncListener.class);
    private static final String SYSTEM_ACTOR = "ROLE_MATRIX_SYNC";

    private final RolePermissionsRepository rolePermissionsRepository;
    private final MatrixCellRepository matrixCellRepository;
    private final ServerRepository serverRepository;
    private final PermsSchemaNormalizer schemaNormalizer;
    private final ApplicationEventPublisher eventPublisher;

    public RoleHierarchyPermissionsSyncListener(
            RolePermissionsRepository rolePermissionsRepository,
            MatrixCellRepository matrixCellRepository,
            ServerRepository serverRepository,
            PermsSchemaNormalizer schemaNormalizer,
            ApplicationEventPublisher eventPublisher
    ) {
        this.rolePermissionsRepository = rolePermissionsRepository;
        this.matrixCellRepository = matrixCellRepository;
        this.serverRepository = serverRepository;
        this.schemaNormalizer = schemaNormalizer;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Propagates role additions, renames, deletions, and designation removals into {@code role_permissions}.
     *
     * @param event role hierarchy mutation event
     */
    @EventListener
    public void onRoleHierarchyMutation(RoleHierarchyMutationEvent event) {
        if (event == null || event.type() == null) {
            return;
        }
        switch (event.type()) {
            case ROLE_ADDED -> handleRoleAdded(event);
            case ROLE_UPDATED -> handleRoleUpdated(event);
            case ROLE_DELETED -> handleRoleDeleted(event);
            case DESIGNATION_DELETED -> handleDesignationDeleted(event);
            case DESIGNATION_UPDATED -> {
                // Designation renames leave designation_id primary key prefixes intact.
            }
        }
    }

    private void handleRoleAdded(RoleHierarchyMutationEvent event) {
        if (event.designationId() == null || event.roleName() == null) {
            return;
        }
        String roleId = buildRoleId(event.designationId(), event.roleName());
        if (rolePermissionsRepository.existsById(roleId)) {
            return;
        }
        int rankWeight = resolveRankWeight(event.designationId(), event.roleName());
        List<String> serverSlugs = serverRepository.findAll().stream()
                .map(Server::getSlug)
                .toList();
        Map<String, Object> defaultTree = schemaNormalizer.buildDefaultTree(rankWeight >= 8, serverSlugs);

        RolePermissions created = new RolePermissions(
                roleId,
                event.designationId(),
                event.roleName(),
                rankWeight,
                defaultTree,
                SYSTEM_ACTOR
        );
        rolePermissionsRepository.save(created);
        eventPublisher.publishEvent(new RolePermissionsUpdatedEvent(roleId, SYSTEM_ACTOR, Instant.now()));
        log.info("Provisioned default RolePermissions for newly added roleId={} (rankWeight={})", roleId, rankWeight);
    }

    private void handleRoleUpdated(RoleHierarchyMutationEvent event) {
        if (event.designationId() == null || event.roleName() == null) {
            return;
        }
        String previousRoleName = (event.oldRoleName() != null && !event.oldRoleName().isBlank())
                ? event.oldRoleName()
                : event.roleName();
        String oldRoleId = buildRoleId(event.designationId(), previousRoleName);
        String newRoleId = buildRoleId(event.designationId(), event.roleName());
        int resolvedWeight = resolveRankWeight(event.designationId(), event.roleName());

        Optional<RolePermissions> existingOpt = rolePermissionsRepository.findById(oldRoleId);
        if (existingOpt.isEmpty()) {
            handleRoleAdded(event);
            return;
        }

        RolePermissions existing = existingOpt.get();
        if (oldRoleId.equals(newRoleId)) {
            existing.setRankWeight(resolvedWeight);
            existing.setUpdatedBy(SYSTEM_ACTOR);
            rolePermissionsRepository.save(existing);
            eventPublisher.publishEvent(new RolePermissionsUpdatedEvent(newRoleId, SYSTEM_ACTOR, Instant.now()));
            return;
        }

        RolePermissions migrated = new RolePermissions(
                newRoleId,
                event.designationId(),
                event.roleName(),
                resolvedWeight,
                existing.getPermissions(),
                SYSTEM_ACTOR
        );
        rolePermissionsRepository.delete(existing);
        rolePermissionsRepository.flush();
        rolePermissionsRepository.save(migrated);
        eventPublisher.publishEvent(new RolePermissionsUpdatedEvent(oldRoleId, SYSTEM_ACTOR, Instant.now()));
        eventPublisher.publishEvent(new RolePermissionsUpdatedEvent(newRoleId, SYSTEM_ACTOR, Instant.now()));
        log.info("Migrated RolePermissions from {} to {}", oldRoleId, newRoleId);
    }

    private void handleRoleDeleted(RoleHierarchyMutationEvent event) {
        if (event.designationId() == null || event.roleName() == null) {
            return;
        }
        String roleId = buildRoleId(event.designationId(), event.roleName());
        rolePermissionsRepository.findById(roleId).ifPresent(entity -> {
            rolePermissionsRepository.delete(entity);
            eventPublisher.publishEvent(new RolePermissionsUpdatedEvent(roleId, SYSTEM_ACTOR, Instant.now()));
            log.info("Removed RolePermissions for deleted roleId={}", roleId);
        });
    }

    private void handleDesignationDeleted(RoleHierarchyMutationEvent event) {
        if (event.designationId() == null || event.designationId().isBlank()) {
            return;
        }
        List<RolePermissions> matching = rolePermissionsRepository.findAll().stream()
                .filter(rp -> event.designationId().equals(rp.getDesignationId()))
                .toList();
        if (matching.isEmpty()) {
            return;
        }
        rolePermissionsRepository.deleteAll(matching);
        for (RolePermissions rp : matching) {
            eventPublisher.publishEvent(new RolePermissionsUpdatedEvent(rp.getRoleId(), SYSTEM_ACTOR, Instant.now()));
        }
        log.info("Removed {} RolePermissions records for deleted designationId={}", matching.size(), event.designationId());
    }

    private int resolveRankWeight(String designationId, String roleName) {
        List<MatrixCell> cells = matrixCellRepository.findAllByDesignationId(designationId);
        for (MatrixCell cell : cells) {
            if (cell.getRoleName() != null && cell.getRoleName().equalsIgnoreCase(roleName)) {
                return cell.getRankWeight() != null ? cell.getRankWeight() : 0;
            }
        }
        return 0;
    }

    private String buildRoleId(String designationId, String roleName) {
        return designationId + ":" + roleName;
    }
}
