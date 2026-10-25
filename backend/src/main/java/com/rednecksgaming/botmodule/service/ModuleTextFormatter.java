package com.rednecksgaming.botmodule.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;


public final class ModuleTextFormatter {

    private static final Set<String> ACRONYMS = Set.of(
            "SP", "GP", "RP", "RT", "HC", "ID", "URL", "UPI", "WU", "J2C", "LOA",
            "GFX", "RI", "RIV", "RGH", "RNG", "WT", "MOIA", "MOT", "MOC", "MOP", "MOF", "MOGGER",
            "XP", "DM", "VC", "API",
            "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"
    );

    private ModuleTextFormatter() {
    }

    public static String format(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }

        // Split by underscores, hyphens, or whitespace first
        String[] parts = raw.trim().split("[_\\-\\s]+");
        List<String> tokens = new ArrayList<>();

        for (String part : parts) {
            if (part.isEmpty()) {
                continue;
            }

            // Check if entire part is a recognized acronym (case-insensitive)
            String upperPart = part.toUpperCase();
            if (ACRONYMS.contains(upperPart)) {
                tokens.add(upperPart);
                continue;
            }

            // Split camelCase boundaries, e.g. 'lastMessage' -> 'last', 'Message'
            String[] camelParts = part.replaceAll("(?<!^)(?=[A-Z][a-z])|(?<=[a-z0-9])(?=[A-Z])", " ")
                    .trim()
                    .split("\\s+");

            for (String cp : camelParts) {
                if (cp.isEmpty()) {
                    continue;
                }
                String upper = cp.toUpperCase();
                if (ACRONYMS.contains(upper)) {
                    tokens.add(upper);
                } else {
                    tokens.add(Character.toUpperCase(cp.charAt(0)) + cp.substring(1).toLowerCase());
                }
            }
        }

        return String.join(" ", tokens);
    }
}
