package com.rng.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.dto.CreateActionRequest;
import com.rng.embed.dto.EmbedActionDto;
import com.rng.embed.dto.UpdateActionRequest;
import com.rng.embed.repository.EmbedActionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * Service managing the authoritative Discord Action Registry, coordinating
 * MongoDB persistence with Redis 7.2 caching.
 */
@Slf4j
@Service
public class EmbedActionService {

    private static final String REDIS_ACTION_PREFIX = "action:";
    private static final Duration ACTION_CACHE_TTL = Duration.ofHours(24);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmbedActionRepository repository;
    private final Optional<StringRedisTemplate> redisTemplate;
    private final ObjectMapper objectMapper;

    public EmbedActionService(
            EmbedActionRepository repository,
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.redisTemplate = Optional.ofNullable(redisTemplate);
        this.objectMapper = objectMapper;
    }

    public static String generateActionId() {
        byte[] bytes = new byte[8];
        SECURE_RANDOM.nextBytes(bytes);
        StringBuilder sb = new StringBuilder("rng_act_");
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String buildRedisKey(String serverId, String actionId) {
        return REDIS_ACTION_PREFIX + serverId + ":" + actionId;
    }

    public EmbedActionDto createAction(String serverId, CreateActionRequest request, String userEmail) {
        String actionId = generateActionId();

        EmbedAction action = EmbedAction.builder()
                .actionId(actionId)
                .serverId(serverId)
                .name(request.name())
                .actionType(request.actionType())
                .payload(request.payload())
                .createdBy(userEmail)
                .build();

        EmbedAction saved = repository.save(action);
        cacheActionInRedis(saved);

        log.info("Registered new action {} for server {}", actionId, serverId);
        return mapToDto(saved);
    }

    public EmbedActionDto getAction(String serverId, String actionId) {
        // Step 1: Read-through cache from Redis
        if (redisTemplate.isPresent()) {
            try {
                String redisKey = buildRedisKey(serverId, actionId);
                String cachedJson = redisTemplate.get().opsForValue().get(redisKey);
                if (cachedJson != null && !cachedJson.isBlank()) {
                    EmbedAction cached = objectMapper.readValue(cachedJson, EmbedAction.class);
                    return mapToDto(cached);
                }
            } catch (Exception e) {
                log.warn("Redis cache read failed for action {}: {}", actionId, e.getMessage());
            }
        }

        // Step 2: Fallback to MongoDB
        EmbedAction action = repository.findByServerIdAndActionId(serverId, actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action not found: " + actionId + " on server: " + serverId));

        cacheActionInRedis(action);
        return mapToDto(action);
    }

    public Optional<EmbedActionDto> findActionByIdOnly(String actionId) {
        // Query MongoDB by actionId directly (used by Gateway listeners)
        return repository.findByActionId(actionId)
                .map(action -> {
                    cacheActionInRedis(action);
                    return mapToDto(action);
                });
    }

    public EmbedActionDto updateAction(String serverId, String actionId, UpdateActionRequest request, String userEmail) {
        EmbedAction existing = repository.findByServerIdAndActionId(serverId, actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action not found: " + actionId));

        if (request.name() != null) {
            existing.setName(request.name());
        }
        if (request.actionType() != null) {
            existing.setActionType(request.actionType());
        }
        if (request.payload() != null) {
            existing.setPayload(request.payload());
        }

        EmbedAction updated = repository.save(existing);
        cacheActionInRedis(updated);

        log.info("Updated action {} on server {}", actionId, serverId);
        return mapToDto(updated);
    }

    public void deleteAction(String serverId, String actionId) {
        repository.findByServerIdAndActionId(serverId, actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action not found: " + actionId));

        repository.deleteByServerIdAndActionId(serverId, actionId);

        if (redisTemplate.isPresent()) {
            try {
                String redisKey = buildRedisKey(serverId, actionId);
                redisTemplate.get().delete(redisKey);
            } catch (Exception e) {
                log.warn("Failed to evict action {} from Redis: {}", actionId, e.getMessage());
            }
        }
        log.info("Deleted action {} from server {}", actionId, serverId);
    }

    public List<EmbedActionDto> listServerActions(String serverId) {
        return repository.findByServerId(serverId).stream()
                .map(this::mapToDto)
                .toList();
    }

    private void cacheActionInRedis(EmbedAction action) {
        if (redisTemplate.isPresent()) {
            try {
                String redisKey = buildRedisKey(action.getServerId(), action.getActionId());
                String json = objectMapper.writeValueAsString(action);
                redisTemplate.get().opsForValue().set(redisKey, json, ACTION_CACHE_TTL);
            } catch (Exception e) {
                log.warn("Failed to cache action {} in Redis: {}", action.getActionId(), e.getMessage());
            }
        }
    }

    public EmbedActionDto mapToDto(EmbedAction entity) {
        return EmbedActionDto.builder()
                .id(entity.getId())
                .actionId(entity.getActionId())
                .serverId(entity.getServerId())
                .name(entity.getName())
                .actionType(entity.getActionType())
                .payload(entity.getPayload())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
