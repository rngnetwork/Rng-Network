package com.rng.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.embed.dto.DryRunValidationResponse;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PreFlightValidatorServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private JDA jda;

    @Mock
    private Guild guild;

    @Mock
    private TextChannel textChannel;

    @Mock
    private Member selfMember;

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
    @DisplayName("Missing flags: 32768 produces validation error")
    void validate_missingFlags() {
        Map<String, Object> payload = createValidPayload();
        payload.remove("flags");

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("flags: 32768"));
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
        assertThat(response.errors()).anyMatch(e -> e.contains("Nested containers"));
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
    @DisplayName("Link button without valid http/https URL is rejected")
    void validate_invalidLinkButton() {
        Map<String, Object> linkBtn = Map.of(
                "type", 2,
                "style", 5,
                "label", "Broken Link",
                "url", "ftp://invalid-url.com"
        );

        Map<String, Object> actionRow = Map.of("type", 1, "components", List.of(linkBtn));
        Map<String, Object> container = Map.of("type", 17, "components", List.of(actionRow));

        Map<String, Object> payload = new HashMap<>();
        payload.put("flags", 32768);
        payload.put("components", List.of(container));

        DryRunValidationResponse response = validatorWithoutJda.validate("guild_1", "chan_1", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.errors()).anyMatch(e -> e.contains("Link buttons (style 5) must specify a valid URL"));
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
    @DisplayName("Bot permission check reports missing permissions from JDA gateway")
    void validate_botPermissionCheck() {
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);
        when(jda.getGuildById("guild_123")).thenReturn(guild);
        when(guild.getGuildChannelById("chan_456")).thenReturn(textChannel);
        when(guild.getSelfMember()).thenReturn(selfMember);
        when(selfMember.hasPermission(textChannel, Permission.VIEW_CHANNEL)).thenReturn(true);
        when(selfMember.hasPermission(textChannel, Permission.MESSAGE_SEND)).thenReturn(false);
        when(selfMember.hasPermission(textChannel, Permission.MESSAGE_EMBED_LINKS)).thenReturn(true);

        Map<String, Object> payload = createValidPayload();

        DryRunValidationResponse response = validatorWithMockJda.validate("guild_123", "chan_456", payload);

        assertThat(response.isValid()).isFalse();
        assertThat(response.permissions().hasViewChannel()).isTrue();
        assertThat(response.permissions().hasSendMessages()).isTrue();
        assertThat(response.permissions().hasEmbedLinks()).isTrue();
        assertThat(response.errors()).anyMatch(e -> e.contains("SEND_MESSAGES"));
    }
}
