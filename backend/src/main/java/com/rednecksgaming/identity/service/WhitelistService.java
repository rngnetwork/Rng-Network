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

@Slf4j
@Service
@RequiredArgsConstructor
public class WhitelistService {

    private final UserRepository userRepository;
    private final DesignationRoleService designationRoleService;
    private final RolePermissionsService rolePermissionsService;
    private final GranularPermissionEvaluator granularPermissionEvaluator;

    private boolean assertWhitelistAccessAndCheckFullAccess(User operator, String denyMessage) {
        EffectivePermissionsDto effective = rolePermissionsService.computeEffectivePermissions(operator, null);
        if (!granularPermissionEvaluator.isFeatureEnabled(effective, "dashboard.whitelist")) {
            throw new ForbiddenException(denyMessage);
        }
        return granularPermissionEvaluator.hasWhitelistFullAccess(effective);
    }

    private List<String> resolveScopedMinistries(User operator) {
        List<String> ministerMinistries = operator.getMinisterMinistries();
        if (!ministerMinistries.isEmpty()) {
            return ministerMinistries;
        }
        return operator.getDesignationList();
    }

    public boolean isDesignationRoleValid(String designation, String role) {
        return designationRoleService.isValidRoleForDesignation(designation, role);
    }

    @Transactional(readOnly = true)
    public List<WhitelistedUserDto> getWhitelistedUsers(Long currentUserId) {
        return getWhitelistedUsers(currentUserId, null);
    }

    @Transactional(readOnly = true)
    public List<WhitelistedUserDto> getWhitelistedUsers(Long currentUserId, String ministry) {
        User operator = getOperator(currentUserId);
        int opWeight = operator.getRankWeight();
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

        // R7 (Director): Sees R6 - R0
        if (opWeight == 7) {
            return allUsers.stream()
                    .filter(u -> u.getRankWeight() <= 6)
                    .map(this::mapToDto)
                    .toList();
        }

        // R6 (Executive Director): Sees R5 - R0
        if (opWeight == 6) {
            return allUsers.stream()
                    .filter(u -> u.getRankWeight() <= 5)
                    .map(this::mapToDto)
                    .toList();
        }

        // R5 (Minister / Chancellor) or granted R4-R0 without fullAccess: Scoped to their assigned ministries
        List<String> operatorMinistries = resolveScopedMinistries(operator);
        if (operatorMinistries.isEmpty()) {
            throw new ForbiddenException("Minister account is not assigned to a valid Ministry designation");
        }

        if (ministry != null && !ministry.isBlank()) {
            boolean authorizedForMinistry = operatorMinistries.stream().anyMatch(m -> m.equalsIgnoreCase(ministry.trim()));
            if (!authorizedForMinistry) {
                throw new ForbiddenException("Ministers may only query their own assigned ministries: " + operatorMinistries);
            }
        }

        return allUsers.stream()
                .filter(u -> (u.getRankWeight() <= 4 || u.getId().equals(operator.getId()))
                        && u.getDesignationList().stream().anyMatch(operatorMinistries::contains))
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public WhitelistedUserDto createWhitelistedUser(Long currentUserId, WhitelistUserRequest request) {
        User operator = getOperator(currentUserId);

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new ConflictException("User with email " + request.getEmail() + " is already whitelisted");
        }

        int opWeight = operator.getRankWeight();
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
                    if (User.getRoleRankWeight(role) >= 9) {
                        throw new ForbiddenException("Only Chief High Command can assign the Chief High Command role");
                    }
                }
            }
        } else if (opWeight == 7) {
            for (String role : requestedRoles) {
                if (User.getRoleRankWeight(role) >= 7) {
                    throw new ForbiddenException("Directors can only assign roles from R6 down to R0");
                }
            }
        } else if (opWeight == 6) {
            for (String role : requestedRoles) {
                if (User.getRoleRankWeight(role) >= 6) {
                    throw new ForbiddenException("Executive Directors can only assign roles from R5 down to R0");
                }
            }
        } else if (opWeight <= 5) {
            List<String> operatorMinistries = resolveScopedMinistries(operator);
            if (operatorMinistries.isEmpty()) {
                throw new ForbiddenException("Minister is not assigned to a valid Ministry");
            }
            if (requestedDesignations.isEmpty() || !operatorMinistries.containsAll(requestedDesignations)) {
                throw new ForbiddenException("Ministers may only assign their own assigned ministries: " + operatorMinistries);
            }
            for (String role : requestedRoles) {
                String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                String targetDes = role.contains(":") ? role.substring(0, role.indexOf(":")).trim() : requestedDesignations.get(0);
                if (!operatorMinistries.contains(targetDes)) {
                    throw new ForbiddenException("Cannot assign role for unassigned ministry: " + targetDes);
                }
                if (!designationRoleService.isValidRoleForDesignation(targetDes, pureRole)
                        || pureRole.equalsIgnoreCase("Minister")
                        || pureRole.equalsIgnoreCase("High Command")
                        || pureRole.equalsIgnoreCase("Chief High Command")
                        || User.getRoleRankWeight(pureRole) >= 5) {
                    throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + targetDes);
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

        int opWeight = operator.getRankWeight();
        int targetWeight = target.getRankWeight();

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
            if (!isSelf && target.isChiefHighCommand()) {
                throw new ForbiddenException("Chief High Command administrators cannot modify other Chief High Command members");
            }
        } else if (opWeight == 8 || hasFullAccess) {
            if (!isSelf && target.isHighCommand()) {
                throw new ForbiddenException("High Command administrators cannot modify other High Command members");
            }
            for (String role : requestedRoles) {
                String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                if (pureRole.equalsIgnoreCase("Chief High Command") || User.getRoleRankWeight(pureRole) >= 9) {
                    throw new ForbiddenException("Only Chief High Command can assign the Chief High Command role");
                }
            }
        } else if (opWeight == 7) {
            if (!isSelf && targetWeight >= 7) {
                throw new ForbiddenException("Directors cannot modify personnel of rank R7 or higher");
            }
            for (String role : requestedRoles) {
                if (User.getRoleRankWeight(role) >= 7) {
                    throw new ForbiddenException("Directors can only assign roles from R6 down to R0");
                }
            }
        } else if (opWeight == 6) {
            if (!isSelf && targetWeight >= 6) {
                throw new ForbiddenException("Executive Directors cannot modify personnel of rank R6 or higher");
            }
            for (String role : requestedRoles) {
                if (User.getRoleRankWeight(role) >= 6) {
                    throw new ForbiddenException("Executive Directors can only assign roles from R5 down to R0");
                }
            }
        } else if (opWeight <= 5) {
            List<String> operatorMinistries = resolveScopedMinistries(operator);
            if (operatorMinistries.isEmpty()) {
                throw new ForbiddenException("Minister is not assigned to a valid Ministry");
            }

            if (!isSelf) {
                boolean sharesMinistry = target.getDesignationList().stream().anyMatch(operatorMinistries::contains);
                if (!sharesMinistry) {
                    throw new ForbiddenException("Ministers can only edit users within their own assigned Ministries");
                }
                if (target.isHighCommand()) {
                    throw new ForbiddenException("Ministers cannot modify High Command accounts");
                }
                if (target.isMinister()) {
                    throw new ForbiddenException("Ministers cannot modify other Minister accounts");
                }
                if (requestedDesignations.isEmpty() || !operatorMinistries.containsAll(requestedDesignations)) {
                    throw new ForbiddenException("Ministers cannot alter designations to outside their assigned ministries: " + operatorMinistries);
                }
                for (String role : requestedRoles) {
                    String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                    String targetDes = role.contains(":") ? role.substring(0, role.indexOf(":")).trim() : requestedDesignations.get(0);
                    if (!operatorMinistries.contains(targetDes)) {
                        throw new ForbiddenException("Cannot assign role for unassigned ministry: " + targetDes);
                    }
                    if (!designationRoleService.isValidRoleForDesignation(targetDes, pureRole)
                            || pureRole.equalsIgnoreCase("Minister")
                            || pureRole.equalsIgnoreCase("High Command")
                            || pureRole.equalsIgnoreCase("Chief High Command")
                            || User.getRoleRankWeight(pureRole) >= 5) {
                        throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + targetDes);
                    }
                }
            } else {
                if (requestedDesignations.isEmpty() || !operatorMinistries.containsAll(requestedDesignations)) {
                    throw new ForbiddenException("Ministers cannot alter designations to outside their assigned ministries: " + operatorMinistries);
                }
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
                for (String role : requestedRoles) {
                    String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                    String targetDes = role.contains(":") ? role.substring(0, role.indexOf(":")).trim() : requestedDesignations.get(0);
                    if (!operatorMinistries.contains(targetDes)) {
                        throw new ForbiddenException("Cannot assign role for unassigned ministry: " + targetDes);
                    }
                    if (!designationRoleService.isValidRoleForDesignation(targetDes, pureRole)
                            || pureRole.equalsIgnoreCase("High Command")
                            || pureRole.equalsIgnoreCase("Chief High Command")
                            || User.getRoleRankWeight(pureRole) >= 8) {
                        throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + targetDes);
                    }
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

        if (target.isChiefHighCommand()) {
            throw new ForbiddenException("Chief High Command administrator accounts cannot be deleted");
        }

        int opWeight = operator.getRankWeight();
        int targetWeight = target.getRankWeight();

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
            if (target.isHighCommand()) {
                throw new ForbiddenException("High Command administrators cannot delete other High Command members");
            }
            userRepository.delete(target);
            log.info("High Command {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        if (opWeight == 7) {
            if (targetWeight >= 7) {
                throw new ForbiddenException("Directors cannot delete personnel of rank R7 or higher");
            }
            userRepository.delete(target);
            log.info("Director {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        if (opWeight == 6) {
            if (targetWeight >= 6) {
                throw new ForbiddenException("Executive Directors cannot delete personnel of rank R6 or higher");
            }
            userRepository.delete(target);
            log.info("Executive Director {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        if (opWeight <= 5) {
            if (target.isHighCommand()) {
                throw new ForbiddenException("Ministers cannot delete High Command accounts");
            }
            List<String> operatorMinistries = resolveScopedMinistries(operator);
            if (operatorMinistries.isEmpty()) {
                throw new ForbiddenException("Minister is not assigned to a valid Ministry");
            }

            boolean sharesMinistry = target.getDesignationList().stream().anyMatch(operatorMinistries::contains);
            if (!sharesMinistry) {
                throw new ForbiddenException("Ministers can only delete users within their own assigned Ministries");
            }
            if (target.isMinister()) {
                throw new ForbiddenException("Ministers cannot delete other Minister accounts");
            }

            userRepository.delete(target);
            log.info("Minister {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        throw new ForbiddenException("Access Denied: Insufficient authorization to delete whitelisted users");
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
