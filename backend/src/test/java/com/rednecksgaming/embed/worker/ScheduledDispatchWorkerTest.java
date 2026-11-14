// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.worker;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.common.exception.BadRequestException;
import com.rednecksgaming.embed.domain.DispatchLog;
import com.rednecksgaming.embed.domain.DispatchStatus;
import com.rednecksgaming.embed.domain.DispatchType;
import com.rednecksgaming.embed.dto.ScheduledTaskDto;
import com.rednecksgaming.embed.repository.DispatchLogRepository;
import com.rednecksgaming.embed.service.DiscordDispatchService;
import com.rednecksgaming.embed.service.RedisRateLimiterService;
import com.rednecksgaming.embed.service.RedisScheduledDispatchService;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduledDispatchWorkerTest {

    @Mock
    private RedisScheduledDispatchService queueService;

    @Mock
    private DiscordDispatchService discordDispatchService;

    @Mock
    private RedisRateLimiterService rateLimiterService;

    @Mock
    private DispatchLogRepository dispatchLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private ScheduledDispatchWorker worker;

    @BeforeEach
    void setUp() {
        worker = new ScheduledDispatchWorker(
                queueService,
                discordDispatchService,
                rateLimiterService,
                dispatchLogRepository,
                userRepository,
                redisTemplate
        );
    }

    @Test
    @DisplayName("processScheduledQueue returns immediately when redisTemplate is null")
    void processScheduledQueue_nullRedisReturns() {
        ScheduledDispatchWorker nullRedisWorker = new ScheduledDispatchWorker(
                queueService, discordDispatchService, rateLimiterService,
                dispatchLogRepository, userRepository, null
        );

        nullRedisWorker.processScheduledQueue();

        verifyNoInteractions(queueService);
    }

    @Test
    @DisplayName("processScheduledQueue returns immediately when lock cannot be acquired")
    void processScheduledQueue_lockNotAcquiredReturns() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(false);

        worker.processScheduledQueue();

        verify(queueService, never()).claimDueTasks(anyLong(), anyLong(), anyInt());
    }

    @Test
    @DisplayName("processScheduledQueue handles Redis connection exception during lock acquisition")
    void processScheduledQueue_redisExceptionHandled() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class)))
                .thenThrow(new RuntimeException("Redis connection timed out"));

        // First call warns
        worker.processScheduledQueue();
        // Second call doesn't warn again (redisWarned = true)
        worker.processScheduledQueue();

        verify(queueService, never()).claimDueTasks(anyLong(), anyLong(), anyInt());
    }

    @Test
    @DisplayName("Worker acquires lock, claims tasks, and executes dispatch successfully")
    void processScheduledQueue_successfulDispatch() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);
        when(valueOperations.get("dispatch:poller:lock")).thenAnswer(inv -> "test-lock");

        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of("dsp_123"));

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_123")
                .userId("1")
                .serverId("guild_1")
                .channelId("chan_1")
                .dispatchType(DispatchType.SCHEDULED)
                .scheduledFor(Instant.now())
                .payload(Map.of("flags", 32768))
                .build();

        when(queueService.getTask("dsp_123")).thenReturn(task);

        User activeUser = User.builder().id(1L).email("operator@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));

        when(discordDispatchService.dispatchToChannel(eq("chan_1"), anyMap(), isNull()))
                .thenReturn(objectMapper.readTree("{\"id\":\"99887766\"}"));

        DispatchLog dispatchLog = DispatchLog.builder().dispatchId("dsp_123").status(DispatchStatus.QUEUED).build();
        when(dispatchLogRepository.findByDispatchId("dsp_123")).thenReturn(Optional.of(dispatchLog));

        worker.processScheduledQueue();

        verify(discordDispatchService).dispatchToChannel(eq("chan_1"), anyMap(), isNull());
        verify(queueService).completeTask("dsp_123");
        verify(dispatchLogRepository).save(argThat(log -> log.getStatus() == DispatchStatus.SUCCESS && "99887766".equals(log.getDiscordMessageId())));
    }

    @Test
    @DisplayName("Null task in queue completes task without dispatching")
    void processScheduledQueue_nullTaskCompletes() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);

        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of("dsp_null_task"));
        when(queueService.getTask("dsp_null_task")).thenReturn(null);

        worker.processScheduledQueue();

        verify(queueService).completeTask("dsp_null_task");
        verifyNoInteractions(discordDispatchService);
    }

    @Test
    @DisplayName("Operator permission decay: Inactive operator causes task cancellation")
    void processScheduledQueue_inactiveOperatorCancelsTask() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);

        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of("dsp_inactive"));

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_inactive")
                .userId("2")
                .serverId("guild_1")
                .channelId("chan_1")
                .build();

        when(queueService.getTask("dsp_inactive")).thenReturn(task);

        User inactiveUser = User.builder().id(2L).email("revoked@rng.com").status("INACTIVE").build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(inactiveUser));

        DispatchLog dispatchLog = DispatchLog.builder().dispatchId("dsp_inactive").status(DispatchStatus.QUEUED).build();
        when(dispatchLogRepository.findByDispatchId("dsp_inactive")).thenReturn(Optional.of(dispatchLog));

        worker.processScheduledQueue();

        verify(discordDispatchService, never()).dispatchToChannel(any(), any(), any());
        verify(queueService).completeTask("dsp_inactive");
        verify(dispatchLogRepository).save(argThat(log -> log.getStatus() == DispatchStatus.CANCELLED));
    }

    @Test
    @DisplayName("Operator permission decay: Non-numeric userId causes task cancellation")
    void processScheduledQueue_invalidUserIdCancelsTask() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);

        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of("dsp_bad_user"));

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_bad_user")
                .userId("not-a-number")
                .serverId("guild_1")
                .channelId("chan_1")
                .build();

        when(queueService.getTask("dsp_bad_user")).thenReturn(task);

        DispatchLog dispatchLog = DispatchLog.builder().dispatchId("dsp_bad_user").status(DispatchStatus.QUEUED).build();
        when(dispatchLogRepository.findByDispatchId("dsp_bad_user")).thenReturn(Optional.of(dispatchLog));

        worker.processScheduledQueue();

        verify(queueService).completeTask("dsp_bad_user");
        verify(dispatchLogRepository).save(argThat(log -> log.getStatus() == DispatchStatus.CANCELLED));
    }

    @Test
    @DisplayName("Rate limit throttling triggers task retry and updates status to RETRYING")
    void processScheduledQueue_rateLimitThrottledRetries() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);

        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of("dsp_rl"));

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_rl")
                .userId("1")
                .serverId("guild_1")
                .channelId("chan_1")
                .attemptCount(0)
                .build();
        when(queueService.getTask("dsp_rl")).thenReturn(task);

        User activeUser = User.builder().id(1L).email("operator@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));

        doThrow(new BadRequestException("Channel rate limit exceeded")).when(rateLimiterService)
                .checkRateLimits("guild_1", "chan_1", "1");

        DispatchLog dispatchLog = DispatchLog.builder().dispatchId("dsp_rl").status(DispatchStatus.QUEUED).build();
        when(dispatchLogRepository.findByDispatchId("dsp_rl")).thenReturn(Optional.of(dispatchLog));

        worker.processScheduledQueue();

        verify(queueService).retryTask(eq(task), eq(3), contains("Channel rate limit exceeded"));
        verify(dispatchLogRepository).save(argThat(log -> log.getStatus() == DispatchStatus.RETRYING));
    }

    @Test
    @DisplayName("Discord API dispatch failure with attemptCount < 3 sets RETRYING and retries task")
    void processScheduledQueue_dispatchFailureRetries() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);

        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of("dsp_fail_1"));

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_fail_1")
                .userId("1")
                .serverId("guild_1")
                .channelId("chan_1")
                .attemptCount(1) // nextAttempt will be 2 <= 3
                .build();
        when(queueService.getTask("dsp_fail_1")).thenReturn(task);

        User activeUser = User.builder().id(1L).email("operator@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));

        when(discordDispatchService.dispatchToChannel(eq("chan_1"), any(), isNull()))
                .thenThrow(new RuntimeException("Discord 500 Internal Error"));

        DispatchLog dispatchLog = DispatchLog.builder().dispatchId("dsp_fail_1").status(DispatchStatus.QUEUED).build();
        when(dispatchLogRepository.findByDispatchId("dsp_fail_1")).thenReturn(Optional.of(dispatchLog));

        worker.processScheduledQueue();

        verify(queueService).retryTask(eq(task), eq(3), eq("Discord 500 Internal Error"));
        verify(dispatchLogRepository).save(argThat(log -> log.getStatus() == DispatchStatus.RETRYING));
    }

    @Test
    @DisplayName("Discord API dispatch failure with attemptCount >= 3 sets FAILED status")
    void processScheduledQueue_dispatchFailureExceedsRetriesSetsFailed() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);

        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of("dsp_fail_max"));

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_fail_max")
                .userId("1")
                .serverId("guild_1")
                .channelId("chan_1")
                .attemptCount(3) // nextAttempt will be 4 > 3 -> FAILED
                .build();
        when(queueService.getTask("dsp_fail_max")).thenReturn(task);

        User activeUser = User.builder().id(1L).email("operator@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));

        when(discordDispatchService.dispatchToChannel(eq("chan_1"), any(), isNull()))
                .thenThrow(new RuntimeException("Discord 403 Forbidden"));

        DispatchLog dispatchLog = DispatchLog.builder().dispatchId("dsp_fail_max").status(DispatchStatus.QUEUED).build();
        when(dispatchLogRepository.findByDispatchId("dsp_fail_max")).thenReturn(Optional.of(dispatchLog));

        worker.processScheduledQueue();

        verify(queueService).retryTask(eq(task), eq(3), eq("Discord 403 Forbidden"));
        verify(dispatchLogRepository).save(argThat(log -> log.getStatus() == DispatchStatus.FAILED));
    }

    @Test
    @DisplayName("Periodic crash recovery sweeper is triggered when 30s have elapsed")
    void processScheduledQueue_triggersCrashRecoverySweeper() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);

        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of());

        worker.processScheduledQueue();

        verify(queueService).sweepStaleProcessingTasks(anyLong());
    }

    @Test
    @DisplayName("Redis recovery logs info when reconnecting after warning, and safe lock release deletes key")
    void processScheduledQueue_reconnectsAndSafeLockReleaseDeletes() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // 1. First trigger redis warning
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class)))
                .thenThrow(new RuntimeException("Redis down"))
                .thenAnswer(inv -> {
                    String lockId = inv.getArgument(1);
                    when(valueOperations.get("dispatch:poller:lock")).thenReturn(lockId);
                    return true;
                });

        worker.processScheduledQueue(); // sets redisWarned = true

        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of());

        // 2. Second invocation recovers, redisWarned reset to false, and lock deleted in finally
        worker.processScheduledQueue();

        verify(redisTemplate).delete("dispatch:poller:lock");
    }

    @Test
    @DisplayName("Unhandled exception during claimDueTasks is caught and lock release handles exception")
    void processScheduledQueue_claimDueTasksExceptionCaughtAndLockExceptionIgnored() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class)))
                .thenAnswer(inv -> {
                    String lockId = inv.getArgument(1);
                    when(valueOperations.get("dispatch:poller:lock")).thenReturn(lockId);
                    return true;
                });

        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenThrow(new RuntimeException("Database error in claim"));
        doThrow(new RuntimeException("Redis delete error")).when(redisTemplate).delete("dispatch:poller:lock");

        // Should not throw
        worker.processScheduledQueue();
    }

    @Test
    @DisplayName("Dispatch success handles null JsonNode and missing log record gracefully")
    void processScheduledQueue_dispatchResultWithoutIdOrLogMissing() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);
        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of("dsp_noid"));

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_noid")
                .userId("1")
                .serverId("guild_1")
                .channelId("chan_1")
                .build();
        when(queueService.getTask("dsp_noid")).thenReturn(task);

        User activeUser = User.builder().id(1L).email("operator@rng.com").status("ACTIVE").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(activeUser));

        // Result without id
        when(discordDispatchService.dispatchToChannel(eq("chan_1"), any(), isNull()))
                .thenReturn(objectMapper.readTree("{\"status\":\"ok\"}"));
        // Dispatch log missing
        when(dispatchLogRepository.findByDispatchId("dsp_noid")).thenReturn(Optional.empty());

        worker.processScheduledQueue();

        verify(queueService).completeTask("dsp_noid");
    }

    @Test
    @DisplayName("Operator missing in userRepository cancels task")
    void processScheduledQueue_operatorMissingInRepoCancels() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);
        when(queueService.claimDueTasks(anyLong(), anyLong(), anyInt())).thenReturn(List.of("dsp_notfound_user"));

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_notfound_user")
                .userId("999")
                .serverId("guild_1")
                .channelId("chan_1")
                .build();
        when(queueService.getTask("dsp_notfound_user")).thenReturn(task);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        when(dispatchLogRepository.findByDispatchId("dsp_notfound_user")).thenReturn(Optional.empty());

        worker.processScheduledQueue();

        verify(queueService).completeTask("dsp_notfound_user");
    }
}
