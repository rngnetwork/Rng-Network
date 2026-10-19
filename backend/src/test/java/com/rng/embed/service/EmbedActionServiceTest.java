package com.rng.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rng.common.exception.ResourceNotFoundException;
import com.rng.embed.domain.ActionType;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.EmbedTemplate;
import com.rng.embed.domain.InteractionLog;
import com.rng.embed.domain.RoleSubtype;
import com.rng.embed.dto.CreateActionRequest;
import com.rng.embed.dto.EmbedActionDto;
import com.rng.embed.dto.InteractionLogResponse;
import com.rng.embed.dto.UpdateActionRequest;
import com.rng.embed.repository.EmbedActionRepository;
import com.rng.embed.repository.EmbedTemplateRepository;
import com.rng.embed.repository.InteractionLogRepository;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
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
import org.springframework.security.access.AccessDeniedException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmbedActionServiceTest {

    @Mock
    private EmbedActionRepository embedActionRepository;

    @Mock
    private InteractionLogRepository interactionLogRepository;

    @Mock
    private EmbedTemplateRepository embedTemplateRepository;

    @Mock
    private UserRepository userRepository;

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
        service = new EmbedActionServiceImpl(
                embedActionRepository,
                interactionLogRepository,
                embedTemplateRepository,
                userRepository,
                redisTemplate,
                objectMapper
        );
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
        verify(valueOperations).set(eq("action:template:" + result.actionId()), anyString(), any(Duration.class));
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
        verify(valueOperations).set(eq("action:template:" + actionId), anyString(), any(Duration.class));
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
        verify(valueOperations).set(eq("action:template:" + actionId), anyString(), any(Duration.class));
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
    @DisplayName("getAllActions returns all persisted action templates")
    void getAllActions_returnsAllPersisted() {
        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_all_1")
                .name("Any Action")
                .isGlobal(false)
                .build();
        when(embedActionRepository.findAll()).thenReturn(List.of(action));

        List<EmbedActionDto> list = service.getAllActions();

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getActionId()).isEqualTo("rng_act_all_1");
        verify(embedActionRepository).findAll();
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

    @Test
    @DisplayName("Should return paginated actions matching serverIds, legacy serverId, or isGlobal")
    void should_get_actions_for_server_paginated() {
        EmbedAction globalAction = EmbedAction.builder().actionId("rng_act_global").name("Global Action").isGlobal(true).build();
        EmbedAction guild1Action = EmbedAction.builder().actionId("rng_act_guild1").name("Guild 1 Action").serverIds(List.of("guild-1")).build();

        Pageable pageable = PageRequest.of(0, 50);
        when(embedActionRepository.findByServerIdOrGlobal("guild-1", pageable))
                .thenReturn(new PageImpl<>(List.of(globalAction, guild1Action), pageable, 2));

        Page<EmbedActionDto> result = service.getActionsForServer("guild-1", pageable);

        assertThat(result.getContent()).extracting(EmbedActionDto::getActionId)
                .contains("rng_act_global", "rng_act_guild1")
                .doesNotContain("rng_act_guild2");
    }

    @Test
    @DisplayName("Should reject global action creation when operator lacks High Command clearance")
    void should_reject_global_action_when_user_not_high_command() {
        User operator = User.builder()
                .email("regular_user@rng.com")
                .role("ROLE_USER")
                .roles("ROLE_USER")
                .build();
        when(userRepository.findByEmail("regular_user@rng.com")).thenReturn(Optional.of(operator));

        CreateActionRequest request = CreateActionRequest.builder()
                .name("Unauthorized Global Action")
                .actionType(ActionType.ROLE)
                .isGlobal(true)
                .build();

        assertThatThrownBy(() -> service.createAction(request, "regular_user@rng.com"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only High Command can create global action templates");
    }

    @Test
    @DisplayName("Should allow global action creation when operator holds High Command clearance")
    void should_allow_global_action_when_user_is_high_command() {
        User operator = User.builder()
                .email("highcommand@rng.com")
                .role("ROLE_HIGH_COMMAND")
                .roles("ROLE_HIGH_COMMAND")
                .build();
        when(userRepository.findByEmail("highcommand@rng.com")).thenReturn(Optional.of(operator));
        when(embedActionRepository.existsByActionId(anyString())).thenReturn(false);
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateActionRequest request = CreateActionRequest.builder()
                .name("Authorized Global Action")
                .actionType(ActionType.ROLE)
                .isGlobal(true)
                .build();

        EmbedActionDto result = service.createAction(request, "highcommand@rng.com");
        assertThat(result).isNotNull();
        assertThat(result.isGlobal()).isTrue();
    }

    @Test
    @DisplayName("Should reject cross-tenant private template reference in responseEmbedTemplateId")
    void should_reject_cross_tenant_template_reference() {
        EmbedTemplate foreignTemplate = EmbedTemplate.builder()
                .id("tpl-foreign")
                .serverId("guild-other")
                .isPublic(false)
                .build();
        when(embedTemplateRepository.findById("tpl-foreign")).thenReturn(Optional.of(foreignTemplate));

        CreateActionRequest request = CreateActionRequest.builder()
                .name("Cross-Tenant Reference")
                .actionType(ActionType.ROLE)
                .isGlobal(false)
                .serverIds(List.of("guild-mine"))
                .responseEmbedTemplateId("tpl-foreign")
                .build();

        assertThatThrownBy(() -> service.createAction(request, "operator@rng.com"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Referenced embed template is not accessible");
    }

    @Test
    @DisplayName("Should allow public template reference in responseEmbedTemplateId")
    void should_allow_public_template_reference() {
        EmbedTemplate publicTemplate = EmbedTemplate.builder()
                .id("tpl-public")
                .serverId("guild-other")
                .isPublic(true)
                .build();
        when(embedTemplateRepository.findById("tpl-public")).thenReturn(Optional.of(publicTemplate));
        when(embedActionRepository.existsByActionId(anyString())).thenReturn(false);
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateActionRequest request = CreateActionRequest.builder()
                .name("Public Reference Action")
                .actionType(ActionType.ROLE)
                .isGlobal(false)
                .serverIds(List.of("guild-mine"))
                .responseEmbedTemplateId("tpl-public")
                .build();

        EmbedActionDto result = service.createAction(request, "operator@rng.com");
        assertThat(result).isNotNull();
        assertThat(result.getResponseEmbedTemplateId()).isEqualTo("tpl-public");
    }

    @Test
    @DisplayName("Should reject global action creation when operatorEmail is null")
    void should_reject_global_action_when_operator_email_is_null() {
        CreateActionRequest request = CreateActionRequest.builder()
                .name("Global Action No Auth")
                .actionType(ActionType.ROLE)
                .isGlobal(true)
                .build();

        assertThatThrownBy(() -> service.createAction(request, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Operator clearance required to create global action templates");
    }

    @Test
    @DisplayName("Should reject modification of existing global action when user lacks High Command clearance")
    void should_reject_global_action_modification_when_not_high_command() {
        String actionId = "rng_act_existing_global";
        EmbedAction existing = EmbedAction.builder()
                .id("mongo_1")
                .actionId(actionId)
                .name("Global Action")
                .isGlobal(true)
                .actionType(ActionType.ROLE)
                .build();
        when(embedActionRepository.findByActionId(actionId)).thenReturn(Optional.of(existing));

        User operator = User.builder()
                .email("regular_user@rng.com")
                .role("ROLE_USER")
                .build();
        when(userRepository.findByEmail("regular_user@rng.com")).thenReturn(Optional.of(operator));

        UpdateActionRequest request = UpdateActionRequest.builder()
                .name("Attempted Demotion")
                .isGlobal(false)
                .build();

        assertThatThrownBy(() -> service.updateAction(actionId, request, "regular_user@rng.com"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only High Command can modify global action templates");
    }

    @Test
    @DisplayName("Should not overwrite existing serverIds and compoundOperations on partial update")
    void should_not_overwrite_fields_on_partial_update() {
        String actionId = "rng_act_partial_update";
        EmbedAction existing = EmbedAction.builder()
                .id("mongo_1")
                .actionId(actionId)
                .name("Old Name")
                .isGlobal(false)
                .serverIds(List.of("guild-1", "guild-2"))
                .actionType(ActionType.REPLY)
                .build();
        when(embedActionRepository.findByActionId(actionId)).thenReturn(Optional.of(existing));
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateActionRequest request = UpdateActionRequest.builder()
                .name("Updated Name Only")
                .build();

        EmbedActionDto result = service.updateAction(actionId, request, "operator@rng.com");

        assertThat(result.getName()).isEqualTo("Updated Name Only");
        assertThat(result.getServerIds()).containsExactly("guild-1", "guild-2");
    }

    @Test
    @DisplayName("Should safely handle null serverIds on legacy existing action during update")
    void should_safely_handle_null_server_ids_on_legacy_action() {
        String actionId = "rng_act_legacy_action";
        EmbedAction existing = EmbedAction.builder()
                .id("mongo_legacy")
                .actionId(actionId)
                .name("Legacy Action")
                .isGlobal(false)
                .serverIds(null)
                .actionType(ActionType.ROLE)
                .build();
        when(embedActionRepository.findByActionId(actionId)).thenReturn(Optional.of(existing));

        EmbedTemplate publicTemplate = EmbedTemplate.builder()
                .id("tpl-public-update")
                .serverId("guild-any")
                .isPublic(true)
                .build();
        when(embedTemplateRepository.findById("tpl-public-update")).thenReturn(Optional.of(publicTemplate));
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateActionRequest request = UpdateActionRequest.builder()
                .responseEmbedTemplateId("tpl-public-update")
                .build();

        EmbedActionDto result = service.updateAction(actionId, request, "operator@rng.com");
        assertThat(result).isNotNull();
        assertThat(result.getResponseEmbedTemplateId()).isEqualTo("tpl-public-update");
    }
}
