// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.botmodule.service;

import com.rednecksgaming.common.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class SchemaValidatorService {

    private static final Pattern SNOWFLAKE_PATTERN = Pattern.compile("^[0-9]{17,20}$");
    public static final int MAX_ARRAY_SIZE = 100;
    public static final int MIN_LEVEL = 1;
    public static final int MAX_LEVEL = 1000;

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

        if ((lowerKey.equals("level") || lowerKey.endsWith("level")) && value instanceof Number number) {
            int level = number.intValue();
            if (level < MIN_LEVEL || level > MAX_LEVEL) {
                throw new BadRequestException("Level must be between 1 and 1000 (received: " + level + " for " + key + ")");
            }
        }

        if ((lowerKey.endsWith("channel") || lowerKey.endsWith("channelid")
                || lowerKey.endsWith("role") || lowerKey.endsWith("roleid"))
                && value instanceof String strVal) {
            String trimmed = strVal.trim();
            if (!trimmed.isEmpty() && !SNOWFLAKE_PATTERN.matcher(trimmed).matches()) {
                throw new BadRequestException("Invalid Discord snowflake ID for " + key + ": " + trimmed);
            }
        }

        if (value instanceof List<?> list) {
            if (list.size() > MAX_ARRAY_SIZE) {
                throw new BadRequestException("Array for " + key + " exceeds maximum limit of 100 entries (found " + list.size() + ")");
            }
            boolean isSnowflakeList = lowerKey.contains("channels") || lowerKey.contains("roles");
            for (Object item : list) {
                if (item instanceof Map<?, ?> itemMap) {
                    validateNode(key + "[]", itemMap);
                } else if (isSnowflakeList && item instanceof String itemStr) {
                    String trimmedItem = itemStr.trim();
                    if (!trimmedItem.isEmpty() && !SNOWFLAKE_PATTERN.matcher(trimmedItem).matches()) {
                        throw new BadRequestException("Invalid Discord snowflake ID in " + key + ": " + trimmedItem);
                    }
                }
            }
        }

        if (value instanceof Map<?, ?> map) {
            if (map.size() > MAX_ARRAY_SIZE) {
                throw new BadRequestException("Map for " + key + " exceeds maximum limit of 100 entries (found " + map.size() + ")");
            }

            boolean isLevelRolesMap = lowerKey.equals("levelroles") || lowerKey.endsWith(".levelroles") || lowerKey.endsWith("[levelroles]");

            for (Map.Entry<?, ?> childEntry : map.entrySet()) {
                String childKey = String.valueOf(childEntry.getKey());
                Object childValue = childEntry.getValue();

                if (isLevelRolesMap) {
                    try {
                        int levelKeyNum = Integer.parseInt(childKey.trim());
                        if (levelKeyNum < MIN_LEVEL || levelKeyNum > MAX_LEVEL) {
                            throw new BadRequestException("Level must be between 1 and 1000 (received: " + levelKeyNum + " in " + key + ")");
                        }
                    } catch (NumberFormatException e) {
                        throw new BadRequestException("Level role key must be a numeric level between 1 and 1000 (received: " + childKey + " in " + key + ")");
                    }

                    if (childValue instanceof String roleIdStr) {
                        String trimmedRole = roleIdStr.trim();
                        if (!trimmedRole.isEmpty() && !SNOWFLAKE_PATTERN.matcher(trimmedRole).matches()) {
                            throw new BadRequestException("Invalid Discord snowflake ID for " + key + "[" + childKey + "]: " + trimmedRole);
                        }
                    }
                } else {
                    validateNode(childKey, childValue);
                }
            }
        }
    }
}
