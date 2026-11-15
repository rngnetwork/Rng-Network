// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.repository;

import com.rednecksgaming.personnel.roles.domain.MatrixDesignation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatrixDesignationRepository extends JpaRepository<MatrixDesignation, String> {

    List<MatrixDesignation> findAllByOrderByPositionAsc();

    Optional<MatrixDesignation> findByName(String name);

    boolean existsByName(String name);
}
