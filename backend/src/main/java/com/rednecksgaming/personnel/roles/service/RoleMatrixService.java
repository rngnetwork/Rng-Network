// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.service;

import com.rednecksgaming.personnel.roles.dto.*;

public interface RoleMatrixService {

    RoleHierarchyMatrixDto getFullMatrix();

    RoleHierarchyMatrixDto addRole(AddRoleRequest req);

    RoleHierarchyMatrixDto updateRole(Long roleId, String newName);

    RoleHierarchyMatrixDto deleteRole(Long roleId);

    RoleHierarchyMatrixDto addDesignation(AddDesignationRequest req);

    RoleHierarchyMatrixDto updateDesignation(String designationId, UpdateDesignationRequest req);

    RoleHierarchyMatrixDto deleteDesignation(String designationId);

    RoleHierarchyMatrixDto addRank(AddRankRequest req);

    RoleHierarchyMatrixDto updateRank(Integer rankWeight, UpdateRankRequest req);

    RoleHierarchyMatrixDto deleteRank(Integer rankWeight);
}
