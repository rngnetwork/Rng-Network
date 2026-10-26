package com.rednecksgaming.identity.domain;

import java.util.*;

/**
 * Defines the canonical RNG Network Personnel Hierarchy, Designations, and Roles.
 */
public final class PersonnelHierarchy {

    private PersonnelHierarchy() {
    }

    public static final String SUPREME = "Supreme";
    public static final String CHANCELLORY = "Chancellory";

    public static final String MINISTRY_INTERNAL_AFFAIRS = "Ministry of Growth, GFX and External Relations";
    public static final String MINISTRY_PERSONELL = "Ministry of Personell";
    public static final String MINISTRY_TECH = "Ministry of Tech";
    public static final String MINISTRY_FINANCES = "Ministry of Finances";
    public static final String MINISTRY_CULTURE = "Ministry of Culture";
    public static final String MINISTRY_EXTERNAL_AFFAIRS = "Ministry of External affairs";

    public static final String ROLE_CHIEF_HIGH_COMMAND = "ROLE_CHIEF_HIGH_COMMAND";
    public static final String ROLE_HIGH_COMMAND = "ROLE_HIGH_COMMAND";
    public static final String ROLE_MINISTER = "ROLE_MINISTER";
    public static final String ROLE_USER = "ROLE_USER";

    public static final Map<String, List<String>> DESIGNATION_ROLES_MAP;

    static {
        Map<String, List<String>> map = new LinkedHashMap<>();

        // 1. Supreme
        map.put(SUPREME, List.of("Chief High Command", "High Command"));

        // 2. Ministries
        map.put(MINISTRY_INTERNAL_AFFAIRS, List.of("Minister", "Secretary", "Senior Agent", "Agent"));
        map.put(MINISTRY_PERSONELL, List.of("Minister", "Secretary", "Magister Officiorum", "Tribunus", "Legatus"));
        map.put(MINISTRY_TECH, List.of("Minister", "Secretary", "Tech Specialist", "Senior Dev", "Junior Dev"));
        map.put(MINISTRY_FINANCES, List.of("Minister", "Secretary", "Digital assets officer", "Regional treasurer", "PayPal treasurer"));
        map.put(MINISTRY_CULTURE, List.of("Minister", "Secretary"));
        map.put(MINISTRY_EXTERNAL_AFFAIRS, List.of("Minister", "Secretary"));

        // 3. Chancellory
        map.put(CHANCELLORY, List.of(
                "Chancellor of Roughnuts",
                "Chancellor of Rednecks Gaming",
                "Chancellor of Rivals"
        ));

        DESIGNATION_ROLES_MAP = Collections.unmodifiableMap(map);
    }

    public static List<String> getAllDesignations() {
        return new ArrayList<>(DESIGNATION_ROLES_MAP.keySet());
    }

    public static List<String> getRolesForDesignation(String designation) {
        return DESIGNATION_ROLES_MAP.getOrDefault(designation, List.of());
    }

    public static boolean isValidDesignation(String designation) {
        return designation != null && DESIGNATION_ROLES_MAP.containsKey(designation.trim());
    }

    public static boolean isValidRoleForDesignation(String designation, String role) {
        if (designation == null || role == null) return false;
        String pureRole = role.contains(":") ? role.substring(role.indexOf(":") + 1).trim() : role.trim();
        String targetDes = role.contains(":") ? role.substring(0, role.indexOf(":")).trim() : designation.trim();
        List<String> roles = DESIGNATION_ROLES_MAP.get(targetDes);
        if (roles == null) return false;
        return roles.stream().anyMatch(r -> r.equalsIgnoreCase(pureRole));
    }

    public static boolean isChiefHighCommand(User user) {
        if (user == null) return false;
        List<String> roles = user.getRoleList();
        boolean hasChiefRole = roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("Chief High Command");
        });
        return hasChiefRole || "ROLE_CHIEF_HIGH_COMMAND".equalsIgnoreCase(user.getRole());
    }

    public static boolean isHighCommand(User user) {
        if (user == null) return false;
        if (isChiefHighCommand(user)) return true;
        List<String> roles = user.getRoleList();
        boolean hasHcRole = roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("High Command") || pure.equalsIgnoreCase("Chief High Command");
        });
        return hasHcRole || "ROLE_HIGH_COMMAND".equalsIgnoreCase(user.getRole()) || "ROLE_CHIEF_HIGH_COMMAND".equalsIgnoreCase(user.getRole());
    }

    public static boolean isMinister(User user) {
        if (user == null || isHighCommand(user)) return false;
        if ("ROLE_MINISTER".equalsIgnoreCase(user.getRole())) return true;
        List<String> roles = user.getRoleList();
        return roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("Minister");
        });
    }

    public static List<String> getMinisterMinistries(User user) {
        if (user == null || !isMinister(user)) return List.of();
        List<String> designations = user.getDesignationList();
        return designations.stream()
                .filter(d -> d.startsWith("Ministry of"))
                .toList();
    }

    public static boolean isMinisterOf(User user, String ministry) {
        if (user == null || ministry == null) return false;
        return getMinisterMinistries(user).contains(ministry.trim());
    }

    public static String computePrimaryRole(List<String> roles, List<String> designations) {
        if (roles == null) roles = List.of();

        boolean hasChiefHc = roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("Chief High Command");
        });

        if (hasChiefHc) {
            return "ROLE_HIGH_COMMAND";
        }

        boolean hasHc = roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("High Command");
        });

        if (hasHc) {
            return "ROLE_HIGH_COMMAND";
        }

        boolean hasMinister = roles.stream().anyMatch(r -> {
            String pure = r.contains(":") ? r.substring(r.indexOf(":") + 1).trim() : r.trim();
            return pure.equalsIgnoreCase("Minister");
        });

        if (hasMinister) {
            return "ROLE_MINISTER";
        }
        return "ROLE_USER";
    }

    public static boolean isSupreme(String rank) {
        if (rank == null) return false;
        String trimmed = rank.trim();
        return ROLE_CHIEF_HIGH_COMMAND.equalsIgnoreCase(trimmed)
                || ROLE_HIGH_COMMAND.equalsIgnoreCase(trimmed)
                || "Chief High Command".equalsIgnoreCase(trimmed)
                || "High Command".equalsIgnoreCase(trimmed)
                || SUPREME.equalsIgnoreCase(trimmed);
    }

    public static boolean isMinister(String rank) {
        if (rank == null) return false;
        String trimmed = rank.trim();
        return ROLE_MINISTER.equalsIgnoreCase(trimmed)
                || "Minister".equalsIgnoreCase(trimmed);
    }

    public static int getRankWeight(String rank) {
        if (rank == null) return 0;
        String trimmed = rank.trim();
        if (ROLE_CHIEF_HIGH_COMMAND.equalsIgnoreCase(trimmed) || "Chief High Command".equalsIgnoreCase(trimmed)) {
            return 4;
        }
        if (ROLE_HIGH_COMMAND.equalsIgnoreCase(trimmed) || "High Command".equalsIgnoreCase(trimmed) || SUPREME.equalsIgnoreCase(trimmed)) {
            return 3;
        }
        if (ROLE_MINISTER.equalsIgnoreCase(trimmed) || "Minister".equalsIgnoreCase(trimmed)) {
            return 2;
        }
        if (ROLE_USER.equalsIgnoreCase(trimmed) || "User".equalsIgnoreCase(trimmed) || "Personnel".equalsIgnoreCase(trimmed)) {
            return 1;
        }
        return 0;
    }

    public static boolean canManage(String operatorRank, String targetRank) {
        int opWeight = getRankWeight(operatorRank);
        int targetWeight = getRankWeight(targetRank);
        if (opWeight == 0 || targetWeight == 0) return false;
        return opWeight > targetWeight;
    }

    public static boolean canManage(User operator, User target) {
        if (operator == null || target == null) return false;
        String opRole = isChiefHighCommand(operator) ? ROLE_CHIEF_HIGH_COMMAND : operator.getRole();
        String targetRole = isChiefHighCommand(target) ? ROLE_CHIEF_HIGH_COMMAND : target.getRole();
        return canManage(opRole, targetRole);
    }
}
