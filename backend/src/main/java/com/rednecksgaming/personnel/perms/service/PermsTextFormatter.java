// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.service;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Formats permission keys, server identifiers, rank codes, and filename metadata for UI consumption.
 */
@Component
public class PermsTextFormatter {

    private static final int MAX_LABEL_DEPTH = 6;
    private static final String SERVER_COLLECTION_KEY = "dashboard.servers.[serverId]";
    private static final Pattern CAMEL_CASE_BOUNDARY = Pattern.compile(
            "(?<!^)(?=[A-Z][a-z])|(?<=[a-z0-9])(?=[A-Z])"
    );

    private static final Set<String> ACRONYMS = Set.of(
            "SP", "GP", "RP", "RT", "HC", "ID", "URL", "UPI", "WU", "J2C", "LOA", "GFX",
            "RI", "RIV", "RGH", "RNG", "WT", "MOIA", "MOT", "MOC", "MOP", "MOF", "MOGGER",
            "XP", "DM", "VC", "API", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"
    );

    /**
     * Converts raw dotted/camelCase/kebab/snake permission keys into human-readable display labels.
     *
     * @param raw raw permission key (e.g. {@code dashboard.personnel.perms} or {@code fullAccess})
     * @return formatted label suitable for UI headings and toggles
     */
    public String formatPermKey(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }

        if (raw.contains(".")) {
            return Arrays.stream(raw.split("\\."))
                    .filter(seg -> !seg.isEmpty())
                    .map(this::formatDottedSegment)
                    .collect(Collectors.joining(" : "));
        }

        if ("[serverid]".equalsIgnoreCase(raw)) {
            return "SERVERID";
        }

        return Arrays.stream(raw.split("[-_]+"))
                .filter(part -> !part.isEmpty())
                .map(this::formatSegment)
                .collect(Collectors.joining(" "));
    }

    /**
     * Extracts a flat key-to-label lookup map across an entire permission tree.
     *
     * @param permissionsTree  hierarchical permission map
     * @param serverNameBySlug optional map of server slug to managed guild display name
     * @return deterministic ordered map of permission keys to display labels
     */
    public Map<String, String> extractLabels(
            Map<String, Object> permissionsTree,
            Map<String, String> serverNameBySlug
    ) {
        Map<String, String> labels = new LinkedHashMap<>();
        collectLabelsInto(labels, permissionsTree, serverNameBySlug);
        return labels;
    }

    /**
     * Accumulates formatted display labels from a permission tree into an existing map.
     *
     * @param targetLabels     destination map receiving key-to-label mappings
     * @param permissionsTree  hierarchical permission map
     * @param serverNameBySlug optional map of server slug to managed guild display name
     */
    public void collectLabelsInto(
            Map<String, String> targetLabels,
            Map<String, Object> permissionsTree,
            Map<String, String> serverNameBySlug
    ) {
        if (targetLabels == null || permissionsTree == null || permissionsTree.isEmpty()) {
            return;
        }
        Map<String, String> safeServerNames = serverNameBySlug != null ? serverNameBySlug : Map.of();
        walkLabels(targetLabels, permissionsTree, safeServerNames, false, 1);
    }

    /**
     * Builds the canonical explorer filename for a role entry.
     *
     * @param roleName role display name
     * @return filename ending in {@code .json}
     */
    public String toRoleFileName(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return "role.json";
        }
        return roleName + ".json";
    }

    /**
     * Formats an integer rank weight into canonical {@code R<weight>} notation.
     *
     * @param rankWeight numeric rank weight (0-9)
     * @return rank code string
     */
    public String toRankCode(Integer rankWeight) {
        int weight = rankWeight != null ? rankWeight : 0;
        return "R" + weight;
    }

    private void walkLabels(
            Map<String, String> targetLabels,
            Map<?, ?> currentNode,
            Map<String, String> serverNameBySlug,
            boolean insideServerCollection,
            int depth
    ) {
        if (depth > MAX_LABEL_DEPTH) {
            return;
        }

        for (Map.Entry<?, ?> entry : currentNode.entrySet()) {
            if (!(entry.getKey() instanceof String key) || key.isBlank()) {
                continue;
            }

            if (insideServerCollection) {
                String guildDisplay = serverNameBySlug.get(key);
                if (guildDisplay != null && !guildDisplay.isBlank()) {
                    targetLabels.putIfAbsent(key, guildDisplay);
                } else {
                    targetLabels.putIfAbsent(key, formatPermKey(key));
                }
            } else {
                targetLabels.putIfAbsent(key, formatPermKey(key));
            }

            if (entry.getValue() instanceof Map<?, ?> childMap) {
                boolean nextIsServerCollection = SERVER_COLLECTION_KEY.equals(key);
                walkLabels(targetLabels, childMap, serverNameBySlug, nextIsServerCollection, depth + 1);
            }
        }
    }

    private String formatDottedSegment(String segment) {
        if ("[serverid]".equalsIgnoreCase(segment)) {
            return "SERVERID";
        }
        return Arrays.stream(segment.split("[-_]+"))
                .filter(part -> !part.isEmpty())
                .map(this::formatSegment)
                .collect(Collectors.joining(" "));
    }

    private String formatSegment(String part) {
        if (part == null || part.isEmpty()) {
            return "";
        }
        String upperPart = part.toUpperCase(Locale.ROOT);
        if (ACRONYMS.contains(upperPart)) {
            return upperPart;
        }
        if ("perms".equalsIgnoreCase(part)) {
            return "Permissions";
        }

        String splitCamel = CAMEL_CASE_BOUNDARY.matcher(part).replaceAll(" ").trim();
        if (splitCamel.isEmpty()) {
            return "";
        }

        return Arrays.stream(splitCamel.split("\\s+"))
                .filter(cp -> !cp.isEmpty())
                .map(this::capitalizeWordOrAcronym)
                .collect(Collectors.joining(" "));
    }

    private String capitalizeWordOrAcronym(String word) {
        String upper = word.toUpperCase(Locale.ROOT);
        if (ACRONYMS.contains(upper)) {
            return upper;
        }
        if ("perms".equalsIgnoreCase(word)) {
            return "Permissions";
        }
        if (word.length() == 1) {
            return upper;
        }
        return upper.charAt(0) + word.substring(1).toLowerCase(Locale.ROOT);
    }
}
