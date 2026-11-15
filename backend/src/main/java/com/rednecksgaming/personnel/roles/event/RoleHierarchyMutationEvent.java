// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.event;

public record RoleHierarchyMutationEvent(
        RoleHierarchyMutationEventType type,
        String designationId,
        String designationName,
        String roleName,
        String oldRoleName
) {}
