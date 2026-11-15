// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.identity.domain;

import com.rednecksgaming.common.domain.BaseJpaEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email", unique = true),
        @Index(name = "idx_users_discord_id", columnList = "discord_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseJpaEntity {

    public static final String SUPREME = "Supreme";
    public static final String CHANCELLORY = "Chancellory";
    public static final String ROLE_CHIEF_HIGH_COMMAND = "ROLE_CHIEF_HIGH_COMMAND";
    public static final String ROLE_HIGH_COMMAND = "ROLE_HIGH_COMMAND";
    public static final String ROLE_MINISTER = "ROLE_MINISTER";
    public static final String ROLE_USER = "ROLE_USER";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 255)
    private String password;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthProvider provider;

    @Column(name = "google_id", length = 100)
    private String googleId;

    @Column(name = "discord_id", length = 100)
    private String discordId;

    @Column(name = "discord_username", length = 100)
    private String discordUsername;

    @Column(name = "discord_avatar", length = 255)
    private String discordAvatar;

    @Column(name = "discord_linked", nullable = false)
    @Builder.Default
    private boolean discordLinked = false;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String role = "ROLE_USER";

    @Column(columnDefinition = "TEXT")
    private String designations;

    @Column(columnDefinition = "TEXT")
    private String roles;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    public List<String> getDesignationList() {
        if (designations == null || designations.isBlank()) return List.of();
        return java.util.Arrays.stream(designations.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public List<String> getRoleList() {
        if (roles == null || roles.isBlank()) return List.of();
        return java.util.Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(this.status);
    }

    // --- Personnel Clearance & Hierarchy Methods ---

    public int getRankWeight() {
        return getRankWeight(this);
    }

    public boolean isChiefHighCommand() {
        return isChiefHighCommand(this);
    }

    public boolean isHighCommand() {
        return isHighCommand(this);
    }

    public boolean isDirector() {
        return isDirector(this);
    }

    public boolean isExecutiveDirector() {
        return isExecutiveDirector(this);
    }

    public boolean isMinister() {
        return isMinister(this);
    }

    public List<String> getMinisterMinistries() {
        return getMinisterMinistries(this);
    }

    public boolean isMinisterOf(String ministry) {
        return isMinisterOf(this, ministry);
    }

    public boolean canManage(User target) {
        return canManage(this, target);
    }

    public static int getRoleRankWeight(String roleName) {
        if (roleName == null || roleName.isBlank()) return 0;
        String pure = roleName.contains(":") ? roleName.substring(roleName.indexOf(":") + 1).trim() : roleName.trim();
        if (pure.equalsIgnoreCase("Chief High Command")) return 9;
        if (pure.equalsIgnoreCase("High Command")) return 8;
        if (pure.equalsIgnoreCase("Director")) return 7;
        if (pure.equalsIgnoreCase("Executive Director")) return 6;
        if (pure.equalsIgnoreCase("Minister") || pure.toLowerCase().startsWith("chancellor")) return 5;
        if (pure.equalsIgnoreCase("Secretary")) return 4;
        if (pure.equalsIgnoreCase("Senior Agent")
                || pure.equalsIgnoreCase("Tech Specialist")
                || pure.equalsIgnoreCase("Magister Officiorum")
                || pure.equalsIgnoreCase("Digital assets officer")) return 3;
        if (pure.equalsIgnoreCase("Agent")
                || pure.equalsIgnoreCase("Senior Dev")
                || pure.equalsIgnoreCase("Tribunus")
                || pure.equalsIgnoreCase("Regional treasurer")) return 2;
        if (pure.equalsIgnoreCase("Junior Dev")
                || pure.equalsIgnoreCase("Legatus")
                || pure.equalsIgnoreCase("PayPal treasurer")) return 1;
        return 1;
    }

    public static int getRankWeight(User user) {
        if (user == null) return 0;
        int maxWeight = 0;
        List<String> roleList = user.getRoleList();
        for (String r : roleList) {
            maxWeight = Math.max(maxWeight, getRoleRankWeight(r));
        }

        if (maxWeight == 0) {
            String primary = user.getRole();
            if (ROLE_CHIEF_HIGH_COMMAND.equalsIgnoreCase(primary)) return 9;
            if (ROLE_HIGH_COMMAND.equalsIgnoreCase(primary)) return 8;
            if (ROLE_MINISTER.equalsIgnoreCase(primary)) return 5;
            if (ROLE_USER.equalsIgnoreCase(primary)) return 1;
        }

        return maxWeight;
    }

    public static int getRankWeight(String rank) {
        if (rank == null) return 0;
        String trimmed = rank.trim();
        if (ROLE_CHIEF_HIGH_COMMAND.equalsIgnoreCase(trimmed) || "Chief High Command".equalsIgnoreCase(trimmed)) {
            return 9;
        }
        if (ROLE_HIGH_COMMAND.equalsIgnoreCase(trimmed) || "High Command".equalsIgnoreCase(trimmed) || SUPREME.equalsIgnoreCase(trimmed)) {
            return 8;
        }
        if ("Director".equalsIgnoreCase(trimmed)) {
            return 7;
        }
        if ("Executive Director".equalsIgnoreCase(trimmed)) {
            return 6;
        }
        if (ROLE_MINISTER.equalsIgnoreCase(trimmed) || "Minister".equalsIgnoreCase(trimmed) || trimmed.toLowerCase().startsWith("chancellor")) {
            return 5;
        }
        if ("Secretary".equalsIgnoreCase(trimmed)) {
            return 4;
        }
        if (ROLE_USER.equalsIgnoreCase(trimmed) || "User".equalsIgnoreCase(trimmed) || "Personnel".equalsIgnoreCase(trimmed)) {
            return 1;
        }
        return 0;
    }

    public static boolean isChiefHighCommand(User user) {
        if (user == null) return false;
        List<String> roles = user.getRoleList();
        boolean hasChiefRole = roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("Chief High Command");
        });
        return hasChiefRole || ROLE_CHIEF_HIGH_COMMAND.equalsIgnoreCase(user.getRole()) || getRankWeight(user) >= 9;
    }

    public static boolean isHighCommand(User user) {
        if (user == null) return false;
        if (isChiefHighCommand(user)) return true;
        List<String> roles = user.getRoleList();
        boolean hasHcRole = roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("High Command");
        });
        return hasHcRole || ROLE_HIGH_COMMAND.equalsIgnoreCase(user.getRole()) || getRankWeight(user) >= 8;
    }

    public static boolean isDirector(User user) {
        if (user == null || isHighCommand(user)) return false;
        return getRankWeight(user) == 7;
    }

    public static boolean isExecutiveDirector(User user) {
        if (user == null || isHighCommand(user)) return false;
        return getRankWeight(user) == 6;
    }

    public static boolean isMinister(User user) {
        if (user == null || isHighCommand(user)) return false;
        if (ROLE_MINISTER.equalsIgnoreCase(user.getRole())) return true;
        return getRankWeight(user) == 5;
    }

    public static List<String> getMinisterMinistries(User user) {
        if (user == null || !isMinister(user)) return List.of();
        List<String> designations = user.getDesignationList();
        return designations.stream()
                .filter(d -> d.startsWith("Ministry of") || (d.equalsIgnoreCase(CHANCELLORY) && user.getRoleList().stream().anyMatch(r -> r.toLowerCase().contains("chancellor"))))
                .toList();
    }

    public static boolean isMinisterOf(User user, String ministry) {
        if (user == null || ministry == null) return false;
        return getMinisterMinistries(user).stream().anyMatch(m -> m.equalsIgnoreCase(ministry.trim()));
    }

    public static String computePrimaryRole(List<String> roles, List<String> designations) {
        if (roles == null) roles = List.of();

        boolean hasChiefHc = roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("Chief High Command");
        });
        if (hasChiefHc) {
            return ROLE_HIGH_COMMAND;
        }

        boolean hasHc = roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("High Command");
        });
        if (hasHc) {
            return ROLE_HIGH_COMMAND;
        }

        boolean hasMinister = roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("Minister") || pure.toLowerCase().startsWith("chancellor");
        });
        if (hasMinister) {
            return ROLE_MINISTER;
        }

        return ROLE_USER;
    }

    public static boolean canManage(String operatorRank, String targetRank) {
        int opWeight = getRankWeight(operatorRank);
        int targetWeight = getRankWeight(targetRank);
        if (opWeight == 0 || targetWeight == 0) return false;
        return opWeight > targetWeight;
    }

    public static boolean canManage(User operator, User target) {
        if (operator == null || target == null) return false;
        return getRankWeight(operator) > getRankWeight(target);
    }
}
