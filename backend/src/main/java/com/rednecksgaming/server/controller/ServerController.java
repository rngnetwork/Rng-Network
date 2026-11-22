// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.server.controller;

import com.rednecksgaming.common.dto.ApiResponse;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.server.dto.ChannelDto;
import com.rednecksgaming.server.dto.DiscordEmojiDto;
import com.rednecksgaming.server.dto.ServerDetailDto;
import com.rednecksgaming.server.dto.ServerDto;
import com.rednecksgaming.server.dto.ServerRoleDto;
import com.rednecksgaming.server.dto.UpdateServerSettingsRequest;
import com.rednecksgaming.server.service.ServerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/servers")
@RequiredArgsConstructor
public class ServerController {

    private final ServerService serverService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServerDto>>> getAllServers() {
        List<ServerDto> servers = serverService.getAllServers();
        return ResponseEntity.ok(ApiResponse.success(servers));
    }

    @GetMapping("/{idOrSlug}")
    public ResponseEntity<ApiResponse<ServerDetailDto>> getServerDetails(@PathVariable("idOrSlug") String idOrSlug) {
        ServerDetailDto details = serverService.getServerDetails(idOrSlug);
        return ResponseEntity.ok(ApiResponse.success(details));
    }

    @GetMapping("/{idOrSlug}/channels")
    public ResponseEntity<ApiResponse<List<ChannelDto>>> getServerChannels(@PathVariable("idOrSlug") String idOrSlug) {
        List<ChannelDto> channels = serverService.getServerChannels(idOrSlug);
        return ResponseEntity.ok(ApiResponse.success(channels));
    }

    @GetMapping("/{idOrSlug}/roles")
    public ResponseEntity<ApiResponse<List<ServerRoleDto>>> getServerRoles(@PathVariable("idOrSlug") String idOrSlug) {
        List<ServerRoleDto> roles = serverService.getServerRoles(idOrSlug);
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @GetMapping("/{idOrSlug}/emojis")
    public ResponseEntity<ApiResponse<List<DiscordEmojiDto>>> getServerEmojis(
            @PathVariable("idOrSlug") String idOrSlug,
            @RequestParam(name = "refresh", required = false, defaultValue = "false") boolean refresh
    ) {
        List<DiscordEmojiDto> emojis = serverService.getServerEmojis(idOrSlug, refresh);
        return ResponseEntity.ok(ApiResponse.success(emojis));
    }

    @PutMapping("/{idOrSlug}")
    public ResponseEntity<ApiResponse<ServerDetailDto>> updateServerSettings(
            Authentication authentication,
            @PathVariable("idOrSlug") String idOrSlug,
            @Valid @RequestBody UpdateServerSettingsRequest request) {

        String operatorEmail = "system@rng.com";
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            operatorEmail = userRepository.findById(userId)
                    .map(User::getEmail)
                    .orElse("unknown@rng.com");
        }

        ServerDetailDto updated = serverService.updateServerSettings(idOrSlug, request, operatorEmail);
        return ResponseEntity.ok(ApiResponse.success(updated, "Server settings updated successfully"));
    }
}
