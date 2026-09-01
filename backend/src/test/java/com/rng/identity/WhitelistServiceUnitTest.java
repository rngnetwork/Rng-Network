package com.rng.identity;

import com.rng.common.exception.ConflictException;
import com.rng.common.exception.ForbiddenException;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.identity.domain.AuthProvider;
import com.rng.identity.domain.User;
import com.rng.identity.dto.UpdateWhitelistedUserRequest;
import com.rng.identity.dto.WhitelistUserRequest;
import com.rng.identity.dto.WhitelistedUserDto;
import com.rng.identity.repository.UserRepository;
import com.rng.identity.service.WhitelistService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
@DisplayName("WhitelistService Pure Unit Tests")
class WhitelistServiceUnitTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WhitelistService whitelistService;

    @Nested
    @DisplayName("Directory Scoping & Hierarchy Queries")
    class DirectoryScoping {

        @Test
        @DisplayName("Chief High Command receives unrestricted personnel directory")
        void getWhitelistedUsers_chiefHighCommand_returnsAll() {
            User chief = User.builder().id(1L).email("arzenic@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();
            User techUser = User.builder().id(2L).email("tech@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Dev").build();
            User financeUser = User.builder().id(3L).email("fin@rng.com").role("ROLE_USER").designations("Ministry of Finances").roles("Accountant").build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(chief));
            when(userRepository.findAll()).thenReturn(List.of(chief, techUser, financeUser));

            List<WhitelistedUserDto> results = whitelistService.getWhitelistedUsers(1L);

            assertThat(results).hasSize(3);
        }

        @Test
        @DisplayName("Regular High Command receives unrestricted personnel directory")
        void getWhitelistedUsers_regularHc_returnsAll() {
            User regularHc = User.builder().id(2L).email("commander@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();
            User user1 = User.builder().id(3L).email("user1@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Dev").build();

            when(userRepository.findById(2L)).thenReturn(Optional.of(regularHc));
            when(userRepository.findAll()).thenReturn(List.of(regularHc, user1));

            List<WhitelistedUserDto> results = whitelistService.getWhitelistedUsers(2L);

            assertThat(results).hasSize(2);
        }

        @Test
        @DisplayName("Ministers are domain-scoped to their own assigned ministry")
        void getWhitelistedUsers_minister_scopedToAssignedMinistry() {
            User techMinister = User.builder().id(10L).email("tech.minister@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User techDev = User.builder().id(11L).email("tech.dev@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Junior Dev").build();
            User financeDev = User.builder().id(12L).email("fin.dev@rng.com").role("ROLE_USER").designations("Ministry of Finances").roles("Auditor").build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(techMinister));
            when(userRepository.findAll()).thenReturn(List.of(techMinister, techDev, financeDev));

            List<WhitelistedUserDto> results = whitelistService.getWhitelistedUsers(10L);

            assertThat(results).hasSize(2);
            assertThat(results.stream().map(WhitelistedUserDto::getEmail)).containsExactlyInAnyOrder("tech.minister@rng.com", "tech.dev@rng.com");
        }

        @Test
        @DisplayName("Throws ForbiddenException when minister is not assigned to a valid ministry")
        void getWhitelistedUsers_ministerWithoutMinistry_throwsForbidden() {
            User unassignedMinister = User.builder().id(10L).email("unassigned@rng.com").role("ROLE_MINISTER").designations("Chancellory").roles("Minister").build();
            when(userRepository.findById(10L)).thenReturn(Optional.of(unassignedMinister));

            assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(10L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Minister is not assigned to a valid Ministry");
        }

        @Test
        @DisplayName("Throws ForbiddenException when regular user attempts to access whitelist")
        void getWhitelistedUsers_regularUser_throwsForbidden() {
            User regularUser = User.builder().id(99L).email("regular@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Dev").build();
            when(userRepository.findById(99L)).thenReturn(Optional.of(regularUser));

            assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(99L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Insufficient authorization scope");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when operator is missing")
        void getWhitelistedUsers_operatorNotFound_throwsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> whitelistService.getWhitelistedUsers(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Authenticated operator user not found");
        }
    }

    @Nested
    @DisplayName("Personnel Whitelisting & Creation RBAC")
    class CreationRBAC {

        @Test
        @DisplayName("Chief High Command can assign Chief High Command role")
        void createWhitelistedUser_chiefAssignsChief_success() {
            User chief = User.builder().id(1L).email("arzenic@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();
            WhitelistUserRequest request = WhitelistUserRequest.builder()
                    .email("new.chief@rng.com")
                    .userName("New Chief")
                    .provider(AuthProvider.EMAIL)
                    .designations(List.of("Supreme"))
                    .roles(List.of("Chief High Command", "High Command"))
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(chief));
            when(userRepository.existsByEmail("new.chief@rng.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            WhitelistedUserDto dto = whitelistService.createWhitelistedUser(1L, request);

            assertThat(dto.getEmail()).isEqualTo("new.chief@rng.com");
            assertThat(dto.getRole()).isEqualTo("ROLE_HIGH_COMMAND");
        }

        @Test
        @DisplayName("Regular High Command is forbidden from assigning Chief High Command role")
        void createWhitelistedUser_regularHcAssignsChief_throwsForbidden() {
            User regularHc = User.builder().id(2L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();
            WhitelistUserRequest request = WhitelistUserRequest.builder()
                    .email("applicant@rng.com")
                    .userName("Applicant")
                    .provider(AuthProvider.EMAIL)
                    .designations(List.of("Supreme"))
                    .roles(List.of("Chief High Command"))
                    .build();

            when(userRepository.findById(2L)).thenReturn(Optional.of(regularHc));
            when(userRepository.existsByEmail("applicant@rng.com")).thenReturn(false);

            assertThatThrownBy(() -> whitelistService.createWhitelistedUser(2L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Only Chief High Command can assign the Chief High Command role");
        }

        @Test
        @DisplayName("High Command throws IllegalArgumentException on invalid designation")
        void createWhitelistedUser_highCommandInvalidDesignation_throwsException() {
            User hc = User.builder().id(2L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();
            WhitelistUserRequest request = WhitelistUserRequest.builder()
                    .email("applicant@rng.com")
                    .userName("Applicant")
                    .provider(AuthProvider.EMAIL)
                    .designations(List.of("Invalid Department"))
                    .roles(List.of("Dev"))
                    .build();

            when(userRepository.findById(2L)).thenReturn(Optional.of(hc));
            when(userRepository.existsByEmail("applicant@rng.com")).thenReturn(false);

            assertThatThrownBy(() -> whitelistService.createWhitelistedUser(2L, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid designation: Invalid Department");
        }

        @Test
        @DisplayName("High Command can assign multiple designations and roles across departments")
        void createWhitelistedUser_highCommandAssignsMultiMinistry_success() {
            User hc = User.builder().id(2L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();
            WhitelistUserRequest request = WhitelistUserRequest.builder()
                    .email("crossdept@rng.com")
                    .userName("Cross Dept Officer")
                    .provider(AuthProvider.EMAIL)
                    .designations(List.of("Ministry of Tech", "Ministry of Culture"))
                    .roles(List.of("Lead Architect", "Community Specialist"))
                    .build();

            when(userRepository.findById(2L)).thenReturn(Optional.of(hc));
            when(userRepository.existsByEmail("crossdept@rng.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            WhitelistedUserDto dto = whitelistService.createWhitelistedUser(2L, request);

            assertThat(dto.getEmail()).isEqualTo("crossdept@rng.com");
            assertThat(dto.getDesignations()).contains("Ministry of Tech", "Ministry of Culture");
        }

        @Test
        @DisplayName("Ministers can whitelist subordinates in their own ministry")
        void createWhitelistedUser_ministerOwnMinistry_success() {
            User techMinister = User.builder().id(10L).email("tech.min@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            WhitelistUserRequest request = WhitelistUserRequest.builder()
                    .email("tech.cadet@rng.com")
                    .userName("Tech Cadet")
                    .provider(AuthProvider.EMAIL)
                    .designations(List.of("Ministry of Tech"))
                    .roles(List.of("Junior Dev"))
                    .build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(techMinister));
            when(userRepository.existsByEmail("tech.cadet@rng.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            WhitelistedUserDto dto = whitelistService.createWhitelistedUser(10L, request);

            assertThat(dto.getEmail()).isEqualTo("tech.cadet@rng.com");
            assertThat(dto.getRole()).isEqualTo("ROLE_USER");
        }

        @Test
        @DisplayName("Minister without valid assigned ministry is forbidden from whitelisting")
        void createWhitelistedUser_unassignedMinister_throwsForbidden() {
            User unassigned = User.builder().id(10L).email("min@rng.com").role("ROLE_MINISTER").designations("Chancellory").roles("Minister").build();
            WhitelistUserRequest request = WhitelistUserRequest.builder().email("cadet@rng.com").designations(List.of("Ministry of Tech")).roles(List.of("Junior Dev")).build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(unassigned));
            when(userRepository.existsByEmail("cadet@rng.com")).thenReturn(false);

            assertThatThrownBy(() -> whitelistService.createWhitelistedUser(10L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Minister is not assigned to a valid Ministry");
        }

        @Test
        @DisplayName("Ministers are forbidden from assigning designations outside their assigned ministry")
        void createWhitelistedUser_ministerForeignMinistry_throwsForbidden() {
            User techMinister = User.builder().id(10L).email("tech.min@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            WhitelistUserRequest request = WhitelistUserRequest.builder()
                    .email("fin.hire@rng.com")
                    .userName("Fin Hire")
                    .provider(AuthProvider.EMAIL)
                    .designations(List.of("Ministry of Finances"))
                    .roles(List.of("Auditor"))
                    .build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(techMinister));
            when(userRepository.existsByEmail("fin.hire@rng.com")).thenReturn(false);

            assertThatThrownBy(() -> whitelistService.createWhitelistedUser(10L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Ministers may only assign their own assigned ministries");
        }

        @Test
        @DisplayName("Minister assigning role under unassigned ministry prefix throws ForbiddenException")
        void createWhitelistedUser_ministerRoleUnassignedPrefix_throwsForbidden() {
            User techMinister = User.builder().id(10L).email("tech.min@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            WhitelistUserRequest request = WhitelistUserRequest.builder()
                    .email("hire@rng.com")
                    .userName("Hire")
                    .provider(AuthProvider.EMAIL)
                    .designations(List.of("Ministry of Tech"))
                    .roles(List.of("Ministry of Finances:Auditor"))
                    .build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(techMinister));
            when(userRepository.existsByEmail("hire@rng.com")).thenReturn(false);

            assertThatThrownBy(() -> whitelistService.createWhitelistedUser(10L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Cannot assign role for unassigned ministry");
        }

        @Test
        @DisplayName("Minister assigning Minister or HC role throws ForbiddenException")
        void createWhitelistedUser_ministerAssigningPrivilegedRole_throwsForbidden() {
            User techMinister = User.builder().id(10L).email("tech.min@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            WhitelistUserRequest request = WhitelistUserRequest.builder()
                    .email("hire@rng.com")
                    .userName("Hire")
                    .provider(AuthProvider.EMAIL)
                    .designations(List.of("Ministry of Tech"))
                    .roles(List.of("Minister"))
                    .build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(techMinister));
            when(userRepository.existsByEmail("hire@rng.com")).thenReturn(false);

            assertThatThrownBy(() -> whitelistService.createWhitelistedUser(10L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Cannot assign role");
        }

        @Test
        @DisplayName("Regular user is forbidden from creating whitelisted members")
        void createWhitelistedUser_regularUser_throwsForbidden() {
            User regular = User.builder().id(99L).email("user@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Dev").build();
            WhitelistUserRequest request = WhitelistUserRequest.builder().email("cadet@rng.com").designations(List.of("Ministry of Tech")).roles(List.of("Dev")).build();

            when(userRepository.findById(99L)).thenReturn(Optional.of(regular));
            when(userRepository.existsByEmail("cadet@rng.com")).thenReturn(false);

            assertThatThrownBy(() -> whitelistService.createWhitelistedUser(99L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Only High Command and Ministers can whitelist members");
        }

        @Test
        @DisplayName("Throws ConflictException when whitelisting an existing email")
        void createWhitelistedUser_duplicateEmail_throwsConflict() {
            User chief = User.builder().id(1L).email("arzenic@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();
            when(userRepository.findById(1L)).thenReturn(Optional.of(chief));
            when(userRepository.existsByEmail("existing@rng.com")).thenReturn(true);

            WhitelistUserRequest request = WhitelistUserRequest.builder().email("existing@rng.com").designations(List.of("Supreme")).roles(List.of("High Command")).build();

            assertThatThrownBy(() -> whitelistService.createWhitelistedUser(1L, request))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("is already whitelisted");
        }
    }

    @Nested
    @DisplayName("Personnel Modification & Update RBAC")
    class UpdateRBAC {

        @Test
        @DisplayName("Chief High Command can modify regular High Command members")
        void updateWhitelistedUser_chiefModifiesHc_success() {
            User chief = User.builder().id(1L).email("arzenic@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();
            User regularHc = User.builder().id(2L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                    .userName("Promoted HC")
                    .designations(List.of("Supreme", "Ministry of Tech"))
                    .roles(List.of("High Command", "Lead Architect"))
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(chief));
            when(userRepository.findById(2L)).thenReturn(Optional.of(regularHc));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            WhitelistedUserDto dto = whitelistService.updateWhitelistedUser(1L, 2L, request);

            assertThat(dto.getUserName()).isEqualTo("Promoted HC");
            assertThat(dto.getDesignations()).contains("Supreme", "Ministry of Tech");
        }

        @Test
        @DisplayName("Chief High Command cannot modify other Chief High Command members")
        void updateWhitelistedUser_chiefModifiesOtherChief_throwsForbidden() {
            User chief1 = User.builder().id(1L).email("chief1@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();
            User chief2 = User.builder().id(2L).email("chief2@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("Supreme")).roles(List.of("Chief High Command")).build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(chief1));
            when(userRepository.findById(2L)).thenReturn(Optional.of(chief2));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(1L, 2L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Chief High Command administrators cannot modify other Chief High Command members");
        }

        @Test
        @DisplayName("Chief High Command throws IllegalArgumentException on invalid designation")
        void updateWhitelistedUser_chiefInvalidDesignation_throwsException() {
            User chief = User.builder().id(1L).email("chief@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();
            User target = User.builder().id(2L).email("target@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Dev").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("FakeDept")).roles(List.of("Dev")).build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(chief));
            when(userRepository.findById(2L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(1L, 2L, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid designation");
        }

        @Test
        @DisplayName("Regular High Command is forbidden from modifying other High Command members (Peer Protection)")
        void updateWhitelistedUser_hcModifiesOtherHc_throwsForbidden() {
            User hc1 = User.builder().id(2L).email("hc1@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();
            User hc2 = User.builder().id(3L).email("hc2@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                    .designations(List.of("Supreme"))
                    .roles(List.of("High Command"))
                    .build();

            when(userRepository.findById(2L)).thenReturn(Optional.of(hc1));
            when(userRepository.findById(3L)).thenReturn(Optional.of(hc2));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 3L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("High Command administrators cannot modify other High Command members");
        }

        @Test
        @DisplayName("Regular High Command is forbidden from assigning Chief High Command role")
        void updateWhitelistedUser_regularHcAssignsChief_throwsForbidden() {
            User hc = User.builder().id(2L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();
            User target = User.builder().id(4L).email("target@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Dev").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("Supreme")).roles(List.of("Chief High Command")).build();

            when(userRepository.findById(2L)).thenReturn(Optional.of(hc));
            when(userRepository.findById(4L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 4L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Only Chief High Command can assign the Chief High Command role");
        }

        @Test
        @DisplayName("Regular High Command throws IllegalArgumentException on invalid designation")
        void updateWhitelistedUser_regularHcInvalidDesignation_throwsException() {
            User hc = User.builder().id(2L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();
            User target = User.builder().id(4L).email("target@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Dev").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("FakeDept")).roles(List.of("Dev")).build();

            when(userRepository.findById(2L)).thenReturn(Optional.of(hc));
            when(userRepository.findById(4L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(2L, 4L, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid designation");
        }

        @Test
        @DisplayName("Ministers cannot modify High Command accounts")
        void updateWhitelistedUser_ministerModifiesHc_throwsForbidden() {
            User minister = User.builder().id(10L).email("min@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User hc = User.builder().id(2L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").designations("Ministry of Tech, Supreme").roles("High Command").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                    .designations(List.of("Ministry of Tech"))
                    .roles(List.of("Junior Dev"))
                    .build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(minister));
            when(userRepository.findById(2L)).thenReturn(Optional.of(hc));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 2L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Ministers cannot modify High Command accounts");
        }

        @Test
        @DisplayName("Ministers cannot modify other Minister accounts")
        void updateWhitelistedUser_ministerModifiesOtherMinister_throwsForbidden() {
            User minister1 = User.builder().id(10L).email("min1@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User minister2 = User.builder().id(11L).email("min2@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder()
                    .designations(List.of("Ministry of Tech"))
                    .roles(List.of("Lead Architect"))
                    .build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(minister1));
            when(userRepository.findById(11L)).thenReturn(Optional.of(minister2));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 11L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Ministers cannot modify other Minister accounts");
        }

        @Test
        @DisplayName("Minister modifying own account must retain Minister role")
        void updateWhitelistedUser_ministerModifyingSelf_mustRetainMinisterRole() {
            User minister = User.builder().id(10L).email("min@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();

            UpdateWhitelistedUserRequest badRequest = UpdateWhitelistedUserRequest.builder()
                    .designations(List.of("Ministry of Tech"))
                    .roles(List.of("Junior Dev")) // removed Minister
                    .build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(minister));
            when(userRepository.findById(10L)).thenReturn(Optional.of(minister));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 10L, badRequest))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Ministers cannot remove their own Minister role");
        }

        @Test
        @DisplayName("Minister modifying subordinate across foreign ministry throws ForbiddenException")
        void updateWhitelistedUser_ministerForeignSubordinate_throwsForbidden() {
            User techMinister = User.builder().id(10L).email("tech@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User finSubordinate = User.builder().id(20L).email("fin@rng.com").role("ROLE_USER").designations("Ministry of Finances").roles("Auditor").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("Ministry of Finances")).roles(List.of("Auditor")).build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(techMinister));
            when(userRepository.findById(20L)).thenReturn(Optional.of(finSubordinate));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 20L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Ministers can only edit users within their own assigned Ministries");
        }

        @Test
        @DisplayName("Minister modifying subordinate with foreign designation throws ForbiddenException")
        void updateWhitelistedUser_ministerAlteringToForeignDesignation_throwsForbidden() {
            User techMinister = User.builder().id(10L).email("tech@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User techSubordinate = User.builder().id(20L).email("dev@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Junior Dev").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("Ministry of Finances")).roles(List.of("Auditor")).build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(techMinister));
            when(userRepository.findById(20L)).thenReturn(Optional.of(techSubordinate));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 20L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Ministers cannot alter designations to outside their assigned ministries");
        }

        @Test
        @DisplayName("Minister modifying subordinate with unassigned role prefix throws ForbiddenException")
        void updateWhitelistedUser_ministerSubordinateUnassignedRolePrefix_throwsForbidden() {
            User techMinister = User.builder().id(10L).email("tech@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User techSubordinate = User.builder().id(20L).email("dev@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Junior Dev").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("Ministry of Tech")).roles(List.of("Ministry of Finances:Auditor")).build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(techMinister));
            when(userRepository.findById(20L)).thenReturn(Optional.of(techSubordinate));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 20L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Cannot assign role for unassigned ministry");
        }

        @Test
        @DisplayName("Minister modifying subordinate with invalid or HC role throws ForbiddenException")
        void updateWhitelistedUser_ministerSubordinatePrivilegedRole_throwsForbidden() {
            User techMinister = User.builder().id(10L).email("tech@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User techSubordinate = User.builder().id(20L).email("dev@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Junior Dev").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("Ministry of Tech")).roles(List.of("High Command")).build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(techMinister));
            when(userRepository.findById(20L)).thenReturn(Optional.of(techSubordinate));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 20L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Cannot assign role 'High Command'");
        }

        @Test
        @DisplayName("Minister without assigned ministries modifying user throws ForbiddenException")
        void updateWhitelistedUser_ministerNoMinistries_throwsForbidden() {
            User minister = User.builder().id(10L).email("min@rng.com").role("ROLE_MINISTER").designations("Chancellory").roles("Minister").build();
            User target = User.builder().id(20L).email("dev@rng.com").role("ROLE_USER").designations("Chancellory").roles("Staff").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("Chancellory")).roles(List.of("Staff")).build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(minister));
            when(userRepository.findById(20L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(10L, 20L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Minister is not assigned to a valid Ministry");
        }

        @Test
        @DisplayName("Regular user is forbidden from updating whitelisted users")
        void updateWhitelistedUser_regularUser_throwsForbidden() {
            User regular = User.builder().id(99L).email("user@rng.com").role("ROLE_USER").build();
            User target = User.builder().id(20L).email("target@rng.com").role("ROLE_USER").build();

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("Ministry of Tech")).roles(List.of("Dev")).build();

            when(userRepository.findById(99L)).thenReturn(Optional.of(regular));
            when(userRepository.findById(20L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(99L, 20L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Insufficient authorization scope to update whitelisted user");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when target user is not found")
        void updateWhitelistedUser_targetNotFound_throwsException() {
            User chief = User.builder().id(1L).email("chief@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();
            when(userRepository.findById(1L)).thenReturn(Optional.of(chief));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().designations(List.of("Supreme")).roles(List.of("High Command")).build();

            assertThatThrownBy(() -> whitelistService.updateWhitelistedUser(1L, 999L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Whitelisted user not found with ID: 999");
        }
    }

    @Nested
    @DisplayName("Personnel Deletion & Immunity Guards")
    class DeletionGuards {

        @Test
        @DisplayName("Administrators cannot delete their own account")
        void deleteWhitelistedUser_selfDelete_throwsForbidden() {
            User chief = User.builder().id(1L).email("arzenic@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();
            when(userRepository.findById(1L)).thenReturn(Optional.of(chief));

            assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(1L, 1L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Administrators cannot delete their own account");
        }

        @Test
        @DisplayName("Chief High Command accounts cannot be deleted by anyone")
        void deleteWhitelistedUser_targetChief_throwsForbidden() {
            User chief1 = User.builder().id(1L).email("chief1@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();
            User chief2 = User.builder().id(99L).email("chief2@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(chief1));
            when(userRepository.findById(99L)).thenReturn(Optional.of(chief2));

            assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(1L, 99L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Chief High Command administrator accounts cannot be deleted");
        }

        @Test
        @DisplayName("Chief High Command can delete regular High Command members seamlessly")
        void deleteWhitelistedUser_chiefDeletesRegularHc_success() {
            User chief = User.builder().id(1L).email("arzenic@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();
            User regularHc = User.builder().id(2L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(chief));
            when(userRepository.findById(2L)).thenReturn(Optional.of(regularHc));

            whitelistService.deleteWhitelistedUser(1L, 2L);

            verify(userRepository).delete(regularHc);
        }

        @Test
        @DisplayName("Regular High Command is forbidden from deleting other High Command members")
        void deleteWhitelistedUser_hcDeletesOtherHc_throwsForbidden() {
            User hc1 = User.builder().id(2L).email("hc1@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();
            User hc2 = User.builder().id(3L).email("hc2@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();

            when(userRepository.findById(2L)).thenReturn(Optional.of(hc1));
            when(userRepository.findById(3L)).thenReturn(Optional.of(hc2));

            assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(2L, 3L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("High Command administrators cannot delete other High Command members");
        }

        @Test
        @DisplayName("Ministers cannot delete High Command accounts")
        void deleteWhitelistedUser_ministerDeletesHc_throwsForbidden() {
            User minister = User.builder().id(10L).email("min@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User hc = User.builder().id(2L).email("hc@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("High Command").build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(minister));
            when(userRepository.findById(2L)).thenReturn(Optional.of(hc));

            assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(10L, 2L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Ministers cannot delete High Command accounts");
        }

        @Test
        @DisplayName("Ministers cannot delete other Minister accounts")
        void deleteWhitelistedUser_ministerDeletesOtherMinister_throwsForbidden() {
            User min1 = User.builder().id(10L).email("min1@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User min2 = User.builder().id(11L).email("min2@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(min1));
            when(userRepository.findById(11L)).thenReturn(Optional.of(min2));

            assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(10L, 11L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Ministers cannot delete other Minister accounts");
        }

        @Test
        @DisplayName("Ministers can delete subordinate users within their assigned ministry")
        void deleteWhitelistedUser_ministerDeletesSubordinate_success() {
            User minister = User.builder().id(10L).email("min@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User subordinate = User.builder().id(20L).email("cadet@rng.com").role("ROLE_USER").designations("Ministry of Tech").roles("Junior Dev").build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(minister));
            when(userRepository.findById(20L)).thenReturn(Optional.of(subordinate));

            whitelistService.deleteWhitelistedUser(10L, 20L);

            verify(userRepository).delete(subordinate);
        }

        @Test
        @DisplayName("Ministers cannot delete users from unassigned ministries")
        void deleteWhitelistedUser_ministerForeignSubordinate_throwsForbidden() {
            User minister = User.builder().id(10L).email("min@rng.com").role("ROLE_MINISTER").designations("Ministry of Tech").roles("Minister").build();
            User foreignUser = User.builder().id(30L).email("fin@rng.com").role("ROLE_USER").designations("Ministry of Finances").roles("Auditor").build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(minister));
            when(userRepository.findById(30L)).thenReturn(Optional.of(foreignUser));

            assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(10L, 30L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Ministers can only delete users within their own assigned Ministries");
        }

        @Test
        @DisplayName("Ministers without ministry designations are forbidden from deleting users")
        void deleteWhitelistedUser_ministerNoMinistries_throwsForbidden() {
            User minister = User.builder().id(10L).email("min@rng.com").role("ROLE_MINISTER").designations("Chancellory").build();
            User target = User.builder().id(30L).email("target@rng.com").role("ROLE_USER").designations("Chancellory").build();

            when(userRepository.findById(10L)).thenReturn(Optional.of(minister));
            when(userRepository.findById(30L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(10L, 30L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Minister is not assigned to a valid Ministry");
        }

        @Test
        @DisplayName("Unauthorized operator (ROLE_USER) is forbidden from deleting users")
        void deleteWhitelistedUser_regularUserOperator_throwsForbidden() {
            User operator = User.builder().id(99L).email("user@rng.com").role("ROLE_USER").build();
            User target = User.builder().id(30L).email("target@rng.com").role("ROLE_USER").build();

            when(userRepository.findById(99L)).thenReturn(Optional.of(operator));
            when(userRepository.findById(30L)).thenReturn(Optional.of(target));

            assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(99L, 30L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Access Denied: Insufficient authorization to delete whitelisted users");
        }

        @Test
        @DisplayName("Throws ResourceNotFoundException when deleting non-existent target")
        void deleteWhitelistedUser_targetNotFound_throwsException() {
            User chief = User.builder().id(1L).email("chief@rng.com").role("ROLE_HIGH_COMMAND").designations("Supreme").roles("Chief High Command").build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(chief));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> whitelistService.deleteWhitelistedUser(1L, 999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Whitelisted user not found with ID: 999");
        }
    }
}
