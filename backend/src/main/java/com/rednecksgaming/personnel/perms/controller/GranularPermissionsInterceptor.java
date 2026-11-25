// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.personnel.perms.dto.EffectivePermissionsDto;
import com.rednecksgaming.personnel.perms.dto.PermsApiResponse;
import com.rednecksgaming.personnel.perms.service.GranularPermissionEvaluator;
import com.rednecksgaming.personnel.perms.service.RolePermissionsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.NoSuchElementException;

/**
 * Defense-in-depth Spring MVC interceptor enforcing granular JSONB permissions and R9/R8
 * temporary preview constraints across all protected {@code /api/v1/**} endpoints.
 */
@Component
public class GranularPermissionsInterceptor implements HandlerInterceptor {

    public static final String REQUEST_ATTR_EFFECTIVE_PERMS = "RNG_EFFECTIVE_PERMISSIONS";
    private static final String HEADER_PREVIEW_ROLE_ID = "X-Preview-Role-Id";

    private final RolePermissionsService rolePermissionsService;
    private final GranularPermissionEvaluator evaluator;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public GranularPermissionsInterceptor(
            RolePermissionsService rolePermissionsService,
            GranularPermissionEvaluator evaluator,
            UserRepository userRepository,
            ObjectMapper objectMapper
    ) {
        this.rolePermissionsService = rolePermissionsService;
        this.evaluator = evaluator;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String uri = request.getRequestURI();
        String method = request.getMethod();

        if (uri == null || !uri.startsWith("/api/v1/")) {
            return true;
        }
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return true;
        }

        if (isSafetyAllowlisted(method, uri)) {
            return true;
        }

        User caller = resolveUser(auth);
        if (caller == null) {
            writeFailure(response, HttpServletResponse.SC_FORBIDDEN, 1003, "Authenticated user not found");
            return false;
        }

        String previewRoleId = request.getHeader(HEADER_PREVIEW_ROLE_ID);
        EffectivePermissionsDto effective;
        try {
            effective = rolePermissionsService.computeEffectivePermissions(caller, previewRoleId);
        } catch (AccessDeniedException ex) {
            writeFailure(response, HttpServletResponse.SC_FORBIDDEN, 1003, ex.getMessage());
            return false;
        } catch (NoSuchElementException ex) {
            writeFailure(response, HttpServletResponse.SC_NOT_FOUND, 1002, ex.getMessage());
            return false;
        }

        request.setAttribute(REQUEST_ATTR_EFFECTIVE_PERMS, effective);

        if (!evaluator.isFeatureEnabled(effective, "dashboard")) {
            writeFailure(response, HttpServletResponse.SC_FORBIDDEN, 1003, "Access denied: dashboard permission disabled");
            return false;
        }

        String deniedReason = evaluateRoutePermission(method, uri, effective);
        if (deniedReason != null) {
            writeFailure(response, HttpServletResponse.SC_FORBIDDEN, 1003, deniedReason);
            return false;
        }

        return true;
    }

    private boolean isSafetyAllowlisted(String method, String uri) {
        if (uri.startsWith("/api/v1/auth")) {
            return true;
        }
        if (!"GET".equalsIgnoreCase(method)) {
            return false;
        }
        return "/api/v1/users/me".equals(uri)
                || "/api/v1/personnel/perms/me".equals(uri)
                || "/api/v1/personnel/perms/preview-options".equals(uri);
    }

    private String evaluateRoutePermission(String method, String uri, EffectivePermissionsDto effective) {
        if (uri.startsWith("/api/v1/personnel/perms")) {
            if (!evaluator.isFeatureEnabled(effective, "dashboard.personnel", "dashboard.personnel.perms")) {
                return "Access denied: missing dashboard.personnel.perms permission";
            }
            return null;
        }
        if (uri.startsWith("/api/v1/personnel/hierarchy")) {
            if (!evaluator.isFeatureEnabled(effective, "dashboard.personnel", "dashboard.personnel.roles")) {
                return "Access denied: missing dashboard.personnel.roles permission";
            }
            return null;
        }
        if (uri.startsWith("/api/v1/whitelist")) {
            if (!evaluator.isFeatureEnabled(effective, "dashboard.whitelist")) {
                return "Access denied: missing dashboard.whitelist permission";
            }
            return null;
        }
        if (uri.startsWith("/api/v1/embeds")) {
            if (!evaluator.isFeatureEnabled(effective, "dashboard.embeds")) {
                return "Access denied: missing dashboard.embeds permission";
            }
            return null;
        }
        if (uri.startsWith("/api/v1/bot") || uri.startsWith("/api/v1/bot-modules")) {
            if (!evaluator.isFeatureEnabled(effective, "dashboard.botconfig")) {
                return "Access denied: missing dashboard.botconfig permission";
            }
            return null;
        }
        if (uri.equals("/api/v1/servers") || uri.equals("/api/v1/servers/")) {
            if (!evaluator.isFeatureEnabled(effective, "dashboard.servers")) {
                return "Access denied: missing dashboard.servers permission";
            }
            return null;
        }
        if (uri.startsWith("/api/v1/servers/")) {
            return evaluateServerRoute(method, uri, effective);
        }
        return null;
    }

    private String evaluateServerRoute(String method, String uri, EffectivePermissionsDto effective) {
        String remainder = uri.substring("/api/v1/servers/".length());
        int slashIdx = remainder.indexOf('/');
        String serverIdOrSlug = slashIdx >= 0 ? remainder.substring(0, slashIdx) : remainder;
        String subPath = slashIdx >= 0 ? remainder.substring(slashIdx) : "";

        String subFeature = resolveServerSubFeature(method, subPath);
        if (!evaluator.isServerAllowed(effective, serverIdOrSlug, subFeature)) {
            String suffix = subFeature != null ? "." + subFeature : "";
            return "Access denied: missing server permission for " + serverIdOrSlug + suffix;
        }
        return null;
    }

    private String resolveServerSubFeature(String method, String subPath) {
        if (subPath.startsWith("/bot-modules")) {
            return "botconfig";
        }
        if (subPath.startsWith("/embeds")) {
            return "embeds";
        }
        if (subPath.startsWith("/analytics")) {
            return "analytics";
        }
        if (subPath.startsWith("/settings")) {
            return "settings";
        }
        boolean isMutation = !"GET".equalsIgnoreCase(method) && !"HEAD".equalsIgnoreCase(method);
        if (isMutation) {
            return "settings";
        }
        return null;
    }

    private User resolveUser(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof Long userId) {
            return userRepository.findById(userId).orElse(null);
        }
        if (principal instanceof Number num) {
            return userRepository.findById(num.longValue()).orElse(null);
        }
        if (principal instanceof String str) {
            try {
                return userRepository.findById(Long.valueOf(str.trim())).orElse(null);
            } catch (NumberFormatException ignored) {
                return userRepository.findByEmail(str.trim()).orElse(null);
            }
        }
        return null;
    }

    private void writeFailure(
            HttpServletResponse response,
            int status,
            int errorCode,
            String message
    ) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(PermsApiResponse.failure(errorCode, message)));
    }
}
