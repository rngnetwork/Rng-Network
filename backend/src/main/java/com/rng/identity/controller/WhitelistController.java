package com.rng.identity.controller;

import com.rng.common.dto.ApiResponse;
import com.rng.identity.domain.PersonnelHierarchy;
import com.rng.identity.dto.UpdateWhitelistedUserRequest;
import com.rng.identity.dto.WhitelistUserRequest;
import com.rng.identity.dto.WhitelistedUserDto;
import com.rng.identity.service.WhitelistService;
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

    @GetMapping
    public ResponseEntity<ApiResponse<List<WhitelistedUserDto>>> getWhitelistedUsers(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<WhitelistedUserDto> users = whitelistService.getWhitelistedUsers(userId);
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
        return ResponseEntity.ok(ApiResponse.success(PersonnelHierarchy.DESIGNATION_ROLES_MAP));
    }
}
