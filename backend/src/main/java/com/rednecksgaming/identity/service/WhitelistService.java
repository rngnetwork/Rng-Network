// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity.service;

import com.rednecksgaming.common.exception.ConflictException;
import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.dto.UpdateWhitelistedUserRequest;
import com.rednecksgaming.identity.dto.WhitelistUserRequest;
import com.rednecksgaming.identity.dto.WhitelistedUserDto;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.personnel.perms.dto.EffectivePermissionsDto;
import com.rednecksgaming.personnel.perms.service.GranularPermissionEvaluator;
import com.rednecksgaming.personnel.perms.service.RolePermissionsService;
import com.rednecksgaming.personnel.roles.service.DesignationRoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhitelistService {

    private final UserRepository userRepository;
    private final DesignationRoleService designationRoleService;
    private final RolePermissionsService rolePermissionsService;
    private final GranularPermissionEvaluator granularPermissionEvaluator;

    private boolean assertWhitelistAccessAndCheckFullAccess(User operator, String denyMessage) {
        if (rolePermissionsService == null || granularPermissionEvaluator == null) {
            if (operator.getRankWeight() < 5) {
                throw new ForbiddenException(denyMessage);
            }
            return operator.getRankWeight() >= 8;
        }
        EffectivePermissionsDto effective = rolePermissionsService.computeEffectivePermissions(operator, null);
        if (!granularPermissionEvaluator.isFeatureEnabled(effective, "dashboard.whitelist")) {
            throw new ForbiddenException(denyMessage);
        }
        return granularPermissionEvaluator.hasWhitelistFullAccess(effective);
    }

    private int resolveDynamicUserWeight(User user) {
        if (user == null) {
            return 0;
        }
        if (rolePermissionsService != null) {
            return rolePermissionsService.resolveUserRankWeight(user);
        }
        return user.getRankWeight();
    }

    private int resolveDynamicTokenWeight(String role, List<String> requestedDesignations) {
        if (rolePermissionsService != null) {
            String candidate = (!role.contains(":") && requestedDesignations != null && requestedDesignations.size() == 1)
                    ? requestedDesignations.get(0) + ":" + role
                    : role;
            return rolePermissionsService.resolveRoleTokensMaxRankWeight(List.of(candidate));
        }
        return User.getRoleRankWeight(role);
    }

    private boolean isChiefRank(User user, int weight) {
        return weight >= 9 || (rolePermissionsService == null && user.isChiefHighCommand());
    }

    private boolean isHighCommandRank(User user, int weight) {
        return weight >= 8 || (rolePermissionsService == null && user.isHighCommand());
    }

    private List<String> resolveScopedMinistries(User operator, int opWeight) {
        if (rolePermissionsService == null) {
            if (opWeight >= 5) {
                return operator.getMinisterMinistries();
            }
            return operator.getDesignationList();
        }
        if (opWeight == 5 && operator.isMinister()) {
            List<String> ministerScoped = operator.getMinisterMinistries();
            if (!ministerScoped.isEmpty()) {
                return ministerScoped;
            }
            // Custom non-"Ministry of ..." designations assigned to R5 operators remain valid unless only Chancellory without Chancellor.
            return operator.getDesignationList().stream()
                    .filter(d -> !d.equalsIgnoreCase(User.CHANCELLORY))
                    .toList();
        }
        return operator.getDesignationList();
    }

    private void assertSelfRoleBounds(
            User target,
            int opWeight,
            String requestedRole,
            String targetDes,
            int tokenWeight
    ) {
        if (opWeight >= 9) {
            return;
        }
        if (tokenWeight >= 9) {
            throw new ForbiddenException("Only Chief High Command can assign the Chief High Command role");
        }
        if (opWeight == 8) {
            return;
        }
        int effectiveOp = Math.max(opWeight, 1);
        if (tokenWeight > effectiveOp) {
            throw new ForbiddenException("Cannot escalate self to a role higher than your own rank: " + requestedRole);
        }
        if (tokenWeight == effectiveOp && !wasRoleAlreadyAssigned(target, requestedRole, targetDes)) {
            throw new ForbiddenException("Cannot assign new peer-level role '" + requestedRole + "' to self");
        }
    }

    private boolean wasRoleAlreadyAssigned(User target, String requestedRole, String targetDes) {
        if (target == null || requestedRole == null) {
            return false;
        }
        String pureRequested = requestedRole.contains(":")
                ? requestedRole.substring(requestedRole.indexOf(":") + 1).trim()
                : requestedRole.trim();
        for (String existing : target.getRoleList()) {
            if (existing == null || existing.isBlank()) {
                continue;
            }
            String trimmed = existing.trim();
            if (trimmed.contains(":")) {
                String existingDes = trimmed.substring(0, trimmed.indexOf(":")).trim();
                String existingPure = trimmed.substring(trimmed.indexOf(":") + 1).trim();
                if (existingPure.equalsIgnoreCase(pureRequested)
                        && (targetDes == null || targetDes.isBlank() || existingDes.equalsIgnoreCase(targetDes.trim()))) {
                    return true;
                }
            } else if (trimmed.equalsIgnoreCase(pureRequested)
                    && (targetDes == null || targetDes.isBlank() || containsIgnoreCase(target.getDesignationList(), targetDes))) {
                return true;
            }
        }
        return false;
    }

    private boolean containsIgnoreCase(List<String> values, String target) {
        if (values == null || target == null) {
            return false;
        }
        return values.stream().anyMatch(v -> v != null && v.equalsIgnoreCase(target.trim()));
    }

    private boolean containsAllIgnoreCase(List<String> container, List<String> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return false;
        }
        return candidates.stream().allMatch(c -> containsIgnoreCase(container, c));
    }

    public boolean isDesignationRoleValid(String designation, String role) {
        return designationRoleService.isValidRoleForDesignation(designation, role);
    }

    @Transactional(readOnly = true)
    public Map<String, Integer> getHierarchyRankWeights() {
        if (rolePermissionsService == null) {
            return Map.of();
        }
        return rolePermissionsService.getHierarchyRankWeights();
    }

    @Transactional(readOnly = true)
    public List<WhitelistedUserDto> getWhitelistedUsers(Long currentUserId) {
        return getWhitelistedUsers(currentUserId, null);
    }

    @Transactional(readOnly = true)
    public List<WhitelistedUserDto> getWhitelistedUsers(Long currentUserId, String ministry) {
        User operator = getOperator(currentUserId);
        int opWeight = resolveDynamicUserWeight(operator);
        boolean hasFullAccess = assertWhitelistAccessAndCheckFullAccess(
                operator,
                "Access Denied: Insufficient authorization scope to view whitelist"
        );

        List<User> allUsers = userRepository.findAll();

        if (ministry != null && !ministry.isBlank()) {
            String targetMinistry = ministry.trim();
            allUsers = allUsers.stream()
                    .filter(u -> u.getDesignationList().stream().anyMatch(d -> d.equalsIgnoreCase(targetMinistry)))
                    .toList();
        }

        if (hasFullAccess || opWeight >= 8) {
            return allUsers.stream().map(this::mapToDto).toList();
        }

        if (rolePermissionsService == null) {
            // Legacy fallback when granular permission service is uninjected in unit tests
            if (opWeight == 7) {
                return allUsers.stream()
                        .filter(u -> resolveDynamicUserWeight(u) <= 6)
                        .map(this::mapToDto)
                        .toList();
            }
            if (opWeight == 6) {
                return allUsers.stream()
                        .filter(u -> resolveDynamicUserWeight(u) <= 5)
                        .map(this::mapToDto)
                        .toList();
            }
        }

        List<String> operatorMinistries = resolveScopedMinistries(operator, opWeight);
        if (operatorMinistries.isEmpty()) {
            throw new ForbiddenException("Minister account is not assigned to a valid Ministry designation");
        }

        if (ministry != null && !ministry.isBlank()) {
            boolean authorizedForMinistry = containsIgnoreCase(operatorMinistries, ministry);
            if (!authorizedForMinistry) {
                throw new ForbiddenException("Ministers may only query their own assigned ministries: " + operatorMinistries);
            }
        }

        return allUsers.stream()
                .filter(u -> resolveDynamicUserWeight(u) < Math.max(opWeight, 1)
                        && u.getDesignationList().stream().anyMatch(d -> containsIgnoreCase(operatorMinistries, d)))
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public WhitelistedUserDto createWhitelistedUser(Long currentUserId, WhitelistUserRequest request) {
        User operator = getOperator(currentUserId);

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new ConflictException("User with email " + request.getEmail() + " is already whitelisted");
        }

        int opWeight = resolveDynamicUserWeight(operator);
        boolean hasFullAccess = assertWhitelistAccessAndCheckFullAccess(
                operator,
                "Access Denied: Only High Command and Ministers can whitelist members"
        );

        List<String> requestedDesignations = request.getDesignations().stream().map(String::trim).toList();
        List<String> requestedRoles = request.getRoles().stream().map(String::trim).toList();

        for (String des : requestedDesignations) {
            if (!designationRoleService.isValidDesignation(des)) {
                throw new IllegalArgumentException("Invalid designation: " + des);
            }
        }

        if (opWeight >= 8 || hasFullAccess) {
            if (opWeight < 9) {
                for (String role : requestedRoles) {
                    int tokenWeight = resolveDynamicTokenWeight(role, requestedDesignations);
                    if (tokenWeight >= 9) {
                        throw new ForbiddenException("Only Chief High Command can assign the Chief High Command role");
                    }
                    if (opWeight < 8 && tokenWeight >= Math.max(opWeight, 1)) {
                        throw new ForbiddenException("Operators cannot assign roles equal to or higher than their own rank");
                    }
                }
            }
        } else {
            if (rolePermissionsService == null && opWeight == 7) {
                for (String role : requestedRoles) {
                    if (User.getRoleRankWeight(role) >= 7) {
                        throw new ForbiddenException("Directors can only assign roles from R6 down to R0");
                    }
                }
            } else if (rolePermissionsService == null && opWeight == 6) {
                for (String role : requestedRoles) {
                    if (User.getRoleRankWeight(role) >= 6) {
                        throw new ForbiddenException("Executive Directors can only assign roles from R5 down to R0");
                    }
                }
            } else {
                List<String> operatorMinistries = resolveScopedMinistries(operator, opWeight);
                if (operatorMinistries.isEmpty()) {
                    throw new ForbiddenException("Minister is not assigned to a valid Ministry");
                }
                if (!containsAllIgnoreCase(operatorMinistries, requestedDesignations)) {
                    throw new ForbiddenException("Ministers may only assign their own assigned ministries: " + operatorMinistries);
                }
                for (String role : requestedRoles) {
                    String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                    String targetDes = role.contains(":") ? role.substring(0, role.indexOf(":")).trim() : requestedDesignations.get(0);
                    if (!containsIgnoreCase(operatorMinistries, targetDes)) {
                        throw new ForbiddenException("Cannot assign role for unassigned ministry: " + targetDes);
                    }
                    int tokenWeight = resolveDynamicTokenWeight(role, List.of(targetDes));
                    if (!designationRoleService.isValidRoleForDesignation(targetDes, pureRole)
                            || pureRole.equalsIgnoreCase("Minister")
                            || pureRole.equalsIgnoreCase("High Command")
                            || pureRole.equalsIgnoreCase("Chief High Command")
                            || tokenWeight >= Math.max(opWeight, 1)) {
                        throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + targetDes);
                    }
                }
            }
        }

        String primaryRole = User.computePrimaryRole(requestedRoles, requestedDesignations);

        User newUser = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .fullName(request.getUserName().trim())
                .provider(request.getProvider())
                .password(null)
                .role(primaryRole)
                .designations(String.join(", ", requestedDesignations))
                .roles(String.join(", ", requestedRoles))
                .status("ACTIVE")
                .discordLinked(false)
                .build();

        User saved = userRepository.save(newUser);
        log.info("Operator {} whitelisted new user {} with role {}", operator.getEmail(), saved.getEmail(), saved.getRole());

        return mapToDto(saved);
    }

    @Transactional
    public WhitelistedUserDto updateWhitelistedUser(Long currentUserId, Long targetUserId, UpdateWhitelistedUserRequest request) {
        User operator = getOperator(currentUserId);
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Whitelisted user not found with ID: " + targetUserId));

        int opWeight = resolveDynamicUserWeight(operator);
        int targetWeight = resolveDynamicUserWeight(target);

        boolean hasFullAccess = assertWhitelistAccessAndCheckFullAccess(
                operator,
                "Access Denied: Insufficient authorization scope to update whitelisted user"
        );

        List<String> requestedDesignations = request.getDesignations().stream().map(String::trim).toList();
        List<String> requestedRoles = request.getRoles().stream().map(String::trim).toList();

        for (String des : requestedDesignations) {
            if (!designationRoleService.isValidDesignation(des)) {
                throw new IllegalArgumentException("Invalid designation: " + des);
            }
        }

        boolean isSelf = operator.getId().equals(target.getId());

        if (opWeight >= 9) {
            if (!isSelf && isChiefRank(target, targetWeight)) {
                throw new ForbiddenException("Chief High Command administrators cannot modify other Chief High Command members");
            }
        } else if (opWeight == 8 || hasFullAccess) {
            if (!isSelf && isChiefRank(target, targetWeight)) {
                throw new ForbiddenException("High Command administrators cannot modify other High Command members");
            }
            if (!isSelf && (isHighCommandRank(target, targetWeight) || targetWeight >= opWeight)) {
                throw new ForbiddenException("High Command administrators cannot modify other High Command members");
            }
            for (String role : requestedRoles) {
                String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                String targetDes = role.contains(":")
                        ? role.substring(0, role.indexOf(":")).trim()
                        : (requestedDesignations.isEmpty() ? "" : requestedDesignations.get(0));
                int tokenWeight = resolveDynamicTokenWeight(role, requestedDesignations);
                if (pureRole.equalsIgnoreCase("Chief High Command") || tokenWeight >= 9) {
                    throw new ForbiddenException("Only Chief High Command can assign the Chief High Command role");
                }
                if (isSelf) {
                    assertSelfRoleBounds(target, opWeight, role, targetDes, tokenWeight);
                } else if (opWeight < 8 && tokenWeight >= Math.max(opWeight, 1)) {
                    throw new ForbiddenException("Operators cannot assign roles equal to or higher than their own rank");
                }
            }
        } else if (rolePermissionsService == null && opWeight == 7) {
            if (!isSelf && targetWeight >= 7) {
                throw new ForbiddenException("Directors cannot modify personnel of rank R7 or higher");
            }
            for (String role : requestedRoles) {
                if (User.getRoleRankWeight(role) >= 7) {
                    throw new ForbiddenException("Directors can only assign roles from R6 down to R0");
                }
            }
        } else if (rolePermissionsService == null && opWeight == 6) {
            if (!isSelf && targetWeight >= 6) {
                throw new ForbiddenException("Executive Directors cannot modify personnel of rank R6 or higher");
            }
            for (String role : requestedRoles) {
                if (User.getRoleRankWeight(role) >= 6) {
                    throw new ForbiddenException("Executive Directors can only assign roles from R5 down to R0");
                }
            }
        } else {
            List<String> operatorMinistries = resolveScopedMinistries(operator, opWeight);
            if (operatorMinistries.isEmpty()) {
                throw new ForbiddenException("Minister is not assigned to a valid Ministry");
            }

            if (!isSelf) {
                boolean sharesMinistry = target.getDesignationList().stream().anyMatch(d -> containsIgnoreCase(operatorMinistries, d));
                if (!sharesMinistry) {
                    throw new ForbiddenException("Ministers can only edit users within their own assigned Ministries");
                }
                if (isHighCommandRank(target, targetWeight)) {
                    throw new ForbiddenException("Ministers cannot modify High Command accounts");
                }
                if (targetWeight >= opWeight) {
                    throw new ForbiddenException("Ministers cannot modify other Minister accounts");
                }
                if (!containsAllIgnoreCase(operatorMinistries, requestedDesignations)) {
                    throw new ForbiddenException("Ministers cannot alter designations to outside their assigned ministries: " + operatorMinistries);
                }
                for (String role : requestedRoles) {
                    String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                    String targetDes = role.contains(":") ? role.substring(0, role.indexOf(":")).trim() : requestedDesignations.get(0);
                    if (!containsIgnoreCase(operatorMinistries, targetDes)) {
                        throw new ForbiddenException("Cannot assign role for unassigned ministry: " + targetDes);
                    }
                    int tokenWeight = resolveDynamicTokenWeight(role, List.of(targetDes));
                    if (!designationRoleService.isValidRoleForDesignation(targetDes, pureRole)
                            || pureRole.equalsIgnoreCase("Minister")
                            || pureRole.equalsIgnoreCase("High Command")
                            || pureRole.equalsIgnoreCase("Chief High Command")
                            || tokenWeight >= Math.max(opWeight, 1)) {
                        throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + targetDes);
                    }
                }
            } else {
                if (!containsAllIgnoreCase(operatorMinistries, requestedDesignations)) {
                    throw new ForbiddenException("Ministers cannot alter designations to outside their assigned ministries: " + operatorMinistries);
                }
                if (opWeight == 5 && operator.isMinister()) {
                    for (String minDes : requestedDesignations) {
                        boolean hasMinisterRoleForDept = requestedRoles.stream().anyMatch(r -> {
                            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
                            String dept = r.contains(":") ? r.substring(0, r.indexOf(":")).trim() : minDes;
                            return (pure.equalsIgnoreCase("Minister") || pure.toLowerCase().startsWith("chancellor")) && dept.equalsIgnoreCase(minDes);
                        });
                        if (!hasMinisterRoleForDept) {
                            throw new ForbiddenException("Ministers cannot remove their own Minister role in " + minDes);
                        }
                    }
                }
                for (String role : requestedRoles) {
                    String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                    String targetDes = role.contains(":") ? role.substring(0, role.indexOf(":")).trim() : requestedDesignations.get(0);
                    if (!containsIgnoreCase(operatorMinistries, targetDes)) {
                        throw new ForbiddenException("Cannot assign role for unassigned ministry: " + targetDes);
                    }
                    int tokenWeight = resolveDynamicTokenWeight(role, List.of(targetDes));
                    if (!designationRoleService.isValidRoleForDesignation(targetDes, pureRole)
                            || pureRole.equalsIgnoreCase("High Command")
                            || pureRole.equalsIgnoreCase("Chief High Command")) {
                        throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + targetDes);
                    }
                    assertSelfRoleBounds(target, opWeight, role, targetDes, tokenWeight);
                }
            }
        }

        if (request.getUserName() != null && !request.getUserName().isBlank()) {
            target.setFullName(request.getUserName().trim());
        }
        target.setDesignations(String.join(", ", requestedDesignations));
        target.setRoles(String.join(", ", requestedRoles));
        target.setRole(User.computePrimaryRole(requestedRoles, requestedDesignations));

        User updated = userRepository.save(target);
        log.info("Operator {} updated whitelisted user {}", operator.getEmail(), updated.getEmail());

        return mapToDto(updated);
    }

    @Transactional
    public void deleteWhitelistedUser(Long currentUserId, Long targetUserId) {
        User operator = getOperator(currentUserId);
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Whitelisted user not found with ID: " + targetUserId));

        if (operator.getId().equals(target.getId())) {
            throw new ForbiddenException("Administrators cannot delete their own account");
        }

        int opWeight = resolveDynamicUserWeight(operator);
        int targetWeight = resolveDynamicUserWeight(target);

        if (isChiefRank(target, targetWeight)) {
            throw new ForbiddenException("Chief High Command administrator accounts cannot be deleted");
        }

        boolean hasFullAccess = assertWhitelistAccessAndCheckFullAccess(
                operator,
                "Access Denied: Insufficient authorization to delete whitelisted users"
        );

        if (opWeight >= 9) {
            userRepository.delete(target);
            log.info("Chief High Command {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        if (opWeight == 8 || hasFullAccess) {
            if (isHighCommandRank(target, targetWeight) || targetWeight >= opWeight) {
                throw new ForbiddenException("High Command administrators cannot delete other High Command members");
            }
            userRepository.delete(target);
            log.info("High Command {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        if (rolePermissionsService == null && opWeight == 7) {
            if (targetWeight >= 7) {
                throw new ForbiddenException("Directors cannot delete personnel of rank R7 or higher");
            }
            userRepository.delete(target);
            log.info("Director {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        if (rolePermissionsService == null && opWeight == 6) {
            if (targetWeight >= 6) {
                throw new ForbiddenException("Executive Directors cannot delete personnel of rank R6 or higher");
            }
            userRepository.delete(target);
            log.info("Executive Director {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        if (isHighCommandRank(target, targetWeight)) {
            throw new ForbiddenException("Ministers cannot delete High Command accounts");
        }
        List<String> operatorMinistries = resolveScopedMinistries(operator, opWeight);
        if (operatorMinistries.isEmpty()) {
            throw new ForbiddenException("Minister is not assigned to a valid Ministry");
        }

        boolean sharesMinistry = target.getDesignationList().stream().anyMatch(d -> containsIgnoreCase(operatorMinistries, d));
        if (!sharesMinistry) {
            throw new ForbiddenException("Ministers can only delete users within their own assigned Ministries");
        }
        if (targetWeight >= opWeight) {
            throw new ForbiddenException("Ministers cannot delete other Minister accounts");
        }

        userRepository.delete(target);
        log.info("Minister {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
    }

    private User getOperator(Long currentUserId) {
        User operator = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated operator user not found"));
        if (!operator.isActive()) {
            throw new ForbiddenException("Operator account is inactive or suspended");
        }
        return operator;
    }

    private WhitelistedUserDto mapToDto(User user) {
        return WhitelistedUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .userName(user.getFullName())
                .provider(user.getProvider() != null ? user.getProvider().name() : "EMAIL")
                .role(user.getRole())
                .rankWeight(resolveDynamicUserWeight(user))
                .designations(user.getDesignationList())
                .roles(user.getRoleList())
                .discordId(user.getDiscordId())
                .discordUsername(user.getDiscordUsername())
                .discordAvatar(user.getDiscordAvatar())
                .discordLinked(user.isDiscordLinked())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
