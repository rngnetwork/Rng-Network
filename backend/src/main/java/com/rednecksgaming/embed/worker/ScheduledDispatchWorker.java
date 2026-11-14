// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.worker;

import com.fasterxml.jackson.databind.JsonNode;
import com.rednecksgaming.embed.domain.DispatchLog;
import com.rednecksgaming.embed.domain.DispatchStatus;
import com.rednecksgaming.embed.dto.ScheduledTaskDto;
import com.rednecksgaming.embed.repository.DispatchLogRepository;
import com.rednecksgaming.embed.service.DiscordDispatchService;
import com.rednecksgaming.embed.service.RedisRateLimiterService;
import com.rednecksgaming.embed.service.RedisScheduledDispatchService;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Background worker polling and dispatching mature scheduled tasks from Redis 7.2 two-phase queue.
 * Enforces operator Layer 1 permission decay protection, distributed polling locks, and crash recovery.
 */
@Slf4j
@Component
public class ScheduledDispatchWorker {

    private static final String POLLER_LOCK_KEY = "dispatch:poller:lock";
    private static final long LOCK_TTL_SECONDS = 4L;

    private final RedisScheduledDispatchService queueService;
    private final DiscordDispatchService discordDispatchService;
    private final RedisRateLimiterService rateLimiterService;
    private final DispatchLogRepository dispatchLogRepository;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;

    private long lastSweepTimestamp = 0;

    public ScheduledDispatchWorker(
            RedisScheduledDispatchService queueService,
            DiscordDispatchService discordDispatchService,
            RedisRateLimiterService rateLimiterService,
            DispatchLogRepository dispatchLogRepository,
            UserRepository userRepository,
            @Autowired(required = false) StringRedisTemplate redisTemplate
    ) {
        this.queueService = queueService;
        this.discordDispatchService = discordDispatchService;
        this.rateLimiterService = rateLimiterService;
        this.dispatchLogRepository = dispatchLogRepository;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
    }

    private boolean redisWarned = false;

    @Scheduled(fixedDelay = 5000)
    public void processScheduledQueue() {
        if (redisTemplate == null) {
            return;
        }

        String workerLockId = UUID.randomUUID().toString();
        try {
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(POLLER_LOCK_KEY, workerLockId, Duration.ofSeconds(LOCK_TTL_SECONDS));
            if (!Boolean.TRUE.equals(acquired)) {
                return; // Another worker instance is currently polling
            }
            if (redisWarned) {
                log.info("Redis connection established. Scheduled dispatch poller active.");
                redisWarned = false;
            }
        } catch (Exception e) {
            if (!redisWarned) {
                log.warn("Redis connection unavailable for scheduled dispatch poller ({}). Scheduled queue processing paused until Redis reconnects.", e.getMessage());
                redisWarned = true;
            }
            return;
        }

        try {
            long now = System.currentTimeMillis();

            // 1. Periodic crash recovery sweeper (every 30s)
            if (now - lastSweepTimestamp > 30000L) {
                queueService.sweepStaleProcessingTasks(now);
                lastSweepTimestamp = now;
            }

            // 2. Claim mature tasks
            List<String> claimedTaskIds = queueService.claimDueTasks(now, 60000L, 10);
            for (String dispatchId : claimedTaskIds) {
                executeTask(dispatchId);
            }
        } catch (Exception e) {
            log.error("Unhandled error during scheduled dispatch processing: {}", e.getMessage(), e);
        } finally {
            // Safe lock release
            try {
                String currentLock = redisTemplate.opsForValue().get(POLLER_LOCK_KEY);
                if (workerLockId.equals(currentLock)) {
                    redisTemplate.delete(POLLER_LOCK_KEY);
                }
            } catch (Exception ignored) {
            }
        }
    }

    private void executeTask(String dispatchId) {
        ScheduledTaskDto task = queueService.getTask(dispatchId);
        if (task == null) {
            queueService.completeTask(dispatchId);
            return;
        }

        // 1. Operator Permission Decay Protection (Layer 1 verification)
        if (!isOperatorStillAuthorized(task.userId())) {
            log.warn("Permission decay check failed: Operator {} is no longer active. Cancelling task {}", task.userId(), dispatchId);
            queueService.completeTask(dispatchId);
            updateDispatchLogStatus(dispatchId, DispatchStatus.CANCELLED, null, "Operator clearance revoked or account deactivated.");
            return;
        }

        // 2. Rate limit check
        try {
            rateLimiterService.checkRateLimits(task.serverId(), task.channelId(), task.userId());
        } catch (Exception e) {
            log.warn("Rate limit backpressure for scheduled task {}: {}", dispatchId, e.getMessage());
            queueService.retryTask(task, 3, "Rate limit throttling: " + e.getMessage());
            updateDispatchLogStatus(dispatchId, DispatchStatus.RETRYING, null, e.getMessage());
            return;
        }

        // 3. Dispatch execution
        long start = System.currentTimeMillis();
        try {
            JsonNode result = discordDispatchService.dispatchToChannel(task.channelId(), task.payload(), null);

            long latency = System.currentTimeMillis() - start;
            String messageSnowflake = result != null && result.has("id") ? result.get("id").asText() : null;

            queueService.completeTask(dispatchId);
            updateDispatchLogSuccess(dispatchId, messageSnowflake, latency);
            log.info("Scheduled dispatch {} succeeded. Snowflake: {}, Latency: {} ms", dispatchId, messageSnowflake, latency);
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            log.error("Scheduled dispatch {} failed: {}", dispatchId, e.getMessage(), e);

            int nextAttempt = task.attemptCount() + 1;
            DispatchStatus nextStatus = nextAttempt > 3 ? DispatchStatus.FAILED : DispatchStatus.RETRYING;
            updateDispatchLogStatus(dispatchId, nextStatus, latency, e.getMessage());
            queueService.retryTask(task, 3, e.getMessage());
        }
    }

    private boolean isOperatorStillAuthorized(String userIdStr) {
        try {
            Long userId = Long.valueOf(userIdStr);
            Optional<User> userOpt = userRepository.findById(userId);
            return userOpt.isPresent() && userOpt.get().isActive();
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private void updateDispatchLogSuccess(String dispatchId, String messageSnowflake, long latencyMs) {
        Optional<DispatchLog> logOpt = dispatchLogRepository.findByDispatchId(dispatchId);
        if (logOpt.isPresent()) {
            DispatchLog logEntry = logOpt.get();
            logEntry.setStatus(DispatchStatus.SUCCESS);
            logEntry.setDiscordMessageId(messageSnowflake);
            logEntry.setLatencyMs(latencyMs);
            logEntry.setTimestamp(Instant.now());
            dispatchLogRepository.save(logEntry);
        }
    }

    private void updateDispatchLogStatus(String dispatchId, DispatchStatus status, Long latencyMs, String errorMessage) {
        Optional<DispatchLog> logOpt = dispatchLogRepository.findByDispatchId(dispatchId);
        if (logOpt.isPresent()) {
            DispatchLog logEntry = logOpt.get();
            logEntry.setStatus(status);
            if (latencyMs != null) {
                logEntry.setLatencyMs(latencyMs);
            }
            if (errorMessage != null) {
                logEntry.setErrorMessage(errorMessage);
            }
            dispatchLogRepository.save(logEntry);
        }
    }
}
