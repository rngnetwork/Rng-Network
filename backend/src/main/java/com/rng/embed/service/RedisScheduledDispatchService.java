package com.rng.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.exception.BadRequestException;
import com.rng.common.exception.InternalServerException;
import com.rng.embed.dto.ScheduledTaskDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Two-phase reliable Redis scheduling queue engine guaranteeing zero-drop task dispatch.
 */
@Slf4j
@Service
public class RedisScheduledDispatchService {

    public static final String SCHEDULED_ZSET = "dispatch:scheduled:zset";
    public static final String PROCESSING_ZSET = "dispatch:processing:zset";
    public static final String TASK_KEY_PREFIX = "dispatch:task:";
    public static final String DLQ_LIST = "dispatch:dlq:list";

    private static final String TWO_PHASE_CLAIM_LUA =
            "local tasks = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, tonumber(ARGV[3]))\n" +
            "if #tasks > 0 then\n" +
            "    for i, task in ipairs(tasks) do\n" +
            "        redis.call('ZREM', KEYS[1], task)\n" +
            "        redis.call('ZADD', KEYS[2], tonumber(ARGV[2]), task)\n" +
            "    end\n" +
            "end\n" +
            "return tasks";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final DefaultRedisScript<List> claimScript;

    public RedisScheduledDispatchService(
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.objectMapper.findAndRegisterModules();
        this.claimScript = new DefaultRedisScript<>();
        this.claimScript.setScriptText(TWO_PHASE_CLAIM_LUA);
        this.claimScript.setResultType(List.class);
    }

    /**
     * Enqueue a new scheduled dispatch task. Target time must be in the future.
     */
    public void scheduleTask(ScheduledTaskDto task) {
        if (redisTemplate == null) {
            throw new InternalServerException("Redis service is required for scheduled dispatch operations.");
        }

        Instant minAllowedTime = Instant.now().minusSeconds(15); // 15s clock skew / network latency tolerance buffer
        if (task.scheduledFor() == null || task.scheduledFor().isBefore(minAllowedTime)) {
            throw new BadRequestException("Scheduled dispatch time must be in the future.");
        }

        try {
            String taskJson = objectMapper.writeValueAsString(task);
            String taskKey = TASK_KEY_PREFIX + task.dispatchId();

            // 1. Store task payload with 7-day TTL
            redisTemplate.opsForValue().set(taskKey, taskJson, Duration.ofDays(7));

            // 2. Add to scheduled ZSET with epoch millisecond score
            redisTemplate.opsForZSet().add(SCHEDULED_ZSET, task.dispatchId(), task.scheduledFor().toEpochMilli());

            log.info("Enqueued scheduled dispatch {} for timestamp {}", task.dispatchId(), task.scheduledFor());
        } catch (Exception e) {
            throw new InternalServerException("Failed to enqueue scheduled task in Redis: " + e.getMessage(), e);
        }
    }

    /**
     * Atomically claim due tasks moving them from scheduled to processing set.
     */
    public List<String> claimDueTasks(long currentEpochMs, long timeoutMs, int batchSize) {
        if (redisTemplate == null) {
            return List.of();
        }

        try {
            long expireScore = currentEpochMs + timeoutMs;
            List<?> result = redisTemplate.execute(
                    claimScript,
                    List.of(SCHEDULED_ZSET, PROCESSING_ZSET),
                    String.valueOf(currentEpochMs),
                    String.valueOf(expireScore),
                    String.valueOf(batchSize)
            );

            if (result == null || result.isEmpty()) {
                return List.of();
            }

            List<String> taskIds = new ArrayList<>();
            for (Object obj : result) {
                if (obj != null) {
                    taskIds.add(obj.toString());
                }
            }
            return taskIds;
        } catch (Exception e) {
            log.error("Failed executing two-phase atomic claim Lua script: {}", e.getMessage(), e);
            return List.of();
        }
    }

    /**
     * Retrieves full ScheduledTaskDto payload from Redis.
     */
    public ScheduledTaskDto getTask(String dispatchId) {
        if (redisTemplate == null) return null;
        try {
            String json = redisTemplate.opsForValue().get(TASK_KEY_PREFIX + dispatchId);
            if (json == null || json.isBlank()) return null;
            return objectMapper.readValue(json, ScheduledTaskDto.class);
        } catch (Exception e) {
            log.error("Failed to read scheduled task payload {}: {}", dispatchId, e.getMessage());
            return null;
        }
    }

    /**
     * Successfully complete task, removing from processing set and clearing payload.
     */
    public void completeTask(String dispatchId) {
        if (redisTemplate == null) return;
        try {
            redisTemplate.opsForZSet().remove(PROCESSING_ZSET, dispatchId);
            redisTemplate.delete(TASK_KEY_PREFIX + dispatchId);
            log.info("Completed and cleared scheduled task {}", dispatchId);
        } catch (Exception e) {
            log.warn("Failed to complete task {}: {}", dispatchId, e.getMessage());
        }
    }

    /**
     * Re-enqueue a failed task with exponential backoff or transfer to dead letter queue.
     */
    public void retryTask(ScheduledTaskDto task, int maxRetries, String error) {
        if (redisTemplate == null) return;
        int nextAttempt = task.attemptCount() + 1;
        String dispatchId = task.dispatchId();

        if (nextAttempt <= maxRetries) {
            long backoffDelayMs = (long) Math.pow(2, nextAttempt) * 1000L;
            long nextScore = System.currentTimeMillis() + backoffDelayMs;
            ScheduledTaskDto updated = task.toBuilder()
                    .attemptCount(nextAttempt)
                    .lastError(error)
                    .build();

            try {
                redisTemplate.opsForValue().set(TASK_KEY_PREFIX + dispatchId, objectMapper.writeValueAsString(updated), Duration.ofDays(7));
                redisTemplate.opsForZSet().remove(PROCESSING_ZSET, dispatchId);
                redisTemplate.opsForZSet().add(SCHEDULED_ZSET, dispatchId, nextScore);
                log.warn("Task {} failed (attempt {}/{}). Retrying in {} ms", dispatchId, nextAttempt, maxRetries, backoffDelayMs);
            } catch (Exception e) {
                log.error("Failed to re-queue retry task {}: {}", dispatchId, e.getMessage());
            }
        } else {
            log.error("Task {} exceeded maximum retries ({}). Routing to DLQ.", dispatchId, maxRetries);
            try {
                redisTemplate.opsForZSet().remove(PROCESSING_ZSET, dispatchId);
                redisTemplate.opsForList().rightPush(DLQ_LIST, dispatchId);
            } catch (Exception e) {
                log.error("Failed to push task {} to DLQ: {}", dispatchId, e.getMessage());
            }
        }
    }

    /**
     * Cancel scheduled dispatch and delete payload.
     */
    public boolean cancelTask(String dispatchId) {
        if (redisTemplate == null) return false;
        try {
            redisTemplate.opsForZSet().remove(SCHEDULED_ZSET, dispatchId);
            redisTemplate.opsForZSet().remove(PROCESSING_ZSET, dispatchId);
            redisTemplate.delete(TASK_KEY_PREFIX + dispatchId);
            log.info("Cancelled scheduled task {}", dispatchId);
            return true;
        } catch (Exception e) {
            log.error("Failed to cancel scheduled task {}: {}", dispatchId, e.getMessage());
            return false;
        }
    }

    /**
     * Crash-recovery sweeper recovering tasks abandoned in processing set past their expiration score.
     */
    public int sweepStaleProcessingTasks(long nowEpochMs) {
        if (redisTemplate == null) return 0;
        try {
            Set<String> staleTaskIds = redisTemplate.opsForZSet().rangeByScore(PROCESSING_ZSET, 0, nowEpochMs);
            if (staleTaskIds == null || staleTaskIds.isEmpty()) {
                return 0;
            }

            int count = 0;
            for (String taskId : staleTaskIds) {
                ScheduledTaskDto task = getTask(taskId);
                if (task != null) {
                    retryTask(task, 3, "Worker node timeout / crash detected during processing");
                } else {
                    redisTemplate.opsForZSet().remove(PROCESSING_ZSET, taskId);
                }
                count++;
            }
            if (count > 0) {
                log.warn("Sweeper recovered {} stale in-flight dispatch tasks", count);
            }
            return count;
        } catch (Exception e) {
            log.error("Error sweeping stale processing tasks: {}", e.getMessage());
            return 0;
        }
    }
}
