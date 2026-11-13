// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.botmodule.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Categorizes network-wide configuration keys into domain-specific operational groups.
 * Strict backend-only logic evaluating both key naming schemes and semantic descriptions.
 */
@Service
public class NetworkKeyCategorizer {

    public static final String CATEGORY_FINANCIAL = "FINANCIAL";
    public static final String CATEGORY_MODERATION = "MODERATION";
    public static final String CATEGORY_RT = "RT";
    public static final String CATEGORY_CITIZENSHIP = "CITIZENSHIP";
    public static final String CATEGORY_EVENTS = "EVENTS";
    public static final String CATEGORY_RIVALS = "RIVALS";
    public static final String CATEGORY_GOVERNANCE = "GOVERNANCE";
    public static final String CATEGORY_MISC = "MISC";

    private static final Map<String, String> CATEGORY_LABELS = new LinkedHashMap<>();

    static {
        CATEGORY_LABELS.put(CATEGORY_FINANCIAL, "Financial & Payouts");
        CATEGORY_LABELS.put(CATEGORY_MODERATION, "Moderation & Security");
        CATEGORY_LABELS.put(CATEGORY_RT, "Rednecks Token (RT)");
        CATEGORY_LABELS.put(CATEGORY_CITIZENSHIP, "Citizenship & Community");
        CATEGORY_LABELS.put(CATEGORY_EVENTS, "Events & Competitions");
        CATEGORY_LABELS.put(CATEGORY_RIVALS, "Rivals Esports");
        CATEGORY_LABELS.put(CATEGORY_GOVERNANCE, "Ministries & Governance");
        CATEGORY_LABELS.put(CATEGORY_MISC, "Miscellaneous");
    }

    /**
     * Categorizes a network key by evaluating its name and semantic description.
     * Remaining unclassified keys are assigned to the Misc category.
     *
     * @param keyName             The canonical identifier (e.g. "sp_ratio", "gulag_role")
     * @param descriptionOrLabel  Optional human-readable label or description
     * @return The canonical category identifier
     */
    public String categorize(String keyName, String descriptionOrLabel) {
        if (keyName == null || keyName.isBlank()) {
            return CATEGORY_MISC;
        }

        String normalizedKey = keyName.trim().toLowerCase();
        String normalizedDesc = descriptionOrLabel != null ? descriptionOrLabel.trim().toLowerCase() : "";

        // 1. Telemetry / RT: all keys starting with rt_
        if (normalizedKey.startsWith("rt_") || normalizedDesc.contains("roughnecks telemetry")) {
            return CATEGORY_RT;
        }

        // 2. Rivals Esports: all keys starting with rivals_
        if (normalizedKey.startsWith("rivals_") || normalizedDesc.contains("rivals esports") || normalizedDesc.contains("rivals ladder")) {
            return CATEGORY_RIVALS;
        }

        // 3. Events: all keys starting with event_
        if (normalizedKey.startsWith("event_") || normalizedDesc.contains("event announcement") || normalizedDesc.contains("event approv")) {
            return CATEGORY_EVENTS;
        }

        // 4. Financial & Payouts: ratios, payouts, finance channels, payment logs, points
        if (normalizedKey.contains("payout")
                || normalizedKey.endsWith("_ratio")
                || normalizedKey.contains("sp_ratio")
                || normalizedKey.contains("gp_ratio")
                || normalizedKey.equals("sp_log_channel")
                || normalizedKey.equals("gp_log_channel")
                || normalizedKey.equals("rp_log_channel")
                || normalizedKey.startsWith("financial_")
                || normalizedKey.startsWith("finance_")
                || normalizedKey.contains("payment_log")
                || normalizedKey.equals("point_manager_role")
                || normalizedDesc.contains("payout")
                || normalizedDesc.contains("ratio for sp")
                || normalizedDesc.contains("ratio for gp")) {
            return CATEGORY_FINANCIAL;
        }

        // 5. Moderation & Security: bulk channel deletion, gulag, warnings, mod roles, moderation logs
        if (normalizedKey.startsWith("bulk_channel_delete")
                || normalizedKey.startsWith("gulag_")
                || normalizedKey.equals("moderation_log_channel")
                || normalizedKey.equals("mod_roles")
                || normalizedKey.equals("warning_threshold")
                || normalizedKey.equals("user_review_channel")
                || normalizedDesc.contains("moderation")
                || normalizedDesc.contains("gulag")
                || normalizedDesc.contains("bulk delete")) {
            return CATEGORY_MODERATION;
        }

        // 6. Citizenship & Community: citizens, parties, giveaways, boosters, teachers
        if (normalizedKey.startsWith("citizen_")
                || normalizedKey.startsWith("party_")
                || normalizedKey.equals("booster_role")
                || normalizedKey.equals("giveaway_request_channel")
                || normalizedKey.equals("teacher_roles")
                || normalizedDesc.contains("citizenship")
                || normalizedDesc.contains("party category")
                || normalizedDesc.contains("giveaway")) {
            return CATEGORY_CITIZENSHIP;
        }

        // 7. Ministries & Governance: high command, ministers, secretaries, chancellors, budgets
        if (normalizedKey.startsWith("budget_")
                || normalizedKey.startsWith("minister_")
                || normalizedKey.startsWith("secretary_")
                || normalizedKey.startsWith("chancellor_")
                || normalizedKey.startsWith("hc_")
                || normalizedDesc.contains("high command")
                || normalizedDesc.contains("minister")
                || normalizedDesc.contains("chancellor")
                || normalizedDesc.contains("ministry")) {
            return CATEGORY_GOVERNANCE;
        }

        return CATEGORY_MISC;
    }

    /**
     * Returns the canonical metadata mapping of all supported categories and their UI labels.
     */
    public Map<String, String> getCategoryLabels() {
        return new LinkedHashMap<>(CATEGORY_LABELS);
    }
}
