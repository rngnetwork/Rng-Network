package com.rng.embed.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.exception.InternalServerException;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.dto.CreateActionRequest;
import com.rng.embed.dto.EmbedActionDto;
import com.rng.embed.dto.InteractionLogResponse;
import com.rng.embed.dto.UpdateActionRequest;
import com.rng.embed.repository.EmbedActionRepository;
import com.rng.embed.repository.InteractionLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

/**
 * Service implementation managing Action Templates, MongoDB persistence,
 * and high-performance read-through caching in Redis.
 */
@Slf4j
@Service
public class EmbedActionServiceImpl implements EmbedActionService {

    private static final String REDIS_ACTION_PREFIX = "action:template:";
    private static final Duration CACHE_TTL = Duration.ofHours(24);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmbedActionRepository embedActionRepository;
    private final InteractionLogRepository interactionLogRepository;
    private final Optional<StringRedisTemplate> redisTemplate;
    private final ObjectMapper objectMapper;

    public EmbedActionServiceImpl(
            EmbedActionRepository embedActionRepository,
            InteractionLogRepository interactionLogRepository,
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.embedActionRepository = embedActionRepository;
        this.interactionLogRepository = interactionLogRepository;
        this.redisTemplate = Optional.ofNullable(redisTemplate);
        this.objectMapper = objectMapper;
    }

    @Override
    public EmbedActionDto createAction(CreateActionRequest request) {
        String actionId = generateUniqueActionId();

        EmbedAction action = EmbedAction.builder()
                .actionId(actionId)
                .serverId(request.serverId())
                .isGlobal(request.isGlobal())
                .name(request.name())
                .description(request.description())
                .actionType(request.actionType())
                .roleSubtype(request.roleSubtype())
                .roleId(request.roleId())
                .roleName(request.roleName())
                .channelPrefix(request.channelPrefix())
                .welcomeMessage(request.welcomeMessage())
                .replyContent(request.replyContent())
                .isEphemeral(request.isEphemeral() == null || request.isEphemeral())
                .dmContent(request.dmContent())
                .requiredUser(Boolean.TRUE.equals(request.requiredUser()))
                .requiredRole(Boolean.TRUE.equals(request.requiredRole()))
                .responseEmbedTemplateId(request.responseEmbedTemplateId())
                .build();

        EmbedAction saved = embedActionRepository.save(action);
        cacheAction(saved);

        log.info("Registered Action Template {} (name: '{}', type: {})", actionId, saved.getName(), saved.getActionType());
        return EmbedActionDto.fromDomain(saved);
    }

    @Override
    public EmbedActionDto updateAction(String actionId, UpdateActionRequest request) {
        EmbedAction existing = embedActionRepository.findByActionId(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action Template not found with ID: " + actionId));

        existing.setServerId(request.serverId());
        existing.setGlobal(request.isGlobal());
        existing.setName(request.name());
        existing.setDescription(request.description());
        existing.setActionType(request.actionType());
        existing.setRoleSubtype(request.roleSubtype());
        existing.setRoleId(request.roleId());
        existing.setRoleName(request.roleName());
        existing.setChannelPrefix(request.channelPrefix());
        existing.setWelcomeMessage(request.welcomeMessage());
        existing.setReplyContent(request.replyContent());
        if (request.isEphemeral() != null) {
            existing.setEphemeral(request.isEphemeral());
        }
        existing.setDmContent(request.dmContent());
        if (request.requiredUser() != null) {
            existing.setRequiredUser(request.requiredUser());
        }
        if (request.requiredRole() != null) {
            existing.setRequiredRole(request.requiredRole());
        }
        existing.setResponseEmbedTemplateId(request.responseEmbedTemplateId());

        EmbedAction updated = embedActionRepository.save(existing);
        evictActionCache(actionId);
        cacheAction(updated);

        log.info("Updated Action Template {} (name: '{}')", actionId, updated.getName());
        return EmbedActionDto.fromDomain(updated);
    }

    @Override
    public void deleteAction(String actionId) {
        if (!embedActionRepository.existsByActionId(actionId)) {
            throw new ResourceNotFoundException("Action Template not found with ID: " + actionId);
        }

        embedActionRepository.deleteByActionId(actionId);
        evictActionCache(actionId);
        log.info("Deleted Action Template {}", actionId);
    }

    @Override
    public List<EmbedActionDto> getActionsForServer(String serverId) {
        if (serverId == null || serverId.isBlank()) {
            return getGlobalActions();
        }
        return embedActionRepository.findByServerIdOrIsGlobalTrue(serverId)
                .stream()
                .map(EmbedActionDto::fromDomain)
                .toList();
    }

    @Override
    public List<EmbedActionDto> getGlobalActions() {
        return embedActionRepository.findByIsGlobalTrue()
                .stream()
                .map(EmbedActionDto::fromDomain)
                .toList();
    }

    @Override
    public Optional<EmbedAction> resolveAction(String actionId) {
        if (actionId == null || actionId.isBlank()) {
            return Optional.empty();
        }

        // 1. Read-through Redis cache lookup
        if (redisTemplate.isPresent()) {
            try {
                String cachedJson = redisTemplate.get().opsForValue().get(REDIS_ACTION_PREFIX + actionId);
                if (cachedJson != null && !cachedJson.isBlank()) {
                    EmbedAction action = objectMapper.readValue(cachedJson, EmbedAction.class);
                    return Optional.of(action);
                }
            } catch (Exception e) {
                log.warn("Redis read failed for Action Template {}: {}", actionId, e.getMessage());
            }
        }

        // 2. Durable MongoDB lookup
        Optional<EmbedAction> actionOpt = embedActionRepository.findByActionId(actionId);
        actionOpt.ifPresent(this::cacheAction);
        return actionOpt;
    }

    @Override
    public Page<InteractionLogResponse> getInteractionLogs(String guildId, Pageable pageable) {
        Page<com.rng.embed.domain.InteractionLog> logs;
        if (guildId != null && !guildId.isBlank()) {
            logs = interactionLogRepository.findByGuildIdOrderByCreatedAtDesc(guildId, pageable);
        } else {
            logs = interactionLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return logs.map(InteractionLogResponse::fromDomain);
    }

    private void cacheAction(EmbedAction action) {
        if (redisTemplate.isEmpty() || action == null) {
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(action);
            redisTemplate.get().opsForValue().set(
                    REDIS_ACTION_PREFIX + action.getActionId(),
                    json,
                    CACHE_TTL
            );
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize Action Template {} for Redis caching: {}", action.getActionId(), e.getMessage());
        } catch (Exception e) {
            log.warn("Failed to cache Action Template {} in Redis: {}", action.getActionId(), e.getMessage());
        }
    }

    private void evictActionCache(String actionId) {
        if (redisTemplate.isEmpty() || actionId == null) {
            return;
        }

        try {
            redisTemplate.get().delete(REDIS_ACTION_PREFIX + actionId);
        } catch (Exception e) {
            log.warn("Failed to evict Action Template {} from Redis: {}", actionId, e.getMessage());
        }
    }

    private String generateUniqueActionId() {
        byte[] randomBytes = new byte[8];
        for (int i = 0; i < 10; i++) {
            SECURE_RANDOM.nextBytes(randomBytes);
            String candidate = "rng_act_" + HexFormat.of().formatHex(randomBytes);
            if (!embedActionRepository.existsByActionId(candidate)) {
                return candidate;
            }
        }
        throw new InternalServerException("Failed to generate unique action ID after maximum retries");
    }
}
