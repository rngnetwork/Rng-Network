package com.rng.embed.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.rng.common.exception.BadRequestException;
import com.rng.common.exception.ForbiddenException;
import com.rng.common.exception.InternalServerException;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.common.exception.UnauthorizedException;
import com.rng.embed.domain.DispatchLog;
import com.rng.embed.domain.DispatchStatus;
import com.rng.embed.domain.DispatchType;
import com.rng.embed.dto.*;
import com.rng.embed.repository.DispatchLogRepository;
import com.rng.embed.security.WebhookCryptoService;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import com.rng.server.dto.ChannelDto;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Orchestrating service managing immediate & scheduled Discord message dispatches,
 * dual-layer RBAC permissions, and telemetry auditing.
 */
@Slf4j
@Service
public class EmbedDispatchService {

    private final DiscordDispatchService discordDispatchService;
    private final PreFlightValidatorService validatorService;
    private final RedisRateLimiterService rateLimiterService;
    private final RedisScheduledDispatchService scheduledDispatchService;
    private final DispatchLogRepository dispatchLogRepository;
    private final UserRepository userRepository;
    private final WebhookCryptoService cryptoService;
    private final Optional<JDA> jda;

    public EmbedDispatchService(
            DiscordDispatchService discordDispatchService,
            PreFlightValidatorService validatorService,
            RedisRateLimiterService rateLimiterService,
            RedisScheduledDispatchService scheduledDispatchService,
            DispatchLogRepository dispatchLogRepository,
            UserRepository userRepository,
            WebhookCryptoService cryptoService,
            @Autowired(required = false) JDA jda
    ) {
        this.discordDispatchService = discordDispatchService;
        this.validatorService = validatorService;
        this.rateLimiterService = rateLimiterService;
        this.scheduledDispatchService = scheduledDispatchService;
        this.dispatchLogRepository = dispatchLogRepository;
        this.userRepository = userRepository;
        this.cryptoService = cryptoService;
        this.jda = Optional.ofNullable(jda);
    }

    public DispatchResponse dispatchImmediate(Long operatorUserId, DispatchEmbedRequest request, List<MultipartFile> files) {
        User operator = validateOperatorAuthorization(operatorUserId, request.serverId(), request.dispatchType());

        // 1. Rate limit quota check
        rateLimiterService.checkRateLimits(request.serverId(), request.channelId(), String.valueOf(operatorUserId));

        // 2. Pre-flight validation check
        DryRunValidationResponse validation = validatorService.validate(request.serverId(), request.channelId(), request.payload());
        if (!validation.isValid()) {
            throw new BadRequestException("Pre-flight validation failed: " + String.join("; ", validation.errors()));
        }

        // 3. Process attachments
        List<Resource> resources = convertMultipartFiles(files);

        // 4. Outbound dispatch execution
        long start = System.currentTimeMillis();
        JsonNode responseNode;
        if (request.dispatchType() == DispatchType.WEBHOOK) {
            String[] parts = cryptoService.parseAndValidateWebhookUrl(request.webhookUrl());
            responseNode = discordDispatchService.dispatchToWebhook(parts[0], parts[1], request.payload(), resources);
        } else {
            responseNode = discordDispatchService.dispatchToChannel(request.channelId(), request.payload(), resources);
        }
        long latency = System.currentTimeMillis() - start;
        String messageSnowflake = responseNode != null && responseNode.has("id") ? responseNode.get("id").asText() : null;

        // 5. Audit Log Persistence in MongoDB
        String dispatchId = "dsp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        DispatchLog logEntry = DispatchLog.builder()
                .dispatchId(dispatchId)
                .userId(String.valueOf(operatorUserId))
                .userEmail(operator.getEmail())
                .serverId(request.serverId())
                .channelId(request.channelId())
                .dispatchType(request.dispatchType())
                .status(DispatchStatus.SUCCESS)
                .discordMessageId(messageSnowflake)
                .latencyMs(latency)
                .payloadSnapshot(request.payload())
                .timestamp(Instant.now())
                .build();
        dispatchLogRepository.save(logEntry);

        log.info("Immediate dispatch {} completed for channel {}. Snowflake: {}", dispatchId, request.channelId(), messageSnowflake);

        return DispatchResponse.builder()
                .dispatchId(dispatchId)
                .discordMessageId(messageSnowflake)
                .status(DispatchStatus.SUCCESS)
                .timestamp(Instant.now())
                .latencyMs(latency)
                .build();
    }

    public DispatchResponse scheduleDispatch(Long operatorUserId, DispatchEmbedRequest request) {
        User operator = validateOperatorAuthorization(operatorUserId, request.serverId(), request.dispatchType());

        Instant minAllowedTime = Instant.now().plus(Duration.ofMinutes(2)).minusSeconds(5);
        if (request.scheduledFor() == null || request.scheduledFor().isBefore(minAllowedTime)) {
            throw new BadRequestException("Scheduled dispatch time must be at least 2 minutes in the future.");
        }

        DryRunValidationResponse validation = validatorService.validate(request.serverId(), request.channelId(), request.payload());
        if (!validation.isValid()) {
            throw new BadRequestException("Pre-flight validation failed: " + String.join("; ", validation.errors()));
        }

        String dispatchId = "dsp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        // 1. Persist QUEUED record in MongoDB
        DispatchLog logEntry = DispatchLog.builder()
                .dispatchId(dispatchId)
                .userId(String.valueOf(operatorUserId))
                .userEmail(operator.getEmail())
                .serverId(request.serverId())
                .channelId(request.channelId())
                .dispatchType(request.dispatchType())
                .status(DispatchStatus.QUEUED)
                .payloadSnapshot(request.payload())
                .scheduledFor(request.scheduledFor())
                .timestamp(Instant.now())
                .build();
        dispatchLogRepository.save(logEntry);

        // 2. Enqueue in Redis Two-Phase scheduling queue
        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId(dispatchId)
                .userId(String.valueOf(operatorUserId))
                .userEmail(operator.getEmail())
                .serverId(request.serverId())
                .channelId(request.channelId())
                .dispatchType(request.dispatchType())
                .scheduledFor(request.scheduledFor())
                .payload(request.payload())
                .webhookUrl(request.webhookUrl())
                .createdAt(Instant.now())
                .build();
        scheduledDispatchService.scheduleTask(task);

        log.info("Enqueued scheduled dispatch {} for timestamp {}", dispatchId, request.scheduledFor());

        return DispatchResponse.builder()
                .dispatchId(dispatchId)
                .status(DispatchStatus.QUEUED)
                .scheduledFor(request.scheduledFor())
                .timestamp(Instant.now())
                .build();
    }

    public boolean cancelScheduledDispatch(Long operatorUserId, String dispatchId) {
        DispatchLog logEntry = dispatchLogRepository.findByDispatchId(dispatchId)
                .orElseThrow(() -> new ResourceNotFoundException("Scheduled dispatch log not found: " + dispatchId));

        User operator = userRepository.findById(operatorUserId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated operator not found."));

        boolean isAuthor = String.valueOf(operatorUserId).equals(logEntry.getUserId());
        boolean isHighCommand = operator.getRole().contains("HIGH_COMMAND") || operator.getRole().contains("SUPER_ADMIN");
        if (!isAuthor && !isHighCommand) {
            throw new ForbiddenException("Only the author or High Command may cancel this scheduled dispatch.");
        }

        scheduledDispatchService.cancelTask(dispatchId);

        logEntry.setStatus(DispatchStatus.CANCELLED);
        logEntry.setErrorMessage("Manually cancelled by operator: " + operator.getEmail());
        dispatchLogRepository.save(logEntry);

        log.info("Cancelled scheduled dispatch {} by operator {}", dispatchId, operator.getEmail());
        return true;
    }

    public DryRunValidationResponse testDryRun(Long operatorUserId, DryRunValidationRequest request) {
        validateOperatorAuthorization(operatorUserId, request.serverId(), DispatchType.IMMEDIATE);
        return validatorService.validate(request.serverId(), request.channelId(), request.payload());
    }

    public Page<DispatchLogResponse> getDispatchLogs(String serverId, DispatchStatus status, Pageable pageable) {
        Page<DispatchLog> logs;
        if (serverId != null && !serverId.isBlank() && status != null) {
            logs = dispatchLogRepository.findByServerIdAndStatusOrderByTimestampDesc(serverId, status, pageable);
        } else if (serverId != null && !serverId.isBlank()) {
            logs = dispatchLogRepository.findByServerIdOrderByTimestampDesc(serverId, pageable);
        } else {
            logs = dispatchLogRepository.findAll(pageable);
        }

        return logs.map(l -> DispatchLogResponse.builder()
                .id(l.getId())
                .dispatchId(l.getDispatchId())
                .userId(l.getUserId())
                .userEmail(l.getUserEmail())
                .serverId(l.getServerId())
                .serverName(l.getServerName())
                .channelId(l.getChannelId())
                .channelName(l.getChannelName())
                .dispatchType(l.getDispatchType())
                .status(l.getStatus())
                .discordMessageId(l.getDiscordMessageId())
                .errorMessage(l.getErrorMessage())
                .latencyMs(l.getLatencyMs())
                .payloadSnapshot(l.getPayloadSnapshot())
                .scheduledFor(l.getScheduledFor())
                .timestamp(l.getTimestamp())
                .build());
    }

    public List<ChannelDto> getDispatchableChannels(String serverId) {
        if (jda.isEmpty() || jda.get().getStatus() != JDA.Status.CONNECTED) {
            return List.of();
        }

        Guild guild = jda.get().getGuildById(serverId);
        if (guild == null) {
            return List.of();
        }

        Member selfMember = guild.getSelfMember();
        List<ChannelDto> channels = new ArrayList<>();

        for (TextChannel textChannel : guild.getTextChannels()) {
            if (selfMember.hasPermission(textChannel, Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND)) {
                channels.add(ChannelDto.builder()
                        .id(textChannel.getId())
                        .name(textChannel.getName())
                        .type(0) // Text channel
                        .position(textChannel.getPosition())
                        .build());
            }
        }

        return channels;
    }

    private User validateOperatorAuthorization(Long operatorUserId, String serverId, DispatchType dispatchType) {
        User operator = userRepository.findById(operatorUserId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated operator record not found."));

        if (!operator.isActive()) {
            throw new ForbiddenException("Operator account is deactivated.");
        }

        // Layer 2: Discord Snowflake verification required for non-webhook dispatches
        if (dispatchType != DispatchType.WEBHOOK && (!operator.isDiscordLinked() || operator.getDiscordId() == null)) {
            throw new ForbiddenException("Operator must link a Discord account to dispatch server messages.");
        }

        return operator;
    }

    private List<Resource> convertMultipartFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        List<Resource> resources = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                byte[] bytes = file.getBytes();
                String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment.bin";
                resources.add(new ByteArrayResource(bytes) {
                    @Override
                    public String getFilename() {
                        return filename;
                    }
                });
            } catch (Exception e) {
                throw new InternalServerException("Failed to read uploaded file attachment: " + file.getOriginalFilename(), e);
            }
        }
        return resources;
    }
}
