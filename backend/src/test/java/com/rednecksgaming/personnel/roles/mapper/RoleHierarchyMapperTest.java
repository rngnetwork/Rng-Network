// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.mapper;

import com.rednecksgaming.personnel.roles.domain.DesignationRole;
import com.rednecksgaming.personnel.roles.domain.MatrixCell;
import com.rednecksgaming.personnel.roles.domain.MatrixDesignation;
import com.rednecksgaming.personnel.roles.domain.MatrixRank;
import com.rednecksgaming.personnel.roles.dto.DesignationRolesResponse;
import com.rednecksgaming.personnel.roles.dto.RoleHierarchyMatrixDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RoleHierarchyMapperTest {

    private final RoleHierarchyMapper mapper = new RoleHierarchyMapper();

    @Test
    @DisplayName("RoleHierarchyMapper should map ranks, designations, and cells to matrix DTO")
    void should_map_entities_to_matrix_dto() {
        List<MatrixRank> ranks = List.of(new MatrixRank(9, "R9"));
        List<MatrixDesignation> desList = List.of(new MatrixDesignation("des_tech", "Ministry of Tech", 1));
        List<MatrixCell> cells = List.of(new MatrixCell(9, "des_tech", "Lead Architect"));

        RoleHierarchyMatrixDto dto = mapper.toMatrixDto(ranks, desList, cells);

        assertThat(dto.ranks()).hasSize(1);
        assertThat(dto.ranks().get(0).weight()).isEqualTo(9);
        assertThat(dto.ranks().get(0).code()).isEqualTo("R9");
        assertThat(dto.designations()).hasSize(1);
        assertThat(dto.designations().get(0).id()).isEqualTo("des_tech");
        assertThat(dto.designations().get(0).name()).isEqualTo("Ministry of Tech");
        assertThat(dto.cells()).containsKey("9_des_tech");
        assertThat(dto.cells().get("9_des_tech")).extracting("name").containsExactly("Lead Architect");
    }

    @Test
    @DisplayName("RoleHierarchyMapper should map designation role records into grouped response DTO")
    void should_map_entities_to_designation_roles_response() {
        List<DesignationRole> records = List.of(
                new DesignationRole("des_tech", "Ministry of Tech", "Senior Dev"),
                new DesignationRole("des_tech", "Ministry of Tech", "Junior Dev")
        );

        DesignationRolesResponse response = mapper.toDesignationRolesResponse(records);

        assertThat(response.designations()).hasSize(1);
        assertThat(response.designations().get(0).id()).isEqualTo("des_tech");
        assertThat(response.designations().get(0).name()).isEqualTo("Ministry of Tech");
        assertThat(response.designations().get(0).roles()).containsExactly("Junior Dev", "Senior Dev");
    }
}
