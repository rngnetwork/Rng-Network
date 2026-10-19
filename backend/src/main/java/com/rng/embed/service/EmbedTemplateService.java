package com.rng.embed.service;

import com.rng.common.exception.BadRequestException;
import com.rng.common.exception.ForbiddenException;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.common.exception.UnauthorizedException;
import com.rng.embed.domain.EmbedTemplate;
import com.rng.embed.dto.CreateTemplateRequest;
import com.rng.embed.dto.DryRunValidationResponse;
import com.rng.embed.dto.TemplateResponse;
import com.rng.embed.dto.UpdateTemplateRequest;
import com.rng.embed.repository.EmbedTemplateRepository;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Service managing message templates lifecycle in MongoDB document storage.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmbedTemplateService {

    private final EmbedTemplateRepository templateRepository;
    private final UserRepository userRepository;
    private final PreFlightValidatorService validatorService;

    public Page<TemplateResponse> listTemplates(Long operatorUserId, String serverId, String category, Pageable pageable) {
        Page<EmbedTemplate> templates;
        String authorId = operatorUserId != null ? String.valueOf(operatorUserId) : null;
        if (category != null && !category.isBlank()) {
            templates = templateRepository.findAccessibleByCategory(serverId, authorId, category.trim().toLowerCase(), pageable);
        } else {
            templates = templateRepository.findAccessibleTemplates(serverId, authorId, pageable);
        }
        return templates.map(this::toResponse);
    }

    public TemplateResponse getTemplate(String templateId) {
        EmbedTemplate template = templateRepository.findByTemplateId(templateId)
                .or(() -> templateRepository.findById(templateId))
                .orElseThrow(() -> new ResourceNotFoundException("Embed template not found: " + templateId));
        return toResponse(template);
    }

    public TemplateResponse createTemplate(Long operatorUserId, CreateTemplateRequest request) {
        User operator = userRepository.findById(operatorUserId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated operator record not found."));

        if (request.payload() != null && !request.payload().isEmpty()) {
            Map<String, Object> validationPayload = new HashMap<>(request.payload());
            if (validationPayload.containsKey("components") && validationPayload.get("components") instanceof List) {
                Map<String, Object> wireValidationPayload = new HashMap<>(validationPayload);
                wireValidationPayload.remove("content");
                if (!wireValidationPayload.containsKey("flags")) {
                    wireValidationPayload.put("flags", 32768);
                }
                DryRunValidationResponse validation = validatorService.validate(
                        request.serverId() != null ? request.serverId() : "global",
                        "template-validation",
                        wireValidationPayload
                );
                if (!validation.isValid()) {
                    throw new BadRequestException("Template payload is invalid: " + String.join("; ", validation.errors()));
                }
            } else if (!validationPayload.containsKey("containers")) {
                DryRunValidationResponse validation = validatorService.validate(
                        request.serverId() != null ? request.serverId() : "global",
                        "template-validation",
                        validationPayload
                );
                if (!validation.isValid()) {
                    throw new BadRequestException("Template payload is invalid: " + String.join("; ", validation.errors()));
                }
            }
        }

        String templateId = "tmpl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String authorName = (operator.getFullName() != null && !operator.getFullName().isBlank())
                ? operator.getFullName()
                : operator.getEmail();

        EmbedTemplate template = EmbedTemplate.builder()
                .templateId(templateId)
                .name(request.name().trim())
                .description(request.description() != null ? request.description().trim() : null)
                .authorId(String.valueOf(operatorUserId))
                .authorName(authorName)
                .serverId(request.serverId())
                .category(request.category() != null && !request.category().isBlank() ? request.category().trim().toLowerCase() : "general")
                .tags(request.tags() != null ? request.tags() : new ArrayList<>())
                .payload(request.payload())
                .isPublic(request.isPublic())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        EmbedTemplate saved = templateRepository.save(template);
        log.info("Created embed template {} by operator {}", templateId, operator.getEmail());
        return toResponse(saved);
    }

    public TemplateResponse updateTemplate(Long operatorUserId, String templateId, UpdateTemplateRequest request) {
        EmbedTemplate template = templateRepository.findByTemplateId(templateId)
                .or(() -> templateRepository.findById(templateId))
                .orElseThrow(() -> new ResourceNotFoundException("Embed template not found: " + templateId));

        User operator = userRepository.findById(operatorUserId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated operator record not found."));

        boolean isAuthor = template.getAuthorId() == null
                || template.getAuthorId().isBlank()
                || String.valueOf(operatorUserId).equals(template.getAuthorId())
                || (operator.getEmail() != null && (
                    operator.getEmail().equalsIgnoreCase(template.getAuthorId())
                    || operator.getEmail().equalsIgnoreCase(template.getAuthorName())));

        boolean isHighCommand = com.rng.identity.domain.PersonnelHierarchy.isHighCommand(operator)
                || com.rng.identity.domain.PersonnelHierarchy.isChiefHighCommand(operator)
                || (operator.getRole() != null && (
                    operator.getRole().contains("HIGH_COMMAND")
                    || operator.getRole().contains("SUPER_ADMIN")
                    || operator.getRole().contains("ADMIN")));

        if (!isAuthor && !isHighCommand) {
            throw new ForbiddenException("Only the original template author or High Command may modify this template.");
        }

        if (request.payload() != null && !request.payload().isEmpty()) {
            Map<String, Object> validationPayload = new HashMap<>(request.payload());
            if (validationPayload.containsKey("components") && validationPayload.get("components") instanceof List) {
                Map<String, Object> wireValidationPayload = new HashMap<>(validationPayload);
                wireValidationPayload.remove("content");
                if (!wireValidationPayload.containsKey("flags")) {
                    wireValidationPayload.put("flags", 32768);
                }
                DryRunValidationResponse validation = validatorService.validate(
                        template.getServerId() != null ? template.getServerId() : "global",
                        "template-validation",
                        wireValidationPayload
                );
                if (!validation.isValid()) {
                    throw new BadRequestException("Updated template payload is invalid: " + String.join("; ", validation.errors()));
                }
            } else if (!validationPayload.containsKey("containers")) {
                DryRunValidationResponse validation = validatorService.validate(
                        template.getServerId() != null ? template.getServerId() : "global",
                        "template-validation",
                        validationPayload
                );
                if (!validation.isValid()) {
                    throw new BadRequestException("Updated template payload is invalid: " + String.join("; ", validation.errors()));
                }
            }
        }

        template.setName(request.name().trim());
        if (request.description() != null) {
            template.setDescription(request.description().trim());
        }
        if (request.category() != null && !request.category().isBlank()) {
            template.setCategory(request.category().trim().toLowerCase());
        }
        if (request.tags() != null) {
            template.setTags(request.tags());
        }
        template.setPayload(request.payload());
        if (request.isPublic() != null) {
            template.setPublic(request.isPublic());
        }
        template.setUpdatedAt(Instant.now());

        EmbedTemplate saved = templateRepository.save(template);
        log.info("Updated embed template {} by operator {}", templateId, operator.getEmail());
        return toResponse(saved);
    }

    public void deleteTemplate(Long operatorUserId, String templateId) {
        EmbedTemplate template = templateRepository.findByTemplateId(templateId)
                .or(() -> templateRepository.findById(templateId))
                .orElseThrow(() -> new ResourceNotFoundException("Embed template not found: " + templateId));

        User operator = userRepository.findById(operatorUserId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated operator record not found."));

        boolean isAuthor = template.getAuthorId() == null
                || template.getAuthorId().isBlank()
                || String.valueOf(operatorUserId).equals(template.getAuthorId())
                || (operator.getEmail() != null && (
                    operator.getEmail().equalsIgnoreCase(template.getAuthorId())
                    || operator.getEmail().equalsIgnoreCase(template.getAuthorName())));

        boolean isHighCommand = com.rng.identity.domain.PersonnelHierarchy.isHighCommand(operator)
                || com.rng.identity.domain.PersonnelHierarchy.isChiefHighCommand(operator)
                || (operator.getRole() != null && (
                    operator.getRole().contains("HIGH_COMMAND")
                    || operator.getRole().contains("SUPER_ADMIN")
                    || operator.getRole().contains("ADMIN")));

        if (!isAuthor && !isHighCommand) {
            throw new ForbiddenException("Only the original template author or High Command may delete this template.");
        }

        templateRepository.delete(template);
        log.info("Deleted embed template {} (name: '{}') by operator {}", templateId, template.getName(), operator.getEmail());
    }

    public Map<String, Object> exportTemplate(String templateId) {
        EmbedTemplate template = templateRepository.findByTemplateId(templateId)
                .or(() -> templateRepository.findById(templateId))
                .orElseThrow(() -> new ResourceNotFoundException("Embed template not found: " + templateId));

        Map<String, Object> exportMap = new LinkedHashMap<>();
        exportMap.put("name", template.getName());
        exportMap.put("description", template.getDescription());
        exportMap.put("category", template.getCategory());
        exportMap.put("tags", template.getTags());
        exportMap.put("payload", template.getPayload());
        exportMap.put("isPublic", template.isPublic());
        exportMap.put("exportedAt", Instant.now().toString());
        return exportMap;
    }

    public TemplateResponse importTemplate(Long operatorUserId, Map<String, Object> templateJson) {
        String name = (String) templateJson.getOrDefault("name", "Imported Template");
        String description = (String) templateJson.get("description");
        String category = ((String) templateJson.getOrDefault("category", "general")).toLowerCase();
        List<String> tags = templateJson.get("tags") instanceof List<?> list
                ? list.stream().map(Object::toString).toList()
                : List.of();
        Object rawPayload = templateJson.get("payload");
        if (!(rawPayload instanceof Map<?, ?> rawMap)) {
            throw new BadRequestException("Imported JSON must contain a valid 'payload' object.");
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        rawMap.forEach((k, v) -> payload.put(String.valueOf(k), v));

        CreateTemplateRequest createRequest = new CreateTemplateRequest(
                name,
                description,
                category,
                tags,
                null,
                payload,
                false
        );

        return createTemplate(operatorUserId, createRequest);
    }

    private TemplateResponse toResponse(EmbedTemplate doc) {
        return TemplateResponse.builder()
                .id(doc.getId())
                .templateId(doc.getTemplateId())
                .name(doc.getName())
                .description(doc.getDescription())
                .authorId(doc.getAuthorId())
                .authorName(doc.getAuthorName())
                .serverId(doc.getServerId())
                .category(doc.getCategory())
                .tags(doc.getTags())
                .payload(doc.getPayload())
                .isPublic(doc.isPublic())
                .version(doc.getVersion())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }
}
