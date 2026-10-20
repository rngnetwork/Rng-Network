package com.rednecksgaming.embed.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.common.exception.InternalServerException;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.domain.ResponseType;
import com.rednecksgaming.embed.dto.CreateActionRequest;
import com.rednecksgaming.embed.dto.EmbedActionDto;
import com.rednecksgaming.embed.dto.InteractionLogResponse;
import com.rednecksgaming.embed.dto.UpdateActionRequest;
import com.rednecksgaming.embed.repository.EmbedActionRepository;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

/**
 * Service implementation managing Action Templates, MongoDB persistence,
 * multi-tenant RBAC, and high-performance read-through caching in Redis.
 */
@Slf4j
@Service
public class EmbedActionServiceImpl implements EmbedActionService {

    private static final String REDIS_ACTION_PREFIX = "action:template:";
    private static final Duration CACHE_TTL = Duration.ofHours(24);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmbedActionRepository embedActionRepository;
    private final InteractionLogRepository interactionLogRepository;
    private final EmbedTemplateRepository embedTemplateRepository;
    private final UserRepository userRepository;
    private final Optional<StringRedisTemplate> redisTemplate;
    private final ObjectMapper objectMapper;

    public EmbedActionServiceImpl(
            EmbedActionRepository embedActionRepository,
            InteractionLogRepository interactionLogRepository,
            EmbedTemplateRepository embedTemplateRepository,
            UserRepository userRepository,
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.embedActionRepository = embedActionRepository;
        this.interactionLogRepository = interactionLogRepository;
        this.embedTemplateRepository = embedTemplateRepository;
        this.userRepository = userRepository;
        this.redisTemplate = Optional.ofNullable(redisTemplate);
        this.objectMapper = objectMapper;
    }

    @Override
    public EmbedActionDto createAction(CreateActionRequest request) {
        return createAction(request, null);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "server:actions", allEntries = true),
        @CacheEvict(value = "action:templates", allEntries = true)
    })
    public EmbedActionDto createAction(CreateActionRequest request, String operatorEmail) {
        User operator = tryResolveOperatorUser(operatorEmail);
        boolean isHighCommand = operator != null && ((operator.getRole() != null && 
                (operator.getRole().equals("ROLE_CHIEF_HIGH_COMMAND") || operator.getRole().equals("ROLE_HIGH_COMMAND")))
                || (operator.getRoleList() != null && (operator.getRoleList().contains("ROLE_CHIEF_HIGH_COMMAND")
                || operator.getRoleList().contains("ROLE_HIGH_COMMAND"))));

        if (Boolean.TRUE.equals(request.isGlobal())) {
            if (operatorEmail == null || operatorEmail.isBlank()) {
                throw new AccessDeniedException("Operator clearance required to create global action templates");
            }
            if (!isHighCommand) {
                throw new AccessDeniedException("Only High Command can create global action templates");
            }
        }

        if (request.responseEmbedTemplateId() != null && !request.responseEmbedTemplateId().isBlank()) {
            Optional<EmbedTemplate> templateOpt = embedTemplateRepository.findById(request.responseEmbedTemplateId())
                    .or(() -> embedTemplateRepository.findByTemplateId(request.responseEmbedTemplateId()));
            if (templateOpt.isPresent()) {
                EmbedTemplate template = templateOpt.get();
                List<String> targetServerIds = request.serverIds() != null && !request.serverIds().isEmpty()
                        ? request.serverIds()
                        : (request.serverId() != null ? List.of(request.serverId()) : List.of());
                boolean isAuthor = operator != null && (String.valueOf(operator.getId()).equals(template.getAuthorId())
                        || (operator.getEmail() != null && operator.getEmail().equalsIgnoreCase(template.getAuthorName())));
                boolean isAccessible = template.isPublic()
                        || template.getServerId() == null
                        || Boolean.TRUE.equals(request.isGlobal())
                        || isHighCommand
                        || isAuthor
                        || (template.getServerId() != null && targetServerIds.contains(template.getServerId()));
                if (!isAccessible) {
                    throw new AccessDeniedException("Referenced embed template is not accessible for specified serverIds");
                }
            } else {
                log.warn("Referenced embed template ID {} not found in MongoDB during action creation; proceeding with non-fatal reference", request.responseEmbedTemplateId());
            }
        }

        String actionId = generateUniqueActionId();

        List<String> serverIds = request.serverIds() != null && !request.serverIds().isEmpty()
                ? request.serverIds()
                : (request.serverId() != null ? List.of(request.serverId()) : List.of());

        EmbedAction action = EmbedAction.builder()
                .actionId(actionId)
                .serverId(request.serverId())
                .isGlobal(Boolean.TRUE.equals(request.isGlobal()))
                .serverIds(serverIds)
                .name(request.name() != null ? request.name().trim() : "")
                .description(request.description())
                .actionType(request.actionType())
                .roleSubtype(request.roleSubtype())
                .roleId(request.roleId())
                .roleName(request.roleName())
                .channelPrefix(request.channelPrefix() != null ? request.channelPrefix() : "ticket-")
                .welcomeMessage(request.welcomeMessage())
                .replyContent(request.replyContent())
                .confirmationMessage(request.confirmationMessage())
                .isEphemeral(request.isEphemeral() == null || request.isEphemeral())
                .dmContent(request.dmContent())
                .requiredUser(Boolean.TRUE.equals(request.requiredUser()))
                .requiredRole(Boolean.TRUE.equals(request.requiredRole()))
                .responseType(request.responseType() != null ? request.responseType() : ResponseType.EPHEMERAL_TEXT)
                .responseEmbedTemplateId(request.responseEmbedTemplateId())
                .compoundOperations(request.compoundOperations() != null ? request.compoundOperations() : List.of())
                .build();

        EmbedAction saved = embedActionRepository.save(action);
        cacheAction(saved);

        log.info("Registered Action Template {} (name: '{}', type: {})", actionId, saved.getName(), saved.getActionType());
        return EmbedActionDto.fromDomain(saved);
    }

    @Override
    public EmbedActionDto updateAction(String actionId, UpdateActionRequest request) {
        return updateAction(actionId, request, null);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "server:actions", allEntries = true),
        @CacheEvict(value = "action:templates", allEntries = true)
    })
    public EmbedActionDto updateAction(String actionId, UpdateActionRequest request, String operatorEmail) {
        EmbedAction existing = embedActionRepository.findByActionId(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Action Template not found with ID: " + actionId));

        User operator = tryResolveOperatorUser(operatorEmail);
        boolean isHighCommand = operator != null && ((operator.getRole() != null && 
                (operator.getRole().equals("ROLE_CHIEF_HIGH_COMMAND") || operator.getRole().equals("ROLE_HIGH_COMMAND")))
                || (operator.getRoleList() != null && (operator.getRoleList().contains("ROLE_CHIEF_HIGH_COMMAND")
                || operator.getRoleList().contains("ROLE_HIGH_COMMAND"))));

        if (existing.isGlobal() || Boolean.TRUE.equals(request.isGlobal())) {
            if (operatorEmail == null || operatorEmail.isBlank()) {
                throw new AccessDeniedException("Operator clearance required to modify global action templates");
            }
            if (!isHighCommand) {
                throw new AccessDeniedException("Only High Command can modify global action templates");
            }
        }

        if (request.responseEmbedTemplateId() != null && !request.responseEmbedTemplateId().isBlank()) {
            Optional<EmbedTemplate> templateOpt = embedTemplateRepository.findById(request.responseEmbedTemplateId())
                    .or(() -> embedTemplateRepository.findByTemplateId(request.responseEmbedTemplateId()));
            if (templateOpt.isPresent()) {
                EmbedTemplate template = templateOpt.get();
                List<String> existingServerIds = existing.getServerIds() != null ? existing.getServerIds() : List.of();
                List<String> targetServerIds = request.serverIds() != null && !request.serverIds().isEmpty()
                        ? request.serverIds()
                        : (request.serverId() != null ? List.of(request.serverId()) : existingServerIds);
                boolean isGlobalAction = existing.isGlobal() || Boolean.TRUE.equals(request.isGlobal());
                boolean isAuthor = operator != null && (String.valueOf(operator.getId()).equals(template.getAuthorId())
                        || (operator.getEmail() != null && operator.getEmail().equalsIgnoreCase(template.getAuthorName())));
                boolean isAccessible = template.isPublic()
                        || template.getServerId() == null
                        || isGlobalAction
                        || isHighCommand
                        || isAuthor
                        || (template.getServerId() != null && targetServerIds.contains(template.getServerId()));
                if (!isAccessible) {
                    throw new AccessDeniedException("Referenced embed template is not accessible for specified serverIds");
                }
            } else {
                log.warn("Referenced embed template ID {} not found in MongoDB during action update; proceeding with non-fatal reference", request.responseEmbedTemplateId());
            }
        }

        if (request.serverId() != null) existing.setServerId(request.serverId());
        if (request.isGlobal() != null) existing.setGlobal(request.isGlobal());
        if (request.serverIds() != null) existing.setServerIds(request.serverIds());
        if (request.name() != null) existing.setName(request.name().trim());
        if (request.description() != null) existing.setDescription(request.description());
        if (request.actionType() != null) existing.setActionType(request.actionType());
        if (request.roleSubtype() != null) existing.setRoleSubtype(request.roleSubtype());
        if (request.roleId() != null) existing.setRoleId(request.roleId());
        if (request.roleName() != null) existing.setRoleName(request.roleName());
        if (request.channelPrefix() != null) existing.setChannelPrefix(request.channelPrefix());
        if (request.welcomeMessage() != null) existing.setWelcomeMessage(request.welcomeMessage());
        if (request.replyContent() != null) existing.setReplyContent(request.replyContent());
        if (request.confirmationMessage() != null) existing.setConfirmationMessage(request.confirmationMessage());
        if (request.isEphemeral() != null) existing.setEphemeral(request.isEphemeral());
        if (request.dmContent() != null) existing.setDmContent(request.dmContent());
        if (request.requiredUser() != null) existing.setRequiredUser(request.requiredUser());
        if (request.requiredRole() != null) existing.setRequiredRole(request.requiredRole());
        if (request.responseType() != null) existing.setResponseType(request.responseType());
        if (request.responseEmbedTemplateId() != null) existing.setResponseEmbedTemplateId(request.responseEmbedTemplateId());
        if (request.compoundOperations() != null) existing.setCompoundOperations(request.compoundOperations());

        EmbedAction updated = embedActionRepository.save(existing);
        evictActionCache(actionId);
        cacheAction(updated);

        log.info("Updated Action Template {} (name: '{}')", actionId, updated.getName());
        return EmbedActionDto.fromDomain(updated);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = "server:actions", allEntries = true),
        @CacheEvict(value = "action:templates", allEntries = true)
    })
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
    @Cacheable(value = "server:actions", key = "#serverId + ':' + #pageable.pageNumber + ':' + #pageable.pageSize")
    public Page<EmbedActionDto> getActionsForServer(String serverId, Pageable pageable) {
        return embedActionRepository.findByServerIdOrGlobal(serverId, pageable)
                .map(EmbedActionDto::fromDomain);
    }

    @Override
    public List<EmbedActionDto> getGlobalActions() {
        return embedActionRepository.findByIsGlobalTrue()
                .stream()
                .map(EmbedActionDto::fromDomain)
                .toList();
    }

    @Override
    public List<EmbedActionDto> getAllActions() {
        return embedActionRepository.findAll()
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
        Optional<EmbedAction> actionOpt = embedActionRepository.findByActionId(actionId)
                .or(() -> embedActionRepository.findById(actionId));
        actionOpt.ifPresent(this::cacheAction);
        return actionOpt;
    }

    @Override
    public Page<InteractionLogResponse> getInteractionLogs(String guildId, Pageable pageable) {
        Page<com.rednecksgaming.embed.domain.InteractionLog> logs;
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

    private User resolveOperatorUser(String operatorIdentifier) {
        if (operatorIdentifier == null || operatorIdentifier.isBlank()) {
            throw new AccessDeniedException("Operator clearance required");
        }
        try {
            Long userId = Long.parseLong(operatorIdentifier);
            Optional<User> byId = userRepository.findById(userId);
            if (byId.isPresent()) {
                return byId.get();
            }
        } catch (NumberFormatException ignored) {
        }
        return userRepository.findByEmail(operatorIdentifier)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + operatorIdentifier));
    }

    private User tryResolveOperatorUser(String operatorIdentifier) {
        if (operatorIdentifier == null || operatorIdentifier.isBlank()) {
            return null;
        }
        try {
            Long userId = Long.parseLong(operatorIdentifier);
            Optional<User> byId = userRepository.findById(userId);
            if (byId.isPresent()) {
                return byId.get();
            }
        } catch (NumberFormatException ignored) {
        }
        return userRepository.findByEmail(operatorIdentifier).orElse(null);
    }
}
