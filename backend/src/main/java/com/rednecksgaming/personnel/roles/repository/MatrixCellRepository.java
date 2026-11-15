// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.repository;

import com.rednecksgaming.personnel.roles.domain.MatrixCell;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatrixCellRepository extends JpaRepository<MatrixCell, Long> {

    Optional<MatrixCell> findByRankWeightAndDesignationId(Integer rankWeight, String designationId);

    List<MatrixCell> findAllByRankWeight(Integer rankWeight);

    List<MatrixCell> findAllByDesignationId(String designationId);

    boolean existsByRankWeightAndDesignationIdAndRoleName(Integer rankWeight, String designationId, String roleName);

    boolean existsByRoleName(String roleName);

    void deleteByRankWeightAndDesignationId(Integer rankWeight, String designationId);

    void deleteByDesignationId(String designationId);

    void deleteByRankWeight(Integer rankWeight);
}
