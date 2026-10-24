package com.rednecksgaming.botmodule.service;

import com.rednecksgaming.common.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Validates module configurations against numerical bounds, Discord snowflake constraints,
 * and BSON collection/map bounds without warning suppressions.
 */
@Service
public class SchemaValidatorService {

    private static final Pattern SNOWFLAKE_PATTERN = Pattern.compile("^[0-9]{17,20}$");
    public static final int MAX_ARRAY_SIZE = 100;
    public static final int MIN_LEVEL = 1;
    public static final int MAX_LEVEL = 1000;

    /**
     * Validates a batch modules payload before applying or dispatching.
     */
    public void validateModules(Map<String, Object> modules) {
        if (modules == null || modules.isEmpty()) {
            throw new BadRequestException("Modules configuration cannot be null or empty");
        }

        for (Map.Entry<String, Object> entry : modules.entrySet()) {
            validateNode(entry.getKey(), entry.getValue());
        }
    }

    private void validateNode(String key, Object value) {
        if (value == null) {
            return;
        }

        String lowerKey = key.toLowerCase();

        // 1. Level bounds validation: 1 to 1000 for direct numeric values
        if (lowerKey.contains("level") && value instanceof Number number) {
            int level = number.intValue();
            if (level < MIN_LEVEL || level > MAX_LEVEL) {
                throw new BadRequestException("Level must be between 1 and 1000 (received: " + level + " for " + key + ")");
            }
        }

        // 2. Discord Snowflake ID validation: 17 to 20 digits
        if ((lowerKey.endsWith("channel") || lowerKey.endsWith("channelid")
                || lowerKey.endsWith("role") || lowerKey.endsWith("roleid"))
                && value instanceof String strVal) {
            String trimmed = strVal.trim();
            if (!trimmed.isEmpty() && !SNOWFLAKE_PATTERN.matcher(trimmed).matches()) {
                throw new BadRequestException("Invalid Discord snowflake ID for " + key + ": " + trimmed);
            }
        }

        // 3. Array bounds validation: <= 100 items (AP-MONGO-02 prevention)
        if (value instanceof List<?> list) {
            if (list.size() > MAX_ARRAY_SIZE) {
                throw new BadRequestException("Array for " + key + " exceeds maximum limit of 100 entries (found " + list.size() + ")");
            }
            for (Object item : list) {
                if (item instanceof Map<?, ?> itemMap) {
                    validateNode(key + "[]", itemMap);
                }
            }
        }

        // 4. Map traversal and dictionary bounds validation (e.g. levelRoles)
        if (value instanceof Map<?, ?> map) {
            if (map.size() > MAX_ARRAY_SIZE) {
                throw new BadRequestException("Map for " + key + " exceeds maximum limit of 100 entries (found " + map.size() + ")");
            }

            boolean isLevelMap = lowerKey.contains("level");

            for (Map.Entry<?, ?> childEntry : map.entrySet()) {
                String childKey = String.valueOf(childEntry.getKey());
                Object childValue = childEntry.getValue();

                // Check numeric level keys in level dictionary maps (e.g. levelRoles: {"1500": "roleId"})
                if (isLevelMap) {
                    try {
                        int levelKeyNum = Integer.parseInt(childKey.trim());
                        if (levelKeyNum < MIN_LEVEL || levelKeyNum > MAX_LEVEL) {
                            throw new BadRequestException("Level must be between 1 and 1000 (received: " + levelKeyNum + " in " + key + ")");
                        }
                    } catch (NumberFormatException ignored) {
                        // Key is not an integer level, proceed with child validation
                    }

                    // If level map value is a role ID, validate snowflake
                    if (childValue instanceof String roleIdStr) {
                        String trimmedRole = roleIdStr.trim();
                        if (!trimmedRole.isEmpty() && !SNOWFLAKE_PATTERN.matcher(trimmedRole).matches()) {
                            throw new BadRequestException("Invalid Discord snowflake ID for " + key + "[" + childKey + "]: " + trimmedRole);
                        }
                    }
                }

                validateNode(childKey, childValue);
            }
        }
    }
}
