// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PermsTextFormatterTest {

    private final PermsTextFormatter formatter = new PermsTextFormatter();

    @Test
    @DisplayName("Formats dotted permission routes, SERVERID token, perms alias, and acronyms")
    void shouldFormatDottedKeysAndTokens() {
        assertThat(formatter.formatPermKey(null)).isEmpty();
        assertThat(formatter.formatPermKey("   ")).isEmpty();
        assertThat(formatter.formatPermKey("dashboard")).isEqualTo("Dashboard");
        assertThat(formatter.formatPermKey("dashboard.personnel.perms"))
                .isEqualTo("Dashboard : Personnel : Permissions");
        assertThat(formatter.formatPermKey("dashboard.servers.[serverId]"))
                .isEqualTo("Dashboard : Servers : SERVERID");
        assertThat(formatter.formatPermKey("[serverid]")).isEqualTo("SERVERID");
        assertThat(formatter.formatPermKey("fullAccess")).isEqualTo("Full Access");
        assertThat(formatter.formatPermKey("myURLParser")).isEqualTo("My URL Parser");
        assertThat(formatter.formatPermKey("role_id")).isEqualTo("Role ID");
        assertThat(formatter.formatPermKey("MOIA_LOA")).isEqualTo("MOIA LOA");
        assertThat(formatter.formatPermKey("rednecks-gaming")).isEqualTo("Rednecks Gaming");
    }

    @Test
    @DisplayName("Extracts flat label lookup map and resolves guild display names for server slugs")
    void shouldExtractLabelsWithServerDisplayNames() {
        Map<String, Object> serverDetails = Map.of(
                "enabled", true,
                "botconfig", false
        );
        Map<String, Object> serversNode = new LinkedHashMap<>();
        serversNode.put("rednecks-gaming", serverDetails);
        serversNode.put("unmapped-guild", Map.of("enabled", true));

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("dashboard.servers", Map.of(
                "enabled", true,
                "dashboard.servers.[serverId]", serversNode
        ));
        root.put("dashboard.whitelist", Map.of("enabled", true, "fullAccess", false));

        Map<String, String> labels = formatter.extractLabels(
                root,
                Map.of("rednecks-gaming", "Rednecks Official HQ")
        );

        assertThat(labels).containsEntry("dashboard.servers", "Dashboard : Servers");
        assertThat(labels).containsEntry("dashboard.servers.[serverId]", "Dashboard : Servers : SERVERID");
        assertThat(labels).containsEntry("rednecks-gaming", "Rednecks Official HQ");
        assertThat(labels).containsEntry("unmapped-guild", "Unmapped Guild");
        assertThat(labels).containsEntry("fullAccess", "Full Access");
        assertThat(labels).containsEntry("botconfig", "Botconfig");
    }

    @Test
    @DisplayName("Formats role filename and rank code consistently")
    void shouldFormatRoleFilenameAndRankCode() {
        assertThat(formatter.toRoleFileName("Chief High Command")).isEqualTo("Chief High Command.json");
        assertThat(formatter.toRoleFileName(" ")).isEqualTo("role.json");
        assertThat(formatter.toRankCode(9)).isEqualTo("R9");
        assertThat(formatter.toRankCode(0)).isEqualTo("R0");
        assertThat(formatter.toRankCode(null)).isEqualTo("R0");
    }
}
