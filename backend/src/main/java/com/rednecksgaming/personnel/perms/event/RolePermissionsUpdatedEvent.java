// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.event;

import java.time.Instant;

/**
 * Domain event published when a role's permission matrix is created, updated, reset, or deleted.
 */
public record RolePermissionsUpdatedEvent(
        String roleId,
        String operatorEmail,
        Instant timestamp
) {
}
