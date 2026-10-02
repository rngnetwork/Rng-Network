package com.rng.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.embed.domain.ActionPayload;
import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.dto.CreateActionRequest;
import com.rng.embed.dto.EmbedActionDto;
import com.rng.embed.dto.UpdateActionRequest;
import com.rng.embed.repository.EmbedActionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmbedActionServiceTest {

    @Mock
    private EmbedActionRepository repository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private ObjectMapper objectMapper;
    private EmbedActionService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new EmbedActionService(repository, redisTemplate, objectMapper);
    }

    @Test
    @DisplayName("createAction generates rng_act_ id, saves to Mongo and caches in Redis")
    void testCreateAction() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        ActionPayload payload = ActionPayload.builder()
                .roleSubtype("TOGGLE")
                .roleId("123456789")
                .roleName("Member")
                .build();

        CreateActionRequest request = CreateActionRequest.builder()
                .name("Toggle Member")
                .actionType(ActionType.ROLE)
                .payload(payload)
                .build();

        when(repository.save(any(EmbedAction.class))).thenAnswer(invocation -> {
            EmbedAction action = invocation.getArgument(0);
            action.setId("mongo_id_1");
            return action;
        });

        EmbedActionDto response = service.createAction("guild_123", request, "admin@rng.com");

        assertThat(response).isNotNull();
        assertThat(response.actionId()).startsWith("rng_act_");
        assertThat(response.actionId()).hasSize(24);
        assertThat(response.serverId()).isEqualTo("guild_123");
        assertThat(response.name()).isEqualTo("Toggle Member");
        assertThat(response.actionType()).isEqualTo(ActionType.ROLE);

        verify(repository).save(any(EmbedAction.class));
        verify(valueOperations).set(eq("action:guild_123:" + response.actionId()), anyString(), any(Duration.class));
    }

    @Test
    @DisplayName("getAction returns cached value from Redis when available")
    void testGetAction_fromRedisCache() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_1234567890abcdef")
                .serverId("guild_123")
                .name("Cached Action")
                .actionType(ActionType.REPLY)
                .payload(ActionPayload.builder().ephemeral(true).replyContent("Hello").build())
                .build();

        String json = objectMapper.writeValueAsString(action);
        when(valueOperations.get("action:guild_123:rng_act_1234567890abcdef")).thenReturn(json);

        EmbedActionDto result = service.getAction("guild_123", "rng_act_1234567890abcdef");

        assertThat(result).isNotNull();
        assertThat(result.actionId()).isEqualTo("rng_act_1234567890abcdef");
        assertThat(result.name()).isEqualTo("Cached Action");
        verify(repository, never()).findByServerIdAndActionId(anyString(), anyString());
    }

    @Test
    @DisplayName("getAction falls back to Mongo and populates Redis on cache miss")
    void testGetAction_fromMongoFallback() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("action:guild_123:rng_act_1234567890abcdef")).thenReturn(null);

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_1234567890abcdef")
                .serverId("guild_123")
                .name("Mongo Action")
                .actionType(ActionType.TICKET)
                .payload(ActionPayload.builder().channelPrefix("ticket-").build())
                .build();

        when(repository.findByServerIdAndActionId("guild_123", "rng_act_1234567890abcdef"))
                .thenReturn(Optional.of(action));

        EmbedActionDto result = service.getAction("guild_123", "rng_act_1234567890abcdef");

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Mongo Action");
        verify(valueOperations).set(eq("action:guild_123:rng_act_1234567890abcdef"), anyString(), any(Duration.class));
    }

    @Test
    @DisplayName("deleteAction removes from Mongo and evicts from Redis")
    void testDeleteAction() {
        when(repository.findByServerIdAndActionId("guild_123", "rng_act_del"))
                .thenReturn(Optional.of(EmbedAction.builder().actionId("rng_act_del").serverId("guild_123").build()));

        service.deleteAction("guild_123", "rng_act_del");

        verify(repository).deleteByServerIdAndActionId("guild_123", "rng_act_del");
        verify(redisTemplate).delete("action:guild_123:rng_act_del");
    }
}
