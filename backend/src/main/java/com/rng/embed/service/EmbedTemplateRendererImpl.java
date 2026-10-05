package com.rng.embed.service;

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

            if (rootNode.has("content") && !rootNode.get("content").isNull()) {
                builder.setContent(rootNode.get("content").asText());
            }

            if (rootNode.has("components") && rootNode.get("components").isArray()) {
                List<ActionRow> actionRows = new ArrayList<>();
                for (JsonNode rowNode : rootNode.get("components")) {
                    if (rowNode.has("type") && rowNode.get("type").asInt() == 1 && rowNode.has("components") && rowNode.get("components").isArray()) {
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
                        if (!buttons.isEmpty()) {
                            actionRows.add(ActionRow.of(buttons));
                        }
                    }
                }
                if (!actionRows.isEmpty()) {
                    builder.setComponents(actionRows);
                }
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
}
