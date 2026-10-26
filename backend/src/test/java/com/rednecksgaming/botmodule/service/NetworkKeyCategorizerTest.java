package com.rednecksgaming.botmodule.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NetworkKeyCategorizerTest {

    private NetworkKeyCategorizer categorizer;

    @BeforeEach
    void setUp() {
        categorizer = new NetworkKeyCategorizer();
    }

    @Test
    @DisplayName("categorizes telemetry keys starting with rt_ properly")
    void testTelemetryKeys() {
        assertThat(categorizer.categorize("rt_bonus_r1_role", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_TELEMETRY);
        assertThat(categorizer.categorize("rt_rate", "Telemetry rate"))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_TELEMETRY);
        assertThat(categorizer.categorize("rt_log_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_TELEMETRY);
    }

    @Test
    @DisplayName("categorizes rivals esports keys starting with rivals_ properly")
    void testRivalsKeys() {
        assertThat(categorizer.categorize("rivals_abuse_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_RIVALS);
        assertThat(categorizer.categorize("rivals_rank_ladder", "Rivals leaderboard"))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_RIVALS);
    }

    @Test
    @DisplayName("categorizes event keys starting with event_ properly")
    void testEventKeys() {
        assertThat(categorizer.categorize("event_announce_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_EVENTS);
        assertThat(categorizer.categorize("event_approval_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_EVENTS);
    }

    @Test
    @DisplayName("categorizes financial and payout keys properly")
    void testFinancialKeys() {
        assertThat(categorizer.categorize("sp_ratio", "SP to RP ratio"))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_FINANCIAL);
        assertThat(categorizer.categorize("gp_ratio", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_FINANCIAL);
        assertThat(categorizer.categorize("crypto_payout_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_FINANCIAL);
        assertThat(categorizer.categorize("nitro_payout_roles", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_FINANCIAL);
        assertThat(categorizer.categorize("financial_log_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_FINANCIAL);
        assertThat(categorizer.categorize("payment_log_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_FINANCIAL);
        assertThat(categorizer.categorize("point_manager_role", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_FINANCIAL);
    }

    @Test
    @DisplayName("categorizes moderation keys properly")
    void testModerationKeys() {
        assertThat(categorizer.categorize("bulk_channel_delete_password", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_MODERATION);
        assertThat(categorizer.categorize("gulag_role", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_MODERATION);
        assertThat(categorizer.categorize("moderation_log_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_MODERATION);
        assertThat(categorizer.categorize("mod_roles", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_MODERATION);
        assertThat(categorizer.categorize("warning_threshold", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_MODERATION);
        assertThat(categorizer.categorize("user_review_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_MODERATION);
    }

    @Test
    @DisplayName("categorizes citizenship & community keys properly")
    void testCitizenshipKeys() {
        assertThat(categorizer.categorize("citizen_i_role", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_CITIZENSHIP);
        assertThat(categorizer.categorize("citizen_request_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_CITIZENSHIP);
        assertThat(categorizer.categorize("party_category", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_CITIZENSHIP);
        assertThat(categorizer.categorize("booster_role", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_CITIZENSHIP);
        assertThat(categorizer.categorize("giveaway_request_channel", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_CITIZENSHIP);
    }

    @Test
    @DisplayName("categorizes governance, ministry, and high command keys properly")
    void testGovernanceKeys() {
        assertThat(categorizer.categorize("budget_MoC_roles", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_GOVERNANCE);
        assertThat(categorizer.categorize("minister_MoIA_role", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_GOVERNANCE);
        assertThat(categorizer.categorize("secretary_MoT_role", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_GOVERNANCE);
        assertThat(categorizer.categorize("chancellor_rednecks_role", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_GOVERNANCE);
        assertThat(categorizer.categorize("hc_roles", null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_GOVERNANCE);
    }

    @Test
    @DisplayName("falls back to misc category for remaining unclassified network keys")
    void testMiscFallback() {
        assertThat(categorizer.categorize("random_unknown_key", "Some random text"))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_MISC);
        assertThat(categorizer.categorize(null, null))
                .isEqualTo(NetworkKeyCategorizer.CATEGORY_MISC);
        assertThat(categorizer.getCategoryLabels())
                .containsEntry(NetworkKeyCategorizer.CATEGORY_MISC, "Miscellaneous");
    }
}
