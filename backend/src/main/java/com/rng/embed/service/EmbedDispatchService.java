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
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import com.rng.server.client.DiscordServerClient;
import com.rng.server.dto.ChannelDto;
import com.rng.server.dto.discord.DiscordChannelDto;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.channel.middleman.GuildChannel;
import net.dv8tion.jda.api.entities.channel.middleman.GuildMessageChannel;
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
    private final Optional<JDA> jda;
    private final DiscordServerClient discordClient;

    public EmbedDispatchService(
            DiscordDispatchService discordDispatchService,
            PreFlightValidatorService validatorService,
            RedisRateLimiterService rateLimiterService,
            RedisScheduledDispatchService scheduledDispatchService,
            DispatchLogRepository dispatchLogRepository,
            UserRepository userRepository,
            @Autowired(required = false) JDA jda,
            @Autowired(required = false) DiscordServerClient discordClient
    ) {
        this.discordDispatchService = discordDispatchService;
        this.validatorService = validatorService;
        this.rateLimiterService = rateLimiterService;
        this.scheduledDispatchService = scheduledDispatchService;
        this.dispatchLogRepository = dispatchLogRepository;
        this.userRepository = userRepository;
        this.jda = Optional.ofNullable(jda);
        this.discordClient = discordClient;
    }

    public DispatchResponse dispatchImmediate(Long operatorUserId, DispatchEmbedRequest request, List<MultipartFile> files) {
        User operator = validateOperatorAuthorization(operatorUserId, request.serverId());

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
        JsonNode responseNode = discordDispatchService.dispatchToChannel(request.channelId(), request.payload(), resources);
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
                .status(DispatchStatus.SUCCESS)
                .discordMessageId(messageSnowflake)
                .timestamp(Instant.now())
                .latencyMs(latency)
                .build();
    }

    public DispatchResponse scheduleDispatch(Long operatorUserId, DispatchEmbedRequest request) {
        User operator = validateOperatorAuthorization(operatorUserId, request.serverId());

        rateLimiterService.checkRateLimits(request.serverId(), request.channelId(), String.valueOf(operatorUserId));

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
        boolean isHighCommand = com.rng.identity.domain.PersonnelHierarchy.isHighCommand(operator);

        if (!isAuthor && !isHighCommand) {
            throw new ForbiddenException("Only the author or High Command may cancel a scheduled dispatch.");
        }

        boolean removed = scheduledDispatchService.cancelTask(dispatchId);
        logEntry.setStatus(DispatchStatus.CANCELLED);
        logEntry.setErrorMessage("Dispatch cancelled by operator " + operator.getEmail());
        dispatchLogRepository.save(logEntry);

        log.info("Operator {} cancelled scheduled dispatch {}", operator.getEmail(), dispatchId);
        return removed;
    }

    public DryRunValidationResponse testDryRun(Long operatorUserId, DryRunValidationRequest request) {
        validateOperatorAuthorization(operatorUserId, request.serverId());
        return validatorService.validate(request.serverId(), request.channelId(), request.payload());
    }

    public Page<DispatchLogResponse> getDispatchLogs(String serverId, DispatchStatus status, Pageable pageable) {
        Page<DispatchLog> page;
        if (serverId != null && !serverId.isBlank() && status != null) {
            page = dispatchLogRepository.findByServerIdAndStatusOrderByTimestampDesc(serverId, status, pageable);
        } else if (serverId != null && !serverId.isBlank()) {
            page = dispatchLogRepository.findByServerIdOrderByTimestampDesc(serverId, pageable);
        } else if (status != null) {
            page = dispatchLogRepository.findByStatusOrderByTimestampDesc(status, pageable);
        } else {
            page = dispatchLogRepository.findAll(pageable);
        }

        return page.map(logItem -> DispatchLogResponse.builder()
                .id(logItem.getId())
                .dispatchId(logItem.getDispatchId())
                .serverId(logItem.getServerId())
                .channelId(logItem.getChannelId())
                .userId(logItem.getUserId())
                .userEmail(logItem.getUserEmail())
                .dispatchType(logItem.getDispatchType())
                .status(logItem.getStatus())
                .discordMessageId(logItem.getDiscordMessageId())
                .latencyMs(logItem.getLatencyMs())
                .errorMessage(logItem.getErrorMessage())
                .scheduledFor(logItem.getScheduledFor())
                .timestamp(logItem.getTimestamp())
                .build());
    }

    public List<ChannelDto> getDispatchableChannels(String serverId) {
        // Priority 1: Fetch live directly from Discord REST API v10 via Bot Token (full parity with app.js)
        if (discordClient != null) {
            try {
                List<DiscordChannelDto> discordChannels = discordClient.getGuildChannels(serverId);
                if (discordChannels != null && !discordChannels.isEmpty()) {
                    return discordChannels.stream()
                            // Include Text (0), Voice text (2), Announcement (5), and Forum (15) channels
                            .filter(c -> c.getType() != null && (c.getType() == 0 || c.getType() == 5 || c.getType() == 2 || c.getType() == 15))
                            .map(c -> ChannelDto.builder()
                                    .id(c.getId())
                                    .name(c.getName())
                                    .type(c.getType())
                                    .position(c.getPosition() != null ? c.getPosition() : 0)
                                    .parentId(c.getParentId())
                                    .build())
                            .sorted(Comparator.comparingInt(c -> c.getPosition() != null ? c.getPosition() : 0))
                            .toList();
                }
            } catch (Exception e) {
                log.warn("Discord REST client channel retrieval failed for {}: {}", serverId, e.getMessage());
            }
        }

        // Priority 2: Fallback to JDA Gateway in-memory cache
        if (jda.isPresent()) {
            Guild guild = jda.get().getGuildById(serverId);
            if (guild != null) {
                Member selfMember = guild.getSelfMember();
                List<ChannelDto> channels = new ArrayList<>();
                for (GuildChannel ch : guild.getChannels()) {
                    if (ch instanceof GuildMessageChannel msgCh) {
                        if (selfMember.hasPermission(msgCh, Permission.VIEW_CHANNEL, Permission.MESSAGE_SEND)) {
                            int pos = ch instanceof net.dv8tion.jda.api.entities.channel.attribute.IPositionableChannel pc ? pc.getPosition() : 0;
                            String parentId = null;
                            if (ch instanceof net.dv8tion.jda.api.entities.channel.attribute.ICategorizableChannel cc && cc.getParentCategory() != null) {
                                parentId = cc.getParentCategory().getId();
                            }
                            channels.add(ChannelDto.builder()
                                    .id(ch.getId())
                                    .name(ch.getName())
                                    .type(ch.getType().getId())
                                    .position(pos)
                                    .parentId(parentId)
                                    .build());
                        }
                    }
                }
                channels.sort(Comparator.comparingInt(c -> c.getPosition() != null ? c.getPosition() : 0));
                return channels;
            }
        }

        return List.of();
    }

    private User validateOperatorAuthorization(Long operatorUserId, String serverId) {
        User operator = userRepository.findById(operatorUserId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated operator record not found. Please log in again."));

        if (!operator.isActive()) {
            throw new ForbiddenException("Operator account is deactivated.");
        }

        // Operator is active and authenticated; allow dispatch via official bot credentials
        if (!operator.isDiscordLinked() || operator.getDiscordId() == null) {
            log.info("Operator {} (ID: {}) dispatching message via Bot credentials without linked personal Discord snowflake.",
                    operator.getEmail(), operator.getId());
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
