package com.rng.identity.service;

import com.rng.common.exception.ConflictException;
import com.rng.common.exception.ForbiddenException;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.identity.domain.PersonnelHierarchy;
import com.rng.identity.domain.User;
import com.rng.identity.dto.UpdateWhitelistedUserRequest;
import com.rng.identity.dto.WhitelistUserRequest;
import com.rng.identity.dto.WhitelistedUserDto;
import com.rng.identity.repository.UserRepository;
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
            String ministry = PersonnelHierarchy.getMinisterMinistry(operator)
                    .orElseThrow(() -> new ForbiddenException("Minister account is not assigned to a valid Ministry designation"));

            return userRepository.findAll().stream()
                    .filter(user -> user.getDesignationList().contains(ministry))
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
        } else if (PersonnelHierarchy.isMinister(operator)) {
            String ministry = PersonnelHierarchy.getMinisterMinistry(operator)
                    .orElseThrow(() -> new ForbiddenException("Minister is not assigned to a valid Ministry"));

            // Minister can only assign their own ministry
            if (requestedDesignations.size() != 1 || !requestedDesignations.contains(ministry)) {
                throw new ForbiddenException("Ministers may only assign their own Ministry: " + ministry);
            }

            // Minister can only assign roles under their ministry (excluding Minister itself)
            List<String> validRoles = PersonnelHierarchy.getRolesForDesignation(ministry);
            for (String role : requestedRoles) {
                if (!validRoles.contains(role) || role.equalsIgnoreCase("Minister") || role.equalsIgnoreCase("High Command")) {
                    throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + ministry);
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

        if (PersonnelHierarchy.isHighCommand(operator)) {
            for (String des : requestedDesignations) {
                if (!PersonnelHierarchy.isValidDesignation(des)) {
                    throw new IllegalArgumentException("Invalid designation: " + des);
                }
            }
        } else if (PersonnelHierarchy.isMinister(operator)) {
            String ministry = PersonnelHierarchy.getMinisterMinistry(operator)
                    .orElseThrow(() -> new ForbiddenException("Minister is not assigned to a valid Ministry"));

            if (!target.getDesignationList().contains(ministry)) {
                throw new ForbiddenException("Ministers can only edit users within their own Ministry");
            }
            if (PersonnelHierarchy.isHighCommand(target) || PersonnelHierarchy.isMinister(target)) {
                throw new ForbiddenException("Ministers cannot modify High Command or Minister accounts");
            }
            if (requestedDesignations.size() != 1 || !requestedDesignations.contains(ministry)) {
                throw new ForbiddenException("Ministers cannot alter ministry designation to outside: " + ministry);
            }

            List<String> validRoles = PersonnelHierarchy.getRolesForDesignation(ministry);
            for (String role : requestedRoles) {
                if (!validRoles.contains(role) || role.equalsIgnoreCase("Minister") || role.equalsIgnoreCase("High Command")) {
                    throw new ForbiddenException("Cannot assign role '" + role + "' under ministry: " + ministry);
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

        if (PersonnelHierarchy.isHighCommand(target)) {
            throw new ForbiddenException("High Command administrator accounts cannot be deleted");
        }

        if (PersonnelHierarchy.isHighCommand(operator)) {
            userRepository.delete(target);
            log.info("High Command {} removed user {} from whitelist", operator.getEmail(), target.getEmail());
            return;
        }

        if (PersonnelHierarchy.isMinister(operator)) {
            String ministry = PersonnelHierarchy.getMinisterMinistry(operator)
                    .orElseThrow(() -> new ForbiddenException("Minister is not assigned to a valid Ministry"));

            if (!target.getDesignationList().contains(ministry)) {
                throw new ForbiddenException("Ministers can only delete users within their own Ministry");
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
