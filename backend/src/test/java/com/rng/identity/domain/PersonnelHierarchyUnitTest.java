package com.rng.identity.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PersonnelHierarchyUnitTest {

    @Test
    @DisplayName("getAllDesignations returns all canonical tiers and ministries")
    void getAllDesignations_returnsAll() {
        List<String> designations = PersonnelHierarchy.getAllDesignations();

        assertThat(designations).contains(
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
    @DisplayName("getRolesForDesignation returns correct roles or empty list for unknown")
    void getRolesForDesignation_validAndInvalid() {
        List<String> techRoles = PersonnelHierarchy.getRolesForDesignation(PersonnelHierarchy.MINISTRY_TECH);
        assertThat(techRoles).contains("Minister", "Tech Specialist", "Senior Dev", "Junior Dev");

        List<String> unknownRoles = PersonnelHierarchy.getRolesForDesignation("Unknown Ministry");
        assertThat(unknownRoles).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Supreme",
            "Ministry of Tech",
            "Ministry of Finances",
            "Chancellory"
    })
    @DisplayName("isValidDesignation returns true for existing designations")
    void isValidDesignation_valid(String designation) {
        assertThat(PersonnelHierarchy.isValidDesignation(designation)).isTrue();
        assertThat(PersonnelHierarchy.isValidDesignation("  " + designation + "  ")).isTrue();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"Fake Department", "Ministry of Magic", "Unknown"})
    @DisplayName("isValidDesignation returns false for invalid or null designations")
    void isValidDesignation_invalid(String designation) {
        assertThat(PersonnelHierarchy.isValidDesignation(designation)).isFalse();
    }

    @Test
    @DisplayName("isValidRoleForDesignation validates roles with and without prefix colon")
    void isValidRoleForDesignation_matrix() {
        assertThat(PersonnelHierarchy.isValidRoleForDesignation(null, "Senior Dev")).isFalse();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation("Ministry of Tech", null)).isFalse();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation("Unknown", "Senior Dev")).isFalse();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation("Ministry of Tech", "Senior Dev")).isTrue();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation("Ministry of Tech", "senior dev")).isTrue();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation("Supreme", "Ministry of Tech:Senior Dev")).isTrue();
        assertThat(PersonnelHierarchy.isValidRoleForDesignation("Ministry of Tech", "Invalid Role")).isFalse();
    }

    @Test
    @DisplayName("isChiefHighCommand evaluates null user, role string, role list, and authority")
    void isChiefHighCommand_evaluations() {
        assertThat(PersonnelHierarchy.isChiefHighCommand(null)).isFalse();

        User userNoRoles = User.builder().build();
        assertThat(PersonnelHierarchy.isChiefHighCommand(userNoRoles)).isFalse();

        User userAuthority = User.builder().role("ROLE_CHIEF_HIGH_COMMAND").build();
        assertThat(PersonnelHierarchy.isChiefHighCommand(userAuthority)).isTrue();

        User userRoleList = User.builder().roles("Chief High Command").build();
        assertThat(PersonnelHierarchy.isChiefHighCommand(userRoleList)).isTrue();

        User userPrefixedRole = User.builder().roles("Supreme:Chief High Command").build();
        assertThat(PersonnelHierarchy.isChiefHighCommand(userPrefixedRole)).isTrue();
    }

    @Test
    @DisplayName("isHighCommand evaluates null user, chief, regular HC, and authority")
    void isHighCommand_evaluations() {
        assertThat(PersonnelHierarchy.isHighCommand(null)).isFalse();

        User chiefUser = User.builder().role("ROLE_CHIEF_HIGH_COMMAND").build();
        assertThat(PersonnelHierarchy.isHighCommand(chiefUser)).isTrue();

        User hcUser = User.builder().role("ROLE_HIGH_COMMAND").build();
        assertThat(PersonnelHierarchy.isHighCommand(hcUser)).isTrue();

        User hcRole = User.builder().roles("High Command").build();
        assertThat(PersonnelHierarchy.isHighCommand(hcRole)).isTrue();

        User hcPrefixed = User.builder().roles("Supreme:High Command").build();
        assertThat(PersonnelHierarchy.isHighCommand(hcPrefixed)).isTrue();

        User regularUser = User.builder().role("ROLE_USER").roles("Agent").build();
        assertThat(PersonnelHierarchy.isHighCommand(regularUser)).isFalse();
    }

    @Test
    @DisplayName("isMinister evaluates null user, HC priority, authority, and role list")
    void isMinister_evaluations() {
        assertThat(PersonnelHierarchy.isMinister(null)).isFalse();

        User hcUser = User.builder().role("ROLE_HIGH_COMMAND").roles("Minister").build();
        assertThat(PersonnelHierarchy.isMinister(hcUser)).isFalse();

        User ministerAuthority = User.builder().role("ROLE_MINISTER").build();
        assertThat(PersonnelHierarchy.isMinister(ministerAuthority)).isTrue();

        User ministerRole = User.builder().roles("Minister").build();
        assertThat(PersonnelHierarchy.isMinister(ministerRole)).isTrue();

        User ministerPrefixed = User.builder().roles("Ministry of Tech:Minister").build();
        assertThat(PersonnelHierarchy.isMinister(ministerPrefixed)).isTrue();

        User regularUser = User.builder().role("ROLE_USER").roles("Junior Dev").build();
        assertThat(PersonnelHierarchy.isMinister(regularUser)).isFalse();
    }

    @Test
    @DisplayName("getMinisterMinistries and isMinisterOf filter ministry designations")
    void getMinisterMinistries_and_isMinisterOf() {
        assertThat(PersonnelHierarchy.getMinisterMinistries(null)).isEmpty();
        assertThat(PersonnelHierarchy.isMinisterOf(null, "Ministry of Tech")).isFalse();
        assertThat(PersonnelHierarchy.isMinisterOf(User.builder().build(), null)).isFalse();

        User minister = User.builder()
                .role("ROLE_MINISTER")
                .designations("Ministry of Tech, Chancellory")
                .build();

        List<String> ministries = PersonnelHierarchy.getMinisterMinistries(minister);
        assertThat(ministries).containsExactly("Ministry of Tech");

        assertThat(PersonnelHierarchy.isMinisterOf(minister, "Ministry of Tech")).isTrue();
        assertThat(PersonnelHierarchy.isMinisterOf(minister, "Ministry of Finances")).isFalse();
    }

    @Test
    @DisplayName("computePrimaryRole resolves hierarchy from Chief HC down to regular user")
    void computePrimaryRole_matrix() {
        assertThat(PersonnelHierarchy.computePrimaryRole(null, null)).isEqualTo("ROLE_USER");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of(), List.of())).isEqualTo("ROLE_USER");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Chief High Command"), List.of("Supreme"))).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Supreme:Chief High Command"), List.of())).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("High Command"), List.of("Supreme"))).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Supreme:High Command"), List.of())).isEqualTo("ROLE_HIGH_COMMAND");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Minister"), List.of("Ministry of Tech"))).isEqualTo("ROLE_MINISTER");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Ministry of Tech:Minister"), List.of())).isEqualTo("ROLE_MINISTER");
        assertThat(PersonnelHierarchy.computePrimaryRole(List.of("Junior Dev"), List.of("Ministry of Tech"))).isEqualTo("ROLE_USER");
    }
}
