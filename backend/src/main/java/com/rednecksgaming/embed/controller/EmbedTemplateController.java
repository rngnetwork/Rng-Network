// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.controller;

import com.rednecksgaming.common.dto.ApiResponse;
import com.rednecksgaming.embed.dto.CreateTemplateRequest;
import com.rednecksgaming.embed.dto.TemplateResponse;
import com.rednecksgaming.embed.dto.UpdateTemplateRequest;
import com.rednecksgaming.embed.service.EmbedTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller managing MongoDB message templates CRUD, export, and import.
 */
@RestController
@RequestMapping("/api/v1/embeds/templates")
@RequiredArgsConstructor
public class EmbedTemplateController {

    private final EmbedTemplateService templateService;

    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<Page<TemplateResponse>>> listTemplates(
            Authentication authentication,
            @RequestParam(value = "serverId", required = false) String serverId,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        Long userId = resolveUserId(authentication);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<TemplateResponse> templates = templateService.listTemplates(userId, serverId, category, pageable);
        return ResponseEntity.ok(ApiResponse.success(templates));
    }

    @GetMapping("/{templateId}")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<TemplateResponse>> getTemplate(
            @PathVariable("templateId") String templateId) {

        TemplateResponse template = templateService.getTemplate(templateId);
        return ResponseEntity.ok(ApiResponse.success(template));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<TemplateResponse>> createTemplate(
            Authentication authentication,
            @Valid @RequestBody CreateTemplateRequest request) {

        Long userId = resolveUserId(authentication);
        TemplateResponse created = templateService.createTemplate(userId, request);
        return ResponseEntity.ok(ApiResponse.success(created, "Template created successfully."));
    }

    @PutMapping("/{templateId}")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<TemplateResponse>> updateTemplate(
            Authentication authentication,
            @PathVariable("templateId") String templateId,
            @Valid @RequestBody UpdateTemplateRequest request) {

        Long userId = resolveUserId(authentication);
        TemplateResponse updated = templateService.updateTemplate(userId, templateId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Template updated successfully."));
    }

    @DeleteMapping("/{templateId}")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<Boolean>> deleteTemplate(
            Authentication authentication,
            @PathVariable("templateId") String templateId) {

        Long userId = resolveUserId(authentication);
        templateService.deleteTemplate(userId, templateId);
        return ResponseEntity.ok(ApiResponse.success(true, "Template deleted successfully."));
    }

    @GetMapping("/{templateId}/export")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportTemplate(
            @PathVariable("templateId") String templateId) {

        Map<String, Object> exported = templateService.exportTemplate(templateId);
        return ResponseEntity.ok(ApiResponse.success(exported, "Template exported successfully."));
    }

    @PostMapping("/import")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<TemplateResponse>> importTemplate(
            Authentication authentication,
            @RequestBody Map<String, Object> templateJson) {

        Long userId = resolveUserId(authentication);
        TemplateResponse imported = templateService.importTemplate(userId, templateJson);
        return ResponseEntity.ok(ApiResponse.success(imported, "Template imported successfully."));
    }

    private Long resolveUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Long id) {
            return id;
        }
        if (authentication != null && authentication.getName() != null) {
            try {
                return Long.parseLong(authentication.getName());
            } catch (NumberFormatException ignored) {
            }
        }
        return 1L; // Fallback for local testing
    }
}
