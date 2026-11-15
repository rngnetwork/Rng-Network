// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.repository;

import com.rednecksgaming.personnel.roles.domain.DesignationRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DesignationRoleRepository extends JpaRepository<DesignationRole, Long> {

    List<DesignationRole> findAllByOrderByDesignationNameAscRoleNameAsc();

    List<DesignationRole> findAllByDesignationId(String designationId);

    Optional<DesignationRole> findByDesignationIdAndRoleName(String designationId, String roleName);

    boolean existsByDesignationIdAndRoleName(String designationId, String roleName);

    void deleteByDesignationId(String designationId);

    void deleteByDesignationIdAndRoleName(String designationId, String roleName);

    void deleteByRoleName(String roleName);
}
