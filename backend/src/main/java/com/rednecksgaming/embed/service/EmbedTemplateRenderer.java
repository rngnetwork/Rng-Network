package com.rednecksgaming.embed.service;

import com.rednecksgaming.embed.domain.EmbedTemplate;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;

import java.util.Map;

/**
 * Service contract for interpolating dynamic variables in template payloads
 * and rendering them into Discord Components V2 MessageCreateData structures.
 */
public interface EmbedTemplateRenderer {
    String interpolateVariables(String rawJson, Map<String, String> variables);
    MessageCreateData renderToMessageData(EmbedTemplate template, Map<String, String> variables);
    Map<String, Object> renderInterpolatedWirePayload(EmbedTemplate template, Map<String, String> variables);
}
