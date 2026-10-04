package com.rng.embed.controller;

import com.rng.common.dto.ApiResponse;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.dto.CreateActionRequest;
import com.rng.embed.dto.EmbedActionDto;
import com.rng.embed.dto.InteractionLogResponse;
import com.rng.embed.dto.UpdateActionRequest;
import com.rng.embed.service.EmbedActionService;
import com.rng.server.domain.Server;
import com.rng.server.repository.ServerRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller managing interactive component Action Templates and interaction audit logs.
 */
@RestController
@RequiredArgsConstructor
public class EmbedActionController {

    private final EmbedActionService actionService;
    private final ServerRepository serverRepository;

    @GetMapping("/api/v1/embeds/actions")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<List<EmbedActionDto>>> listActions(
            @RequestParam(value = "serverId", required = false) String serverId) {

        if (serverId != null && !serverId.isBlank()) {
            String resolvedId = serverRepository.findByIdOrSlug(serverId)
                    .map(Server::getId)
                    .orElse(serverId);
            List<EmbedActionDto> actions = actionService.getActionsForServer(resolvedId);
            return ResponseEntity.ok(ApiResponse.success(actions));
        }

        List<EmbedActionDto> actions = actionService.getGlobalActions();
        return ResponseEntity.ok(ApiResponse.success(actions));
    }

    @GetMapping("/api/v1/embeds/actions/{actionId}")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<EmbedActionDto>> getAction(
            @PathVariable("actionId") String actionId) {

        EmbedAction action = actionService.resolveAction(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action not found: " + actionId));
        return ResponseEntity.ok(ApiResponse.success(EmbedActionDto.fromDomain(action)));
    }

    @PostMapping("/api/v1/embeds/actions")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<EmbedActionDto>> createAction(
            @Valid @RequestBody CreateActionRequest request) {

        EmbedActionDto created = actionService.createAction(request);
        return ResponseEntity.ok(ApiResponse.success(created, "Action template created successfully."));
    }

    @PutMapping("/api/v1/embeds/actions/{actionId}")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<EmbedActionDto>> updateAction(
            @PathVariable("actionId") String actionId,
            @Valid @RequestBody UpdateActionRequest request) {

        EmbedActionDto updated = actionService.updateAction(actionId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Action template updated successfully."));
    }

    @DeleteMapping("/api/v1/embeds/actions/{actionId}")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<Boolean>> deleteAction(
            @PathVariable("actionId") String actionId) {

        actionService.deleteAction(actionId);
        return ResponseEntity.ok(ApiResponse.success(true, "Action template deleted successfully."));
    }

    @GetMapping("/api/v1/embeds/actions/logs")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<Page<InteractionLogResponse>>> getInteractionLogs(
            @RequestParam(value = "guildId", required = false) String guildId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InteractionLogResponse> logs = actionService.getInteractionLogs(guildId, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/api/v1/servers/{idOrSlug}/actions")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<List<EmbedActionDto>>> getServerActions(
            @PathVariable("idOrSlug") String idOrSlug) {

        Server server = serverRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found: " + idOrSlug));
        List<EmbedActionDto> actions = actionService.getActionsForServer(server.getId());
        return ResponseEntity.ok(ApiResponse.success(actions));
    }

    @PostMapping("/api/v1/servers/{idOrSlug}/actions")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<EmbedActionDto>> createServerAction(
            @PathVariable("idOrSlug") String idOrSlug,
            @Valid @RequestBody CreateActionRequest request) {

        Server server = serverRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found: " + idOrSlug));

        CreateActionRequest effectiveRequest = request;
        if (request.serverId() == null || request.serverId().isBlank()) {
            effectiveRequest = new CreateActionRequest(
                    server.getId(),
                    request.isGlobal(),
                    request.name(),
                    request.description(),
                    request.actionType(),
                    request.roleSubtype(),
                    request.roleId(),
                    request.roleName(),
                    request.channelPrefix(),
                    request.welcomeMessage(),
                    request.replyContent(),
                    request.isEphemeral(),
                    request.dmContent(),
                    request.requiredUser(),
                    request.requiredRole(),
                    request.responseEmbedTemplateId()
            );
        }

        EmbedActionDto created = actionService.createAction(effectiveRequest);
        return ResponseEntity.ok(ApiResponse.success(created, "Action template created successfully."));
    }

    @PutMapping("/api/v1/servers/{idOrSlug}/actions/{actionId}")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<EmbedActionDto>> updateServerAction(
            @PathVariable("idOrSlug") String idOrSlug,
            @PathVariable("actionId") String actionId,
            @Valid @RequestBody UpdateActionRequest request) {

        serverRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found: " + idOrSlug));

        EmbedActionDto updated = actionService.updateAction(actionId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Action template updated successfully."));
    }

    @DeleteMapping("/api/v1/servers/{idOrSlug}/actions/{actionId}")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<Boolean>> deleteServerAction(
            @PathVariable("idOrSlug") String idOrSlug,
            @PathVariable("actionId") String actionId) {

        serverRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found: " + idOrSlug));

        actionService.deleteAction(actionId);
        return ResponseEntity.ok(ApiResponse.success(true, "Action template deleted successfully."));
    }

    @GetMapping("/api/v1/servers/{idOrSlug}/interactions/logs")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<Page<InteractionLogResponse>>> getServerInteractionLogs(
            @PathVariable("idOrSlug") String idOrSlug,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        Server server = serverRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found: " + idOrSlug));

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InteractionLogResponse> logs = actionService.getInteractionLogs(server.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
