// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.mapper;

import com.rednecksgaming.personnel.perms.domain.RolePermissions;
import com.rednecksgaming.personnel.perms.dto.PermsFileDto;
import com.rednecksgaming.personnel.perms.dto.PreviewRoleOptionDto;
import com.rednecksgaming.personnel.perms.dto.RolePermissionsDto;
import com.rednecksgaming.personnel.perms.service.PermsTextFormatter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RolePermissionsMapperTest {

    private final PermsTextFormatter formatter = new PermsTextFormatter();
    private final RolePermissionsMapper mapper = new RolePermissionsMapper(formatter);

    @Test
    @DisplayName("Maps RolePermissions entity to RolePermissionsDto with formatted labels and designation fallback")
    void shouldMapEntityToDtoWithLabels() {
        RolePermissions entity = new RolePermissions(
                "des_supreme:High Command",
                "des_supreme",
                "High Command",
                8,
                Map.of(
                        "dashboard.servers", Map.of(
                                "enabled", true,
                                "dashboard.servers.[serverId]", Map.of(
                                        "rednecks-gaming", Map.of("enabled", true)
                                )
                        )
                ),
                "admin@rng.gg"
        );
        entity.setVersion(3L);
        Instant now = Instant.parse("2026-11-25T10:00:00Z");
        entity.setUpdatedAt(now);

        RolePermissionsDto dto = mapper.toDto(
                entity,
                Map.of("des_supreme", "Supreme"),
                Map.of("rednecks-gaming", "Rednecks Gaming Hub")
        );

        assertThat(dto).isNotNull();
        assertThat(dto.roleId()).isEqualTo("des_supreme:High Command");
        assertThat(dto.designationName()).isEqualTo("Supreme");
        assertThat(dto.rankCode()).isEqualTo("R8");
        assertThat(dto.version()).isEqualTo(3L);
        assertThat(dto.updatedAt()).isEqualTo(now);
        assertThat(dto.labels()).containsEntry("rednecks-gaming", "Rednecks Gaming Hub");
        assertThat(dto.labels()).containsEntry("dashboard.servers", "Dashboard : Servers");
        assertThat(mapper.toDto(null)).isNull();
    }

    @Test
    @DisplayName("Maps RolePermissions entity to PermsFileDto and PreviewRoleOptionDto")
    void shouldMapEntityToFileAndPreviewOptionDtos() {
        RolePermissions entity = new RolePermissions(
                "des_tech:Minister",
                "des_tech",
                "Minister",
                5,
                Map.of("dashboard", Map.of("enabled", true)),
                "operator@rng.gg"
        );
        entity.setVersion(1L);

        PermsFileDto fileDto = mapper.toFileDto(
                entity,
                Map.of("dashboard", Map.of("enabled", true)),
                Map.of("des_tech", "Ministry of Tech")
        );
        assertThat(fileDto).isNotNull();
        assertThat(fileDto.id()).isEqualTo("des_tech:Minister");
        assertThat(fileDto.fileName()).isEqualTo("Minister.json");
        assertThat(fileDto.rankCode()).isEqualTo("R5");
        assertThat(fileDto.schema().title()).isEqualTo("(Personnel) (Permission System)");
        assertThat(fileDto.schema().metadata().designationName()).isEqualTo("Ministry of Tech");

        PreviewRoleOptionDto previewDto = mapper.toPreviewOptionDto(entity, Map.of("des_tech", "Ministry of Tech"));
        assertThat(previewDto).isNotNull();
        assertThat(previewDto.roleId()).isEqualTo("des_tech:Minister");
        assertThat(previewDto.rankWeight()).isEqualTo(5);
        assertThat(mapper.toPreviewOptionDto(null, Map.of())).isNull();
    }
}
