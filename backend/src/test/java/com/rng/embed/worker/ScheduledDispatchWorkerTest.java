package com.rng.embed.worker;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.embed.domain.DispatchLog;
import com.rng.embed.domain.DispatchStatus;
import com.rng.embed.domain.DispatchType;
import com.rng.embed.dto.ScheduledTaskDto;
import com.rng.embed.repository.DispatchLogRepository;
import com.rng.embed.service.DiscordDispatchService;
import com.rng.embed.service.RedisRateLimiterService;
import com.rng.embed.service.RedisScheduledDispatchService;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
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
    @DisplayName("Worker acquires lock, claims tasks, and executes dispatch successfully")
    void processScheduledQueue_successfulDispatch() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);
        when(valueOperations.get("dispatch:poller:lock")).thenReturn("test-lock");

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
    @DisplayName("Operator permission decay: Inactive operator causes task cancellation")
    void processScheduledQueue_inactiveOperatorCancelsTask() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("dispatch:poller:lock"), anyString(), any(Duration.class))).thenReturn(true);
        when(valueOperations.get("dispatch:poller:lock")).thenReturn("test-lock");

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
}
