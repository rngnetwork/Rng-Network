// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.mapper;

import com.rednecksgaming.personnel.roles.domain.DesignationRole;
import com.rednecksgaming.personnel.roles.domain.MatrixCell;
import com.rednecksgaming.personnel.roles.domain.MatrixDesignation;
import com.rednecksgaming.personnel.roles.domain.MatrixRank;
import com.rednecksgaming.personnel.roles.dto.DesignationRolesItemDto;
import com.rednecksgaming.personnel.roles.dto.DesignationRolesResponse;
import com.rednecksgaming.personnel.roles.dto.MatrixDesignationDto;
import com.rednecksgaming.personnel.roles.dto.MatrixRankDto;
import com.rednecksgaming.personnel.roles.dto.PopoverRoleDto;
import com.rednecksgaming.personnel.roles.dto.RoleHierarchyMatrixDto;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class RoleHierarchyMapper {

    public RoleHierarchyMatrixDto toMatrixDto(
            List<MatrixRank> ranks,
            List<MatrixDesignation> designations,
            List<MatrixCell> cells
    ) {
        List<MatrixRankDto> rankDtos = ranks.stream()
                .map(r -> new MatrixRankDto(r.getWeight(), r.getCode()))
                .toList();

        List<MatrixDesignationDto> desDtos = designations.stream()
                .map(d -> new MatrixDesignationDto(d.getId(), d.getName()))
                .toList();

        Map<String, List<PopoverRoleDto>> cellMap = cells.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getRankWeight() + "_" + c.getDesignationId(),
                        LinkedHashMap::new,
                        Collectors.mapping(c -> new PopoverRoleDto(String.valueOf(c.getId()), c.getRoleName()), Collectors.toList())
                ));

        return new RoleHierarchyMatrixDto(rankDtos, desDtos, cellMap);
    }

    public DesignationRolesResponse toDesignationRolesResponse(List<DesignationRole> records) {
        Map<String, List<DesignationRole>> grouped = records.stream()
                .collect(Collectors.groupingBy(DesignationRole::getDesignationId, LinkedHashMap::new, Collectors.toList()));

        List<DesignationRolesItemDto> items = grouped.entrySet().stream()
                .map(entry -> {
                    String id = entry.getKey();
                    String name = entry.getValue().get(0).getDesignationName();
                    List<String> roles = entry.getValue().stream()
                            .map(DesignationRole::getRoleName)
                            .sorted()
                            .toList();
                    return new DesignationRolesItemDto(id, name, roles);
                })
                .toList();

        return new DesignationRolesResponse(items);
    }
}
