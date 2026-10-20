package com.rednecksgaming.identity.service;

import com.rednecksgaming.common.exception.ConflictException;
import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.identity.domain.PersonnelHierarchy;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.dto.UpdateWhitelistedUserRequest;
import com.rednecksgaming.identity.dto.WhitelistUserRequest;
import com.rednecksgaming.identity.dto.WhitelistedUserDto;
import com.rednecksgaming.identity.repository.UserRepository;
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

    @Transactional(readOnly = true)
    public List<WhitelistedUserDto> getWhitelistedUsers(Long currentUserId) {
        User operator = getOperator(currentUserId);

        if (PersonnelHierarchy.isHighCommand(operator)) {
            return userRepository.findAll().stream()
                    .map(this::mapToDto)
                    .toList();
        }

        if (PersonnelHierarchy.isMinister(operator)) {
            List<String> operatorMinistries = PersonnelHierarchy.getMinisterMinistries(operator);
            if (operatorMinistries.isEmpty()) {
                throw new ForbiddenException("Minister account is not assigned to a valid Ministry designation");
            }

            return userRepository.findAll().stream()
                    .filter(user -> user.getDesignationList().stream().anyMatch(operatorMinistries::contains))
                    .map(this::mapToDto)
                    .toList();
        }

        throw new ForbiddenException("Access Denied: Insufficient authorization scope to view whitelist");
    }

    @Transactional
    public WhitelistedUserDto createWhitelistedUser(Long currentUserId, WhitelistUserRequest request) {
        User operator = getOperator(currentUserId);

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new ConflictException("User with email " + request.getEmail() + " is already whitelisted");
        }

        List<String> requestedDesignations = request.getDesignations().stream().map(String::trim).toList();
        List<String> requestedRoles = request.getRoles().stream().map(String::trim).toList();

        if (PersonnelHierarchy.isHighCommand(operator)) {
            // High Command can assign arbitrary designations and roles
            for (String des : requestedDesignations) {
                if (!PersonnelHierarchy.isValidDesignation(des)) {
                    throw new IllegalArgumentException("Invalid designation: " + des);
                }
            }

            // Only Chief High Command can assign Chief High Command role
            if (!PersonnelHierarchy.isChiefHighCommand(operator)) {
                for (String role : requestedRoles) {
                    String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                    if (pureRole.equalsIgnoreCase("Chief High Command")) {
                        throw new ForbiddenException("Only Chief High Command can assign the Chief High Command role");
                    }
                }
            }
        } else if (PersonnelHierarchy.isMinister(operator)) {
            List<String> operatorMinistries = PersonnelHierarchy.getMinisterMinistries(operator);
            if (operatorMinistries.isEmpty()) {
                throw new ForbiddenException("Minister is not assigned to a valid Ministry");
            }

            // Minister can only assign designations within their assigned ministries
            if (requestedDesignations.isEmpty() || !operatorMinistries.containsAll(requestedDesignations)) {
                throw new ForbiddenException("Ministers may only assign their own assigned ministries: " + operatorMinistries);
            }

            // Minister can only assign roles under their assigned ministries (excluding Minister itself for subordinates)
            for (String role : requestedRoles) {
                String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                String targetDes = role.contains(":") ? role.substring(0, role.indexOf(":")).trim() : requestedDesignations.get(0);
                if (!operatorMinistries.contains(targetDes)) {
                    throw new ForbiddenException("Cannot assign role for unassigned ministry: " + targetDes);
                }
                List<String> validRoles = PersonnelHierarchy.getRolesForDesignation(targetDes);
                if (!validRoles.contains(pureRole) || pureRole.equalsIgnoreCase("Minister") || pureRole.equalsIgnoreCase("High Command") || pureRole.equalsIgnoreCase("Chief High Command")) {
                    throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + targetDes);
                }
            }
        } else {
            throw new ForbiddenException("Access Denied: Only High Command and Ministers can whitelist members");
        }

        String primaryRole = PersonnelHierarchy.computePrimaryRole(requestedRoles, requestedDesignations);

        User newUser = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .fullName(request.getUserName().trim())
                .provider(request.getProvider())
                .password(null) // Password set upon first login
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

        List<String> requestedDesignations = request.getDesignations().stream().map(String::trim).toList();
        List<String> requestedRoles = request.getRoles().stream().map(String::trim).toList();

        if (PersonnelHierarchy.isChiefHighCommand(operator)) {
            // Chief High Command can modify regular High Command, Ministers, and Users
            // Peer protection: Chief HC cannot modify other Chief HC members (unless editing self)
            if (PersonnelHierarchy.isChiefHighCommand(target) && !operator.getId().equals(target.getId())) {
                throw new ForbiddenException("Chief High Command administrators cannot modify other Chief High Command members");
            }
            for (String des : requestedDesignations) {
                if (!PersonnelHierarchy.isValidDesignation(des)) {
                    throw new IllegalArgumentException("Invalid designation: " + des);
                }
            }
        } else if (PersonnelHierarchy.isHighCommand(operator)) {
            // Regular High Command cannot modify other High Command or Chief High Command members
            if (PersonnelHierarchy.isHighCommand(target) && !operator.getId().equals(target.getId())) {
                throw new ForbiddenException("High Command administrators cannot modify other High Command members");
            }
            // Regular High Command cannot assign Chief High Command role
            for (String role : requestedRoles) {
                String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
                if (pureRole.equalsIgnoreCase("Chief High Command")) {
                    throw new ForbiddenException("Only Chief High Command can assign the Chief High Command role");
                }
            }
            for (String des : requestedDesignations) {
                if (!PersonnelHierarchy.isValidDesignation(des)) {
                    throw new IllegalArgumentException("Invalid designation: " + des);
                }
            }
        } else if (PersonnelHierarchy.isMinister(operator)) {
            List<String> operatorMinistries = PersonnelHierarchy.getMinisterMinistries(operator);
            if (operatorMinistries.isEmpty()) {
                throw new ForbiddenException("Minister is not assigned to a valid Ministry");
            }

            boolean isSelf = operator.getId().equals(target.getId());

            if (!isSelf) {
                boolean sharesMinistry = target.getDesignationList().stream().anyMatch(operatorMinistries::contains);
                if (!sharesMinistry) {
                    throw new ForbiddenException("Ministers can only edit users within their own assigned Ministries");
                }
                if (PersonnelHierarchy.isHighCommand(target)) {
                    throw new ForbiddenException("Ministers cannot modify High Command accounts");
                }
                if (PersonnelHierarchy.isMinister(target)) {
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
                    List<String> validRoles = PersonnelHierarchy.getRolesForDesignation(targetDes);
                    if (!validRoles.contains(pureRole) || pureRole.equalsIgnoreCase("Minister") || pureRole.equalsIgnoreCase("High Command") || pureRole.equalsIgnoreCase("Chief High Command")) {
                        throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + targetDes);
                    }
                }
            } else {
                // Minister editing their own account
                if (requestedDesignations.isEmpty() || !operatorMinistries.containsAll(requestedDesignations)) {
                    throw new ForbiddenException("Ministers cannot alter designations to outside their assigned ministries: " + operatorMinistries);
                }

                // Must retain "Minister" role for each of their assigned ministries in requestedDesignations
                for (String minDes : requestedDesignations) {
                    boolean hasMinisterRoleForDept = requestedRoles.stream().anyMatch(r -> {
                        String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
                        String dept = r.contains(":") ? r.substring(0, r.indexOf(":")).trim() : minDes;
                        return pure.equalsIgnoreCase("Minister") && dept.equalsIgnoreCase(minDes);
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
                    List<String> validRoles = PersonnelHierarchy.getRolesForDesignation(targetDes);
                    if (!validRoles.contains(pureRole) || pureRole.equalsIgnoreCase("High Command") || pureRole.equalsIgnoreCase("Chief High Command")) {
                        throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + targetDes);
                    }
                }
            }
        } else {
            throw new ForbiddenException("Access Denied: Insufficient authorization scope to update whitelisted user");
        }

        if (request.getUserName() != null && !request.getUserName().isBlank()) {
            target.setFullName(request.getUserName().trim());
        }
        target.setDesignations(String.join(", ", requestedDesignations));
        target.setRoles(String.join(", ", requestedRoles));
        target.setRole(PersonnelHierarchy.computePrimaryRole(requestedRoles, requestedDesignations));

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

        if (PersonnelHierarchy.isChiefHighCommand(target)) {
            throw new ForbiddenException("Chief High Command administrator accounts cannot be deleted");
        }

        if (PersonnelHierarchy.isChiefHighCommand(operator)) {
            // Chief High Command CAN delete regular High Command members seamlessly!
            userRepository.delete(target);
            log.info("Chief High Command {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        if (PersonnelHierarchy.isHighCommand(operator)) {
            if (PersonnelHierarchy.isHighCommand(target)) {
                throw new ForbiddenException("High Command administrators cannot delete other High Command members");
            }
            userRepository.delete(target);
            log.info("High Command {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        if (PersonnelHierarchy.isMinister(operator)) {
            if (PersonnelHierarchy.isHighCommand(target)) {
                throw new ForbiddenException("Ministers cannot delete High Command accounts");
            }
            List<String> operatorMinistries = PersonnelHierarchy.getMinisterMinistries(operator);
            if (operatorMinistries.isEmpty()) {
                throw new ForbiddenException("Minister is not assigned to a valid Ministry");
            }

            boolean sharesMinistry = target.getDesignationList().stream().anyMatch(operatorMinistries::contains);
            if (!sharesMinistry) {
                throw new ForbiddenException("Ministers can only delete users within their own assigned Ministries");
            }
            if (PersonnelHierarchy.isMinister(target)) {
                throw new ForbiddenException("Ministers cannot delete other Minister accounts");
            }

            userRepository.delete(target);
            log.info("Minister {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        throw new ForbiddenException("Access Denied: Insufficient authorization to delete whitelisted users");
    }

    private User getOperator(Long currentUserId) {
        return userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated operator user not found"));
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
