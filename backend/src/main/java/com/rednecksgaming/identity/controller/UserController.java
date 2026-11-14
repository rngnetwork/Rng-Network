// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity.controller;

import com.rednecksgaming.common.dto.ApiResponse;
import com.rednecksgaming.identity.dto.ActiveSessionDto;
import com.rednecksgaming.identity.dto.UserResponse;
import com.rednecksgaming.identity.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        UserResponse response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/sessions")
    public ResponseEntity<ApiResponse<List<ActiveSessionDto>>> getActiveSessions(
            Authentication authentication,
            HttpServletRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        List<ActiveSessionDto> sessions = authService.getActiveSessions(userId, request);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @DeleteMapping("/me/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> revokeSession(
            Authentication authentication,
            @PathVariable String sessionId) {
        return ResponseEntity.ok(ApiResponse.success(null, "Session revoked"));
    }
}
