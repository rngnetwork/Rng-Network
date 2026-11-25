// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.controller;

import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.personnel.perms.dto.EffectivePermissionsDto;
import com.rednecksgaming.personnel.perms.dto.PermsApiResponse;
import com.rednecksgaming.personnel.perms.dto.PermsExplorerResponseDto;
import com.rednecksgaming.personnel.perms.dto.PreviewRoleOptionDto;
import com.rednecksgaming.personnel.perms.dto.RolePermissionsDto;
import com.rednecksgaming.personnel.perms.dto.UpdateRolePermissionsRequest;
import com.rednecksgaming.personnel.perms.service.RolePermissionsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST API controller for CRUD management of explicit role permissions, explorer tree retrieval,
 * multi-role additive union evaluation, and R9/R8 temporary role preview options.
 */
@Validated
@RestController
@RequestMapping("/api/v1/personnel/perms")
public class RolePermissionsController {

    private final RolePermissionsService service;
    private final UserRepository userRepository;

    public RolePermissionsController(RolePermissionsService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    /**
     * Lists all role permission records.
     *
     * @return all {@link RolePermissionsDto} entries
     */
    @GetMapping
    public ResponseEntity<PermsApiResponse<List<RolePermissionsDto>>> getAllRolePermissions() {
        return ResponseEntity.ok(PermsApiResponse.ok(service.getAllRolePermissions()));
    }

    /**
     * Returns designation-grouped explorer folders, managed servers, and formatted UI labels.
     *
     * @return {@link PermsExplorerResponseDto}
     */
    @GetMapping("/explorer")
    public ResponseEntity<PermsApiResponse<PermsExplorerResponseDto>> getExplorer() {
        return ResponseEntity.ok(PermsApiResponse.ok(service.getExplorer()));
    }

    /**
     * Evaluates effective permissions for the authenticated caller, honoring optional R9/R8 preview header.
     *
     * @param authentication active Spring Security authentication carrying {@code Long userId} principal
     * @param previewRoleId  optional {@code X-Preview-Role-Id} header for temporary role preview
     * @return {@link EffectivePermissionsDto}
     */
    @GetMapping("/me")
    public ResponseEntity<PermsApiResponse<EffectivePermissionsDto>> getCallerEffectivePermissions(
            Authentication authentication,
            @RequestHeader(value = "X-Preview-Role-Id", required = false) String previewRoleId
    ) {
        User caller = resolveAuthenticatedUser(authentication);
        return ResponseEntity.ok(PermsApiResponse.ok(service.computeEffectivePermissions(caller, previewRoleId)));
    }

    /**
     * Lists all roles selectable for temporary role preview mode (R9/R8 personnel only).
     *
     * @param authentication active Spring Security authentication
     * @return ordered list of {@link PreviewRoleOptionDto}
     */
    @GetMapping("/preview-options")
    public ResponseEntity<PermsApiResponse<List<PreviewRoleOptionDto>>> getPreviewRoleOptions(
            Authentication authentication
    ) {
        User caller = resolveAuthenticatedUser(authentication);
        return ResponseEntity.ok(PermsApiResponse.ok(service.getPreviewRoleOptions(caller)));
    }

    /**
     * Retrieves a single role's persisted permissions by canonical {@code roleId}.
     *
     * @param roleId canonical identifier ({@code designationId:roleName})
     * @return {@link RolePermissionsDto}
     */
    @GetMapping("/{roleId}")
    public ResponseEntity<PermsApiResponse<RolePermissionsDto>> getRolePermissions(
            @PathVariable @NotBlank String roleId
    ) {
        return ResponseEntity.ok(PermsApiResponse.ok(service.getRolePermissions(roleId)));
    }

    /**
     * Updates a role's JSONB permissions with optimistic concurrency control.
     * Unrestricted across all roles (R9-R0) for authorized operators.
     *
     * @param roleId         canonical identifier ({@code designationId:roleName})
     * @param request        validated permissions payload and expected version
     * @param authentication active Spring Security authentication
     * @return updated {@link RolePermissionsDto}
     */
    @PutMapping("/{roleId}")
    public ResponseEntity<PermsApiResponse<RolePermissionsDto>> updateRolePermissions(
            @PathVariable @NotBlank String roleId,
            @Valid @RequestBody UpdateRolePermissionsRequest request,
            Authentication authentication
    ) {
        User operator = resolveAuthenticatedUser(authentication);
        RolePermissionsDto updated = service.updateRolePermissions(roleId, request, operator.getEmail());
        return ResponseEntity.ok(PermsApiResponse.ok("Permissions updated successfully", updated));
    }

    /**
     * Resets a role's permissions back to its rank-derived canonical defaults.
     *
     * @param roleId         canonical identifier ({@code designationId:roleName})
     * @param authentication active Spring Security authentication
     * @return reset {@link RolePermissionsDto}
     */
    @PostMapping("/reset/{roleId}")
    public ResponseEntity<PermsApiResponse<RolePermissionsDto>> resetRolePermissions(
            @PathVariable @NotBlank String roleId,
            Authentication authentication
    ) {
        User operator = resolveAuthenticatedUser(authentication);
        RolePermissionsDto reset = service.resetToDefault(roleId, operator.getEmail());
        return ResponseEntity.ok(PermsApiResponse.ok("Role permissions reset to default seed", reset));
    }

    private User resolveAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null) {
            throw new AccessDeniedException("Unauthenticated caller");
        }
        Long userId = extractUserId(authentication.getPrincipal());
        return userRepository.findById(userId)
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }

    private Long extractUserId(Object principal) {
        if (principal instanceof Long id) {
            return id;
        }
        if (principal instanceof Number num) {
            return num.longValue();
        }
        if (principal instanceof String str) {
            try {
                return Long.valueOf(str.trim());
            } catch (NumberFormatException ex) {
                throw new AccessDeniedException("Invalid user principal format");
            }
        }
        throw new AccessDeniedException("Unsupported authentication principal");
    }
}
