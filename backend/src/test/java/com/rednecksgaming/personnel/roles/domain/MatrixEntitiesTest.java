// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MatrixEntitiesTest {

    @Test
    void should_create_matrix_rank() {
        MatrixRank rank = new MatrixRank(9, "R9");
        assertThat(rank.getWeight()).isEqualTo(9);
        assertThat(rank.getCode()).isEqualTo("R9");
        assertThat(rank.getCreatedAt()).isNotNull();
        assertThat(rank.getUpdatedAt()).isNotNull();
    }

    @Test
    void should_create_matrix_designation() {
        MatrixDesignation des = new MatrixDesignation("des_tech", "Ministry of Tech", 5);
        assertThat(des.getId()).isEqualTo("des_tech");
        assertThat(des.getName()).isEqualTo("Ministry of Tech");
        assertThat(des.getPosition()).isEqualTo(5);
    }

    @Test
    void should_create_matrix_cell() {
        MatrixCell cell = new MatrixCell(9, "des_supreme", "Chief High Command");
        assertThat(cell.getRankWeight()).isEqualTo(9);
        assertThat(cell.getDesignationId()).isEqualTo("des_supreme");
        assertThat(cell.getRoleName()).isEqualTo("Chief High Command");
        assertThat(cell.getCreatedAt()).isNotNull();
    }

    @Test
    void should_create_designation_role() {
        DesignationRole dr = new DesignationRole("des_tech", "Ministry of Tech", "Senior Dev");
        assertThat(dr.getDesignationId()).isEqualTo("des_tech");
        assertThat(dr.getDesignationName()).isEqualTo("Ministry of Tech");
        assertThat(dr.getRoleName()).isEqualTo("Senior Dev");
        assertThat(dr.getCreatedAt()).isNotNull();
    }
}
