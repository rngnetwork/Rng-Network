package com.rng.embed.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.embed.domain.EmbedTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.components.actionrow.ActionRow;
import net.dv8tion.jda.api.components.buttons.Button;
import net.dv8tion.jda.api.components.buttons.ButtonStyle;
import net.dv8tion.jda.api.utils.messages.MessageCreateBuilder;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmbedTemplateRendererImpl implements EmbedTemplateRenderer {

    private final ObjectMapper objectMapper;

    @Override
    public String interpolateVariables(String rawJson, Map<String, String> variables) {
        if (rawJson == null || variables == null || variables.isEmpty()) {
            return rawJson;
        }
        String result = rawJson;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            if (entry.getKey() != null) {
                result = result.replace("{" + entry.getKey() + "}", entry.getValue() != null ? entry.getValue() : "");
            }
        }
        return result;
    }

    @Override
    public MessageCreateData renderToMessageData(EmbedTemplate template, Map<String, String> variables) {
        MessageCreateBuilder builder = new MessageCreateBuilder();
        if (template == null || template.getPayload() == null || template.getPayload().isEmpty()) {
            builder.setContent("⚠️ Empty response template");
            return builder.build();
        }

        try {
            String rawJson = objectMapper.writeValueAsString(template.getPayload());
            String interpolatedJson = interpolateVariables(rawJson, variables);
            JsonNode rootNode = objectMapper.readTree(interpolatedJson);

            StringBuilder contentBuilder = new StringBuilder();

            if (rootNode.has("content") && !rootNode.get("content").isNull() && !rootNode.get("content").asText().isBlank()) {
                contentBuilder.append(rootNode.get("content").asText());
            }

            List<ActionRow> actionRows = new ArrayList<>();

            // Inspect top-level components (Components V2 wire payload)
            if (rootNode.has("components") && rootNode.get("components").isArray() && !rootNode.get("components").isEmpty()) {
                for (JsonNode node : rootNode.get("components")) {
                    processComponentNode(node, contentBuilder, actionRows);
                }
            } else if (rootNode.has("containers") && rootNode.get("containers").isArray() && !rootNode.get("containers").isEmpty()) {
                // Fallback for UI state builder payload lacking compiled components array
                for (JsonNode containerNode : rootNode.get("containers")) {
                    processContainerNode(containerNode, contentBuilder, actionRows);
                }
            }

            String finalContent = contentBuilder.toString().trim();
            if (!finalContent.isBlank()) {
                builder.setContent(finalContent);
            }

            if (!actionRows.isEmpty()) {
                builder.setComponents(actionRows);
            }
        } catch (Exception e) {
            log.error("Failed to render EmbedTemplate {} into MessageCreateData: {}", template.getId(), e.getMessage());
            builder.setContent("⚠️ Error rendering response template: " + e.getMessage());
        }

        if (builder.isEmpty()) {
            builder.setContent("⚠️ Empty response template");
        }

        return builder.build();
    }

    @Override
    public Map<String, Object> renderInterpolatedWirePayload(EmbedTemplate template, Map<String, String> variables) {
        if (template == null || template.getPayload() == null || template.getPayload().isEmpty()) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("content", "⚠️ Empty response template");
            return fallback;
        }

        try {
            String rawJson = objectMapper.writeValueAsString(template.getPayload());
            String interpolatedJson = interpolateVariables(rawJson, variables);
            Map<String, Object> fullPayload = objectMapper.readValue(
                    interpolatedJson,
                    new TypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> wirePayload = new HashMap<>();
            wirePayload.put("flags", 32768);

            if (fullPayload.containsKey("components") && fullPayload.get("components") instanceof List<?> list && !list.isEmpty()) {
                wirePayload.put("components", list);
            } else {
                return fullPayload;
            }

            return wirePayload;
        } catch (Exception e) {
            log.error("Failed to render interpolated wire payload for template {}: {}", template.getId(), e.getMessage());
            return template.getPayload();
        }
    }

    private void processComponentNode(JsonNode node, StringBuilder contentBuilder, List<ActionRow> actionRows) {
        if (node == null || !node.has("type")) return;
        int type = node.get("type").asInt();

        if (type == 10) { // Text Display
            String text = node.has("content") ? node.get("content").asText() : (node.has("text") ? node.get("text").asText() : "");
            if (!text.isBlank()) {
                if (!contentBuilder.isEmpty()) contentBuilder.append("\n");
                contentBuilder.append(text);
            }
        } else if (type == 1) { // Action Row
            ActionRow row = parseActionRow(node);
            if (row != null && !row.getButtons().isEmpty()) {
                actionRows.add(row);
            }
        } else if (type == 17) { // Type 17 Container
            if (node.has("components") && node.get("components").isArray()) {
                for (JsonNode child : node.get("components")) {
                    processComponentNode(child, contentBuilder, actionRows);
                }
            }
        } else if (type == 9) { // Section
            if (node.has("components") && node.get("components").isArray()) {
                for (JsonNode child : node.get("components")) {
                    processComponentNode(child, contentBuilder, actionRows);
                }
            }
        }
    }

    private void processContainerNode(JsonNode containerNode, StringBuilder contentBuilder, List<ActionRow> actionRows) {
        if (containerNode == null) return;
        if (containerNode.has("title") && !containerNode.get("title").asText().isBlank()) {
            if (!contentBuilder.isEmpty()) contentBuilder.append("\n");
            contentBuilder.append("**").append(containerNode.get("title").asText()).append("**");
        }
        if (containerNode.has("description") && !containerNode.get("description").asText().isBlank()) {
            if (!contentBuilder.isEmpty()) contentBuilder.append("\n");
            contentBuilder.append(containerNode.get("description").asText());
        }
        if (containerNode.has("fields") && containerNode.get("fields").isArray()) {
            for (JsonNode field : containerNode.get("fields")) {
                String fName = field.has("name") ? field.get("name").asText() : "";
                String fVal = field.has("value") ? field.get("value").asText() : "";
                if (!fName.isBlank() || !fVal.isBlank()) {
                    if (!contentBuilder.isEmpty()) contentBuilder.append("\n");
                    contentBuilder.append("**").append(fName).append("**\n").append(fVal);
                }
            }
        }
        if (containerNode.has("components") && containerNode.get("components").isArray()) {
            for (JsonNode child : containerNode.get("components")) {
                processComponentNode(child, contentBuilder, actionRows);
            }
        }
    }

    private ActionRow parseActionRow(JsonNode rowNode) {
        if (!rowNode.has("components") || !rowNode.get("components").isArray()) {
            return null;
        }
        List<Button> buttons = new ArrayList<>();
        for (JsonNode btnNode : rowNode.get("components")) {
            if (btnNode.has("type") && btnNode.get("type").asInt() == 2) {
                String label = btnNode.has("label") ? btnNode.get("label").asText() : "Submit";
                int rawStyle = btnNode.has("style") ? btnNode.get("style").asInt() : 1;
                ButtonStyle style = ButtonStyle.fromKey(rawStyle);

                if (style == ButtonStyle.LINK) {
                    String url = btnNode.has("url") ? btnNode.get("url").asText() : "https://discord.com";
                    buttons.add(Button.link(url, label));
                } else {
                    String customId = btnNode.has("custom_id") ? btnNode.get("custom_id").asText() : "rng_act_noop";
                    buttons.add(Button.of(style, customId, label));
                }
            }
        }
        return buttons.isEmpty() ? null : ActionRow.of(buttons);
    }
}
