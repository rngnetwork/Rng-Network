// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.roles.controller;

import com.rednecksgaming.personnel.roles.dto.*;
import com.rednecksgaming.personnel.roles.service.DesignationRoleService;
import com.rednecksgaming.personnel.roles.service.RoleMatrixService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/personnel/hierarchy")
@Validated
public class RoleHierarchyController {

    private final RoleMatrixService matrixService;
    private final DesignationRoleService designationRoleService;

    public RoleHierarchyController(RoleMatrixService matrixService, DesignationRoleService designationRoleService) {
        this.matrixService = matrixService;
        this.designationRoleService = designationRoleService;
    }

    @GetMapping("/matrix")
    public ResponseEntity<Map<String, Object>> getMatrix() {
        return ResponseEntity.ok(Map.of("success", true, "data", matrixService.getFullMatrix()));
    }

    @PostMapping("/matrix/roles")
    public ResponseEntity<Map<String, Object>> addRole(
            @Valid @RequestBody AddRoleRequest req,
            Authentication authentication
    ) {
        assertChiefHighCommandIfRank9(authentication, req.rankWeight());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "data", matrixService.addRole(req)));
    }

    @PatchMapping("/matrix/roles/{roleId}")
    public ResponseEntity<Map<String, Object>> updateRole(
            @PathVariable @Positive Long roleId,
            @Valid @RequestBody UpdateRoleRequest req
    ) {
        return ResponseEntity.ok(Map.of("success", true, "data", matrixService.updateRole(roleId, req.name())));
    }

    @DeleteMapping("/matrix/roles/{roleId}")
    public ResponseEntity<Map<String, Object>> deleteRole(@PathVariable @Positive Long roleId) {
        return ResponseEntity.ok(Map.of("success", true, "data", matrixService.deleteRole(roleId)));
    }

    @PostMapping("/matrix/designations")
    public ResponseEntity<Map<String, Object>> addDesignation(@Valid @RequestBody AddDesignationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "data", matrixService.addDesignation(req)));
    }

    @PatchMapping("/matrix/designations/{designationId}")
    public ResponseEntity<Map<String, Object>> updateDesignation(
            @PathVariable @Pattern(regexp = "^[a-z0-9_-]+$") String designationId,
            @Valid @RequestBody UpdateDesignationRequest req
    ) {
        return ResponseEntity.ok(Map.of("success", true, "data", matrixService.updateDesignation(designationId, req)));
    }

    @DeleteMapping("/matrix/designations/{designationId}")
    public ResponseEntity<Map<String, Object>> deleteDesignation(
            @PathVariable @Pattern(regexp = "^[a-z0-9_-]+$") String designationId
    ) {
        return ResponseEntity.ok(Map.of("success", true, "data", matrixService.deleteDesignation(designationId)));
    }

    @PostMapping("/matrix/ranks")
    public ResponseEntity<Map<String, Object>> addRank(
            @Valid @RequestBody AddRankRequest req,
            Authentication authentication
    ) {
        assertChiefHighCommandIfRank9(authentication, req.weight());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "data", matrixService.addRank(req)));
    }

    @PatchMapping("/matrix/ranks/{rankWeight}")
    public ResponseEntity<Map<String, Object>> updateRank(
            @PathVariable @Min(0) @Max(100) Integer rankWeight,
            @Valid @RequestBody UpdateRankRequest req,
            Authentication authentication
    ) {
        assertChiefHighCommandIfRank9(authentication, rankWeight);
        assertChiefHighCommandIfRank9(authentication, req.weight());
        return ResponseEntity.ok(Map.of("success", true, "data", matrixService.updateRank(rankWeight, req)));
    }

    @DeleteMapping("/matrix/ranks/{rankWeight}")
    public ResponseEntity<Map<String, Object>> deleteRank(
            @PathVariable @Min(0) @Max(100) Integer rankWeight,
            Authentication authentication
    ) {
        assertChiefHighCommandIfRank9(authentication, rankWeight);
        return ResponseEntity.ok(Map.of("success", true, "data", matrixService.deleteRank(rankWeight)));
    }

    @GetMapping("/designation-roles")
    public ResponseEntity<Map<String, Object>> getDesignationRoles() {
        return ResponseEntity.ok(Map.of("success", true, "data", designationRoleService.getDesignationRoles()));
    }

    private void assertChiefHighCommandIfRank9(Authentication authentication, Integer rankWeight) {
        if (rankWeight != null && rankWeight == 9) {
            boolean isChief = authentication != null && authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_CHIEF_HIGH_COMMAND"));
            if (!isChief) {
                throw new AccessDeniedException("Insufficient hierarchical clearance: Mutating Rank 9 requires ROLE_CHIEF_HIGH_COMMAND");
            }
        }
    }
}
