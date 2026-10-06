package com.rng.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.embed.domain.EmbedTemplate;
import net.dv8tion.jda.api.components.actionrow.ActionRow;
import net.dv8tion.jda.api.components.buttons.Button;
import net.dv8tion.jda.api.components.buttons.ButtonStyle;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EmbedTemplateRendererTest {

    private EmbedTemplateRenderer renderer;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        renderer = new EmbedTemplateRendererImpl(objectMapper);
    }

    @Test
    @DisplayName("Should interpolate runtime context variables in Discord Components V2 payload")
    void should_interpolate_variables_in_components_v2_payload() {
        Map<String, String> vars = Map.of(
                "user", "<@111>",
                "targetUser", "<@222>",
                "targetRole", "<@&333>",
                "server", "RNG Army"
        );
        String raw = "{user} granted role {targetRole} to {targetUser} in {server}";
        String rendered = renderer.interpolateVariables(raw, vars);
        assertThat(rendered).isEqualTo("<@111> granted role <@&333> to <@222> in RNG Army");
    }

    @Test
    @DisplayName("Should return raw string when variables or raw string is null or empty")
    void should_handle_null_or_empty_variables_cleanly() {
        assertThat(renderer.interpolateVariables(null, Map.of("user", "123"))).isNull();
        assertThat(renderer.interpolateVariables("Hello {user}", null)).isEqualTo("Hello {user}");
        assertThat(renderer.interpolateVariables("Hello {user}", Map.of())).isEqualTo("Hello {user}");
    }

    @Test
    @DisplayName("Should replace null variable value with empty string")
    void should_replace_null_variable_value_with_empty_string() {
        Map<String, String> vars = new HashMap<>();
        vars.put("user", null);
        String rendered = renderer.interpolateVariables("User: {user}", vars);
        assertThat(rendered).isEqualTo("User: ");
    }

    @Test
    @DisplayName("Should render EmbedTemplate into MessageCreateData with content and buttons")
    void should_render_template_to_message_create_data() {
        Map<String, Object> payload = Map.of(
                "content", "Action performed by {user} on {targetUser}",
                "components", List.of(
                        Map.of(
                                "type", 1,
                                "components", List.of(
                                        Map.of(
                                                "type", 2,
                                                "style", 3,
                                                "label", "DM Logs for {ticketId}",
                                                "custom_id", "rng_act_ticket_123"
                                        )
                                )
                        )
                )
        );

        EmbedTemplate template = EmbedTemplate.builder()
                .id("tpl-1")
                .name("Success Response")
                .payload(payload)
                .build();

        Map<String, String> variables = Map.of(
                "user", "<@123>",
                "targetUser", "<@456>",
                "ticketId", "TK-999"
        );

        MessageCreateData data = renderer.renderToMessageData(template, variables);
        assertThat(data).isNotNull();
        assertThat(data.getContent()).isEqualTo("Action performed by <@123> on <@456>");
        assertThat(data.getComponents()).hasSize(1);

        ActionRow row = (ActionRow) data.getComponents().get(0);
        assertThat(row.getButtons()).hasSize(1);
        Button btn = row.getButtons().get(0);
        assertThat(btn.getLabel()).isEqualTo("DM Logs for TK-999");
        assertThat(btn.getCustomId()).isEqualTo("rng_act_ticket_123");
        assertThat(btn.getStyle()).isEqualTo(ButtonStyle.SUCCESS);
    }

    @Test
    @DisplayName("Should render template with multiple action rows and different button styles including link")
    void should_render_template_with_multiple_buttons_and_styles() {
        Map<String, Object> payload = Map.of(
                "content", "Multi-Button Template",
                "components", List.of(
                        Map.of(
                                "type", 1,
                                "components", List.of(
                                        Map.of("type", 2, "style", 1, "label", "Primary", "custom_id", "act_1"),
                                        Map.of("type", 2, "style", 2, "label", "Secondary", "custom_id", "act_2"),
                                        Map.of("type", 2, "style", 4, "label", "Danger", "custom_id", "act_4"),
                                        Map.of("type", 2, "style", 5, "label", "Documentation", "url", "https://rng.army/docs")
                                )
                        )
                )
        );

        EmbedTemplate template = EmbedTemplate.builder()
                .id("tpl-2")
                .name("Multi-Button")
                .payload(payload)
                .build();

        MessageCreateData data = renderer.renderToMessageData(template, Map.of());
        assertThat(data.getContent()).isEqualTo("Multi-Button Template");
        assertThat(data.getComponents()).hasSize(1);

        ActionRow row = (ActionRow) data.getComponents().get(0);
        assertThat(row.getButtons()).hasSize(4);
        assertThat(row.getButtons().get(0).getStyle()).isEqualTo(ButtonStyle.PRIMARY);
        assertThat(row.getButtons().get(1).getStyle()).isEqualTo(ButtonStyle.SECONDARY);
        assertThat(row.getButtons().get(2).getStyle()).isEqualTo(ButtonStyle.DANGER);
        assertThat(row.getButtons().get(3).getStyle()).isEqualTo(ButtonStyle.LINK);
        assertThat(row.getButtons().get(3).getUrl()).isEqualTo("https://rng.army/docs");
    }

    @Test
    @DisplayName("Should handle empty or null payload gracefully")
    void should_handle_empty_or_null_payload_gracefully() {
        EmbedTemplate emptyTemplate = EmbedTemplate.builder()
                .id("tpl-empty")
                .payload(null)
                .build();

        MessageCreateData data = renderer.renderToMessageData(emptyTemplate, Map.of());
        assertThat(data).isNotNull();
        assertThat(data.getContent()).isEqualTo("⚠️ Empty response template");
    }

    @Test
    @DisplayName("Should render Components V2 Type 17 Containers with nested Type 10 Text Displays and Action Rows")
    void should_render_components_v2_type17_containers_with_nested_text_and_buttons() {
        Map<String, Object> payload = Map.of(
                "flags", 32768,
                "components", List.of(
                        Map.of(
                                "type", 17,
                                "accent_color", 43260,
                                "components", List.of(
                                        Map.of("type", 10, "content", "Welcome to {server}, {user}!"),
                                        Map.of("type", 10, "content", "Role {targetRole} assigned to {targetUser}"),
                                        Map.of(
                                                "type", 1,
                                                "components", List.of(
                                                        Map.of("type", 2, "style", 3, "label", "Confirm Role", "custom_id", "rng_act_confirm")
                                                )
                                        )
                                )
                        )
                )
        );

        EmbedTemplate template = EmbedTemplate.builder()
                .templateId("tmpl_v2_test")
                .name("Components V2 Container")
                .payload(payload)
                .build();

        Map<String, String> vars = Map.of(
                "server", "Rednecks Gaming",
                "user", "<@111>",
                "targetRole", "<@&222>",
                "targetUser", "<@333>"
        );

        MessageCreateData data = renderer.renderToMessageData(template, vars);
        assertThat(data).isNotNull();
        assertThat(data.getContent()).contains("Welcome to Rednecks Gaming, <@111>!");
        assertThat(data.getContent()).contains("Role <@&222> assigned to <@333>");
        assertThat(data.getComponents()).hasSize(1);
        ActionRow row = (ActionRow) data.getComponents().get(0);
        assertThat(row.getButtons()).hasSize(1);
        assertThat(row.getButtons().get(0).getCustomId()).isEqualTo("rng_act_confirm");
    }
}
