package com.rednecksgaming.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rednecksgaming.common.exception.BadRequestException;
import com.rednecksgaming.common.exception.InternalServerException;
import com.rednecksgaming.embed.domain.DispatchType;
import com.rednecksgaming.embed.dto.ScheduledTaskDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.data.redis.core.script.RedisScript;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisScheduledDispatchServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private ZSetOperations<String, String> zSetOperations;

    @Mock
    private ListOperations<String, String> listOperations;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private RedisScheduledDispatchService service;

    @BeforeEach
    void setUp() {
        service = new RedisScheduledDispatchService(redisTemplate, objectMapper);
    }

    @Test
    @DisplayName("Enqueuing task with null redisTemplate throws InternalServerException")
    void scheduleTask_nullRedisThrows() {
        RedisScheduledDispatchService noRedisService = new RedisScheduledDispatchService(null, objectMapper);
        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_1")
                .scheduledFor(Instant.now().plusSeconds(60))
                .build();

        assertThatThrownBy(() -> noRedisService.scheduleTask(task))
                .isInstanceOf(InternalServerException.class)
                .hasMessageContaining("Redis service is required");
    }

    @Test
    @DisplayName("Enqueuing task scheduled in the past or with null scheduledFor throws BadRequestException")
    void scheduleTask_pastOrNullScheduledForThrows() {
        ScheduledTaskDto taskPast = ScheduledTaskDto.builder()
                .dispatchId("dsp_1")
                .scheduledFor(Instant.now().minusSeconds(60))
                .build();

        assertThatThrownBy(() -> service.scheduleTask(taskPast))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("must be in the future");

        ScheduledTaskDto taskNull = ScheduledTaskDto.builder()
                .dispatchId("dsp_2")
                .scheduledFor(null)
                .build();

        assertThatThrownBy(() -> service.scheduleTask(taskNull))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("must be in the future");
    }

    @Test
    @DisplayName("Valid task is persisted with 7-day TTL and added to scheduled ZSET")
    void scheduleTask_success() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);

        Instant target = Instant.now().plus(Duration.ofMinutes(10));
        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_valid")
                .userId("100")
                .serverId("srv_1")
                .channelId("chn_1")
                .dispatchType(DispatchType.SCHEDULED)
                .scheduledFor(target)
                .payload(Map.of("flags", 32768))
                .build();

        service.scheduleTask(task);

        verify(valueOperations).set(eq("dispatch:task:dsp_valid"), anyString(), eq(Duration.ofDays(7)));
        verify(zSetOperations).add(eq("dispatch:scheduled:zset"), eq("dsp_valid"), eq((double) target.toEpochMilli()));
    }

    @Test
    @DisplayName("claimDueTasks executes two-phase Lua claim script or handles null/empty/exceptions")
    void claimDueTasks_variations() {
        // Null redisTemplate returns empty list
        RedisScheduledDispatchService noRedisService = new RedisScheduledDispatchService(null, objectMapper);
        assertThat(noRedisService.claimDueTasks(1000L, 5000L, 10)).isEmpty();

        // Successful execution returning task list
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString(), anyString(), anyString()))
                .thenReturn(List.of("task_1", "task_2"));

        List<String> claimed = service.claimDueTasks(1000L, 5000L, 10);
        assertThat(claimed).containsExactly("task_1", "task_2");

        // Script returns null
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString(), anyString(), anyString()))
                .thenReturn(null);
        assertThat(service.claimDueTasks(1000L, 5000L, 10)).isEmpty();

        // Exception caught and returns empty list
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("Redis error"));
        assertThat(service.claimDueTasks(1000L, 5000L, 10)).isEmpty();
    }

    @Test
    @DisplayName("getTask retrieves and deserializes ScheduledTaskDto from Redis")
    void getTask_variations() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // Valid task
        ScheduledTaskDto expectedTask = ScheduledTaskDto.builder().dispatchId("dsp_get_1").userId("1").build();
        String json = objectMapper.writeValueAsString(expectedTask);
        when(valueOperations.get("dispatch:task:dsp_get_1")).thenReturn(json);

        ScheduledTaskDto result = service.getTask("dsp_get_1");
        assertThat(result).isNotNull();
        assertThat(result.dispatchId()).isEqualTo("dsp_get_1");

        // Blank or null
        when(valueOperations.get("dispatch:task:empty")).thenReturn("");
        assertThat(service.getTask("empty")).isNull();

        when(valueOperations.get("dispatch:task:null_val")).thenReturn(null);
        assertThat(service.getTask("null_val")).isNull();

        // Malformed json
        when(valueOperations.get("dispatch:task:corrupt")).thenReturn("{invalid-json");
        assertThat(service.getTask("corrupt")).isNull();

        // Null redis
        RedisScheduledDispatchService noRedis = new RedisScheduledDispatchService(null, objectMapper);
        assertThat(noRedis.getTask("any")).isNull();
    }

    @Test
    @DisplayName("completeTask removes task from processing set and deletes payload")
    void completeTask_successAndNullRedis() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);

        service.completeTask("dsp_done");

        verify(zSetOperations).remove("dispatch:processing:zset", "dsp_done");
        verify(redisTemplate).delete("dispatch:task:dsp_done");

        // Null redis no-op
        RedisScheduledDispatchService noRedis = new RedisScheduledDispatchService(null, objectMapper);
        noRedis.completeTask("dsp_done");
    }

    @Test
    @DisplayName("retryTask re-enqueues failed task with exponential backoff when attemptCount <= maxRetries")
    void retryTask_backoffReenqueue() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_retry_1")
                .attemptCount(0)
                .build();

        service.retryTask(task, 3, "Discord 503");

        verify(zSetOperations).remove("dispatch:processing:zset", "dsp_retry_1");
        verify(zSetOperations).add(eq("dispatch:scheduled:zset"), eq("dsp_retry_1"), anyDouble());
        verify(valueOperations).set(eq("dispatch:task:dsp_retry_1"), anyString(), eq(Duration.ofDays(7)));
    }

    @Test
    @DisplayName("retryTask routes task to DLQ when attemptCount exceeds maxRetries")
    void retryTask_exceedsMaxRetriesPushesToDLQ() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        when(redisTemplate.opsForList()).thenReturn(listOperations);

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_max_retries")
                .attemptCount(3)
                .build();

        service.retryTask(task, 3, "Discord API 500 error");

        verify(zSetOperations).remove("dispatch:processing:zset", "dsp_max_retries");
        verify(listOperations).rightPush("dispatch:dlq:list", "dsp_max_retries");

        // Null redis no-op
        RedisScheduledDispatchService noRedis = new RedisScheduledDispatchService(null, objectMapper);
        noRedis.retryTask(task, 3, "error");
    }

    @Test
    @DisplayName("Cancelling task removes from ZSETs and deletes payload")
    void cancelTask_successAndFailures() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);

        boolean result = service.cancelTask("dsp_to_cancel");
        assertThat(result).isTrue();
        verify(zSetOperations).remove("dispatch:scheduled:zset", "dsp_to_cancel");
        verify(zSetOperations).remove("dispatch:processing:zset", "dsp_to_cancel");
        verify(redisTemplate).delete("dispatch:task:dsp_to_cancel");

        // Null redis returns false
        RedisScheduledDispatchService noRedis = new RedisScheduledDispatchService(null, objectMapper);
        assertThat(noRedis.cancelTask("any")).isFalse();

        // Exception returns false
        doThrow(new RuntimeException("Redis timeout")).when(redisTemplate).delete(anyString());
        assertThat(service.cancelTask("dsp_error")).isFalse();
    }

    @Test
    @DisplayName("sweepStaleProcessingTasks recovers abandoned in-flight tasks")
    void sweepStaleProcessingTasks_success() throws Exception {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        long now = System.currentTimeMillis();
        when(zSetOperations.rangeByScore("dispatch:processing:zset", 0, now))
                .thenReturn(Set.of("stale_task_1", "stale_task_2"));

        ScheduledTaskDto task1 = ScheduledTaskDto.builder().dispatchId("stale_task_1").attemptCount(1).build();
        when(valueOperations.get("dispatch:task:stale_task_1")).thenReturn(objectMapper.writeValueAsString(task1));
        when(valueOperations.get("dispatch:task:stale_task_2")).thenReturn(null);

        int count = service.sweepStaleProcessingTasks(now);

        assertThat(count).isEqualTo(2);
        verify(zSetOperations).remove("dispatch:processing:zset", "stale_task_2");

        // Null redis returns 0
        RedisScheduledDispatchService noRedis = new RedisScheduledDispatchService(null, objectMapper);
        assertThat(noRedis.sweepStaleProcessingTasks(now)).isEqualTo(0);
    }

    @Test
    @DisplayName("RedisScheduledDispatchService exception handling and null element branches")
    void redisScheduledDispatchService_exceptionAndNullBranches() {
        // 1. scheduleTask throws InternalServerException when redis ops fail
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        doThrow(new RuntimeException("Redis connection lost")).when(valueOperations).set(anyString(), anyString(), any(Duration.class));

        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_err")
                .scheduledFor(Instant.now().plusSeconds(60))
                .build();

        assertThatThrownBy(() -> service.scheduleTask(task))
                .isInstanceOf(InternalServerException.class)
                .hasMessageContaining("Failed to enqueue scheduled task in Redis");

        // 2. claimDueTasks with null element in result and with exception
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(), any(), any()))
                .thenReturn(java.util.Arrays.asList("task_1", null, "task_2"));

        List<String> claimed = service.claimDueTasks(System.currentTimeMillis(), 5000, 10);
        assertThat(claimed).containsExactly("task_1", "task_2");

        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(), any(), any()))
                .thenThrow(new RuntimeException("Lua script error"));
        List<String> failedClaim = service.claimDueTasks(System.currentTimeMillis(), 5000, 10);
        assertThat(failedClaim).isEmpty();

        // 3. getTask with blank json and with deserialization error
        when(valueOperations.get("dispatch:task:blank_task")).thenReturn("   ");
        assertThat(service.getTask("blank_task")).isNull();

        when(valueOperations.get("dispatch:task:corrupt_task")).thenReturn("not-json");
        assertThat(service.getTask("corrupt_task")).isNull();

        // 4. completeTask with redis exception
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        doThrow(new RuntimeException("ZSet remove failure")).when(zSetOperations).remove(eq(RedisScheduledDispatchService.PROCESSING_ZSET), eq("dsp_complete_err"));
        service.completeTask("dsp_complete_err"); // Should not throw

        // 5. retryTask with redis exceptions
        when(redisTemplate.opsForList()).thenReturn(listOperations);
        doThrow(new RuntimeException("DLQ push error")).when(listOperations).rightPush(anyString(), anyString());
        ScheduledTaskDto maxRetried = ScheduledTaskDto.builder().dispatchId("dsp_dlq_fail").attemptCount(5).build();
        service.retryTask(maxRetried, 3, "Err"); // Should not throw

        // 6. sweepStaleProcessingTasks with null result and exception
        when(zSetOperations.rangeByScore(anyString(), anyDouble(), anyDouble())).thenReturn(null);
        assertThat(service.sweepStaleProcessingTasks(System.currentTimeMillis())).isEqualTo(0);

        when(zSetOperations.rangeByScore(anyString(), anyDouble(), anyDouble())).thenThrow(new RuntimeException("Range score failure"));
        assertThat(service.sweepStaleProcessingTasks(System.currentTimeMillis())).isEqualTo(0);
    }
}
