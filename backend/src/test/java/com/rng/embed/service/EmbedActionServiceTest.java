package com.rng.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.InteractionLog;
import com.rng.embed.domain.RoleSubtype;
import com.rng.embed.dto.CreateActionRequest;
import com.rng.embed.dto.EmbedActionDto;
import com.rng.embed.dto.InteractionLogResponse;
import com.rng.embed.dto.UpdateActionRequest;
import com.rng.embed.repository.EmbedActionRepository;
import com.rng.embed.repository.InteractionLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmbedActionServiceTest {

    @Mock
    private EmbedActionRepository embedActionRepository;

    @Mock
    private InteractionLogRepository interactionLogRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private ObjectMapper objectMapper;
    private EmbedActionServiceImpl service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new EmbedActionServiceImpl(embedActionRepository, interactionLogRepository, redisTemplate, objectMapper);
    }

    @Test
    @DisplayName("createAction generates rng_act_ prefix, saves to Mongo, and caches in Redis")
    void createAction_success() {
        CreateActionRequest request = new CreateActionRequest(
                "guild_100",
                false,
                "Self-Role VIP",
                "Assigns VIP role",
                ActionType.ROLE,
                RoleSubtype.TOGGLE,
                "role_777",
                "VIP",
                null,
                null,
                "VIP role updated!",
                true,
                null,
                false,
                false,
                null
        );

        when(embedActionRepository.existsByActionId(anyString())).thenReturn(false);
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> {
            EmbedAction action = inv.getArgument(0);
            action.setId("mongo_id_1");
            return action;
        });

        EmbedActionDto result = service.createAction(request);

        assertThat(result).isNotNull();
        assertThat(result.actionId())
                .hasSize(24)
                .matches("^rng_act_[0-9a-f]{16}$");
        assertThat(result.name()).isEqualTo("Self-Role VIP");
        assertThat(result.actionType()).isEqualTo(ActionType.ROLE);
        assertThat(result.roleSubtype()).isEqualTo(RoleSubtype.TOGGLE);

        verify(embedActionRepository).save(any(EmbedAction.class));
        verify(valueOperations).set(eq("action:template:" + result.actionId()), anyString(), any());
    }

    @Test
    @DisplayName("updateAction updates existing document, evicts old cache, and updates Redis")
    void updateAction_success() {
        String actionId = "rng_act_1234567890abcdef";
        EmbedAction existing = EmbedAction.builder()
                .id("mongo_1")
                .actionId(actionId)
                .name("Old Name")
                .actionType(ActionType.REPLY)
                .build();

        UpdateActionRequest request = new UpdateActionRequest(
                "guild_100",
                false,
                "New Name",
                "Updated description",
                ActionType.REPLY,
                null,
                null,
                null,
                null,
                null,
                "New reply content",
                true,
                null,
                false,
                false,
                null
        );

        when(embedActionRepository.findByActionId(actionId)).thenReturn(Optional.of(existing));
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        EmbedActionDto result = service.updateAction(actionId, request);

        assertThat(result.name()).isEqualTo("New Name");
        verify(redisTemplate).delete("action:template:" + actionId);
        verify(valueOperations).set(eq("action:template:" + actionId), anyString(), any());
    }

    @Test
    @DisplayName("updateAction throws ResourceNotFoundException on nonexistent actionId")
    void updateAction_notFound() {
        when(embedActionRepository.findByActionId("nonexistent")).thenReturn(Optional.empty());

        UpdateActionRequest request = new UpdateActionRequest(
                "guild_100", false, "Name", null, ActionType.REPLY,
                null, null, null, null, null, null, true, null, false, false, null
        );

        assertThatThrownBy(() -> service.updateAction("nonexistent", request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleteAction deletes from Mongo and evicts Redis key")
    void deleteAction_success() {
        String actionId = "rng_act_delete_me";
        when(embedActionRepository.existsByActionId(actionId)).thenReturn(true);

        service.deleteAction(actionId);

        verify(embedActionRepository).deleteByActionId(actionId);
        verify(redisTemplate).delete("action:template:" + actionId);
    }

    @Test
    @DisplayName("resolveAction reads from Redis on cache hit without querying Mongo")
    void resolveAction_cacheHit() throws Exception {
        String actionId = "rng_act_cached_123";
        EmbedAction cached = EmbedAction.builder()
                .actionId(actionId)
                .name("Cached Action")
                .actionType(ActionType.ROLE)
                .build();
        String json = objectMapper.writeValueAsString(cached);

        when(valueOperations.get("action:template:" + actionId)).thenReturn(json);

        Optional<EmbedAction> result = service.resolveAction(actionId);

        assertThat(result).isPresent();
        assertThat(result.get().getActionId()).isEqualTo(actionId);
        assertThat(result.get().getName()).isEqualTo("Cached Action");
        verify(embedActionRepository, never()).findByActionId(anyString());
    }

    @Test
    @DisplayName("resolveAction reads from Mongo on cache miss and populates Redis")
    void resolveAction_cacheMiss() {
        String actionId = "rng_act_uncached_123";
        EmbedAction mongoAction = EmbedAction.builder()
                .actionId(actionId)
                .name("DB Action")
                .actionType(ActionType.TICKET)
                .build();

        when(valueOperations.get("action:template:" + actionId)).thenReturn(null);
        when(embedActionRepository.findByActionId(actionId)).thenReturn(Optional.of(mongoAction));

        Optional<EmbedAction> result = service.resolveAction(actionId);

        assertThat(result).isPresent();
        assertThat(result.get().getActionType()).isEqualTo(ActionType.TICKET);
        verify(valueOperations).set(eq("action:template:" + actionId), anyString(), any());
    }

    @Test
    @DisplayName("getActionsForServer returns mapped DTOs for serverId")
    void getActionsForServer_success() {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_test")
                .name("Server Action")
                .actionType(ActionType.ROLE)
                .build();

        when(embedActionRepository.findByServerIdOrIsGlobalTrue("guild_1")).thenReturn(List.of(action));

        List<EmbedActionDto> list = service.getActionsForServer("guild_1");

        assertThat(list).hasSize(1);
        assertThat(list.get(0).name()).isEqualTo("Server Action");
    }

    @Test
    @DisplayName("getInteractionLogs returns paginated responses")
    void getInteractionLogs_success() {
        InteractionLog log = InteractionLog.builder()
                .id("log_1")
                .guildId("guild_1")
                .userId("user_1")
                .actionId("rng_act_test")
                .actionType(ActionType.ROLE)
                .status("SUCCESS")
                .createdAt(Instant.now())
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        when(interactionLogRepository.findByGuildIdOrderByCreatedAtDesc("guild_1", pageable))
                .thenReturn(new PageImpl<>(List.of(log), pageable, 1));

        Page<InteractionLogResponse> page = service.getInteractionLogs("guild_1", pageable);

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).guildId()).isEqualTo("guild_1");
    }
}
