// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.repository;

import com.rednecksgaming.personnel.roles.domain.MatrixRank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatrixRankRepository extends JpaRepository<MatrixRank, Integer> {

    List<MatrixRank> findAllByOrderByWeightAsc();

    List<MatrixRank> findAllByOrderByWeightDesc();

    Optional<MatrixRank> findByCode(String code);

    boolean existsByCode(String code);
}
