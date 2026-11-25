// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RolePermissionsFlywayTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Flyway V9 seeds all 28 canonical roles matching designation_roles")
    void shouldSeedAll28CanonicalRolesInRolePermissions() {
        Integer permCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM role_permissions", Integer.class);
        Integer desRoleCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM designation_roles", Integer.class);

        assertThat(permCount).isEqualTo(28);
        assertThat(permCount).isEqualTo(desRoleCount);
    }

    @Test
    @DisplayName("Flyway V9 seeds R9 and R8 with all permission flags enabled (true)")
    void shouldSeedSupremeR9AndR8AllTrue() throws Exception {
        List<String> supremePayloads = jdbcTemplate.queryForList(
                "SELECT permissions FROM role_permissions WHERE role_id IN ('des_supreme:Chief High Command', 'des_supreme:High Command')",
                String.class
        );

        assertThat(supremePayloads).hasSize(2);
        for (String json : supremePayloads) {
            Map<String, Object> tree = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            assertThat(extractBool(tree, "dashboard", "enabled")).isTrue();
            assertThat(extractBool(tree, "dashboard.servers", "enabled")).isTrue();
            assertThat(extractBool(tree, "dashboard.embeds", "enabled")).isTrue();
            assertThat(extractBool(tree, "dashboard.botconfig", "enabled")).isTrue();
            assertThat(extractBool(tree, "dashboard.personnel", "enabled")).isTrue();
            assertThat(extractBool(tree, "dashboard.personnel", "dashboard.personnel.roles", "enabled")).isTrue();
            assertThat(extractBool(tree, "dashboard.personnel", "dashboard.personnel.perms", "enabled")).isTrue();
            assertThat(extractBool(tree, "dashboard.whitelist", "enabled")).isTrue();
            assertThat(extractBool(tree, "dashboard.whitelist", "fullAccess")).isTrue();
            assertThat(extractBool(tree, "dashboard.account", "enabled")).isTrue();
        }
    }

    @Test
    @DisplayName("Flyway V9 seeds all R7-R0 roles (26 roles) with every permission flag disabled (false)")
    void shouldSeedR7ThroughR0AllFalse() throws Exception {
        List<String> subordinatePayloads = jdbcTemplate.queryForList(
                "SELECT permissions FROM role_permissions WHERE rank_weight < 8",
                String.class
        );

        assertThat(subordinatePayloads).hasSize(26);
        for (String json : subordinatePayloads) {
            Map<String, Object> tree = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            assertThat(extractBool(tree, "dashboard", "enabled")).isFalse();
            assertThat(extractBool(tree, "dashboard.servers", "enabled")).isFalse();
            assertThat(extractBool(tree, "dashboard.embeds", "enabled")).isFalse();
            assertThat(extractBool(tree, "dashboard.botconfig", "enabled")).isFalse();
            assertThat(extractBool(tree, "dashboard.personnel", "enabled")).isFalse();
            assertThat(extractBool(tree, "dashboard.personnel", "dashboard.personnel.roles", "enabled")).isFalse();
            assertThat(extractBool(tree, "dashboard.personnel", "dashboard.personnel.perms", "enabled")).isFalse();
            assertThat(extractBool(tree, "dashboard.whitelist", "enabled")).isFalse();
            assertThat(extractBool(tree, "dashboard.whitelist", "fullAccess")).isFalse();
            assertThat(extractBool(tree, "dashboard.account", "enabled")).isFalse();
        }
    }

    private boolean extractBool(Map<String, Object> root, String... path) {
        Object current = root;
        for (String segment : path) {
            if (!(current instanceof Map<?, ?> map)) {
                return false;
            }
            current = map.get(segment);
        }
        return Boolean.TRUE.equals(current);
    }
}
