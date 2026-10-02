package com.rng.embed.controller;

import com.rng.common.dto.ApiResponse;
import com.rng.embed.dto.CreateActionRequest;
import com.rng.embed.dto.EmbedActionDto;
import com.rng.embed.dto.UpdateActionRequest;
import com.rng.embed.service.EmbedActionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing endpoints for the Discord Action Registry.
 */
@RestController
@RequestMapping("/api/v1/servers/{idOrSlug}/actions")
@RequiredArgsConstructor
public class EmbedActionController {

    private final EmbedActionService actionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmbedActionDto>>> listActions(
            @PathVariable("idOrSlug") String idOrSlug) {
        List<EmbedActionDto> actions = actionService.listServerActions(idOrSlug);
        return ResponseEntity.ok(ApiResponse.success(actions));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmbedActionDto>> createAction(
            Authentication authentication,
            @PathVariable("idOrSlug") String idOrSlug,
            @Valid @RequestBody CreateActionRequest request) {

        String userEmail = authentication != null ? authentication.getName() : "system@rng.com";
        EmbedActionDto created = actionService.createAction(idOrSlug, request, userEmail);
        return ResponseEntity.ok(ApiResponse.success(created, "Action registered successfully."));
    }

    @GetMapping("/{actionId}")
    public ResponseEntity<ApiResponse<EmbedActionDto>> getAction(
            @PathVariable("idOrSlug") String idOrSlug,
            @PathVariable("actionId") String actionId) {
        EmbedActionDto action = actionService.getAction(idOrSlug, actionId);
        return ResponseEntity.ok(ApiResponse.success(action));
    }

    @PutMapping("/{actionId}")
    public ResponseEntity<ApiResponse<EmbedActionDto>> updateAction(
            Authentication authentication,
            @PathVariable("idOrSlug") String idOrSlug,
            @PathVariable("actionId") String actionId,
            @Valid @RequestBody UpdateActionRequest request) {

        String userEmail = authentication != null ? authentication.getName() : "system@rng.com";
        EmbedActionDto updated = actionService.updateAction(idOrSlug, actionId, request, userEmail);
        return ResponseEntity.ok(ApiResponse.success(updated, "Action updated successfully."));
    }

    @DeleteMapping("/{actionId}")
    public ResponseEntity<ApiResponse<Void>> deleteAction(
            @PathVariable("idOrSlug") String idOrSlug,
            @PathVariable("actionId") String actionId) {
        actionService.deleteAction(idOrSlug, actionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Action deleted successfully."));
    }
}
