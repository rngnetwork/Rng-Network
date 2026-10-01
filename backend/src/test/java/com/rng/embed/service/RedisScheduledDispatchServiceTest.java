package com.rng.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rng.common.exception.BadRequestException;
import com.rng.embed.domain.DispatchType;
import com.rng.embed.dto.ScheduledTaskDto;
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

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

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
    @DisplayName("Enqueuing task scheduled in the past throws BadRequestException")
    void scheduleTask_pastThrows() {
        ScheduledTaskDto task = ScheduledTaskDto.builder()
                .dispatchId("dsp_1")
                .scheduledFor(Instant.now().minusSeconds(60))
                .build();

        assertThatThrownBy(() -> service.scheduleTask(task))
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
    @DisplayName("Cancelling task removes from ZSETs and deletes payload")
    void cancelTask_success() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);

        boolean result = service.cancelTask("dsp_to_cancel");

        assertThat(result).isTrue();
        verify(zSetOperations).remove("dispatch:scheduled:zset", "dsp_to_cancel");
        verify(zSetOperations).remove("dispatch:processing:zset", "dsp_to_cancel");
        verify(redisTemplate).delete("dispatch:task:dsp_to_cancel");
    }

    @Test
    @DisplayName("Task exceeding max retries is pushed to DLQ")
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
    }
}
