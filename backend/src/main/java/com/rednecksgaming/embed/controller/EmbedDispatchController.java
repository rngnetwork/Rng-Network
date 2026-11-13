// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
/*
 * Written By: RachitSWE
 * LICENSE: All rights reserved
 * Year: 2026
*/

package com.rednecksgaming.embed.controller;

import com.rednecksgaming.common.dto.ApiResponse;
import com.rednecksgaming.embed.domain.DispatchStatus;
import com.rednecksgaming.embed.dto.*;
import com.rednecksgaming.embed.service.EmbedDispatchService;
import com.rednecksgaming.server.dto.ChannelDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST controller managing Discord Components V2 message dispatches, scheduling,
 * pre-flight testing, and telemetry history.
 */
@RestController
@RequestMapping("/api/v1/embeds")
@RequiredArgsConstructor
public class EmbedDispatchController {

    private final EmbedDispatchService dispatchService;

    @PostMapping(value = "/dispatch", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<DispatchResponse>> dispatchJson(
            Authentication authentication,
            @Valid @RequestBody DispatchEmbedRequest request) {

        Long userId = resolveUserId(authentication);
        DispatchResponse response = dispatchService.dispatchImmediate(userId, request, null);
        return ResponseEntity.ok(ApiResponse.success(response, "Message dispatched successfully."));
    }

    @PostMapping(value = "/dispatch/multipart", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<DispatchResponse>> dispatchMultipart(
            Authentication authentication,
            @Valid @RequestPart("request") DispatchEmbedRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {

        Long userId = resolveUserId(authentication);
        DispatchResponse response = dispatchService.dispatchImmediate(userId, request, files);
        return ResponseEntity.ok(ApiResponse.success(response, "Message dispatched successfully with file attachments."));
    }

    @PostMapping("/dispatch/schedule")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<DispatchResponse>> scheduleDispatch(
            Authentication authentication,
            @Valid @RequestBody DispatchEmbedRequest request) {

        Long userId = resolveUserId(authentication);
        DispatchResponse response = dispatchService.scheduleDispatch(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Message dispatch scheduled successfully."));
    }

    @DeleteMapping("/dispatch/schedule/{dispatchId}")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<Boolean>> cancelScheduledDispatch(
            Authentication authentication,
            @PathVariable("dispatchId") String dispatchId) {

        Long userId = resolveUserId(authentication);
        boolean cancelled = dispatchService.cancelScheduledDispatch(userId, dispatchId);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Scheduled dispatch cancelled successfully."));
    }

    @PostMapping("/dispatch/test")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<DryRunValidationResponse>> validateDryRun(
            Authentication authentication,
            @Valid @RequestBody DryRunValidationRequest request) {

        Long userId = resolveUserId(authentication);
        DryRunValidationResponse report = dispatchService.testDryRun(userId, request);
        return ResponseEntity.ok(ApiResponse.success(report, "Pre-flight validation completed."));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<Page<DispatchLogResponse>>> getDispatchLogs(
            @RequestParam(value = "serverId", required = false) String serverId,
            @RequestParam(value = "status", required = false) DispatchStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<DispatchLogResponse> logs = dispatchService.getDispatchLogs(serverId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/channels")
    @PreAuthorize("hasAuthority('SCOPE_FULLY_AUTHENTICATED')")
    public ResponseEntity<ApiResponse<List<ChannelDto>>> getDispatchableChannels(
            @RequestParam("serverId") String serverId) {

        List<ChannelDto> channels = dispatchService.getDispatchableChannels(serverId);
        return ResponseEntity.ok(ApiResponse.success(channels));
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
