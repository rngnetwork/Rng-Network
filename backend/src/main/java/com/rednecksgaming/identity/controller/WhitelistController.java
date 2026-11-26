// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity.controller;

import com.rednecksgaming.common.dto.ApiResponse;
import com.rednecksgaming.identity.dto.UpdateWhitelistedUserRequest;
import com.rednecksgaming.identity.dto.WhitelistUserRequest;
import com.rednecksgaming.identity.dto.WhitelistedUserDto;
import com.rednecksgaming.identity.service.WhitelistService;
import com.rednecksgaming.personnel.roles.service.DesignationRoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/whitelist")
@RequiredArgsConstructor
public class WhitelistController {

    private final WhitelistService whitelistService;
    private final DesignationRoleService designationRoleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WhitelistedUserDto>>> getWhitelistedUsers(
            Authentication authentication,
            @RequestParam(value = "ministry", required = false) String ministry) {
        Long userId = (Long) authentication.getPrincipal();
        List<WhitelistedUserDto> users = whitelistService.getWhitelistedUsers(userId, ministry);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WhitelistedUserDto>> createWhitelistedUser(
            Authentication authentication,
            @Valid @RequestBody WhitelistUserRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        WhitelistedUserDto created = whitelistService.createWhitelistedUser(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "User successfully added to whitelist"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WhitelistedUserDto>> updateWhitelistedUser(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateWhitelistedUserRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        WhitelistedUserDto updated = whitelistService.updateWhitelistedUser(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Whitelisted user updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWhitelistedUser(
            Authentication authentication,
            @PathVariable("id") Long id) {
        Long userId = (Long) authentication.getPrincipal();
        whitelistService.deleteWhitelistedUser(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Whitelisted user removed successfully"));
    }

    @GetMapping("/hierarchy")
    public ResponseEntity<ApiResponse<Map<String, List<String>>>> getPersonnelHierarchy() {
        return ResponseEntity.ok(ApiResponse.success(designationRoleService.getDesignationRolesMap()));
    }

    @GetMapping("/hierarchy/weights")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getHierarchyRankWeights() {
        return ResponseEntity.ok(ApiResponse.success(whitelistService.getHierarchyRankWeights()));
    }
}
