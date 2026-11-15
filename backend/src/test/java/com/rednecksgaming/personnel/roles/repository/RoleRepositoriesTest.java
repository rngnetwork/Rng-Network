// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.repository;

import com.rednecksgaming.personnel.roles.domain.DesignationRole;
import com.rednecksgaming.personnel.roles.domain.MatrixCell;
import com.rednecksgaming.personnel.roles.domain.MatrixDesignation;
import com.rednecksgaming.personnel.roles.domain.MatrixRank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RoleRepositoriesTest {

    @Autowired
    private MatrixRankRepository rankRepository;

    @Autowired
    private MatrixDesignationRepository designationRepository;

    @Autowired
    private MatrixCellRepository cellRepository;

    @Autowired
    private DesignationRoleRepository designationRoleRepository;

    @BeforeEach
    void setUp() {
        cellRepository.deleteAll();
        designationRoleRepository.deleteAll();
        designationRepository.deleteAll();
        rankRepository.deleteAll();

        rankRepository.save(new MatrixRank(1, "R1"));
        rankRepository.save(new MatrixRank(2, "R2"));
        rankRepository.save(new MatrixRank(9, "R9"));

        designationRepository.save(new MatrixDesignation("des_supreme", "Supreme", 0));
        designationRepository.save(new MatrixDesignation("des_chancellory", "Chancellory", 1));
        designationRepository.save(new MatrixDesignation("des_tech", "Ministry of Tech", 2));
    }

    @Test
    @DisplayName("MatrixRankRepository should find ranks ordered by weight ascending")
    void testRankRepository() {
        List<MatrixRank> ranks = rankRepository.findAllByOrderByWeightAsc();
        assertThat(ranks).hasSize(3);
        assertThat(ranks).isSortedAccordingTo((r1, r2) -> Integer.compare(r1.getWeight(), r2.getWeight()));

        Optional<MatrixRank> r1 = rankRepository.findByCode("R1");
        assertThat(r1).isPresent();
        assertThat(r1.get().getWeight()).isEqualTo(1);

        assertThat(rankRepository.existsByCode("R1")).isTrue();
        assertThat(rankRepository.existsByCode("NON_EXISTENT")).isFalse();
    }

    @Test
    @DisplayName("MatrixDesignationRepository should find designations ordered by position ascending")
    void testDesignationRepository() {
        List<MatrixDesignation> designations = designationRepository.findAllByOrderByPositionAsc();
        assertThat(designations).hasSize(3);

        Optional<MatrixDesignation> supreme = designationRepository.findById("des_supreme");
        assertThat(supreme).isPresent();
        assertThat(supreme.get().getName()).isEqualTo("Supreme");

        Optional<MatrixDesignation> byName = designationRepository.findByName("Supreme");
        assertThat(byName).isPresent();
        assertThat(byName.get().getId()).isEqualTo("des_supreme");

        assertThat(designationRepository.existsByName("Supreme")).isTrue();
        assertThat(designationRepository.existsByName("NonExistent")).isFalse();
    }

    @Test
    @DisplayName("MatrixCellRepository should support CRUD, coordinate queries, and batch deletions")
    void testMatrixCellRepository() {
        MatrixCell cell = new MatrixCell(1, "des_chancellory", "Chancellor of Test");
        MatrixCell saved = cellRepository.save(cell);
        assertThat(saved.getId()).isNotNull();

        Optional<MatrixCell> found = cellRepository.findByRankWeightAndDesignationId(1, "des_chancellory");
        assertThat(found).isPresent();
        assertThat(found.get().getRoleName()).isEqualTo("Chancellor of Test");

        List<MatrixCell> byRank = cellRepository.findAllByRankWeight(1);
        assertThat(byRank).extracting(MatrixCell::getRoleName).contains("Chancellor of Test");

        List<MatrixCell> byDes = cellRepository.findAllByDesignationId("des_chancellory");
        assertThat(byDes).extracting(MatrixCell::getRoleName).contains("Chancellor of Test");

        cellRepository.deleteByRankWeightAndDesignationId(1, "des_chancellory");
        Optional<MatrixCell> afterDelete = cellRepository.findByRankWeightAndDesignationId(1, "des_chancellory");
        assertThat(afterDelete).isEmpty();

        cellRepository.save(new MatrixCell(1, "des_chancellory", "Test 1"));
        cellRepository.save(new MatrixCell(2, "des_chancellory", "Test 2"));
        cellRepository.deleteByDesignationId("des_chancellory");
        assertThat(cellRepository.findAllByDesignationId("des_chancellory")).isEmpty();

        cellRepository.save(new MatrixCell(9, "des_supreme", "Supreme Leader"));
        cellRepository.deleteByRankWeight(9);
        assertThat(cellRepository.findAllByRankWeight(9)).isEmpty();
    }

    @Test
    @DisplayName("DesignationRoleRepository should support CRUD, ordering, existence checks, and deletion")
    void testDesignationRoleRepository() {
        DesignationRole role = new DesignationRole("des_tech", "Ministry of Tech", "Senior Dev");
        DesignationRole saved = designationRoleRepository.save(role);
        assertThat(saved.getId()).isNotNull();

        boolean exists = designationRoleRepository.existsByDesignationIdAndRoleName("des_tech", "Senior Dev");
        assertThat(exists).isTrue();

        Optional<DesignationRole> found = designationRoleRepository.findByDesignationIdAndRoleName("des_tech", "Senior Dev");
        assertThat(found).isPresent();
        assertThat(found.get().getDesignationName()).isEqualTo("Ministry of Tech");

        List<DesignationRole> byDes = designationRoleRepository.findAllByDesignationId("des_tech");
        assertThat(byDes).isNotEmpty();

        List<DesignationRole> allSorted = designationRoleRepository.findAllByOrderByDesignationNameAscRoleNameAsc();
        assertThat(allSorted).isNotEmpty();

        designationRoleRepository.deleteByDesignationIdAndRoleName("des_tech", "Senior Dev");
        assertThat(designationRoleRepository.existsByDesignationIdAndRoleName("des_tech", "Senior Dev")).isFalse();

        designationRoleRepository.save(new DesignationRole("des_tech", "Ministry of Tech", "Junior Dev"));
        designationRoleRepository.deleteByRoleName("Junior Dev");
        assertThat(designationRoleRepository.findByDesignationIdAndRoleName("des_tech", "Junior Dev")).isEmpty();

        designationRoleRepository.save(new DesignationRole("des_tech", "Ministry of Tech", "Intern"));
        designationRoleRepository.deleteByDesignationId("des_tech");
        assertThat(designationRoleRepository.findAllByDesignationId("des_tech")).isEmpty();
    }
}
