// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity;

import com.rednecksgaming.identity.domain.PersonnelHierarchy;
import com.rednecksgaming.identity.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class PersonnelHierarchyTest {

    @Test
    @DisplayName("Private constructor invocation coverage via reflection")
    void testPrivateConstructor() throws Exception {
        Constructor<PersonnelHierarchy> constructor = PersonnelHierarchy.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        PersonnelHierarchy instance = constructor.newInstance();
        assertThat(instance).isNotNull();
    }

    @Test
    @DisplayName("getAllDesignations returns all canonical RNG designations")
    void testGetAllDesignations() {
        List<String> designations = PersonnelHierarchy.getAllDesignations();
        assertThat(designations)
                .contains(
                        PersonnelHierarchy.SUPREME,
                        PersonnelHierarchy.CHANCELLORY,
                        PersonnelHierarchy.MINISTRY_INTERNAL_AFFAIRS,
                        PersonnelHierarchy.MINISTRY_PERSONELL,
                        PersonnelHierarchy.MINISTRY_TECH,
                        PersonnelHierarchy.MINISTRY_FINANCES,
                        PersonnelHierarchy.MINISTRY_CULTURE,
                        PersonnelHierarchy.MINISTRY_EXTERNAL_AFFAIRS
                );
    }

    @Test
    @DisplayName("getRolesForDesignation returns expected roles and empty list for unknown designation")
    void testGetRolesForDesignation() {
        List<String> supremeRoles = PersonnelHierarchy.getRolesForDesignation(PersonnelHierarchy.SUPREME);
        assertThat(supremeRoles).containsExactly("Chief High Command", "High Command");

        List<String> techRoles = PersonnelHierarchy.getRolesForDesignation(PersonnelHierarchy.MINISTRY_TECH);
        assertThat(techRoles).contains("Minister", "Secretary", "Tech Specialist", "Senior Dev", "Junior Dev");

        List<String> unknownRoles = PersonnelHierarchy.getRolesForDesignation("Unknown Department");
        assertThat(unknownRoles).isEmpty();
    }

    @Test
    @DisplayName("isValidDesignation handles null, trimmed, valid and invalid designations")
    void testIsValidDesignation() {
        assertThat(PersonnelHierarchy.isValidDesignation(null)).isFalse();
        assertThat(PersonnelHierarchy.isValidDesignation("NonExistent")).isFalse();
        assertThat(PersonnelHierarchy.isValidDesignation(PersonnelHierarchy.SUPREME)).isTrue();
        assertThat(PersonnelHierarchy.isValidDesignation("  " + PersonnelHierarchy.MINISTRY_TECH + "  ")).isTrue();
    }

    @Test
    @DisplayName("isValidRoleForDesignation validates nulls, with and without colon prefixes")
    void testIsValidRoleForDesignation() {
        assertThat(PersonnelHierarchy.isValidRoleForDesignation(null, "Junior Dev")).isFalse();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation(PersonnelHierarchy.MINISTRY_TECH, null)).isFalse();

        // Without colon: matches against designation
        assertThat(PersonnelHierarchy.isValidRoleForDesignation(PersonnelHierarchy.MINISTRY_TECH, "Junior Dev")).isTrue();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation(PersonnelHierarchy.MINISTRY_TECH, "junior dev")).isTrue();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation(PersonnelHierarchy.MINISTRY_TECH, "Agent")).isFalse();

        // Unknown designation without colon
        assertThat(PersonnelHierarchy.isValidRoleForDesignation("Unknown", "Junior Dev")).isFalse();

        // With colon: extracts target designation and pure role
        assertThat(PersonnelHierarchy.isValidRoleForDesignation(PersonnelHierarchy.SUPREME, "Ministry of Tech : Junior Dev")).isTrue();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation(PersonnelHierarchy.SUPREME, "UnknownDept : Junior Dev")).isFalse();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation(PersonnelHierarchy.SUPREME, "Ministry of Tech : FakeRole")).isFalse();
    }

    @Test
    @DisplayName("isChiefHighCommand accurately identifies Chief High Command rank")
    void testIsChiefHighCommand() {
        assertThat(PersonnelHierarchy.isChiefHighCommand(null)).isFalse();

        User userByRole = User.builder().role("ROLE_CHIEF_HIGH_COMMAND").roles("SomeRole").build();
        assertThat(PersonnelHierarchy.isChiefHighCommand(userByRole)).isTrue();

        User userByRoleCase = User.builder().role("role_chief_high_command").roles("SomeRole").build();
        assertThat(PersonnelHierarchy.isChiefHighCommand(userByRoleCase)).isTrue();

        User userByRoleList = User.builder().role("ROLE_USER").roles("Chief High Command").build();
        assertThat(PersonnelHierarchy.isChiefHighCommand(userByRoleList)).isTrue();

        User userByPrefixedRole = User.builder().role("ROLE_USER").roles("Supreme:Chief High Command").build();
        assertThat(PersonnelHierarchy.isChiefHighCommand(userByPrefixedRole)).isTrue();

        User nonChiefUser = User.builder().role("ROLE_HIGH_COMMAND").roles("High Command").build();
        assertThat(PersonnelHierarchy.isChiefHighCommand(nonChiefUser)).isFalse();
    }

    @Test
    @DisplayName("isHighCommand returns true for Chief High Command and High Command users")
    void testIsHighCommand() {
        assertThat(PersonnelHierarchy.isHighCommand(null)).isFalse();

        User chiefUser = User.builder().role("ROLE_CHIEF_HIGH_COMMAND").build();
        assertThat(PersonnelHierarchy.isHighCommand(chiefUser)).isTrue();

        User hcByRole = User.builder().role("ROLE_HIGH_COMMAND").roles("Other").build();
        assertThat(PersonnelHierarchy.isHighCommand(hcByRole)).isTrue();

        User hcByRolesString = User.builder().role("ROLE_USER").roles("High Command").build();
        assertThat(PersonnelHierarchy.isHighCommand(hcByRolesString)).isTrue();

        User hcByPrefixedRole = User.builder().role("ROLE_USER").roles("Supreme:High Command").build();
        assertThat(PersonnelHierarchy.isHighCommand(hcByPrefixedRole)).isTrue();

        User hcByPrefixedChief = User.builder().role("ROLE_USER").roles("Supreme:Chief High Command").build();
        assertThat(PersonnelHierarchy.isHighCommand(hcByPrefixedChief)).isTrue();

        User regularUser = User.builder().role("ROLE_USER").roles("Junior Dev").build();
        assertThat(PersonnelHierarchy.isHighCommand(regularUser)).isFalse();
    }

    @Test
    @DisplayName("isMinister returns true for ministers but false for High Command and regular users")
    void testIsMinister() {
        assertThat(PersonnelHierarchy.isMinister((User) null)).isFalse();
        assertThat(PersonnelHierarchy.isMinister((String) null)).isFalse();

        // High Command takes precedence and cannot be considered a subordinate Minister
        User hcUserWithMinisterRole = User.builder().role("ROLE_HIGH_COMMAND").roles("Minister").build();
        assertThat(PersonnelHierarchy.isMinister(hcUserWithMinisterRole)).isFalse();

        User ministerByRole = User.builder().role("ROLE_MINISTER").roles("Other").build();
        assertThat(PersonnelHierarchy.isMinister(ministerByRole)).isTrue();

        User ministerByRolesString = User.builder().role("ROLE_USER").roles("Minister").build();
        assertThat(PersonnelHierarchy.isMinister(ministerByRolesString)).isTrue();

        User ministerByPrefixedRole = User.builder().role("ROLE_USER").roles("Ministry of Tech:Minister").build();
        assertThat(PersonnelHierarchy.isMinister(ministerByPrefixedRole)).isTrue();

        User regularUser = User.builder().role("ROLE_USER").roles("Junior Dev").build();
        assertThat(PersonnelHierarchy.isMinister(regularUser)).isFalse();
    }

    @Test
    @DisplayName("getMinisterMinistries returns ministries for ministers and empty list for others")
    void testGetMinisterMinistries() {
        assertThat(PersonnelHierarchy.getMinisterMinistries(null)).isEmpty();

        User regularUser = User.builder().role("ROLE_USER").designations("Ministry of Tech").roles("Junior Dev").build();
        assertThat(PersonnelHierarchy.getMinisterMinistries(regularUser)).isEmpty();

        User minister = User.builder()
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech, Ministry of Finances, Chancellory")
                .roles("Minister")
                .build();
        List<String> ministries = PersonnelHierarchy.getMinisterMinistries(minister);
        assertThat(ministries).containsExactly("Ministry of Tech", "Ministry of Finances");
    }

    @Test
    @DisplayName("isMinisterOf checks specific ministry assignment with trimming")
    void testIsMinisterOf() {
        assertThat(PersonnelHierarchy.isMinisterOf(null, "Ministry of Tech")).isFalse();

        User minister = User.builder()
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech, Ministry of Finances")
                .roles("Minister")
                .build();

        assertThat(PersonnelHierarchy.isMinisterOf(minister, null)).isFalse();
        assertThat(PersonnelHierarchy.isMinisterOf(minister, "Ministry of Tech")).isTrue();
        assertThat(PersonnelHierarchy.isMinisterOf(minister, "  Ministry of Tech  ")).isTrue();
        assertThat(PersonnelHierarchy.isMinisterOf(minister, "Ministry of War")).isFalse();
    }

    @Test
    @DisplayName("computePrimaryRole resolves hierarchy: High Command > Minister > User")
    void testComputePrimaryRole() {
        // Null or empty roles defaults to ROLE_USER
        assertThat(PersonnelHierarchy.computePrimaryRole(null, List.of())).isEqualTo("ROLE_USER");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of(), List.of())).isEqualTo("ROLE_USER");

        // Chief High Command role computes to ROLE_HIGH_COMMAND
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Chief High Command"), List.of())).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Supreme:Chief High Command"), List.of())).isEqualTo("ROLE_HIGH_COMMAND");

        // High Command role computes to ROLE_HIGH_COMMAND
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("High Command"), List.of())).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Supreme:High Command"), List.of())).isEqualTo("ROLE_HIGH_COMMAND");

        // Minister role computes to ROLE_MINISTER
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Minister"), List.of())).isEqualTo("ROLE_MINISTER");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Ministry of Tech:Minister"), List.of())).isEqualTo("ROLE_MINISTER");

        // Subordinate/regular roles compute to ROLE_USER
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Junior Dev", "Senior Dev"), List.of())).isEqualTo("ROLE_USER");
    }

    @Test
    @DisplayName("isSupreme(String) accurately identifies supreme ranks")
    void testIsSupremeString() {
        assertThat(PersonnelHierarchy.isSupreme(null)).isFalse();
        assertThat(PersonnelHierarchy.isSupreme("")).isFalse();
        assertThat(PersonnelHierarchy.isSupreme("ROLE_USER")).isFalse();
        assertThat(PersonnelHierarchy.isSupreme("ROLE_MINISTER")).isFalse();
        assertThat(PersonnelHierarchy.isSupreme("Junior Dev")).isFalse();

        assertThat(PersonnelHierarchy.isSupreme("ROLE_CHIEF_HIGH_COMMAND")).isTrue();
        assertThat(PersonnelHierarchy.isSupreme("role_chief_high_command")).isTrue();
        assertThat(PersonnelHierarchy.isSupreme("Chief High Command")).isTrue();
        assertThat(PersonnelHierarchy.isSupreme("ROLE_HIGH_COMMAND")).isTrue();
        assertThat(PersonnelHierarchy.isSupreme("High Command")).isTrue();
        assertThat(PersonnelHierarchy.isSupreme("Supreme")).isTrue();
        assertThat(PersonnelHierarchy.isSupreme("  Supreme  ")).isTrue();
    }

    @Test
    @DisplayName("isMinister(String) accurately identifies minister ranks")
    void testIsMinisterString() {
        assertThat(PersonnelHierarchy.isMinister((String) null)).isFalse();
        assertThat(PersonnelHierarchy.isMinister("")).isFalse();
        assertThat(PersonnelHierarchy.isMinister("ROLE_USER")).isFalse();
        assertThat(PersonnelHierarchy.isMinister("ROLE_HIGH_COMMAND")).isFalse();

        assertThat(PersonnelHierarchy.isMinister("ROLE_MINISTER")).isTrue();
        assertThat(PersonnelHierarchy.isMinister("role_minister")).isTrue();
        assertThat(PersonnelHierarchy.isMinister("Minister")).isTrue();
        assertThat(PersonnelHierarchy.isMinister("  Minister  ")).isTrue();
    }

    @Test
    @DisplayName("getRankWeight returns correct numerical weight for ranks")
    void testGetRankWeight() {
        assertThat(PersonnelHierarchy.getRankWeight(null)).isEqualTo(0);
        assertThat(PersonnelHierarchy.getRankWeight("UNKNOWN")).isEqualTo(0);
        assertThat(PersonnelHierarchy.getRankWeight("")).isEqualTo(0);

        assertThat(PersonnelHierarchy.getRankWeight(PersonnelHierarchy.ROLE_CHIEF_HIGH_COMMAND)).isEqualTo(4);
        assertThat(PersonnelHierarchy.getRankWeight("Chief High Command")).isEqualTo(4);

        assertThat(PersonnelHierarchy.getRankWeight(PersonnelHierarchy.ROLE_HIGH_COMMAND)).isEqualTo(3);
        assertThat(PersonnelHierarchy.getRankWeight("High Command")).isEqualTo(3);
        assertThat(PersonnelHierarchy.getRankWeight("Supreme")).isEqualTo(3);

        assertThat(PersonnelHierarchy.getRankWeight(PersonnelHierarchy.ROLE_MINISTER)).isEqualTo(2);
        assertThat(PersonnelHierarchy.getRankWeight("Minister")).isEqualTo(2);

        assertThat(PersonnelHierarchy.getRankWeight(PersonnelHierarchy.ROLE_USER)).isEqualTo(1);
        assertThat(PersonnelHierarchy.getRankWeight("User")).isEqualTo(1);
        assertThat(PersonnelHierarchy.getRankWeight("Personnel")).isEqualTo(1);
    }

    @Test
    @DisplayName("canManage(String, String) enforces rank hierarchy: Supreme > Minister > User")
    void testCanManageString() {
        // Null or invalid ranks cannot manage
        assertThat(PersonnelHierarchy.canManage(null, "ROLE_USER")).isFalse();
        assertThat(PersonnelHierarchy.canManage("ROLE_HIGH_COMMAND", null)).isFalse();
        assertThat(PersonnelHierarchy.canManage("INVALID", "ROLE_USER")).isFalse();
        assertThat(PersonnelHierarchy.canManage("ROLE_HIGH_COMMAND", "INVALID")).isFalse();

        // Chief High Command can manage High Command, Ministers, and Users
        assertThat(PersonnelHierarchy.canManage("ROLE_CHIEF_HIGH_COMMAND", "ROLE_HIGH_COMMAND")).isTrue();
        assertThat(PersonnelHierarchy.canManage("Chief High Command", "ROLE_MINISTER")).isTrue();
        assertThat(PersonnelHierarchy.canManage("Chief High Command", "ROLE_USER")).isTrue();
        assertThat(PersonnelHierarchy.canManage("Chief High Command", "Chief High Command")).isFalse();

        // High Command can manage Ministers and Users, but not High Command or Chief High Command
        assertThat(PersonnelHierarchy.canManage("ROLE_HIGH_COMMAND", "ROLE_MINISTER")).isTrue();
        assertThat(PersonnelHierarchy.canManage("ROLE_HIGH_COMMAND", "ROLE_USER")).isTrue();
        assertThat(PersonnelHierarchy.canManage("ROLE_HIGH_COMMAND", "ROLE_HIGH_COMMAND")).isFalse();
        assertThat(PersonnelHierarchy.canManage("ROLE_HIGH_COMMAND", "ROLE_CHIEF_HIGH_COMMAND")).isFalse();

        // Ministers can manage Users, but not Ministers or High Command
        assertThat(PersonnelHierarchy.canManage("ROLE_MINISTER", "ROLE_USER")).isTrue();
        assertThat(PersonnelHierarchy.canManage("ROLE_MINISTER", "ROLE_MINISTER")).isFalse();
        assertThat(PersonnelHierarchy.canManage("ROLE_MINISTER", "ROLE_HIGH_COMMAND")).isFalse();

        // Users cannot manage anyone
        assertThat(PersonnelHierarchy.canManage("ROLE_USER", "ROLE_USER")).isFalse();
        assertThat(PersonnelHierarchy.canManage("ROLE_USER", "ROLE_MINISTER")).isFalse();
    }

    @Test
    @DisplayName("canManage(User, User) enforces rank hierarchy between User entities")
    void testCanManageUserEntities() {
        assertThat(PersonnelHierarchy.canManage((User) null, null)).isFalse();
        User chief = User.builder().role("ROLE_CHIEF_HIGH_COMMAND").build();
        User hc = User.builder().role("ROLE_HIGH_COMMAND").roles("High Command").build();
        User minister = User.builder().role("ROLE_MINISTER").build();
        User user = User.builder().role("ROLE_USER").build();

        assertThat(PersonnelHierarchy.canManage(chief, null)).isFalse();
        assertThat(PersonnelHierarchy.canManage(null, user)).isFalse();

        assertThat(PersonnelHierarchy.canManage(chief, hc)).isTrue();
        assertThat(PersonnelHierarchy.canManage(chief, minister)).isTrue();
        assertThat(PersonnelHierarchy.canManage(chief, user)).isTrue();

        assertThat(PersonnelHierarchy.canManage(hc, hc)).isFalse();
        assertThat(PersonnelHierarchy.canManage(hc, minister)).isTrue();
        assertThat(PersonnelHierarchy.canManage(hc, user)).isTrue();

        assertThat(PersonnelHierarchy.canManage(minister, hc)).isFalse();
        assertThat(PersonnelHierarchy.canManage(minister, minister)).isFalse();
        assertThat(PersonnelHierarchy.canManage(minister, user)).isTrue();

        assertThat(PersonnelHierarchy.canManage(user, user)).isFalse();
    }
}
