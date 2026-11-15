// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RoleHierarchyFlywayMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void should_have_matrix_and_designation_tables_created() {
        Integer rankCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM matrix_ranks", Integer.class);
        Integer desCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM matrix_designations", Integer.class);
        Integer cellCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM matrix_cells", Integer.class);
        Integer roleCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM designation_roles", Integer.class);

        assertThat(rankCount).isGreaterThanOrEqualTo(10);
        assertThat(desCount).isGreaterThanOrEqualTo(8);
        assertThat(cellCount).isGreaterThanOrEqualTo(20);
        assertThat(roleCount).isGreaterThanOrEqualTo(20);
    }
}
