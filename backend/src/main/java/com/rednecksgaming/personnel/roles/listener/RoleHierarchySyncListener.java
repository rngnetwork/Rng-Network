// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.listener;

import com.rednecksgaming.personnel.roles.event.RoleHierarchyMutationEvent;
import com.rednecksgaming.personnel.roles.service.DesignationRoleService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class RoleHierarchySyncListener {

    private final DesignationRoleService designationRoleService;

    public RoleHierarchySyncListener(DesignationRoleService designationRoleService) {
        this.designationRoleService = designationRoleService;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onHierarchyMutation(RoleHierarchyMutationEvent event) {
        switch (event.type()) {
            case ROLE_ADDED -> designationRoleService.ensureRoleExists(event.designationId(), event.designationName(), event.roleName());
            case ROLE_UPDATED -> designationRoleService.updateRoleName(event.designationId(), event.oldRoleName(), event.roleName());
            case ROLE_DELETED -> designationRoleService.removeRole(event.designationId(), event.roleName());
            case DESIGNATION_DELETED -> designationRoleService.removeDesignation(event.designationId());
            case DESIGNATION_UPDATED -> designationRoleService.updateDesignationName(event.designationId(), event.designationName());
        }
    }
}
