package com.rednecksgaming.botmodule.controller;

import com.rednecksgaming.botmodule.dto.ActorDetails;
import com.rednecksgaming.botmodule.dto.BotModuleConfigRequest;
import com.rednecksgaming.botmodule.service.BotModuleService;
import com.rednecksgaming.common.dto.ApiResponse;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST controller exposing bot module configuration endpoints for Network-Wide and Server-Specific scopes.
 */
@Slf4j
@Validated
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BotModuleController {

    private final BotModuleService botModuleService;
    private final UserRepository userRepository;

    @GetMapping("/bot-modules/network")
    @PreAuthorize("hasAnyRole('CHIEF_HIGH_COMMAND', 'HIGH_COMMAND')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNetworkDefaultModules() {
        Map<String, Object> defaults = botModuleService.getNetworkDefaultModules();
        return ResponseEntity.ok(ApiResponse.success(defaults));
    }

    @PatchMapping("/bot-modules/network")
    @PreAuthorize("hasAnyRole('CHIEF_HIGH_COMMAND', 'HIGH_COMMAND')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> patchNetworkDefaultModules(
            Authentication authentication,
            @Valid @RequestBody BotModuleConfigRequest request
    ) {
        ActorDetails actor = resolveActorDetails(authentication);
        Map<String, Object> result;
        if (request.getSchema() != null && !request.getSchema().isEmpty()) {
            result = botModuleService.updateNetworkDefaultModules(
                    actor.actorId(),
                    actor.actorName(),
                    request.getModules(),
                    request.getNetwork(),
                    request.getSchema()
            );
        } else {
            result = botModuleService.updateNetworkDefaultModules(
                    actor.actorId(),
                    actor.actorName(),
                    request.getModules(),
                    request.getNetwork()
            );
        }
        return ResponseEntity.ok(ApiResponse.success(result, "Network default bot modules updated successfully"));
    }

    @GetMapping("/servers/{serverSlug}/bot-modules")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getServerEffectiveModules(
            @PathVariable("serverSlug") String serverSlug
    ) {
        Map<String, Object> effective = botModuleService.getServerEffectiveModules(serverSlug);
        return ResponseEntity.ok(ApiResponse.success(effective));
    }

    @PatchMapping("/servers/{serverSlug}/bot-modules")
    public ResponseEntity<ApiResponse<Map<String, Object>>> patchServerModules(
            Authentication authentication,
            @PathVariable("serverSlug") String serverSlug,
            @Valid @RequestBody BotModuleConfigRequest request
    ) {
        ActorDetails actor = resolveActorDetails(authentication);
        Map<String, Object> result = botModuleService.updateServerModules(
                serverSlug,
                actor.actorId(),
                actor.actorName(),
                request.getModules()
        );
        return ResponseEntity.ok(ApiResponse.success(result, "Server bot modules updated successfully"));
    }

    @DeleteMapping("/servers/{serverSlug}/bot-modules/{moduleName}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resetServerModule(
            Authentication authentication,
            @PathVariable("serverSlug") String serverSlug,
            @PathVariable("moduleName") String moduleName
    ) {
        ActorDetails actor = resolveActorDetails(authentication);
        Map<String, Object> result = botModuleService.resetServerModule(
                serverSlug,
                moduleName,
                actor.actorId(),
                actor.actorName()
        );
        return ResponseEntity.ok(ApiResponse.success(result, "Server bot module reset successfully"));
    }

    private ActorDetails resolveActorDetails(Authentication authentication) {
        if (authentication == null) {
            return new ActorDetails("system", "System Operator");
        }

        if (authentication.getPrincipal() instanceof Long userId) {
            return userRepository.findById(userId)
                    .map(u -> new ActorDetails(
                            u.getDiscordId() != null && !u.getDiscordId().isBlank() ? u.getDiscordId() : String.valueOf(u.getId()),
                            u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getEmail()
                    ))
                    .orElse(new ActorDetails(String.valueOf(userId), authentication.getName()));
        }

        return new ActorDetails(authentication.getName(), authentication.getName());
    }
}
