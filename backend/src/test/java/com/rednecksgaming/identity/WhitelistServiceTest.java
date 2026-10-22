package com.rednecksgaming.identity;

import com.rednecksgaming.common.exception.ConflictException;
import com.rednecksgaming.common.exception.ForbiddenException;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.identity.domain.AuthProvider;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.dto.UpdateWhitelistedUserRequest;
import com.rednecksgaming.identity.dto.WhitelistUserRequest;
import com.rednecksgaming.identity.dto.WhitelistedUserDto;
import com.rednecksgaming.identity.repository.UserRepository;
import com.rednecksgaming.identity.service.WhitelistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class WhitelistServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WhitelistService whitelistService;

    private User chiefHighCommandUser;
    private User highCommandUser;
    private User ministerTechUser;
    private User regularDevUser;

    @BeforeEach
    void setUp() {
        chiefHighCommandUser = User.builder()
                .id(1L)
                .email("arzenic@rednecksgaming.com")
                .fullName("Arzenic")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("Chief High Command, High Command")
                .status("ACTIVE")
                .build();

        highCommandUser = User.builder()
                .id(10L)
                .email("regular.hc@rng.com")
                .fullName("Regular HC")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .status("ACTIVE")
                .build();

        ministerTechUser = User.builder()
                .id(2L)
                .email("minister.tech@rng.com")
                .fullName("Tech Minister")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech")
                .roles("Minister")
                .status("ACTIVE")
                .build();

        regularDevUser = User.builder()
                .id(3L)
                .email("dev@rng.com")
                .fullName("Junior Dev")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Tech")
                .roles("Junior Dev")
                .status("ACTIVE")
                .build();
    }

    // =========================================================================
    // getWhitelistedUsers Tests
    // =========================================================================

    @Test
    @DisplayName("getWhitelistedUsers: throws ResourceNotFoundException when operator does not exist")
    void testGetWhitelistedUsers_operatorNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Authenticated operator user not found");
    }

    @Test
    @DisplayName("High Command can view all whitelisted users")
    void testHighCommandGetWhitelistedUsers() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.findAll()).thenReturn(List.of(highCommandUser, ministerTechUser, regularDevUser));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(10L);

        assertThat(result).hasSize(3);
    }

    @Test
    @DisplayName("Minister can only view users in their own ministry")
    void testMinisterGetWhitelistedUsersScoped() {
        User internalUser = User.builder()
                .id(4L)
                .email("internal@rng.com")
                .fullName("Agent")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Internal affairs")
                .roles("Agent")
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findAll()).thenReturn(List.of(highCommandUser, ministerTechUser, regularDevUser, internalUser));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(2L);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(WhitelistedUserDto::getEmail)
                .containsExactlyInAnyOrder("minister.tech@rng.com", "dev@rng.com");
    }

    @Test
    @DisplayName("getWhitelistedUsers: Minister with no valid ministry throws ForbiddenException")
    void testMinisterGetWhitelistedUsers_noMinistriesAssigned() {
        User ministerWithoutDept = User.builder()
                .id(25L)
                .email("homeless.minister@rng.com")
                .role("ROLE_MINISTER")
                .designations("Chancellory")
                .roles("Minister")
                .build();

        when(userRepository.findById(25L)).thenReturn(Optional.of(ministerWithoutDept));

        assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(25L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Minister account is not assigned to a valid Ministry designation");
    }

    @Test
    @DisplayName("getWhitelistedUsers: regular user is forbidden from viewing whitelist")
    void testRegularUserCannotViewWhitelist() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));

        assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(3L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access Denied: Insufficient authorization scope to view whitelist");
    }

    @Test
    @DisplayName("Multi-ministry minister can view personnel across all assigned ministries")
    void testMultiMinistryGetWhitelistedUsers() {
        User multiMinister = User.builder()
                .id(5L)
                .email("dual.minister@rng.com")
                .fullName("Dual Minister")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech, Ministry of Finances")
                .roles("Ministry of Tech:Minister, Ministry of Finances:Minister")
                .build();

        User financeUser = User.builder()
                .id(6L)
                .email("finance@rng.com")
                .fullName("Finance Officer")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Finances")
                .roles("Regional treasurer")
                .build();

        User internalUser = User.builder()
                .id(7L)
                .email("internal@rng.com")
                .fullName("Internal Agent")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_USER")
                .designations("Ministry of Internal affairs")
                .roles("Agent")
                .build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(multiMinister));
        when(userRepository.findAll()).thenReturn(List.of(highCommandUser, multiMinister, regularDevUser, financeUser, internalUser));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(5L);

        assertThat(result).hasSize(3);
        assertThat(result).extracting(WhitelistedUserDto::getEmail)
                .containsExactlyInAnyOrder("dual.minister@rng.com", "dev@rng.com", "finance@rng.com");
    }

    @Test
    @DisplayName("getWhitelistedUsers: inactive operator triggers permission decay check and throws ForbiddenException")
    void testOperatorPermissionDecay_inactiveOperatorThrowsForbidden() {
        User suspendedOperator = User.builder()
                .id(99L)
                .email("decayed.operator@rng.com")
                .role("ROLE_HIGH_COMMAND")
                .status("SUSPENDED")
                .build();

        when(userRepository.findById(99L)).thenReturn(Optional.of(suspendedOperator));

        assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(99L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Operator account is inactive or suspended");
    }

    @Test
    @DisplayName("getWhitelistedUsers with ministry: High Command filters accurately by ministry")
    void testHighCommandGetWhitelistedUsers_ministryFilter() {
        User financeUser = User.builder()
                .id(6L)
                .email("finance@rng.com")
                .designations("Ministry of Finances")
                .roles("Treasurer")
                .status("ACTIVE")
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.findAll()).thenReturn(List.of(highCommandUser, ministerTechUser, regularDevUser, financeUser));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(10L, "Ministry of Tech");

        assertThat(result).hasSize(2);
        assertThat(result).extracting(WhitelistedUserDto::getEmail)
                .containsExactlyInAnyOrder("minister.tech@rng.com", "dev@rng.com");
    }

    @Test
    @DisplayName("getWhitelistedUsers with blank ministry: delegates to unfiltered listing")
    void testHighCommandGetWhitelistedUsers_blankMinistryFilter() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.findAll()).thenReturn(List.of(highCommandUser, ministerTechUser, regularDevUser));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(10L, "   ");

        assertThat(result).hasSize(3);
    }

    @Test
    @DisplayName("getWhitelistedUsers with ministry: Minister can query their own assigned ministry")
    void testMinisterGetWhitelistedUsers_assignedMinistry() {
        User otherTech = User.builder()
                .id(12L)
                .email("tech2@rng.com")
                .designations("Ministry of Tech")
                .roles("Tech Specialist")
                .status("ACTIVE")
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findAll()).thenReturn(List.of(ministerTechUser, regularDevUser, otherTech));

        List<WhitelistedUserDto> result = whitelistService.getWhitelistedUsers(2L, "Ministry of Tech");

        assertThat(result).hasSize(3);
    }

    @Test
    @DisplayName("getWhitelistedUsers with ministry: Minister querying unassigned ministry throws ForbiddenException")
    void testMinisterGetWhitelistedUsers_unassignedMinistryThrowsForbidden() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));

        assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(2L, "Ministry of Finances"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers may only query their own assigned ministries");
    }

    @Test
    @DisplayName("getWhitelistedUsers with ministry: Minister with no assigned dept querying ministry throws ForbiddenException")
    void testMinisterGetWhitelistedUsers_noDeptWithMinistryThrowsForbidden() {
        User homelessMinister = User.builder()
                .id(26L)
                .role("ROLE_MINISTER")
                .designations("Chancellory")
                .status("ACTIVE")
                .build();

        when(userRepository.findById(26L)).thenReturn(Optional.of(homelessMinister));

        assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(26L, "Ministry of Tech"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Minister account is not assigned to a valid Ministry designation");
    }

    @Test
    @DisplayName("getWhitelistedUsers with ministry: Regular user querying ministry throws ForbiddenException")
    void testRegularUserGetWhitelistedUsers_ministryThrowsForbidden() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));

        assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(3L, "Ministry of Tech"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access Denied: Insufficient authorization scope to view whitelist");
    }

    // =========================================================================
    // createWhitelistedUser Tests
    // =========================================================================

    @Test
    @DisplayName("createWhitelistedUser: throws ConflictException when email is already whitelisted")
    void testCreateWhitelistedUser_duplicateEmail() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("dev@rng.com")
                .userName("Duplicate Dev")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.existsByEmail("dev@rng.com")).thenReturn(true);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(10L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already whitelisted");
    }

    @Test
    @DisplayName("High Command can whitelist users with multi-designations and multi-roles")
    void testHighCommandCreateWhitelistedUser() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("chancellor@rng.com")
                .userName("New Chancellor")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Chancellory", "Supreme"))
                .roles(List.of("Chancellor of Rivals", "High Command"))
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.existsByEmail("chancellor@rng.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(100L);
            return u;
        });

        WhitelistedUserDto created = whitelistService.createWhitelistedUser(10L, request);

        assertThat(created.getEmail()).isEqualTo("chancellor@rng.com");
        assertThat(created.getRole()).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(created.getDesignations()).contains("Chancellory", "Supreme");
    }

    @Test
    @DisplayName("createWhitelistedUser: High Command specifying invalid designation throws IllegalArgumentException")
    void testHighCommandCreate_invalidDesignation() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("newuser@rng.com")
                .userName("New User")
                .designations(List.of("NonExistentMinistry"))
                .roles(List.of("Junior Dev"))
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.existsByEmail("newuser@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(10L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid designation: NonExistentMinistry");
    }

    @Test
    @DisplayName("createWhitelistedUser: regular High Command cannot assign Chief High Command role")
    void testRegularHighCommandCannotAssignChiefHighCommand() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("newchief@rng.com")
                .userName("Pretender Chief")
                .designations(List.of("Supreme"))
                .roles(List.of("Chief High Command"))
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.existsByEmail("newchief@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(10L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only Chief High Command can assign the Chief High Command role");

        WhitelistUserRequest prefixedRequest = WhitelistUserRequest.builder()
                .email("newchief2@rng.com")
                .userName("Pretender Chief 2")
                .designations(List.of("Supreme"))
                .roles(List.of("Supreme : Chief High Command"))
                .build();

        when(userRepository.existsByEmail("newchief2@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(10L, prefixedRequest))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only Chief High Command can assign the Chief High Command role");
    }

    @Test
    @DisplayName("createWhitelistedUser: Chief High Command CAN assign Chief High Command role")
    void testChiefHighCommandCanAssignChiefHighCommand() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("newchief@rng.com")
                .userName("Second Chief")
                .designations(List.of("Supreme"))
                .roles(List.of("Chief High Command"))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));
        when(userRepository.existsByEmail("newchief@rng.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        WhitelistedUserDto result = whitelistService.createWhitelistedUser(1L, request);
        assertThat(result.getEmail()).isEqualTo("newchief@rng.com");
    }

    @Test
    @DisplayName("createWhitelistedUser: Minister with empty ministries throws ForbiddenException")
    void testMinisterCreate_noAssignedMinistries() {
        User unassignedMinister = User.builder()
                .id(26L)
                .email("nomad@rng.com")
                .role("ROLE_MINISTER")
                .designations("Chancellory")
                .roles("Minister")
                .build();

        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("someone@rng.com")
                .userName("Someone")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        when(userRepository.findById(26L)).thenReturn(Optional.of(unassignedMinister));
        when(userRepository.existsByEmail("someone@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(26L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Minister is not assigned to a valid Ministry");
    }

    @Test
    @DisplayName("Minister cannot assign designations other than their own ministry")
    void testMinisterCannotAssignOtherDesignations() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("test@rng.com")
                .userName("Test User")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Ministry of Internal affairs"))
                .roles(List.of("Agent"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.existsByEmail("test@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(2L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers may only assign their own assigned ministries");

        WhitelistUserRequest emptyDesRequest = WhitelistUserRequest.builder()
                .email("test2@rng.com")
                .userName("Test User 2")
                .designations(List.of())
                .roles(List.of("Junior Dev"))
                .build();

        when(userRepository.existsByEmail("test2@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(2L, emptyDesRequest))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers may only assign their own assigned ministries");
    }

    @Test
    @DisplayName("createWhitelistedUser: Minister assigning role under unassigned ministry prefix throws ForbiddenException")
    void testMinisterCreate_unassignedMinistryRolePrefix() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("test@rng.com")
                .userName("Test User")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Ministry of Internal affairs:Agent"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.existsByEmail("test@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(2L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cannot assign role for unassigned ministry");
    }

    @Test
    @DisplayName("Minister cannot assign Minister role or High Command role")
    void testMinisterCannotAssignPrivilegedRoles() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("test@rng.com")
                .userName("Test User")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Minister"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.existsByEmail("test@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(2L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cannot assign role 'Minister'");

        WhitelistUserRequest hcRequest = WhitelistUserRequest.builder()
                .email("test_hc@rng.com")
                .userName("Test User")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("High Command"))
                .build();

        when(userRepository.existsByEmail("test_hc@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(2L, hcRequest))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cannot assign role 'High Command'");
    }

    @Test
    @DisplayName("createWhitelistedUser: Minister successfully whitelists subordinate user in their ministry")
    void testMinisterCreate_validSubordinate() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("newdev@rng.com")
                .userName("New Tech Specialist")
                .provider(AuthProvider.EMAIL)
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Tech Specialist"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.existsByEmail("newdev@rng.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(50L);
            return u;
        });

        WhitelistedUserDto created = whitelistService.createWhitelistedUser(2L, request);

        assertThat(created.getEmail()).isEqualTo("newdev@rng.com");
        assertThat(created.getRole()).isEqualTo("ROLE_USER");
        assertThat(created.getDesignations()).contains("Ministry of Tech");
        assertThat(created.getRoles()).contains("Tech Specialist");
    }

    @Test
    @DisplayName("Regular users are forbidden from whitelisting")
    void testRegularUserForbidden() {
        WhitelistUserRequest request = WhitelistUserRequest.builder()
                .email("test@rng.com")
                .userName("Test User")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));
        when(userRepository.existsByEmail("test@rng.com")).thenReturn(false);

        assertThatThrownBy(() -> whitelistService.createWhitelistedUser(3L, request))
                .isInstanceOf(ForbiddenException.class);
    }

    // =========================================================================
    // updateWhitelistedUser Tests
    // =========================================================================

    @Test
    @DisplayName("updateWhitelistedUser: throws ResourceNotFoundException when target user not found")
    void testUpdateWhitelistedUser_targetNotFound() {
        UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                .userName("Name")
                .designations(List.of("Supreme"))
                .roles(List.of("High Command"))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(1L, 999L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Whitelisted user not found with ID: 999");
    }

    @Test
    @DisplayName("Chief High Command can modify regular High Command members seamlessly")
    void testChiefHighCommandCanModifyRegularHighCommand() {
        User regularHc = User.builder()
                .id(20L)
                .email("peer.hc@rng.com")
                .fullName("Peer HC")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .build();

        UpdateWhitelistedUserRequest updateReq = UpdateWhitelistedUserRequest.builder()
                .userName("Updated Peer HC")
                .designations(List.of("Supreme", "Chancellory"))
                .roles(List.of("High Command", "Chancellor of Rivals"))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));
        when(userRepository.findById(20L)).thenReturn(Optional.of(regularHc));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        WhitelistedUserDto result = whitelistService.updateWhitelistedUser(1L, 20L, updateReq);

        assertThat(result.getUserName()).isEqualTo("Updated Peer HC");
        assertThat(result.getDesignations()).contains("Supreme", "Chancellory");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Chief High Command cannot modify other Chief High Command members")
    void testChiefHighCommandCannotModifyOtherChiefHighCommand() {
        User otherChief = User.builder()
                .id(2L)
                .email("other.chief@rng.com")
                .role("ROLE_CHIEF_HIGH_COMMAND")
                .designations("Supreme")
                .roles("Chief High Command")
                .build();

        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Attempted Edit")
                .designations(List.of("Supreme"))
                .roles(List.of("High Command"))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(otherChief));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(1L, 2L, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Chief High Command administrators cannot modify other Chief High Command members");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Chief High Command can update their own account")
    void testChiefHighCommandCanUpdateSelf() {
        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Arzenic Renamed")
                .designations(List.of("Supreme"))
                .roles(List.of("Chief High Command, High Command"))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        WhitelistedUserDto result = whitelistService.updateWhitelistedUser(1L, 1L, req);
        assertThat(result.getUserName()).isEqualTo("Arzenic Renamed");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Chief High Command specifying invalid designation throws IllegalArgumentException")
    void testChiefHighCommandUpdate_invalidDesignation() {
        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Arzenic")
                .designations(List.of("FakeDesignation"))
                .roles(List.of("Chief High Command"))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));
        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(1L, 1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid designation: FakeDesignation");
    }

    @Test
    @DisplayName("Regular High Command cannot modify other High Command accounts")
    void testRegularHighCommandCannotModifyOtherHighCommand() {
        User regularHc2 = User.builder()
                .id(20L)
                .email("hc2@rng.com")
                .fullName("HC 2")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .build();

        UpdateWhitelistedUserRequest updateReq = UpdateWhitelistedUserRequest.builder()
                .userName("Tampered HC")
                .designations(List.of("Supreme"))
                .roles(List.of("High Command"))
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.findById(20L)).thenReturn(Optional.of(regularHc2));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 20L, updateReq))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("High Command administrators cannot modify other High Command members");
    }

    @Test
    @DisplayName("updateWhitelistedUser: regular High Command cannot assign Chief High Command role")
    void testRegularHighCommandCannotAssignChiefRoleInUpdate() {
        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Subordinate")
                .designations(List.of("Supreme"))
                .roles(List.of("Supreme:Chief High Command"))
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 3L, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only Chief High Command can assign the Chief High Command role");
    }

    @Test
    @DisplayName("updateWhitelistedUser: regular High Command specifying invalid designation throws IllegalArgumentException")
    void testRegularHighCommandUpdate_invalidDesignation() {
        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Subordinate")
                .designations(List.of("InvalidDept"))
                .roles(List.of("Junior Dev"))
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 3L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid designation: InvalidDept");
    }

    @Test
    @DisplayName("updateWhitelistedUser: regular High Command can update self or subordinate user")
    void testRegularHighCommandCanUpdateSelfAndSubordinate() {
        UpdateWhitelistedUserRequest selfReq = UpdateWhitelistedUserRequest.builder()
                .userName("") // Blank userName keeps existing fullName
                .designations(List.of("Supreme"))
                .roles(List.of("High Command"))
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        WhitelistedUserDto result = whitelistService.updateWhitelistedUser(10L, 10L, selfReq);
        assertThat(result.getUserName()).isEqualTo("Regular HC"); // Preserved!

        UpdateWhitelistedUserRequest subReq = UpdateWhitelistedUserRequest.builder()
                .userName(null) // null userName keeps existing fullName
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Senior Dev"))
                .build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));
        WhitelistedUserDto subResult = whitelistService.updateWhitelistedUser(10L, 3L, subReq);
        assertThat(subResult.getUserName()).isEqualTo("Junior Dev");
        assertThat(subResult.getRoles()).contains("Senior Dev");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Minister with empty ministries throws ForbiddenException")
    void testMinisterUpdate_noAssignedMinistries() {
        User unassignedMinister = User.builder()
                .id(26L)
                .email("nomad@rng.com")
                .role("ROLE_MINISTER")
                .designations("Chancellory")
                .roles("Minister")
                .build();

        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Test")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        when(userRepository.findById(26L)).thenReturn(Optional.of(unassignedMinister));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(26L, 3L, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Minister is not assigned to a valid Ministry");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Minister cannot edit target outside their assigned ministry")
    void testMinisterUpdate_targetNotSharingMinistry() {
        User internalUser = User.builder()
                .id(30L)
                .email("internal@rng.com")
                .role("ROLE_USER")
                .designations("Ministry of Internal affairs")
                .roles("Agent")
                .build();

        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Test")
                .designations(List.of("Ministry of Internal affairs"))
                .roles(List.of("Agent"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findById(30L)).thenReturn(Optional.of(internalUser));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 30L, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers can only edit users within their own assigned Ministries");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Minister cannot edit High Command target")
    void testMinisterUpdate_cannotEditHighCommand() {
        User hcInTech = User.builder()
                .id(31L)
                .email("hc.in.tech@rng.com")
                .role("ROLE_HIGH_COMMAND")
                .designations("Ministry of Tech")
                .roles("High Command")
                .build();

        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Test")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findById(31L)).thenReturn(Optional.of(hcInTech));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 31L, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers cannot modify High Command accounts");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Minister cannot edit other Minister target")
    void testMinisterUpdate_cannotEditOtherMinister() {
        User otherTechMinister = User.builder()
                .id(32L)
                .email("second.minister@rng.com")
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech")
                .roles("Minister")
                .build();

        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Test")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Tech Specialist"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findById(32L)).thenReturn(Optional.of(otherTechMinister));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 32L, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers cannot modify other Minister accounts");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Minister cannot alter designations outside their assigned ministries")
    void testMinisterUpdate_designationOutsideMinistry() {
        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Promoted Dev")
                .designations(List.of("Ministry of Finances"))
                .roles(List.of("Regional treasurer"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 3L, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers cannot alter designations to outside their assigned ministries");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Minister cannot assign role for unassigned ministry or invalid/privileged role")
    void testMinisterUpdate_invalidRoles() {
        UpdateWhitelistedUserRequest reqUnassigned = UpdateWhitelistedUserRequest.builder()
                .userName("Dev")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Ministry of Finances:Regional treasurer"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 3L, reqUnassigned))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cannot assign role for unassigned ministry");

        UpdateWhitelistedUserRequest reqMinisterRole = UpdateWhitelistedUserRequest.builder()
                .userName("Dev")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Minister"))
                .build();

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 3L, reqMinisterRole))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cannot assign role 'Minister' under ministry");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Minister updating subordinate in their ministry succeeds")
    void testMinisterUpdate_subordinateSuccess() {
        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Senior Dev Now")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Senior Dev"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        WhitelistedUserDto result = whitelistService.updateWhitelistedUser(2L, 3L, req);

        assertThat(result.getUserName()).isEqualTo("Senior Dev Now");
        assertThat(result.getRoles()).contains("Senior Dev");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Minister self-demotion check prevents removing their own Minister role")
    void testMinisterSelfUpdate_cannotRemoveMinisterRole() {
        UpdateWhitelistedUserRequest selfDemoteReq = UpdateWhitelistedUserRequest.builder()
                .userName("Demoted Minister")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev")) // Attempting to remove Minister role!
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 2L, selfDemoteReq))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers cannot remove their own Minister role in Ministry of Tech");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Minister self-update cannot assign outside ministry designation or privileged roles")
    void testMinisterSelfUpdate_cannotAssignOutsideDesignationOrPrivilegedRole() {
        UpdateWhitelistedUserRequest outsideDesReq = UpdateWhitelistedUserRequest.builder()
                .userName("Self")
                .designations(List.of("Ministry of Finances"))
                .roles(List.of("Minister"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 2L, outsideDesReq))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers cannot alter designations to outside their assigned ministries");

        UpdateWhitelistedUserRequest unassignedPrefixRoleReq = UpdateWhitelistedUserRequest.builder()
                .userName("Self")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Minister", "Ministry of Finances:Regional treasurer"))
                .build();

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 2L, unassignedPrefixRoleReq))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cannot assign role for unassigned ministry");

        UpdateWhitelistedUserRequest hcRoleReq = UpdateWhitelistedUserRequest.builder()
                .userName("Self")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Minister", "High Command"))
                .build();

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 2L, hcRoleReq))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cannot assign role 'High Command' under ministry");
    }

    @Test
    @DisplayName("updateWhitelistedUser: Minister self-update retaining Minister role succeeds")
    void testMinisterSelfUpdate_validSuccess() {
        UpdateWhitelistedUserRequest validReq = UpdateWhitelistedUserRequest.builder()
                .userName("Tech Minister V2")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Minister", "Tech Specialist"))
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        WhitelistedUserDto result = whitelistService.updateWhitelistedUser(2L, 2L, validReq);

        assertThat(result.getUserName()).isEqualTo("Tech Minister V2");
        assertThat(result.getRoles()).contains("Minister", "Tech Specialist");
    }

    @Test
    @DisplayName("updateWhitelistedUser: regular user is forbidden from updating users")
    void testRegularUserUpdate_forbidden() {
        UpdateWhitelistedUserRequest req = UpdateWhitelistedUserRequest.builder()
                .userName("Test")
                .designations(List.of("Ministry of Tech"))
                .roles(List.of("Junior Dev"))
                .build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));

        assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(3L, 2L, req))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access Denied: Insufficient authorization scope to update whitelisted user");
    }

    // =========================================================================
    // deleteWhitelistedUser Tests
    // =========================================================================

    @Test
    @DisplayName("deleteWhitelistedUser: throws ResourceNotFoundException when target not found")
    void testDeleteWhitelistedUser_targetNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Whitelisted user not found with ID: 999");
    }

    @Test
    @DisplayName("deleteWhitelistedUser: administrator cannot delete their own account")
    void testDeleteWhitelistedUser_cannotDeleteSelf() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));

        assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(1L, 1L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Administrators cannot delete their own account");
    }

    @Test
    @DisplayName("Chief High Command accounts can never be deleted")
    void testChiefHighCommandCannotBeDeleted() {
        User otherUser = User.builder()
                .id(2L)
                .email("other@rng.com")
                .fullName("Other")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));

        assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(2L, 1L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Chief High Command administrator accounts cannot be deleted");
    }

    @Test
    @DisplayName("Chief High Command can delete regular High Command members")
    void testChiefHighCommandCanDeleteRegularHighCommand() {
        User regularHc = User.builder()
                .id(20L)
                .email("peer.hc@rng.com")
                .fullName("Peer HC")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(chiefHighCommandUser));
        when(userRepository.findById(20L)).thenReturn(Optional.of(regularHc));

        whitelistService.deleteWhitelistedUser(1L, 20L);

        verify(userRepository).delete(regularHc);
    }

    @Test
    @DisplayName("Regular High Command cannot delete other High Command members")
    void testRegularHighCommandCannotDeleteOtherHighCommand() {
        User regularHc1 = User.builder()
                .id(10L)
                .email("hc1@rng.com")
                .fullName("HC 1")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .build();

        User regularHc2 = User.builder()
                .id(20L)
                .email("hc2@rng.com")
                .fullName("HC 2")
                .provider(AuthProvider.EMAIL)
                .role("ROLE_HIGH_COMMAND")
                .designations("Supreme")
                .roles("High Command")
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(regularHc1));
        when(userRepository.findById(20L)).thenReturn(Optional.of(regularHc2));

        assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(10L, 20L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("High Command administrators cannot delete other High Command members");
    }

    @Test
    @DisplayName("Regular High Command can delete regular users and ministers")
    void testRegularHighCommandCanDeleteSubordinates() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));

        whitelistService.deleteWhitelistedUser(10L, 3L);

        verify(userRepository).delete(regularDevUser);
    }

    @Test
    @DisplayName("Minister cannot delete High Command accounts")
    void testMinisterCannotDeleteHighCommand() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findById(10L)).thenReturn(Optional.of(highCommandUser));

        assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(2L, 10L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers cannot delete High Command accounts");
    }

    @Test
    @DisplayName("deleteWhitelistedUser: Minister with empty ministries throws ForbiddenException")
    void testMinisterDelete_emptyMinistries() {
        User nomadMinister = User.builder()
                .id(27L)
                .email("nomad@rng.com")
                .role("ROLE_MINISTER")
                .designations("Chancellory")
                .roles("Minister")
                .build();

        when(userRepository.findById(27L)).thenReturn(Optional.of(nomadMinister));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));

        assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(27L, 3L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Minister is not assigned to a valid Ministry");
    }

    @Test
    @DisplayName("deleteWhitelistedUser: Minister cannot delete target not sharing ministry")
    void testMinisterDelete_unsharedMinistry() {
        User internalUser = User.builder()
                .id(40L)
                .email("internal@rng.com")
                .role("ROLE_USER")
                .designations("Ministry of Internal affairs")
                .roles("Agent")
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findById(40L)).thenReturn(Optional.of(internalUser));

        assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(2L, 40L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers can only delete users within their own assigned Ministries");
    }

    @Test
    @DisplayName("deleteWhitelistedUser: Minister cannot delete other Minister accounts")
    void testMinisterDelete_otherMinister() {
        User otherMinister = User.builder()
                .id(41L)
                .email("minister2@rng.com")
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech")
                .roles("Minister")
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findById(41L)).thenReturn(Optional.of(otherMinister));

        assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(2L, 41L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Ministers cannot delete other Minister accounts");
    }

    @Test
    @DisplayName("deleteWhitelistedUser: Minister can delete subordinate member in their ministry")
    void testMinisterDelete_subordinateSuccess() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));

        whitelistService.deleteWhitelistedUser(2L, 3L);

        verify(userRepository).delete(regularDevUser);
    }

    @Test
    @DisplayName("deleteWhitelistedUser: regular user is forbidden from deleting any account")
    void testRegularUserDelete_forbidden() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(regularDevUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(ministerTechUser));

        assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(3L, 2L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access Denied: Insufficient authorization to delete whitelisted users");
    }
}
