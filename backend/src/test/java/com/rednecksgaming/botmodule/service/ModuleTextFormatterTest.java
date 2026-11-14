// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.botmodule.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class ModuleTextFormatterTest {

    @ParameterizedTest(name = "format(\"{0}\") should return \"{1}\"")
    @CsvSource({
            "automod, Automod",
            "antinuke, Antinuke",
            "lastMessage, Last Message",
            "j2c, J2C",
            "loa, LOA",
            "rt_role, RT Role",
            "rivals_gp_log_channel, Rivals GP Log Channel",
            "event_approval_channel, Event Approval Channel",
            "budget_MoIA_roles, Budget MOIA Roles",
            "sp_ratio, SP Ratio",
            "gp_ratio, GP Ratio",
            "rp_points, RP Points",
            "hc_moderator, HC Moderator",
            "user_id, User ID",
            "webhook_url, Webhook URL",
            "upi_gateway, UPI Gateway",
            "wu_payment, WU Payment",
            "staff_loa, Staff LOA",
            "gfx_banner, GFX Banner",
            "ri_department, RI Department",
            "riv_tier, RIV Tier",
            "rgh_guild, RGH Guild",
            "rng_system, RNG System",
            "wt_officer, WT Officer",
            "moia_lead, MOIA Lead",
            "mot_engineer, MOT Engineer",
            "moc_event, MOC Event",
            "mop_admin, MOP Admin",
            "mof_audit, MOF Audit",
            "mogger_role, MOGGER Role",
            "citizen_i_role, Citizen I Role",
            "citizen_iv_role, Citizen IV Role",
            "event_vc_role, Event VC Role",
            "xpRate, XP Rate",
            "bulk_channel_delete_password, Bulk Channel Delete Password"
    })
    @DisplayName("ModuleTextFormatter transforms identifiers accurately according to acronym & casing rules")
    void format_transformsAccurately(String input, String expected) {
        assertThat(ModuleTextFormatter.format(input)).isEqualTo(expected);
    }

    @Test
    @DisplayName("format handles null and empty inputs safely")
    void format_nullAndEmpty() {
        assertThat(ModuleTextFormatter.format(null)).isEmpty();
        assertThat(ModuleTextFormatter.format("")).isEmpty();
        assertThat(ModuleTextFormatter.format("   ")).isEmpty();
    }
}
