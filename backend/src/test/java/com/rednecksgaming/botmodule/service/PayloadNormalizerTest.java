package com.rednecksgaming.botmodule.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PayloadNormalizerTest {

    private PayloadNormalizer payloadNormalizer;

    @BeforeEach
    void setUp() {
        payloadNormalizer = new PayloadNormalizer(new ObjectMapper());
    }

    @Test
    @DisplayName("enrichSchema properly enriches modules and networkKeys with displayName and label without mutating original keys")
    @SuppressWarnings("unchecked")
    void enrichSchema_enrichesProperlyWithoutCorruptingKeys() {
        Map<String, Object> rawSchema = Map.of(
                "modules", Map.of(
                        "automod", Map.of(
                                "anti_spam", Map.of("type", "BOOLEAN"),
                                "rt_role", Map.of("type", "SNOWFLAKE", "label", "Custom RT Role Label"),
                                "rivals_gp_log_channel", Map.of("type", "SNOWFLAKE")
                        )
                ),
                "networkKeys", Map.of(
                        "sp_ratio", Map.of("type", "STRING"),
                        "event_approval_channel", Map.of("type", "SNOWFLAKE")
                )
        );

        Map<String, Object> enriched = payloadNormalizer.enrichSchema(rawSchema);

        // Verify top-level display name maps
        Map<String, String> moduleDisplayNames = (Map<String, String>) enriched.get("moduleDisplayNames");
        assertThat(moduleDisplayNames).containsEntry("automod", "Automod");

        Map<String, String> networkKeyDisplayNames = (Map<String, String>) enriched.get("networkKeyDisplayNames");
        assertThat(networkKeyDisplayNames).containsEntry("sp_ratio", "SP Ratio");
        assertThat(networkKeyDisplayNames).containsEntry("event_approval_channel", "Event Approval Channel");

        // Verify modules and fields keep original keys
        Map<String, Object> modules = (Map<String, Object>) enriched.get("modules");
        assertThat(modules).containsKey("automod");

        Map<String, Object> automodFields = (Map<String, Object>) modules.get("automod");
        assertThat(automodFields).containsKeys("anti_spam", "rt_role", "rivals_gp_log_channel");

        Map<String, Object> antiSpamSchema = (Map<String, Object>) automodFields.get("anti_spam");
        assertThat(antiSpamSchema.get("type")).isEqualTo("BOOLEAN");
        assertThat(antiSpamSchema.get("displayName")).isEqualTo("Anti Spam");
        assertThat(antiSpamSchema.get("label")).isEqualTo("Anti Spam");

        Map<String, Object> rtRoleSchema = (Map<String, Object>) automodFields.get("rt_role");
        assertThat(rtRoleSchema.get("displayName")).isEqualTo("RT Role");
        // Pre-existing custom label should be preserved
        assertThat(rtRoleSchema.get("label")).isEqualTo("Custom RT Role Label");

        Map<String, Object> rivalsGpLogChannelSchema = (Map<String, Object>) automodFields.get("rivals_gp_log_channel");
        assertThat(rivalsGpLogChannelSchema.get("displayName")).isEqualTo("Rivals GP Log Channel");
        assertThat(rivalsGpLogChannelSchema.get("label")).isEqualTo("Rivals GP Log Channel");

        // Verify networkKeys keep original keys
        Map<String, Object> networkKeys = (Map<String, Object>) enriched.get("networkKeys");
        assertThat(networkKeys).containsKeys("sp_ratio", "event_approval_channel");

        Map<String, Object> spRatioSchema = (Map<String, Object>) networkKeys.get("sp_ratio");
        assertThat(spRatioSchema.get("type")).isEqualTo("STRING");
        assertThat(spRatioSchema.get("displayName")).isEqualTo("SP Ratio");
        assertThat(spRatioSchema.get("label")).isEqualTo("SP Ratio");
        assertThat(spRatioSchema.get("category")).isEqualTo("FINANCIAL");

        Map<String, Object> eventApprovalChannelSchema = (Map<String, Object>) networkKeys.get("event_approval_channel");
        assertThat(eventApprovalChannelSchema.get("displayName")).isEqualTo("Event Approval Channel");
        assertThat(eventApprovalChannelSchema.get("label")).isEqualTo("Event Approval Channel");
        assertThat(eventApprovalChannelSchema.get("category")).isEqualTo("EVENTS");

        assertThat(enriched).containsKey("networkKeyCategories");
        Map<String, String> categories = (Map<String, String>) enriched.get("networkKeyCategories");
        assertThat(categories).containsEntry("FINANCIAL", "Financial & Payouts");
    }

    @Test
    @DisplayName("enrichSchema handles null safely")
    void enrichSchema_nullSafe() {
        assertThat(payloadNormalizer.enrichSchema(null)).isEqualTo(Collections.emptyMap());
    }

    @Test
    @DisplayName("normalizeNetworkPayload merges default, config, schema and network without losing fields")
    @SuppressWarnings("unchecked")
    void normalizeNetworkPayload_mergesProperly() {
        Map<String, Object> rawDefault = Map.of(
                "hubGuildId", "111222333444555666",
                "servers", Map.of("roughnuts", "123456789012345678"),
                "modules", Map.of(
                        "automod", Map.of("anti_spam", true, "badWords", "[\"bad1\", \"bad2\"]")
                ),
                "network", Map.of("sp_ratio", "5")
        );

        Map<String, Object> rawConfig = Map.of(
                "schema", Map.of(
                        "modules", Map.of("automod", Map.of("anti_spam", Map.of("type", "BOOLEAN"))),
                        "networkKeys", Map.of("sp_ratio", Map.of("type", "STRING"))
                )
        );

        Map<String, Object> result = payloadNormalizer.normalizeNetworkPayload(rawDefault, rawConfig);

        assertThat(result.get("hubGuildId")).isEqualTo("111222333444555666");
        assertThat(result.get("servers")).isNotNull();
        assertThat(result.get("network")).isNotNull();

        Map<String, Object> modules = (Map<String, Object>) result.get("modules");
        Map<String, Object> automod = (Map<String, Object>) modules.get("automod");
        assertThat(automod.get("anti_spam")).isEqualTo(true);
        // Stringified JSON array should be un-stringified to List
        assertThat(automod.get("badWords")).asList().containsExactly("bad1", "bad2");

        Map<String, Object> schema = (Map<String, Object>) result.get("schema");
        assertThat(schema).containsKey("moduleDisplayNames");
        assertThat(schema).containsKey("networkKeyDisplayNames");
    }
}
