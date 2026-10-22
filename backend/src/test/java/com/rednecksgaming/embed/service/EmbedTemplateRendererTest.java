package com.rednecksgaming.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.embed.domain.EmbedTemplate;
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

        Map<String, String> mapWithNullKey = new HashMap<>();
        mapWithNullKey.put(null, "value");
        assertThat(renderer.interpolateVariables("Hello {user}", mapWithNullKey)).isEqualTo("Hello {user}");
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
    @DisplayName("Should handle empty or null payload gracefully")
    void should_handle_empty_or_null_payload_gracefully() {
        MessageCreateData data1 = renderer.renderToMessageData(null, Map.of());
        assertThat(data1.getContent()).isEqualTo("⚠️ Empty response template");

        EmbedTemplate emptyTemplate = EmbedTemplate.builder().id("tpl-empty").payload(null).build();
        MessageCreateData data2 = renderer.renderToMessageData(emptyTemplate, Map.of());
        assertThat(data2.getContent()).isEqualTo("⚠️ Empty response template");

        EmbedTemplate emptyMapTemplate = EmbedTemplate.builder().id("tpl-empty2").payload(Map.of()).build();
        MessageCreateData data3 = renderer.renderToMessageData(emptyMapTemplate, Map.of());
        assertThat(data3.getContent()).isEqualTo("⚠️ Empty response template");
    }

    @Test
    @DisplayName("Should render Components V2 with nested Type 17 Containers, Type 9 Sections, and Text Displays")
    void should_render_components_v2_type17_containers_sections_and_text() {
        Map<String, Object> payload = Map.of(
                "flags", 32768,
                "components", List.of(
                        Map.of(
                                "type", 17, // Container
                                "components", List.of(
                                        Map.of("type", 10, "content", "Welcome to {server}!"),
                                        Map.of("type", 10, "text", "Alternative text property"),
                                        Map.of(
                                                "type", 9, // Section
                                                "components", List.of(
                                                        Map.of("type", 10, "content", "Section body text")
                                                )
                                        ),
                                        Map.of(
                                                "type", 1, // Action Row
                                                "components", List.of(
                                                        Map.of("type", 2, "style", 3, "label", "Confirm", "custom_id", "btn_confirm"),
                                                        Map.of("type", 2, "style", 5, "label", "Docs", "url", "https://discord.com")
                                                )
                                        )
                                )
                        )
                )
        );

        EmbedTemplate template = EmbedTemplate.builder().id("tpl-comp").payload(payload).build();
        MessageCreateData data = renderer.renderToMessageData(template, Map.of("server", "RNG HQ"));

        assertThat(data).isNotNull();
        assertThat(data.getContent()).contains("Welcome to RNG HQ!");
        assertThat(data.getContent()).contains("Alternative text property");
        assertThat(data.getContent()).contains("Section body text");
        assertThat(data.getComponents()).hasSize(1);

        ActionRow row = (ActionRow) data.getComponents().get(0);
        assertThat(row.getButtons()).hasSize(2);
        assertThat(row.getButtons().get(0).getStyle()).isEqualTo(ButtonStyle.SUCCESS);
        assertThat(row.getButtons().get(1).getStyle()).isEqualTo(ButtonStyle.LINK);
    }

    @Test
    @DisplayName("Should render template using containers array fallback with title, description, and fields")
    void should_render_containers_array_fallback() {
        Map<String, Object> container = Map.of(
                "title", "Announcement: {title}",
                "description", "Description of {title}",
                "fields", List.of(
                        Map.of("name", "Field 1", "value", "Value 1"),
                        Map.of("name", "Field 2", "value", "Value 2")
                ),
                "components", List.of(
                        Map.of("type", 10, "content", "Footer text inside container")
                )
        );

        Map<String, Object> payload = Map.of(
                "content", "Top message",
                "containers", List.of(container)
        );

        EmbedTemplate template = EmbedTemplate.builder().id("tpl-containers").payload(payload).build();
        MessageCreateData data = renderer.renderToMessageData(template, Map.of("title", "Server Maintenance"));

        assertThat(data).isNotNull();
        assertThat(data.getContent()).contains("Top message");
        assertThat(data.getContent()).contains("**Announcement: Server Maintenance**");
        assertThat(data.getContent()).contains("Description of Server Maintenance");
        assertThat(data.getContent()).contains("**Field 1**\nValue 1");
        assertThat(data.getContent()).contains("Footer text inside container");
    }

    @Test
    @DisplayName("Should render button fallbacks for missing label and customId")
    void should_render_button_fallbacks() {
        Map<String, Object> payload = Map.of(
                "components", List.of(
                        Map.of(
                                "type", 1,
                                "components", List.of(
                                        Map.of("type", 2, "style", 1), // missing label and custom_id
                                        Map.of("type", 2, "style", 5)  // link missing url and label
                                )
                        )
                )
        );

        EmbedTemplate template = EmbedTemplate.builder().id("tpl-btn-fb").payload(payload).build();
        MessageCreateData data = renderer.renderToMessageData(template, Map.of());

        assertThat(data.getComponents()).hasSize(1);
        ActionRow row = (ActionRow) data.getComponents().get(0);
        assertThat(row.getButtons()).hasSize(2);
        assertThat(row.getButtons().get(0).getLabel()).isEqualTo("Submit");
        assertThat(row.getButtons().get(0).getCustomId()).isEqualTo("rng_act_noop");
        assertThat(row.getButtons().get(1).getUrl()).isEqualTo("https://discord.com");
    }

    @Test
    @DisplayName("Should render interpolated wire payload preserving flags and components")
    void should_render_interpolated_wire_payload() {
        // Null or empty payload
        assertThat(renderer.renderInterpolatedWirePayload(null, Map.of()))
                .containsEntry("content", "⚠️ Empty response template");

        EmbedTemplate emptyTemplate = EmbedTemplate.builder().id("tpl-e").payload(Map.of()).build();
        assertThat(renderer.renderInterpolatedWirePayload(emptyTemplate, Map.of()))
                .containsEntry("content", "⚠️ Empty response template");

        // With components
        Map<String, Object> payloadWithComps = Map.of(
                "components", List.of(
                        Map.of("type", 10, "content", "Hello {name}")
                )
        );
        EmbedTemplate tpl1 = EmbedTemplate.builder().id("tpl-1").payload(payloadWithComps).build();
        Map<String, Object> wirePayload = renderer.renderInterpolatedWirePayload(tpl1, Map.of("name", "Operator"));

        assertThat(wirePayload.get("flags")).isEqualTo(32768);
        assertThat(wirePayload).containsKey("components");
        List<?> comps = (List<?>) wirePayload.get("components");
        Map<?, ?> c0 = (Map<?, ?>) comps.get(0);
        assertThat(c0.get("content")).isEqualTo("Hello Operator");

        // Without components (returns fullPayload)
        Map<String, Object> payloadWithoutComps = Map.of("content", "Static content {name}");
        EmbedTemplate tpl2 = EmbedTemplate.builder().id("tpl-2").payload(payloadWithoutComps).build();
        Map<String, Object> nonWirePayload = renderer.renderInterpolatedWirePayload(tpl2, Map.of("name", "World"));
        assertThat(nonWirePayload.get("content")).isEqualTo("Static content World");

        // Components is empty list
        Map<String, Object> payloadEmptyComps = Map.of("components", List.of());
        EmbedTemplate tpl3 = EmbedTemplate.builder().id("tpl-3").payload(payloadEmptyComps).build();
        Map<String, Object> emptyCompsPayload = renderer.renderInterpolatedWirePayload(tpl3, Map.of());
        assertThat(emptyCompsPayload).containsEntry("components", List.of());
    }

    @Test
    @DisplayName("Should return empty fallback message when components or container yield no visible text or buttons")
    void should_return_empty_fallback_when_components_yield_nothing() {
        // Unknown component type (e.g., 14) and empty components list
        Map<String, Object> payload = Map.of(
                "components", List.of(
                        Map.of("type", 14), // Separator
                        Map.of("type", 10, "content", "   "), // Blank text display
                        Map.of("type", 10), // Text display missing both content and text
                        Map.of("type", 17), // Container missing components array
                        Map.of("type", 17, "components", "not-array"),
                        Map.of("type", 9), // Section missing components array
                        Map.of("type", 9, "components", "not-array"),
                        Map.of("type", 1, "components", List.of()), // ActionRow with 0 buttons
                        Map.of("type", 1), // ActionRow missing components
                        Map.of("type", 1, "components", "not-array"),
                        Map.of("type", 1, "components", List.of(
                                Map.of("type", 3), // Select menu inside row (ignored by parser)
                                Map.of("not-type", 1) // Missing type
                        ))
                )
        );

        EmbedTemplate template = EmbedTemplate.builder().id("tpl-empty-components").payload(payload).build();
        MessageCreateData data = renderer.renderToMessageData(template, Map.of());

        assertThat(data.getContent()).isEqualTo("⚠️ Empty response template");
    }

    @Test
    @DisplayName("Should handle container node with blank or missing title, description, fields, and components")
    void should_handle_container_node_with_blank_or_missing_attributes() {
        Map<String, Object> container = new HashMap<>();
        container.put("title", "   ");
        container.put("description", "   ");
        container.put("fields", "not-array");
        container.put("components", "not-array");

        Map<String, Object> containerWithPartialFields = new HashMap<>();
        containerWithPartialFields.put("fields", List.of(
                Map.of("name", "NameOnly"),
                Map.of("value", "ValueOnly"),
                Map.of("name", "   ", "value", "   ")
        ));

        Map<String, Object> payload = Map.of(
                "containers", List.of(container, containerWithPartialFields)
        );

        EmbedTemplate template = EmbedTemplate.builder().id("tpl-blank-container").payload(payload).build();
        MessageCreateData data = renderer.renderToMessageData(template, Map.of());

        assertThat(data.getContent()).contains("**NameOnly**");
        assertThat(data.getContent()).contains("ValueOnly");
    }

    @Test
    @DisplayName("Should handle serialization errors in renderToMessageData and renderInterpolatedWirePayload gracefully")
    void should_handle_serialization_errors_gracefully() {
        ObjectMapper failingMapper = org.mockito.Mockito.mock(ObjectMapper.class);
        EmbedTemplateRendererImpl failingRenderer = new EmbedTemplateRendererImpl(failingMapper);
        try {
            org.mockito.Mockito.when(failingMapper.writeValueAsString(org.mockito.ArgumentMatchers.any()))
                    .thenThrow(new com.fasterxml.jackson.core.JsonParseException(null, "Test serialize error"));
        } catch (Exception ignored) {
        }

        EmbedTemplate template = EmbedTemplate.builder().id("tpl-fail").payload(Map.of("a", "b")).build();
        MessageCreateData data = failingRenderer.renderToMessageData(template, Map.of());
        assertThat(data.getContent()).contains("⚠️ Error rendering response template:");

        Map<String, Object> wireResult = failingRenderer.renderInterpolatedWirePayload(template, Map.of());
        assertThat(wireResult).isEqualTo(template.getPayload());
    }
}
