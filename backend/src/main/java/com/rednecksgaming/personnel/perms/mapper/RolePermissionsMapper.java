// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.mapper;

import com.rednecksgaming.personnel.perms.domain.RolePermissions;
import com.rednecksgaming.personnel.perms.dto.PermsFileDto;
import com.rednecksgaming.personnel.perms.dto.PermsRoleSchemaDto;
import com.rednecksgaming.personnel.perms.dto.PreviewRoleOptionDto;
import com.rednecksgaming.personnel.perms.dto.RolePermissionsDto;
import com.rednecksgaming.personnel.perms.dto.RolePermissionsMetadataDto;
import com.rednecksgaming.personnel.perms.service.PermsTextFormatter;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Maps {@link RolePermissions} JPA entities into backend-formatted DTOs and explorer file schemas.
 */
@Component
public class RolePermissionsMapper {

    private static final String SCHEMA_TITLE = "(Personnel) (Permission System)";

    private final PermsTextFormatter textFormatter;

    public RolePermissionsMapper(PermsTextFormatter textFormatter) {
        this.textFormatter = textFormatter;
    }

    /**
     * Converts a {@link RolePermissions} entity into a {@link RolePermissionsDto} with formatted labels.
     *
     * @param entity               persisted role permissions entity
     * @param designationNamesById lookup map of designation ID to display name
     * @param serverNamesBySlug    lookup map of server slug to managed guild name
     * @return mapped DTO or {@code null} when input entity is null
     */
    public RolePermissionsDto toDto(
            RolePermissions entity,
            Map<String, String> designationNamesById,
            Map<String, String> serverNamesBySlug
    ) {
        if (entity == null) {
            return null;
        }
        String designationName = resolveDesignationName(entity.getDesignationId(), designationNamesById);
        int weight = entity.getRankWeight() != null ? entity.getRankWeight() : 0;
        Map<String, Object> permissions = entity.getPermissions() != null ? entity.getPermissions() : Map.of();
        Map<String, String> labels = textFormatter.extractLabels(permissions, serverNamesBySlug);

        return new RolePermissionsDto(
                entity.getRoleId(),
                entity.getDesignationId(),
                designationName,
                entity.getRoleName(),
                weight,
                textFormatter.toRankCode(weight),
                permissions,
                labels,
                entity.getVersion(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Convenience overload converting an entity without external designation or server display maps.
     *
     * @param entity persisted role permissions entity
     * @return mapped DTO or {@code null} when input entity is null
     */
    public RolePermissionsDto toDto(RolePermissions entity) {
        return toDto(entity, Map.of(), Map.of());
    }

    /**
     * Builds an explorer {@link PermsFileDto} with normalized schema metadata for the UI editor.
     *
     * @param entity               persisted role permissions entity
     * @param normalizedPerms      normalized permission tree including active managed servers
     * @param designationNamesById lookup map of designation ID to display name
     * @return explorer file entry or {@code null} when input entity is null
     */
    public PermsFileDto toFileDto(
            RolePermissions entity,
            Map<String, Object> normalizedPerms,
            Map<String, String> designationNamesById
    ) {
        if (entity == null) {
            return null;
        }
        String designationName = resolveDesignationName(entity.getDesignationId(), designationNamesById);
        int weight = entity.getRankWeight() != null ? entity.getRankWeight() : 0;
        String rankCode = textFormatter.toRankCode(weight);

        RolePermissionsMetadataDto metadata = new RolePermissionsMetadataDto(
                entity.getRoleName(),
                entity.getDesignationId(),
                designationName,
                rankCode,
                weight,
                entity.getVersion(),
                entity.getUpdatedAt(),
                entity.getUpdatedBy()
        );

        PermsRoleSchemaDto schema = new PermsRoleSchemaDto(
                SCHEMA_TITLE,
                metadata,
                normalizedPerms != null ? normalizedPerms : Map.of()
        );

        return new PermsFileDto(
                entity.getRoleId(),
                entity.getRoleName(),
                textFormatter.toRoleFileName(entity.getRoleName()),
                entity.getDesignationId(),
                designationName,
                weight,
                rankCode,
                schema
        );
    }

    /**
     * Converts a {@link RolePermissions} entity into a {@link PreviewRoleOptionDto} for R9/R8 preview switching.
     *
     * @param entity               persisted role permissions entity
     * @param designationNamesById lookup map of designation ID to display name
     * @return preview option DTO or {@code null} when input entity is null
     */
    public PreviewRoleOptionDto toPreviewOptionDto(
            RolePermissions entity,
            Map<String, String> designationNamesById
    ) {
        if (entity == null) {
            return null;
        }
        int weight = entity.getRankWeight() != null ? entity.getRankWeight() : 0;
        return new PreviewRoleOptionDto(
                entity.getRoleId(),
                entity.getDesignationId(),
                resolveDesignationName(entity.getDesignationId(), designationNamesById),
                entity.getRoleName(),
                weight,
                textFormatter.toRankCode(weight)
        );
    }

    private String resolveDesignationName(String designationId, Map<String, String> designationNamesById) {
        if (designationNamesById != null && designationId != null) {
            String resolved = designationNamesById.get(designationId);
            if (resolved != null && !resolved.isBlank()) {
                return resolved;
            }
        }
        return designationId != null ? designationId : "";
    }
}
