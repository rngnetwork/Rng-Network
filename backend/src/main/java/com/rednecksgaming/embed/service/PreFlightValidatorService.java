package com.rednecksgaming.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.embed.dto.DryRunValidationResponse;
import com.rednecksgaming.embed.dto.DryRunValidationResponse.BotPermissionCheck;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.channel.middleman.GuildChannel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Pre-flight validation service evaluating Discord Components V2 payload constraints
 * and live gateway bot permissions before outbound dispatch.
 */
@Slf4j
@Service
public class PreFlightValidatorService {

    private final ObjectMapper objectMapper;
    private final Optional<JDA> jda;

    public PreFlightValidatorService(
            ObjectMapper objectMapper,
            @Autowired(required = false) JDA jda
    ) {
        this.objectMapper = objectMapper;
        this.jda = Optional.ofNullable(jda);
    }

    public DryRunValidationResponse validate(String serverId, String channelId, Map<String, Object> payload) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (payload == null || payload.isEmpty()) {
            errors.add("Payload map cannot be null or empty.");
            return DryRunValidationResponse.builder()
                    .isValid(false)
                    .errors(errors)
                    .warnings(warnings)
                    .permissions(BotPermissionCheck.builder().hasViewChannel(true).hasSendMessages(true).hasEmbedLinks(true).build())
                    .build();
        }

        // 1. flags: 32768 (IS_COMPONENTS_V2 bitmask)
        Object flagsObj = payload.get("flags");
        if (flagsObj == null) {
            errors.add("Payload must specify flags: 32768 (IS_COMPONENTS_V2 bitmask).");
        } else if (flagsObj instanceof Number num && num.intValue() != 32768) {
            errors.add("Payload flags must be 32768 for Discord Components V2 (found: " + num.intValue() + ").");
        }

        // 2. Root-level 'content' prohibition
        Object contentObj = payload.get("content");
        if (contentObj != null && !contentObj.toString().trim().isEmpty()) {
            errors.add("Root-level 'content' is forbidden when flags: 32768 is set. Text must be compiled into a Type 10 Text Display component.");
        }

        // 3. Components inspection
        int containerCount = 0;
        int totalComponentCount = 0;
        int totalActionRows = 0;
        long cumulativeCharCount = 0;

        Object componentsObj = payload.get("components");
        if (!(componentsObj instanceof List<?> rootComponents) || rootComponents.isEmpty()) {
            errors.add("Payload 'components' array is required and cannot be empty.");
        } else {
            for (Object compObj : rootComponents) {
                Map<String, Object> comp = toComponentMap(compObj);
                if (comp.isEmpty()) {
                    continue;
                }
                int type = getComponentType(comp);
                totalComponentCount++;

                if (type == 17) { // Container
                    containerCount++;
                    PreFlightComponentStats stats = inspectContainer(comp, errors, warnings);
                    totalComponentCount += stats.nestedComponentCount;
                    totalActionRows += stats.actionRowCount;
                    cumulativeCharCount += stats.charCount;
                } else if (type == 1) { // Top-level Action Row
                    totalActionRows++;
                    PreFlightComponentStats stats = inspectActionRow(comp, errors);
                    totalComponentCount += stats.nestedComponentCount;
                    cumulativeCharCount += stats.charCount;
                } else if (type == 10) { // Top-level Text Display
                    cumulativeCharCount += extractTextChars(comp);
                }
            }
        }

        // Capacity bounds check
        if (containerCount > 10) {
            errors.add("Message cannot exceed 10 containers (found: " + containerCount + ").");
        }
        if (totalComponentCount > 40) {
            errors.add("Message cannot exceed 40 total components (found: " + totalComponentCount + ").");
        }
        if (totalActionRows > 5) {
            errors.add("Message cannot exceed 5 total Action Rows (found: " + totalActionRows + ").");
        }
        if (cumulativeCharCount > 4000) {
            errors.add("Cumulative text content cannot exceed 4000 characters (found: " + cumulativeCharCount + ").");
        }

        // Estimated bytes
        long estimatedBytes = 0;
        try {
            String jsonString = objectMapper.writeValueAsString(payload);
            estimatedBytes = jsonString.getBytes(StandardCharsets.UTF_8).length;
        } catch (Exception e) {
            warnings.add("Failed to calculate exact UTF-8 payload byte size: " + e.getMessage());
        }

        // Bot Permissions Check
        BotPermissionCheck permissions = evaluateBotPermissions(serverId, channelId, errors, warnings);

        boolean isValid = errors.isEmpty();

        return DryRunValidationResponse.builder()
                .isValid(isValid)
                .errors(errors)
                .warnings(warnings)
                .containerCount(containerCount)
                .totalComponentCount(totalComponentCount)
                .totalActionRows(totalActionRows)
                .cumulativeCharCount(cumulativeCharCount)
                .estimatedBytes(estimatedBytes)
                .permissions(permissions)
                .build();
    }

    private PreFlightComponentStats inspectContainer(Map<String, Object> container, List<String> errors, List<String> warnings) {
        PreFlightComponentStats stats = new PreFlightComponentStats();
        Object childrenObj = container.get("components");
        if (!(childrenObj instanceof List<?> childrenList)) {
            return stats;
        }

        if (childrenList.size() > 30) {
            errors.add("Container cannot contain more than 30 nested components (found: " + childrenList.size() + ").");
        }

        for (Object childObj : childrenList) {
            Map<String, Object> child = toComponentMap(childObj);
            if (child.isEmpty()) {
                continue;
            }
            int type = getComponentType(child);
            stats.nestedComponentCount++;

            if (type == 17) {
                errors.add("Nested containers (container inside container) are strictly forbidden.");
            } else if (type == 1) { // Nested Action Row
                stats.actionRowCount++;
                PreFlightComponentStats rowStats = inspectActionRow(child, errors);
                stats.nestedComponentCount += rowStats.nestedComponentCount;
                stats.charCount += rowStats.charCount;
            } else if (type == 9) { // Section
                stats.charCount += inspectSection(child, errors);
            } else if (type == 10) { // Text Display
                stats.charCount += extractTextChars(child);
            } else if (type == 12) { // Media Gallery
                Object itemsObj = child.get("items");
                if (itemsObj instanceof List<?> items && items.size() > 4) {
                    errors.add("Media Gallery cannot contain more than 4 items (found: " + items.size() + ").");
                }
            }
        }

        return stats;
    }

    private PreFlightComponentStats inspectActionRow(Map<String, Object> row, List<String> errors) {
        PreFlightComponentStats stats = new PreFlightComponentStats();
        Object childrenObj = row.get("components");
        if (!(childrenObj instanceof List<?> childrenList)) {
            return stats;
        }

        int buttonCount = 0;
        int selectCount = 0;

        for (Object itemObj : childrenList) {
            Map<String, Object> item = toComponentMap(itemObj);
            if (item.isEmpty()) {
                continue;
            }
            int type = getComponentType(item);
            stats.nestedComponentCount++;

            if (type == 2) { // Button
                buttonCount++;
                stats.charCount += inspectButton(item, errors);
            } else if (type == 3 || (type >= 5 && type <= 8)) { // Select Menu
                selectCount++;
                stats.charCount += inspectSelectMenu(item, errors);
            }
        }

        if (buttonCount > 5) {
            errors.add("Action Row cannot contain more than 5 buttons (found: " + buttonCount + ").");
        }
        if (selectCount > 1) {
            errors.add("Action Row cannot contain more than 1 select menu (found: " + selectCount + ").");
        }
        if (buttonCount > 0 && selectCount > 0) {
            errors.add("Action Row cannot contain both buttons and select menus simultaneously.");
        }

        return stats;
    }

    private long inspectButton(Map<String, Object> button, List<String> errors) {
        long chars = 0;
        Object styleObj = button.get("style");
        int style = styleObj instanceof Number num ? num.intValue() : 1;

        Object labelObj = button.get("label");
        if (labelObj != null) {
            String label = labelObj.toString();
            chars += label.length();
            if (label.length() > 80) {
                errors.add("Button label cannot exceed 80 characters: '" + label + "'");
            }
        }

        if (style == 5) { // Link Button
            Object urlObj = button.get("url");
            if (urlObj == null || (!urlObj.toString().startsWith("http://") && !urlObj.toString().startsWith("https://"))) {
                errors.add("Link buttons (style 5) must specify a valid URL starting with http:// or https://");
            }
            if (button.containsKey("custom_id")) {
                errors.add("Link buttons (style 5) cannot specify a custom_id.");
            }
        } else {
            Object customIdObj = button.get("custom_id");
            if (customIdObj == null || customIdObj.toString().trim().isEmpty()) {
                errors.add("Interactive buttons (style 1-4) require a non-blank custom_id.");
            } else if (customIdObj.toString().length() > 100) {
                errors.add("Button custom_id cannot exceed 100 characters.");
            }
            if (button.containsKey("url")) {
                errors.add("Interactive buttons (style 1-4) cannot specify a url.");
            }
        }
        return chars;
    }

    private long inspectSelectMenu(Map<String, Object> select, List<String> errors) {
        long chars = 0;
        Object placeholderObj = select.get("placeholder");
        if (placeholderObj != null) {
            chars += placeholderObj.toString().length();
        }

        Object customIdObj = select.get("custom_id");
        if (customIdObj == null || customIdObj.toString().trim().isEmpty()) {
            errors.add("Select menu requires a non-blank custom_id.");
        }

        Object optionsObj = select.get("options");
        if (optionsObj instanceof List<?> optionsList) {
            if (optionsList.isEmpty() || optionsList.size() > 25) {
                errors.add("Select menu must contain between 1 and 25 options (found: " + optionsList.size() + ").");
            }
            for (Object optObj : optionsList) {
                if (optObj instanceof Map<?, ?> opt) {
                    Object optLabel = opt.get("label");
                    if (optLabel != null) chars += optLabel.toString().length();
                    Object optDesc = opt.get("description");
                    if (optDesc != null) chars += optDesc.toString().length();
                }
            }
        }
        return chars;
    }

    private long inspectSection(Map<String, Object> section, List<String> errors) {
        long chars = 0;
        Object compsObj = section.get("components");
        if (compsObj instanceof List<?> compsList) {
            for (Object c : compsList) {
                Map<String, Object> cMapCast = toComponentMap(c);
                if (!cMapCast.isEmpty()) {
                    chars += extractTextChars(cMapCast);
                }
            }
        }

        Object accessoryObj = section.get("accessory");
        if (accessoryObj instanceof Map<?, ?> accessory) {
            Object accTypeObj = accessory.get("type");
            int accType = accTypeObj instanceof Number num ? num.intValue() : 0;
            if (accType != 2 && accType != 11) { // Button (2) or Thumbnail (11)
                errors.add("Section accessory must be either a Type 2 Button or a Type 11 Thumbnail (found type: " + accType + ").");
            }
        }
        return chars;
    }

    private long extractTextChars(Map<String, Object> comp) {
        long chars = 0;
        Object content = comp.get("content");
        if (content != null) {
            chars += content.toString().length();
        }
        return chars;
    }

    private int getComponentType(Map<String, Object> comp) {
        Object typeObj = comp.get("type");
        return typeObj instanceof Number num ? num.intValue() : 0;
    }

    private BotPermissionCheck evaluateBotPermissions(String serverId, String channelId, List<String> errors, List<String> warnings) {
        if (jda.isEmpty() || jda.get().getStatus() != JDA.Status.CONNECTED) {
            log.debug("JDA Gateway is disconnected or in test mode. Assuming simulated permissions.");
            return BotPermissionCheck.builder()
                    .hasViewChannel(true)
                    .hasSendMessages(true)
                    .hasEmbedLinks(true)
                    .build();
        }

        if (serverId == null || !serverId.matches("\\d+")) {
            log.warn("Server ID '{}' is not a valid numeric Discord snowflake; skipping in-memory permission check.", serverId);
            return BotPermissionCheck.builder()
                    .hasViewChannel(true)
                    .hasSendMessages(true)
                    .hasEmbedLinks(true)
                    .build();
        }

        try {
            Guild guild = jda.get().getGuildById(serverId);
            if (guild == null) {
                warnings.add("Guild " + serverId + " is not currently cached by the JDA Gateway daemon.");
                return BotPermissionCheck.builder()
                        .hasViewChannel(true)
                        .hasSendMessages(true)
                        .hasEmbedLinks(true)
                        .build();
            }

            if (channelId == null || !channelId.matches("\\d+")) {
                warnings.add("Channel ID '" + channelId + "' is not a valid snowflake; live permissions deferred.");
                return BotPermissionCheck.builder()
                        .hasViewChannel(true)
                        .hasSendMessages(true)
                        .hasEmbedLinks(true)
                        .build();
            }

            GuildChannel channel = guild.getGuildChannelById(channelId);
            if (channel == null) {
                warnings.add("Target channel " + channelId + " is not currently cached by JDA Gateway daemon; permissions will be verified live by Discord REST API.");
                return BotPermissionCheck.builder()
                        .hasViewChannel(true)
                        .hasSendMessages(true)
                        .hasEmbedLinks(true)
                        .build();
            }

            Member selfMember = guild.getSelfMember();
            boolean hasView = selfMember.hasPermission(channel, Permission.VIEW_CHANNEL);
            boolean hasSend = selfMember.hasPermission(channel, Permission.MESSAGE_SEND);
            boolean hasEmbed = selfMember.hasPermission(channel, Permission.MESSAGE_EMBED_LINKS);

            if (!hasView) {
                errors.add("Bot lacks VIEW_CHANNEL permission in channel " + channelId);
            }
            if (!hasSend) {
                errors.add("Bot lacks SEND_MESSAGES permission in channel " + channelId);
            }
            if (!hasEmbed) {
                warnings.add("Bot lacks EMBED_LINKS permission; interactive Discord V2 containers may be rejected.");
            }

            return BotPermissionCheck.builder()
                    .hasViewChannel(hasView)
                    .hasSendMessages(hasSend)
                    .hasEmbedLinks(hasEmbed)
                    .build();
        } catch (Exception e) {
            log.warn("Error evaluating bot permissions via JDA for server {} and channel {}: {}", serverId, channelId, e.getMessage());
            return BotPermissionCheck.builder()
                    .hasViewChannel(true)
                    .hasSendMessages(true)
                    .hasEmbedLinks(true)
                    .build();
        }
    }

    private Map<String, Object> toComponentMap(Object obj) {
        if (obj instanceof Map<?, ?> map) {
            Map<String, Object> typedMap = new LinkedHashMap<>();
            map.forEach((k, v) -> typedMap.put(String.valueOf(k), v));
            return typedMap;
        }
        return Collections.emptyMap();
    }
}
