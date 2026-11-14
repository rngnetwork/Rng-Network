// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.embed.dto.DryRunValidationResponse;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.channel.middleman.GuildChannel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PreFlightValidatorServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private JDA jda;

    @Mock
    private Guild guild;

    @Mock
    private GuildChannel channel;

    @Mock
    private net.dv8tion.jda.api.entities.SelfMember selfMember;

    private PreFlightValidatorService validatorWithMockJda;
    private PreFlightValidatorService validatorWithoutJda;

    @BeforeEach
    void setUp() {
        validatorWithMockJda = new PreFlightValidatorService(objectMapper, jda);
        validatorWithoutJda = new PreFlightValidatorService(objectMapper, null);
    }

    private Map<String, Object> createValidPayload() {
        Map<String, Object> button = Map.of(
                "type", 2,
                "style", 1,
                "label", "Click Me",
                "custom_id", "btn_click_1"
        );

        Map<String, Object> actionRow = Map.of(
                "type", 1,
                "components", List.of(button)
        );

        Map<String, Object> textDisplay = Map.of(
                "type", 10,
                "content", "Welcome to RNG Control Center!"
        );

        Map<String, Object> container = Map.of(
                "type", 17,
                "accent_color", 5793266,
                "components", List.of(textDisplay, actionRow)
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("flags", 32768);
        payload.put("components", List.of(container));
        return payload;
    }

    @Test
    @DisplayName("Null or empty payload produces validation error")
    void validate_nullOrEmptyPayload() {
        DryRunValidationResponse resNull = validatorWithoutJda.validate("guild_1", "chan_1", null);
        assertThat(resNull.isValid()).isFalse();
        assertThat(resNull.errors()).contains("Payload map cannot be null or empty.");

        DryRunValidationResponse resEmpty = validatorWithoutJda.validate("guild_1", "chan_1", Map.of());
        assertThat(resEmpty.isValid()).isFalse();
        assertThat(resEmpty.errors()).contains("Payload map cannot be null or empty.");
    }

    @Test
    @DisplayName("Valid Discord Components V2 payload passes validation")
    void validate_validPayload() {
        Map<String, Object> payload = createValidPayload();

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isTrue();
        assertThat(response.errors()).isEmpty();
        assertThat(response.containerCount()).isEqualTo(1);
        assertThat(response.totalActionRows()).isEqualTo(1);
        assertThat(response.permissions().hasViewChannel()).isTrue();
        assertThat(response.permissions().hasSendMessages()).isTrue();
        assertThat(response.permissions().hasEmbedLinks()).isTrue();
    }

    @Test
    @DisplayName("Missing flags or invalid flags produces validation error")
    void validate_missingOrInvalidFlags() {
        Map<String, Object> payload1 = createValidPayload();
        payload1.remove("flags");

        DryRunValidationResponse res1 = validatorWithoutJda.validate("guild_1", "chan_1", payload1);
        assertThat(res1.isValid()).isFalse();
        assertThat(res1.errors()).anyMatch(e -> e.contains("flags: 32768 (IS_COMPONENTS_V2 bitmask)"));

        Map<String, Object> payload2 = createValidPayload();
        payload2.put("flags", 64);

        DryRunValidationResponse res2 = validatorWithoutJda.validate("guild_1", "chan_1", payload2);
        assertThat(res2.isValid()).isFalse();
        assertThat(res2.errors()).anyMatch(e -> e.contains("Payload flags must be 32768"));
    }

    @Test
    @DisplayName("Root-level 'content' is forbidden when flags: 32768 is set")
    void validate_forbiddenRootContent() {
        Map<String, Object> payload = createValidPayload();
        payload.put("content", "This root content should be rejected!");

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("Root-level 'content' is forbidden"));
    }

    @Test
    @DisplayName("Empty or missing components array produces validation error")
    void validate_missingOrEmptyComponents() {
        Map<String, Object> payloadMissing = new HashMap<>();
        payloadMissing.put("flags", 32768);

        DryRunValidationResponse resMissing = validatorWithoutJda.validate("guild_1", "chan_1", payloadMissing);
        assertThat(resMissing.isValid()).isFalse();
        assertThat(resMissing.errors()).anyMatch(e -> e.contains("Payload 'components' array is required"));

        Map<String, Object> payloadEmpty = new HashMap<>();
        payloadEmpty.put("flags", 32768);
        payloadEmpty.put("components", List.of());

        DryRunValidationResponse resEmpty = validatorWithoutJda.validate("guild_1", "chan_1", payloadEmpty);
        assertThat(resEmpty.isValid()).isFalse();
        assertThat(resEmpty.errors()).anyMatch(e -> e.contains("Payload 'components' array is required"));
    }

    @Test
    @DisplayName("Container inside container nesting is forbidden")
    void validate_nestedContainerForbidden() {
        Map<String, Object> nestedContainer = Map.of("type", 17, "components", List.of());
        Map<String, Object> outerContainer = Map.of(
                "type", 17,
                "components", List.of(nestedContainer)
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("flags", 32768);
        payload.put("components", List.of(outerContainer));

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("Nested containers (container inside container) are strictly forbidden"));
    }

    @Test
    @DisplayName("Container exceeding 30 nested components is rejected")
    void validate_containerExceeds30Children() {
        List<Map<String, Object>> children = new ArrayList<>();
        for (int i = 0; i < 31; i++) {
            children.add(Map.of("type", 10, "content", "Line " + i));
        }

        Map<String, Object> container = Map.of("type", 17, "components", children);
        Map<String, Object> payload = Map.of("flags", 32768, "components", List.of(container));

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("Container cannot contain more than 30 nested components"));
    }

    @Test
    @DisplayName("Container count > 10 produces validation error")
    void validate_exceedsMaxContainers() {
        List<Map<String, Object>> containers = new ArrayList<>();
        for (int i = 0; i < 11; i++) {
            containers.add(Map.of("type", 17, "components", List.of()));
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("flags", 32768);
        payload.put("components", containers);

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("cannot exceed 10 containers"));
    }

    @Test
    @DisplayName("Total components count > 40 produces validation error")
    void validate_exceedsMaxComponents() {
        List<Map<String, Object>> children = new ArrayList<>();
        for (int i = 0; i < 25; i++) {
            children.add(Map.of("type", 10, "content", "Text " + i));
        }

        Map<String, Object> c1 = Map.of("type", 17, "components", children);
        Map<String, Object> c2 = Map.of("type", 17, "components", children);

        Map<String, Object> payload = Map.of("flags", 32768, "components", List.of(c1, c2));

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("cannot exceed 40 total components"));
    }

    @Test
    @DisplayName("Action Rows count > 5 produces validation error")
    void validate_exceedsMaxActionRows() {
        List<Map<String, Object>> actionRows = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            actionRows.add(Map.of(
                    "type", 1,
                    "components", List.of(Map.of("type", 2, "style", 1, "label", "B", "custom_id", "btn_" + i))
            ));
        }

        Map<String, Object> payload = Map.of("flags", 32768, "components", actionRows);

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("cannot exceed 5 total Action Rows"));
    }

    @Test
    @DisplayName("Action Row buttons > 5 produces validation error")
    void validate_exceedsButtonsPerActionRow() {
        List<Map<String, Object>> buttons = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            buttons.add(Map.of("type", 2, "style", 1, "label", "B" + i, "custom_id", "btn_" + i));
        }

        Map<String, Object> actionRow = Map.of("type", 1, "components", buttons);
        Map<String, Object> container = Map.of("type", 17, "components", List.of(actionRow));

        Map<String, Object> payload = new HashMap<>();
        payload.put("flags", 32768);
        payload.put("components", List.of(container));

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("cannot contain more than 5 buttons"));
    }

    @Test
    @DisplayName("Button label > 80 chars is rejected")
    void validate_buttonLabelTooLong() {
        String longLabel = "A".repeat(81);
        Map<String, Object> button = Map.of("type", 2, "style", 1, "label", longLabel, "custom_id", "btn_1");
        Map<String, Object> actionRow = Map.of("type", 1, "components", List.of(button));
        Map<String, Object> payload = Map.of("flags", 32768, "components", List.of(actionRow));

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("Button label cannot exceed 80 characters"));
    }

    @Test
    @DisplayName("Interactive button without custom_id or with url or custom_id > 100 is rejected")
    void validate_invalidInteractiveButton() {
        // Missing custom_id
        Map<String, Object> btnNoId = Map.of("type", 2, "style", 1, "label", "Click");
        Map<String, Object> row1 = Map.of("type", 1, "components", List.of(btnNoId));
        Map<String, Object> payload1 = Map.of("flags", 32768, "components", List.of(row1));

        DryRunValidationResponse res1 = validatorWithoutJda.validate("guild_1", "chan_1", payload1);
        assertThat(res1.isValid()).isFalse();
        assertThat(res1.errors()).anyMatch(e -> e.contains("require a non-blank custom_id"));

        // With custom_id > 100 chars
        Map<String, Object> btnLongId = Map.of("type", 2, "style", 1, "label", "Click", "custom_id", "C".repeat(101));
        Map<String, Object> row2 = Map.of("type", 1, "components", List.of(btnLongId));
        Map<String, Object> payload2 = Map.of("flags", 32768, "components", List.of(row2));

        DryRunValidationResponse res2 = validatorWithoutJda.validate("guild_1", "chan_1", payload2);
        assertThat(res2.isValid()).isFalse();
        assertThat(res2.errors()).anyMatch(e -> e.contains("custom_id cannot exceed 100 characters"));

        // Interactive button with URL
        Map<String, Object> btnWithUrl = Map.of("type", 2, "style", 2, "label", "Click", "custom_id", "btn_ok", "url", "https://discord.com");
        Map<String, Object> row3 = Map.of("type", 1, "components", List.of(btnWithUrl));
        Map<String, Object> payload3 = Map.of("flags", 32768, "components", List.of(row3));

        DryRunValidationResponse res3 = validatorWithoutJda.validate("guild_1", "chan_1", payload3);
        assertThat(res3.isValid()).isFalse();
        assertThat(res3.errors()).anyMatch(e -> e.contains("Interactive buttons (style 1-4) cannot specify a url"));
    }

    @Test
    @DisplayName("Link button without valid http/https URL or with custom_id is rejected")
    void validate_invalidLinkButton() {
        Map<String, Object> linkBtn = Map.of(
                "type", 2,
                "style", 5,
                "label", "Broken Link",
                "url", "ftp://invalid-url.com"
        );

        Map<String, Object> actionRow = Map.of("type", 1, "components", List.of(linkBtn));
        Map<String, Object> payload = Map.of("flags", 32768, "components", List.of(actionRow));

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("Link buttons (style 5) must specify a valid URL"));

        // Link button with custom_id
        Map<String, Object> linkBtnWithId = Map.of(
                "type", 2,
                "style", 5,
                "label", "Link With ID",
                "url", "https://discord.com",
                "custom_id", "link_id"
        );
        Map<String, Object> rowWithId = Map.of("type", 1, "components", List.of(linkBtnWithId));
        Map<String, Object> payloadWithId = Map.of("flags", 32768, "components", List.of(rowWithId));

        DryRunValidationResponse resWithId = validatorWithoutJda.validate("guild_1", "chan_1", payloadWithId);
        assertThat(resWithId.isValid()).isFalse();
        assertThat(resWithId.errors()).anyMatch(e -> e.contains("Link buttons (style 5) cannot specify a custom_id"));
    }

    @Test
    @DisplayName("Select menu validation: options budget, custom_id, and mixing with buttons")
    void validate_selectMenuRules() {
        // Select menu + button in same row
        Map<String, Object> button = Map.of("type", 2, "style", 1, "label", "B", "custom_id", "btn_1");
        Map<String, Object> select = Map.of(
                "type", 3,
                "custom_id", "select_1",
                "options", List.of(Map.of("label", "Opt 1", "value", "v1"))
        );
        Map<String, Object> mixedRow = Map.of("type", 1, "components", List.of(button, select));
        Map<String, Object> mixedPayload = Map.of("flags", 32768, "components", List.of(mixedRow));

        DryRunValidationResponse resMixed = validatorWithoutJda.validate("guild_1", "chan_1", mixedPayload);
        assertThat(resMixed.isValid()).isFalse();
        assertThat(resMixed.errors()).anyMatch(e -> e.contains("Action Row cannot contain both buttons and select menus"));

        // Multiple select menus in row
        Map<String, Object> multiSelectRow = Map.of("type", 1, "components", List.of(select, select));
        Map<String, Object> multiSelectPayload = Map.of("flags", 32768, "components", List.of(multiSelectRow));

        DryRunValidationResponse resMulti = validatorWithoutJda.validate("guild_1", "chan_1", multiSelectPayload);
        assertThat(resMulti.isValid()).isFalse();
        assertThat(resMulti.errors()).anyMatch(e -> e.contains("Action Row cannot contain more than 1 select menu"));

        // Select menu missing custom_id
        Map<String, Object> noIdSelect = Map.of("type", 3, "options", List.of(Map.of("label", "Opt 1", "value", "v1")));
        Map<String, Object> noIdRow = Map.of("type", 1, "components", List.of(noIdSelect));
        Map<String, Object> noIdPayload = Map.of("flags", 32768, "components", List.of(noIdRow));

        DryRunValidationResponse resNoId = validatorWithoutJda.validate("guild_1", "chan_1", noIdPayload);
        assertThat(resNoId.isValid()).isFalse();
        assertThat(resNoId.errors()).anyMatch(e -> e.contains("Select menu requires a non-blank custom_id"));

        // Select menu with 0 options
        Map<String, Object> emptyOptsSelect = Map.of("type", 3, "custom_id", "sel_ok", "options", List.of());
        Map<String, Object> emptyOptsRow = Map.of("type", 1, "components", List.of(emptyOptsSelect));
        Map<String, Object> emptyOptsPayload = Map.of("flags", 32768, "components", List.of(emptyOptsRow));

        DryRunValidationResponse resEmptyOpts = validatorWithoutJda.validate("guild_1", "chan_1", emptyOptsPayload);
        assertThat(resEmptyOpts.isValid()).isFalse();
        assertThat(resEmptyOpts.errors()).anyMatch(e -> e.contains("Select menu must contain between 1 and 25 options"));
    }

    @Test
    @DisplayName("Section validation: accessory must be Button (2) or Thumbnail (11)")
    void validate_sectionAccessoryRules() {
        // Valid Section with Button (type 2)
        Map<String, Object> validSection = Map.of(
                "type", 9,
                "components", List.of(Map.of("type", 10, "content", "Section body")),
                "accessory", Map.of("type", 2, "style", 1, "label", "Action", "custom_id", "sec_btn")
        );
        Map<String, Object> container1 = Map.of("type", 17, "components", List.of(validSection));
        Map<String, Object> payload1 = Map.of("flags", 32768, "components", List.of(container1));

        DryRunValidationResponse res1 = validatorWithoutJda.validate("guild_1", "chan_1", payload1);
        assertThat(res1.isValid()).isTrue();

        // Valid Section with Thumbnail (type 11)
        Map<String, Object> thumbSection = Map.of(
                "type", 9,
                "components", List.of(Map.of("type", 10, "content", "Section body")),
                "accessory", Map.of("type", 11, "media", Map.of("url", "https://img.png"))
        );
        Map<String, Object> container2 = Map.of("type", 17, "components", List.of(thumbSection));
        Map<String, Object> payload2 = Map.of("flags", 32768, "components", List.of(container2));

        DryRunValidationResponse res2 = validatorWithoutJda.validate("guild_1", "chan_1", payload2);
        assertThat(res2.isValid()).isTrue();

        // Invalid Section accessory (e.g. type 10)
        Map<String, Object> invalidSection = Map.of(
                "type", 9,
                "components", List.of(Map.of("type", 10, "content", "Section body")),
                "accessory", Map.of("type", 10, "content", "Invalid accessory")
        );
        Map<String, Object> container3 = Map.of("type", 17, "components", List.of(invalidSection));
        Map<String, Object> payload3 = Map.of("flags", 32768, "components", List.of(container3));

        DryRunValidationResponse res3 = validatorWithoutJda.validate("guild_1", "chan_1", payload3);
        assertThat(res3.isValid()).isFalse();
        assertThat(res3.errors()).anyMatch(e -> e.contains("Section accessory must be either a Type 2 Button or a Type 11 Thumbnail"));
    }

    @Test
    @DisplayName("Media Gallery items > 4 produces validation error")
    void validate_mediaGalleryExceeds4Items() {
        Map<String, Object> mediaGallery = Map.of(
                "type", 12,
                "items", List.of(Map.of(), Map.of(), Map.of(), Map.of(), Map.of())
        );
        Map<String, Object> container = Map.of("type", 17, "components", List.of(mediaGallery));
        Map<String, Object> payload = Map.of("flags", 32768, "components", List.of(container));

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("Media Gallery cannot contain more than 4 items"));
    }

    @Test
    @DisplayName("Cumulative character count > 4000 is rejected")
    void validate_exceedsCumulativeCharCount() {
        String longText = "A".repeat(4001);
        Map<String, Object> textDisplay = Map.of("type", 10, "content", longText);
        Map<String, Object> container = Map.of("type", 17, "components", List.of(textDisplay));

        Map<String, Object> payload = new HashMap<>();
        payload.put("flags", 32768);
        payload.put("components", List.of(container));

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("cannot exceed 4000 characters"));
    }

    @Test
    @DisplayName("Bot permission evaluation with active JDA Gateway cache")
    void evaluateBotPermissions_liveChecks() {
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        when(jda.getGuildById("123456789")).thenReturn(guild);
        when(guild.getGuildChannelById("987654321")).thenReturn(channel);
        doReturn(selfMember).when(guild).getSelfMember();

        when(selfMember.hasPermission(channel, Permission.VIEW_CHANNEL)).thenReturn(true);
        when(selfMember.hasPermission(channel, Permission.MESSAGE_SEND)).thenReturn(true);
        when(selfMember.hasPermission(channel, Permission.MESSAGE_EMBED_LINKS)).thenReturn(false);

        Map<String, Object> payload = createValidPayload();
        DryRunValidationResponse response = validatorWithMockJda.validate("123456789", "987654321", payload);

        assertThat(response.isValid()).isTrue();
        assertThat(response.warnings()).anyMatch(w -> w.contains("Bot lacks EMBED_LINKS permission"));
        assertThat(response.permissions().hasViewChannel()).isTrue();
        assertThat(response.permissions().hasSendMessages()).isTrue();
        assertThat(response.permissions().hasEmbedLinks()).isFalse();
    }

    @Test
    @DisplayName("Bot permission evaluation flags missing VIEW_CHANNEL and MESSAGE_SEND permissions")
    void evaluateBotPermissions_lacksSendAndView() {
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        when(jda.getGuildById("123456789")).thenReturn(guild);
        when(guild.getGuildChannelById("987654321")).thenReturn(channel);
        doReturn(selfMember).when(guild).getSelfMember();

        when(selfMember.hasPermission(channel, Permission.VIEW_CHANNEL)).thenReturn(false);
        when(selfMember.hasPermission(channel, Permission.MESSAGE_SEND)).thenReturn(false);
        when(selfMember.hasPermission(channel, Permission.MESSAGE_EMBED_LINKS)).thenReturn(true);

        Map<String, Object> payload = createValidPayload();
        DryRunValidationResponse response = validatorWithMockJda.validate("123456789", "987654321", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("Bot lacks VIEW_CHANNEL permission"));
        assertThat(response.errors()).anyMatch(e -> e.contains("Bot lacks SEND_MESSAGES permission"));
    }

    @Test
    @DisplayName("Bot permission evaluation handles non-cached guild and channel with warnings")
    void evaluateBotPermissions_uncachedGuildOrChannel() {
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        when(jda.getGuildById("123456789")).thenReturn(null);

        Map<String, Object> payload = createValidPayload();
        DryRunValidationResponse resGuildMissing = validatorWithMockJda.validate("123456789", "987654321", payload);
        assertThat(resGuildMissing.warnings()).anyMatch(w -> w.contains("is not currently cached by the JDA Gateway daemon"));

        when(jda.getGuildById("123456789")).thenReturn(guild);
        when(guild.getGuildChannelById("987654321")).thenReturn(null);

        DryRunValidationResponse resChanMissing = validatorWithMockJda.validate("123456789", "987654321", payload);
        assertThat(resChanMissing.warnings()).anyMatch(w -> w.contains("Target channel 987654321 is not currently cached"));
    }

    @Test
    @DisplayName("Non-numeric serverId skips live permission checks")
    void evaluateBotPermissions_nonNumericServerId() {
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        Map<String, Object> payload = createValidPayload();

        DryRunValidationResponse response = validatorWithMockJda.validate("global", "123456", payload);
        assertThat(response.isValid()).isTrue();
        assertThat(response.permissions().hasViewChannel()).isTrue();
    }

    @Test
    @DisplayName("Non-numeric channelId adds warning and defers live permissions")
    void evaluateBotPermissions_nonNumericChannelId() {
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        when(jda.getGuildById("123456789")).thenReturn(guild);
        Map<String, Object> payload = createValidPayload();

        DryRunValidationResponse response = validatorWithMockJda.validate("123456789", "template-validation", payload);
        assertThat(response.isValid()).isTrue();
        assertThat(response.warnings()).anyMatch(w -> w.contains("Channel ID 'template-validation' is not a valid snowflake"));
    }

    @Test
    @DisplayName("JDA exception during permission evaluation is caught gracefully with debug log")
    void evaluateBotPermissions_jdaExceptionGracefullyHandled() {
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        when(jda.getGuildById("123456789")).thenThrow(new RuntimeException("JDA internal crash"));
        Map<String, Object> payload = createValidPayload();

        DryRunValidationResponse response = validatorWithMockJda.validate("123456789", "987654321", payload);
        assertThat(response.isValid()).isTrue();
        assertThat(response.permissions().hasViewChannel()).isTrue();
    }

    @Test
    @DisplayName("PreFlightValidator edge cases: top-level text display, select menu variants, and placeholder")
    void validate_edgeCasesAndComponentVariants() {
        // 1. Root-level Type 10 Text Display and Type 14 Separator
        Map<String, Object> rootTextDisplay = Map.of("type", 10, "content", "Root text header");
        Map<String, Object> rootSeparator = Map.of("type", 14);
        Map<String, Object> emptyComp = new HashMap<>();

        // 2. Select menu types 5, 6, 7, 8 with placeholder, null options, and non-map options
        Map<String, Object> roleSelect = Map.of(
                "type", 6, // RoleSelect
                "custom_id", "select_role",
                "placeholder", "Choose a role",
                "options", List.of("not-a-map", Map.of("value", "opt1")) // option without label/desc
        );

        Map<String, Object> actionRowWithSelect = Map.of(
                "type", 1,
                "components", List.of(roleSelect, emptyComp, "string-item")
        );

        // 3. Container with non-list components, media gallery <= 4, separator, and section with invalid accessory
        Map<String, Object> mediaGalleryValid = Map.of("type", 12, "items", List.of("img1", "img2"));
        Map<String, Object> sectionWithBadAccessory = Map.of(
                "type", 9,
                "components", List.of(Map.of("type", 10, "content", "Section text"), emptyComp),
                "accessory", Map.of("type", "not-a-number")
        );

        Map<String, Object> container = Map.of(
                "type", 17,
                "components", List.of(mediaGalleryValid, sectionWithBadAccessory, emptyComp, "not-a-map-child")
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("flags", "not-a-number"); // flags not a number
        payload.put("content", "   "); // whitespace content allowed
        payload.put("components", List.of(rootTextDisplay, rootSeparator, actionRowWithSelect, container, emptyComp, "not-map"));

        DryRunValidationResponse response = validatorWithoutJda.validate("123456", "654321", payload);
        assertThat(response.cumulativeCharCount()).isGreaterThan(0);
        assertThat(response.totalComponentCount()).isGreaterThan(0);
    }

    @Test
    @DisplayName("Button and select validation branches: HTTP url, null labels, empty options, and customId variants")
    void validate_buttonAndSelectBranches() {
        // Valid HTTP url button (style 5)
        Map<String, Object> httpButton = Map.of("type", 2, "style", 5, "url", "http://example.com");
        // Button with null/missing style and missing custom_id
        Map<String, Object> noStyleButton = Map.of("type", 2, "label", "No Style");
        // Button with blank custom_id
        Map<String, Object> blankCustomIdBtn = Map.of("type", 2, "style", 1, "custom_id", "   ");

        // Select menu with missing custom_id and empty options list
        Map<String, Object> emptyOptionsSelect = Map.of("type", 3, "options", List.of());

        Map<String, Object> actionRow = Map.of(
                "type", 1,
                "components", List.of(httpButton, noStyleButton, blankCustomIdBtn, emptyOptionsSelect)
        );

        Map<String, Object> payload = Map.of(
                "flags", 32768,
                "components", List.of(actionRow)
        );

        DryRunValidationResponse response = validatorWithoutJda.validate("123456", "654321", payload);
        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("Interactive buttons (style 1-4) require a non-blank custom_id"));
        assertThat(response.errors()).anyMatch(e -> e.contains("Select menu requires a non-blank custom_id"));
    }

    @Test
    @DisplayName("evaluateBotPermissions handles disconnected JDA, null serverId, and exception during UTF8 calculation")
    void evaluateBotPermissions_disconnectedJdaAndSerializationError() {
        when(jda.getStatus()).thenReturn(JDA.Status.SHUTDOWN);
        Map<String, Object> payload = createValidPayload();

        DryRunValidationResponse resShutdown = validatorWithMockJda.validate("123456", "654321", payload);
        assertThat(resShutdown.isValid()).isTrue();
        assertThat(resShutdown.permissions().hasViewChannel()).isTrue();

        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        DryRunValidationResponse resNullServer = validatorWithMockJda.validate(null, "654321", payload);
        assertThat(resNullServer.isValid()).isTrue();

        // Failing ObjectMapper for payload serialization warning
        ObjectMapper failingMapper = mock(ObjectMapper.class);
        PreFlightValidatorService failingValidator = new PreFlightValidatorService(failingMapper, null);
        try {
            when(failingMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("Byte size error") {});
        } catch (Exception ignored) {
        }
        DryRunValidationResponse resWarn = failingValidator.validate("123", "456", payload);
        assertThat(resWarn.warnings()).anyMatch(w -> w.contains("Failed to calculate exact UTF-8 payload byte size"));
    }
}
