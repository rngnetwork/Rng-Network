// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity.service;

import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.identity.domain.AuthProvider;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.dto.WhitelistUserRequest;
import com.rednecksgaming.identity.dto.WhitelistedUserDto;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.personnel.roles.service.DesignationRoleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PersonnelHierarchyRefactorTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DesignationRoleService designationRoleService;

    @InjectMocks
    private WhitelistService whitelistService;

    private User chiefHighCommand;
    private User highCommand;
    private User director;
    private User executiveDirector;
    private User ministerTech;
    private User chancellorRivals;
    private User secretaryTech;
    private User juniorDevTech;
    private User secretaryChancellory;

    @BeforeEach
    void setUp() {
        chiefHighCommand = User.builder()
                .id(1L)
                .email("chc@rednecksgaming.com")
                .fullName("Chief HC")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_CHIEF_HIGH_COMMAND")
                .designations("Supreme")
                .roles("Chief High Command")
                .status("ACTIVE")
                .build();

        highCommand = User.builder()
                .id(2L)
                .email("hc@rednecksgaming.com")
                .fullName("High Command")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .status("ACTIVE")
                .build();

        director = User.builder()
                .id(3L)
                .email("director@rednecksgaming.com")
                .fullName("Director")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Director")
                .status("ACTIVE")
                .build();

        executiveDirector = User.builder()
                .id(4L)
                .email("exec_director@rednecksgaming.com")
                .fullName("Executive Director")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Executive Director")
                .status("ACTIVE")
                .build();

        ministerTech = User.builder()
                .id(5L)
                .email("minister_tech@rednecksgaming.com")
                .fullName("Minister Tech")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech")
                .roles("Minister")
                .status("ACTIVE")
                .build();

        chancellorRivals = User.builder()
                .id(6L)
                .email("chancellor_rivals@rednecksgaming.com")
                .fullName("Chancellor Rivals")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_MINISTER")
                .designations("Chancellory")
                .roles("Chancellor of Rivals")
                .status("ACTIVE")
                .build();

        secretaryTech = User.builder()
                .id(7L)
                .email("secretary_tech@rednecksgaming.com")
                .fullName("Secretary Tech")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Secretary")
                .status("ACTIVE")
                .build();

        juniorDevTech = User.builder()
                .id(8L)
                .email("dev_tech@rednecksgaming.com")
                .fullName("Dev Tech")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Junior Dev")
                .status("ACTIVE")
                .build();

        secretaryChancellory = User.builder()
                .id(9L)
                .email("sec_chancellory@rednecksgaming.com")
                .fullName("Secretary Chancellory")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Chancellory")
                .roles("Secretary")
                .status("ACTIVE")
                .build();
    }

    @Test
    void should_validate_roles_dynamically_from_database() {
        when(designationRoleService.isValidRoleForDesignation("des_tech", "Senior Dev")).thenReturn(true);
        when(designationRoleService.isValidRoleForDesignation("des_tech", "NonExistentRole")).thenReturn(false);

        assertThat(whitelistService.isDesignationRoleValid("des_tech", "Senior Dev")).isTrue();
        assertThat(whitelistService.isDesignationRoleValid("des_tech", "NonExistentRole")).isFalse();
    }

    @Test
    void should_reject_access_for_r4_to_r0_personnel() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(secretaryTech));

        assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(7L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access Denied");
    }

    @Test
    void should_allow_r9_to_see_all_personnel() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommand));
        when(userRepository.findAll()).thenReturn(List.of(
                chiefHighCommand, highCommand, director, executiveDirector, ministerTech, chancellorRivals, secretaryTech
        ));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(1L);
        assertThat(result).hasSize(7);
    }

    @Test
    void should_allow_r8_to_see_r9_r8_and_r7_down_to_r0() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(highCommand));
        when(userRepository.findAll()).thenReturn(List.of(
                chiefHighCommand, highCommand, director, executiveDirector, ministerTech, chancellorRivals, secretaryTech
        ));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(2L);
        assertThat(result).hasSize(7);
    }

    @Test
    void should_allow_r7_director_to_see_only_r6_down_to_r0() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(director));
        when(userRepository.findAll()).thenReturn(List.of(
                chiefHighCommand, highCommand, director, executiveDirector, ministerTech, chancellorRivals, secretaryTech
        ));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(3L);
        // Director cannot see CHC (R9), HC (R8), or Director (R7). Can see R6 (Executive Director), R5 (Minister, Chancellor), and R4 (Secretary).
        assertThat(result).extracting(WhitelistedUserDto::getEmail)
                .containsExactlyInAnyOrder(
                        "exec_director@rednecksgaming.com",
                        "minister_tech@rednecksgaming.com",
                        "chancellor_rivals@rednecksgaming.com",
                        "secretary_tech@rednecksgaming.com"
                );
    }

    @Test
    void should_allow_r6_executive_director_to_see_only_r5_down_to_r0() {
        when(userRepository.findById(4L)).thenReturn(Optional.of(executiveDirector));
        when(userRepository.findAll()).thenReturn(List.of(
                chiefHighCommand, highCommand, director, executiveDirector, ministerTech, chancellorRivals, secretaryTech
        ));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(4L);
        // Executive Director cannot see R9, R8, R7, or R6. Can see R5 (Minister, Chancellor) and R4 (Secretary).
        assertThat(result).extracting(WhitelistedUserDto::getEmail)
                .containsExactlyInAnyOrder(
                        "minister_tech@rednecksgaming.com",
                        "chancellor_rivals@rednecksgaming.com",
                        "secretary_tech@rednecksgaming.com"
                );
    }

    @Test
    void should_allow_r5_chancellor_to_see_only_r4_down_to_r0_in_chancellory() {
        when(userRepository.findById(6L)).thenReturn(Optional.of(chancellorRivals));
        when(userRepository.findAll()).thenReturn(List.of(
                chiefHighCommand, highCommand, director, executiveDirector, ministerTech, chancellorRivals, secretaryTech, secretaryChancellory
        ));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(6L);
        // Chancellor of Rivals can only see R4-R0 in Chancellory designation!
        assertThat(result).extracting(WhitelistedUserDto::getEmail)
                .containsExactly("sec_chancellory@rednecksgaming.com");
    }

    @Test
    void should_prevent_r8_from_editing_r9() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(highCommand));
        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommand));

        assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(2L, 1L))
                .isInstanceOf(ForbiddenException.class);
    }
}
