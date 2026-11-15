// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.service;

import com.rednecksgaming.personnel.roles.dto.DesignationRolesResponse;

import java.util.List;
import java.util.Map;

public interface DesignationRoleService {

    DesignationRolesResponse getDesignationRoles();

    Map<String, List<String>> getDesignationRolesMap();

    List<String> getAllDesignations();

    List<String> getRolesForDesignation(String designation);

    boolean isValidDesignation(String designation);

    boolean isValidRoleForDesignation(String designationId, String roleName);

    void ensureRoleExists(String designationId, String designationName, String roleName);

    void updateRoleName(String designationId, String oldRoleName, String newRoleName);

    void updateDesignationName(String designationId, String newDesignationName);

    void removeRole(String designationId, String roleName);

    void removeDesignation(String designationId);
}
