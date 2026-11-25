// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.repository;

import com.rednecksgaming.personnel.perms.domain.RolePermissions;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RolePermissionsRepository extends JpaRepository<RolePermissions, String> {

    @Query("SELECT rp FROM RolePermissions rp WHERE rp.roleId IN :roleIds")
    List<RolePermissions> findAllByRoleIdIn(@Param("roleIds") Collection<String> roleIds);

    List<RolePermissions> findAll(Sort sort);

    Optional<RolePermissions> findByDesignationIdAndRoleName(String designationId, String roleName);

    List<RolePermissions> findByDesignationId(String designationId);

    void deleteByDesignationIdAndRoleName(String designationId, String roleName);

    void deleteByDesignationId(String designationId);
}
