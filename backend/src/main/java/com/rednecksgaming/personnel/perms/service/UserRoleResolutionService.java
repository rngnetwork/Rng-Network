// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.service;

import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.personnel.perms.domain.RolePermissions;
import com.rednecksgaming.personnel.perms.repository.RolePermissionsRepository;
import com.rednecksgaming.personnel.roles.domain.MatrixDesignation;
import com.rednecksgaming.personnel.roles.repository.MatrixDesignationRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Resolves a {@link User}'s assigned explicit {@code designationId:roleName} permission identifiers,
 * supporting both prefixed entries and legacy unprefixed/Spring-Security role fallbacks.
 */
@Service
public class UserRoleResolutionService {

    private final MatrixDesignationRepository designationRepository;
    private final RolePermissionsRepository rolePermissionsRepository;

    public UserRoleResolutionService(
            MatrixDesignationRepository designationRepository,
            RolePermissionsRepository rolePermissionsRepository
    ) {
        this.designationRepository = designationRepository;
        this.rolePermissionsRepository = rolePermissionsRepository;
    }

    /**
     * Resolves all canonical {@code role_id} keys belonging to {@code user}.
     *
     * @param user authenticated user entity
     * @return deterministic ordered set of {@code designationId:roleName} identifiers
     */
    public Set<String> resolveRoleIds(User user) {
        if (user == null) {
            return Set.of();
        }

        List<RolePermissions> allRolePermissions = rolePermissionsRepository.findAll();
        Map<String, RolePermissions> byRoleId = new LinkedHashMap<>();
        for (RolePermissions rp : allRolePermissions) {
            byRoleId.put(rp.getRoleId(), rp);
        }

        Map<String, String> nameToId = buildDesignationNameToIdMap();
        List<String> userDesignationIds = resolveUserDesignationIds(user, nameToId);
        Set<String> resolved = new LinkedHashSet<>();

        for (String rawRole : user.getRoleList()) {
            if (rawRole == null || rawRole.isBlank()) {
                continue;
            }
            String trimmed = rawRole.trim();
            if (trimmed.contains(":")) {
                resolvePrefixedRole(trimmed, nameToId, byRoleId, allRolePermissions, userDesignationIds, resolved);
                continue;
            }
            resolveUnprefixedRole(trimmed, userDesignationIds, allRolePermissions, resolved);
        }

        if (resolved.isEmpty()) {
            applySpringRoleFallback(user.getRole(), userDesignationIds, byRoleId, resolved);
        }

        return resolved;
    }

    /**
     * Computes the caller's maximum effective rank weight across Spring rank and persisted role permissions.
     *
     * @param user            authenticated user entity
     * @param rolePermissions persisted role permission rows assigned to the user
     * @return highest numeric rank weight (0-9)
     */
    public int resolveMaxRankWeight(User user, Collection<RolePermissions> rolePermissions) {
        int maxWeight = User.getRankWeight(user);
        if (rolePermissions != null) {
            for (RolePermissions rp : rolePermissions) {
                if (rp != null && rp.getRankWeight() != null && rp.getRankWeight() > maxWeight) {
                    maxWeight = rp.getRankWeight();
                }
            }
        }
        return maxWeight;
    }

    private Map<String, String> buildDesignationNameToIdMap() {
        List<MatrixDesignation> designations = designationRepository.findAll();
        Map<String, String> nameToId = new LinkedHashMap<>();
        for (MatrixDesignation md : designations) {
            if (md.getId() != null) {
                nameToId.put(md.getId().toLowerCase(Locale.ROOT), md.getId());
            }
            if (md.getName() != null && md.getId() != null) {
                nameToId.put(md.getName().toLowerCase(Locale.ROOT), md.getId());
            }
        }
        return nameToId;
    }

    private List<String> resolveUserDesignationIds(User user, Map<String, String> nameToId) {
        List<String> resolvedIds = new ArrayList<>();
        for (String entry : user.getDesignationList()) {
            if (entry == null || entry.isBlank()) {
                continue;
            }
            String token = entry.contains(":") ? entry.substring(0, entry.indexOf(':')).trim() : entry.trim();
            String matchedId = nameToId.get(token.toLowerCase(Locale.ROOT));
            if (matchedId != null && !resolvedIds.contains(matchedId)) {
                resolvedIds.add(matchedId);
            }
        }
        return resolvedIds;
    }

    /**
     * Resolves {@code prefix:roleName} entries whether {@code prefix} is already a canonical
     * {@code designation_id} (e.g. {@code des_supreme}) or a human-readable {@link MatrixDesignation}
     * display name written by the whitelist workflow (e.g. {@code "Supreme: High Command"}).
     */
    private void resolvePrefixedRole(
            String trimmed,
            Map<String, String> nameToId,
            Map<String, RolePermissions> byRoleId,
            List<RolePermissions> allRolePermissions,
            List<String> userDesignationIds,
            Set<String> resolved
    ) {
        int colonIdx = trimmed.indexOf(':');
        String rawPrefix = trimmed.substring(0, colonIdx).trim();
        String rawRoleName = trimmed.substring(colonIdx + 1).trim();

        if (rawRoleName.isEmpty()) {
            return;
        }
        if (rawPrefix.isEmpty()) {
            resolveUnprefixedRole(rawRoleName, userDesignationIds, allRolePermissions, resolved);
            return;
        }

        String canonicalCandidate = rawPrefix + ":" + rawRoleName;
        if (byRoleId.containsKey(canonicalCandidate)) {
            resolved.add(canonicalCandidate);
            return;
        }

        String targetDesignationId = nameToId.getOrDefault(rawPrefix.toLowerCase(Locale.ROOT), rawPrefix);
        for (RolePermissions rp : allRolePermissions) {
            if (rp.getDesignationId() != null
                    && rp.getDesignationId().equalsIgnoreCase(targetDesignationId)
                    && rp.getRoleName() != null
                    && rp.getRoleName().equalsIgnoreCase(rawRoleName)) {
                resolved.add(rp.getRoleId());
                return;
            }
        }
    }

    private void resolveUnprefixedRole(
            String roleName,
            List<String> userDesignationIds,
            List<RolePermissions> allRolePermissions,
            Set<String> resolved
    ) {
        boolean matchedWithDesignation = false;
        for (String designationId : userDesignationIds) {
            for (RolePermissions rp : allRolePermissions) {
                if (designationId.equals(rp.getDesignationId())
                        && rp.getRoleName() != null
                        && rp.getRoleName().equalsIgnoreCase(roleName)) {
                    resolved.add(rp.getRoleId());
                    matchedWithDesignation = true;
                }
            }
        }
        if (matchedWithDesignation) {
            return;
        }
        for (RolePermissions rp : allRolePermissions) {
            if (rp.getRoleName() != null && rp.getRoleName().equalsIgnoreCase(roleName)) {
                resolved.add(rp.getRoleId());
            }
        }
    }

    private void applySpringRoleFallback(
            String springRole,
            List<String> userDesignationIds,
            Map<String, RolePermissions> byRoleId,
            Set<String> resolved
    ) {
        if (springRole == null || springRole.isBlank()) {
            return;
        }
        switch (springRole) {
            case "ROLE_CHIEF_HIGH_COMMAND" -> addIfPresent("des_supreme:Chief High Command", byRoleId, resolved);
            case "ROLE_HIGH_COMMAND" -> addIfPresent("des_supreme:High Command", byRoleId, resolved);
            case "ROLE_DIRECTOR" -> addIfPresent("des_supreme:Director", byRoleId, resolved);
            case "ROLE_EXECUTIVE_DIRECTOR" -> addIfPresent("des_supreme:Executive Director", byRoleId, resolved);
            case "ROLE_MINISTER" -> {
                for (String designationId : userDesignationIds) {
                    addIfPresent(designationId + ":Minister", byRoleId, resolved);
                }
                if (resolved.isEmpty()) {
                    addIfPresent("des_tech:Minister", byRoleId, resolved);
                }
            }
            default -> {
                // ROLE_USER with no assigned explicit roles resolves to empty set (all denied).
            }
        }
    }

    private void addIfPresent(
            String roleId,
            Map<String, RolePermissions> byRoleId,
            Set<String> resolved
    ) {
        if (byRoleId.containsKey(roleId)) {
            resolved.add(roleId);
        }
    }
}
