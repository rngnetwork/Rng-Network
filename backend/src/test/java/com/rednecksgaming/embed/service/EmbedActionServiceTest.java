// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rednecksgaming.common.exception.InternalServerException;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.embed.domain.ActionType;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.EmbedTemplate;
import com.rednecksgaming.embed.domain.InteractionLog;
import com.rednecksgaming.embed.domain.RoleSubtype;
import com.rednecksgaming.embed.dto.CreateActionRequest;
import com.rednecksgaming.embed.dto.EmbedActionDto;
import com.rednecksgaming.embed.dto.InteractionLogResponse;
import com.rednecksgaming.embed.dto.UpdateActionRequest;
import com.rednecksgaming.embed.repository.EmbedActionRepository;
import com.rednecksgaming.embed.repository.EmbedTemplateRepository;
import com.rednecksgaming.embed.repository.InteractionLogRepository;
import com.rednecksgaming.identity.domain.User;
import com.rednecksgaming.identity.repository.UserRepository;
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

    @Test
    @DisplayName("generateUniqueActionId retries on collision and succeeds")
    void generateUniqueActionId_collisionAndRetrySuccess() {
        CreateActionRequest request = CreateActionRequest.builder()
                .name("Retry Action")
                .actionType(ActionType.ROLE)
                .build();

        when(embedActionRepository.existsByActionId(anyString()))
                .thenReturn(true)
                .thenReturn(false);
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        EmbedActionDto result = service.createAction(request);
        assertThat(result).isNotNull();
        verify(embedActionRepository, atLeast(2)).existsByActionId(anyString());
    }

    @Test
    @DisplayName("generateUniqueActionId throws InternalServerException when 10 retries are exhausted")
    void generateUniqueActionId_exhaustionThrowsInternalServer() {
        CreateActionRequest request = CreateActionRequest.builder()
                .name("Exhausted Action")
                .actionType(ActionType.ROLE)
                .build();

        when(embedActionRepository.existsByActionId(anyString())).thenReturn(true);

        assertThatThrownBy(() -> service.createAction(request))
                .isInstanceOf(InternalServerException.class)
                .hasMessageContaining("Failed to generate unique action ID after maximum retries");
    }

    @Test
    @DisplayName("resolveAction returns empty for null or blank actionId")
    void resolveAction_nullOrBlankReturnsEmpty() {
        assertThat(service.resolveAction(null)).isEmpty();
        assertThat(service.resolveAction("   ")).isEmpty();
    }

    @Test
    @DisplayName("resolveAction falls back to Mongo when Redis read throws exception")
    void resolveAction_redisExceptionFallsBackToMongo() {
        String actionId = "rng_act_redis_err";
        EmbedAction mongoAction = EmbedAction.builder().actionId(actionId).name("Fallback Action").build();

        when(valueOperations.get(anyString())).thenThrow(new RuntimeException("Redis connection timed out"));
        when(embedActionRepository.findByActionId(actionId)).thenReturn(Optional.of(mongoAction));

        Optional<EmbedAction> result = service.resolveAction(actionId);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Fallback Action");
    }

    @Test
    @DisplayName("deleteAction throws ResourceNotFoundException when actionId does not exist")
    void deleteAction_notFoundThrows() {
        when(embedActionRepository.existsByActionId("rng_act_missing")).thenReturn(false);

        assertThatThrownBy(() -> service.deleteAction("rng_act_missing"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Action Template not found with ID: rng_act_missing");
    }

    @Test
    @DisplayName("getActionsForServer with null or blank serverId delegates to getGlobalActions")
    void getActionsForServer_nullOrBlankDelegatesToGlobal() {
        EmbedAction globalAction = EmbedAction.builder().actionId("rng_act_g").name("Global").isGlobal(true).build();
        when(embedActionRepository.findByIsGlobalTrue()).thenReturn(List.of(globalAction));

        assertThat(service.getActionsForServer(null)).hasSize(1);
        assertThat(service.getActionsForServer("   ")).hasSize(1);
        verify(embedActionRepository, times(2)).findByIsGlobalTrue();
    }

    @Test
    @DisplayName("getInteractionLogs with null or blank guildId queries all logs")
    void getInteractionLogs_nullOrBlankQueriesAll() {
        Pageable pageable = PageRequest.of(0, 10);
        InteractionLog logEntry = InteractionLog.builder().id("l1").build();
        when(interactionLogRepository.findAllByOrderByCreatedAtDesc(pageable))
                .thenReturn(new PageImpl<>(List.of(logEntry)));

        assertThat(service.getInteractionLogs(null, pageable).getTotalElements()).isEqualTo(1);
        assertThat(service.getInteractionLogs("  ", pageable).getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("createAction resolves operator by numeric userId string")
    void createAction_resolvesOperatorByNumericId() {
        User operator = User.builder().id(42L).email("num_op@rng.com").build();
        when(userRepository.findById(42L)).thenReturn(Optional.of(operator));
        when(embedActionRepository.existsByActionId(anyString())).thenReturn(false);
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateActionRequest request = CreateActionRequest.builder()
                .name("Numeric Op Action")
                .actionType(ActionType.ROLE)
                .build();

        EmbedActionDto result = service.createAction(request, "42");
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("createAction and updateAction warn and proceed when responseEmbedTemplateId does not exist")
    void createAndUpdateAction_missingTemplateWarnsAndProceeds() {
        when(embedTemplateRepository.findById("missing_tmpl")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findByTemplateId("missing_tmpl")).thenReturn(Optional.empty());
        when(embedActionRepository.existsByActionId(anyString())).thenReturn(false);
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateActionRequest createReq = CreateActionRequest.builder()
                .name("Missing Tpl Action")
                .actionType(ActionType.ROLE)
                .responseEmbedTemplateId("missing_tmpl")
                .build();

        EmbedActionDto createResult = service.createAction(createReq, "op@rng.com");
        assertThat(createResult.getResponseEmbedTemplateId()).isEqualTo("missing_tmpl");

        EmbedAction existing = EmbedAction.builder().actionId("rng_act_up_tpl").name("Existing").build();
        when(embedActionRepository.findByActionId("rng_act_up_tpl")).thenReturn(Optional.of(existing));

        UpdateActionRequest updateReq = UpdateActionRequest.builder()
                .responseEmbedTemplateId("missing_tmpl")
                .build();

        EmbedActionDto updateResult = service.updateAction("rng_act_up_tpl", updateReq, "op@rng.com");
        assertThat(updateResult.getResponseEmbedTemplateId()).isEqualTo("missing_tmpl");
    }

    @Test
    @DisplayName("createAction access control and template accessibility validation branches")
    void createAction_accessControlAndAccessibilityBranches() {
        when(embedActionRepository.existsByActionId(anyString())).thenReturn(false);
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Global action requires operator clearance
        CreateActionRequest globalReq = CreateActionRequest.builder()
                .name("Global Action")
                .actionType(ActionType.ROLE)
                .isGlobal(true)
                .build();

        assertThatThrownBy(() -> service.createAction(globalReq, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Operator clearance required");

        assertThatThrownBy(() -> service.createAction(globalReq, "   "))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Operator clearance required");

        // 2. Global action requires High Command (ROLE_CHIEF_HIGH_COMMAND in roleList)
        User chiefUser = User.builder().id(50L).email("chief@rng.com").roles("ROLE_CHIEF_HIGH_COMMAND").build();
        when(userRepository.findByEmail("chief@rng.com")).thenReturn(Optional.of(chiefUser));

        EmbedActionDto chiefDto = service.createAction(globalReq, "chief@rng.com");
        assertThat(chiefDto.isGlobal()).isTrue();

        // High command in roleList as ROLE_HIGH_COMMAND
        User hcListUser = User.builder().id(51L).email("hclist@rng.com").roles("ROLE_HIGH_COMMAND").build();
        when(userRepository.findByEmail("hclist@rng.com")).thenReturn(Optional.of(hcListUser));
        EmbedActionDto hcListDto = service.createAction(globalReq, "hclist@rng.com");
        assertThat(hcListDto.isGlobal()).isTrue();

        // 3. Non-accessible referenced template throws AccessDeniedException
        EmbedTemplate privateTemplate = EmbedTemplate.builder()
                .id("t_priv")
                .isPublic(false)
                .serverId("guild_SECRET")
                .authorId("9999")
                .authorName("other@rng.com")
                .build();
        when(embedTemplateRepository.findById("t_priv")).thenReturn(Optional.of(privateTemplate));

        User normalUser = User.builder().id(60L).email("norm@rng.com").role("ROLE_USER").build();
        when(userRepository.findByEmail("norm@rng.com")).thenReturn(Optional.of(normalUser));

        CreateActionRequest badAccessReq = CreateActionRequest.builder()
                .name("Bad Access")
                .actionType(ActionType.ROLE)
                .serverId("guild_NORMAL")
                .responseEmbedTemplateId("t_priv")
                .build();

        assertThatThrownBy(() -> service.createAction(badAccessReq, "norm@rng.com"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Referenced embed template is not accessible");

        // Accessible if operator is author by email matching authorName
        EmbedTemplate authorTmpl = EmbedTemplate.builder()
                .id("t_author")
                .isPublic(false)
                .serverId("guild_SECRET")
                .authorId("9999")
                .authorName("norm@rng.com")
                .build();
        when(embedTemplateRepository.findById("t_author")).thenReturn(Optional.of(authorTmpl));

        CreateActionRequest authorAccessReq = CreateActionRequest.builder()
                .name("Author Access")
                .actionType(ActionType.ROLE)
                .responseEmbedTemplateId("t_author")
                .build();

        EmbedActionDto authorDto = service.createAction(authorAccessReq, "norm@rng.com");
        assertThat(authorDto).isNotNull();

        // Accessible if template serverId matches target serverId
        CreateActionRequest serverAccessReq = CreateActionRequest.builder()
                .name("Server Access")
                .actionType(ActionType.ROLE)
                .serverId("guild_SECRET")
                .responseEmbedTemplateId("t_priv")
                .build();
        EmbedActionDto srvDto = service.createAction(serverAccessReq, "norm@rng.com");
        assertThat(srvDto).isNotNull();
    }

    @Test
    @DisplayName("updateAction exhaustively updates all fields and validates access control")
    void updateAction_allFieldsAndSecurityBranches() {
        EmbedAction existing = EmbedAction.builder()
                .actionId("rng_act_full_update")
                .isGlobal(false)
                .serverId("guild_old")
                .name("Old")
                .build();
        when(embedActionRepository.findByActionId("rng_act_full_update")).thenReturn(Optional.of(existing));
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Updating non-global to isGlobal=true requires High Command
        UpdateActionRequest makeGlobalReq = UpdateActionRequest.builder().isGlobal(true).build();
        assertThatThrownBy(() -> service.updateAction("rng_act_full_update", makeGlobalReq, null))
                .isInstanceOf(AccessDeniedException.class);

        User normalUser = User.builder().id(70L).email("user@rng.com").role("ROLE_USER").build();
        when(userRepository.findByEmail("user@rng.com")).thenReturn(Optional.of(normalUser));
        assertThatThrownBy(() -> service.updateAction("rng_act_full_update", makeGlobalReq, "user@rng.com"))
                .isInstanceOf(AccessDeniedException.class);

        // 2. High command operator can make it global
        User chiefUser = User.builder().id(50L).email("chief@rng.com").role("ROLE_CHIEF_HIGH_COMMAND").build();
        when(userRepository.findByEmail("chief@rng.com")).thenReturn(Optional.of(chiefUser));

        // 3. Inaccessible template in update throws AccessDeniedException
        EmbedTemplate privTmpl = EmbedTemplate.builder().id("t_priv2").isPublic(false).serverId("other_srv").authorId("0").build();
        when(embedTemplateRepository.findById("t_priv2")).thenReturn(Optional.of(privTmpl));

        UpdateActionRequest badTmplReq = UpdateActionRequest.builder().responseEmbedTemplateId("t_priv2").build();
        assertThatThrownBy(() -> service.updateAction("rng_act_full_update", badTmplReq, "user@rng.com"))
                .isInstanceOf(AccessDeniedException.class);

        // 4. Update every single field successfully
        UpdateActionRequest fullReq = UpdateActionRequest.builder()
                .serverId("guild_new")
                .isGlobal(true)
                .serverIds(List.of("guild_new", "guild_extra"))
                .name("New Name")
                .description("New Description")
                .actionType(ActionType.TICKET)
                .roleSubtype(RoleSubtype.ADD)
                .roleId("role_new")
                .roleName("New Role")
                .channelPrefix("support-")
                .welcomeMessage("Welcome to support")
                .replyContent("Ticket created")
                .confirmationMessage("Confirmed")
                .isEphemeral(false)
                .dmContent("DM notification")
                .requiredUser(true)
                .requiredRole(true)
                .responseType(com.rednecksgaming.embed.domain.ResponseType.PUBLIC_TEXT)
                .responseEmbedTemplateId("t_priv2") // accessible because chiefUser is High Command!
                .compoundOperations(List.of())
                .build();

        EmbedActionDto updated = service.updateAction("rng_act_full_update", fullReq, "chief@rng.com");

        assertThat(updated.getName()).isEqualTo("New Name");
        assertThat(updated.getServerId()).isEqualTo("guild_new");
        assertThat(updated.isGlobal()).isTrue();
        assertThat(updated.getServerIds()).containsExactly("guild_new", "guild_extra");
        assertThat(updated.getDescription()).isEqualTo("New Description");
        assertThat(updated.getActionType()).isEqualTo(ActionType.TICKET);
        assertThat(updated.getRoleSubtype()).isEqualTo(RoleSubtype.ADD);
        assertThat(updated.getRoleId()).isEqualTo("role_new");
        assertThat(updated.getRoleName()).isEqualTo("New Role");
        assertThat(updated.getChannelPrefix()).isEqualTo("support-");
        assertThat(updated.getWelcomeMessage()).isEqualTo("Welcome to support");
        assertThat(updated.getReplyContent()).isEqualTo("Ticket created");
        assertThat(updated.getConfirmationMessage()).isEqualTo("Confirmed");
        assertThat(updated.isEphemeral()).isFalse();
        assertThat(updated.getDmContent()).isEqualTo("DM notification");
        assertThat(updated.isRequiredUser()).isTrue();
        assertThat(updated.isRequiredRole()).isTrue();
        assertThat(updated.getResponseType()).isEqualTo(com.rednecksgaming.embed.domain.ResponseType.PUBLIC_TEXT);
    }

    @Test
    @DisplayName("cacheAction and evictActionCache gracefully tolerate null redisTemplate and redis exceptions")
    void cacheActionAndEvict_nullRedisAndExceptionHandling() {
        EmbedActionServiceImpl noRedisService = new EmbedActionServiceImpl(
                embedActionRepository, interactionLogRepository, embedTemplateRepository,
                userRepository, null, objectMapper
        );

        when(embedActionRepository.existsByActionId(anyString())).thenReturn(false);
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        // Create action with no redis template does not fail
        CreateActionRequest req = CreateActionRequest.builder().name("No Redis").actionType(ActionType.ROLE).build();
        EmbedActionDto dto = noRedisService.createAction(req);
        assertThat(dto).isNotNull();

        // Delete action with no redis template does not fail
        when(embedActionRepository.existsByActionId("rng_act_del_noredis")).thenReturn(true);
        noRedisService.deleteAction("rng_act_del_noredis");
        verify(embedActionRepository).deleteByActionId("rng_act_del_noredis");

        // Redis throws exception during caching and eviction
        doThrow(new RuntimeException("Redis set error")).when(valueOperations).set(anyString(), anyString(), any(Duration.class));
        doThrow(new RuntimeException("Redis delete error")).when(redisTemplate).delete(anyString());

        service.createAction(req); // should log warning and not throw
        when(embedActionRepository.existsByActionId("rng_act_del_error")).thenReturn(true);
        service.deleteAction("rng_act_del_error"); // should log warning and not throw
    }

    @Test
    @DisplayName("resolveOperatorUser and tryResolveOperatorUser via reflection cover all lookup branches")
    void operatorResolution_allBranches() {
        // Test tryResolveOperatorUser
        User numUser = User.builder().id(123L).email("user123@rng.com").build();
        when(userRepository.findById(123L)).thenReturn(Optional.of(numUser));
        when(userRepository.findById(456L)).thenReturn(Optional.empty());
        User emailUser = User.builder().id(789L).email("user789@rng.com").build();
        lenient().when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        lenient().when(userRepository.findByEmail("user789@rng.com")).thenReturn(Optional.of(emailUser));

        // Numeric ID found
        User u1 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "tryResolveOperatorUser", "123");
        assertThat(u1).isNotNull();
        assertThat(u1.getId()).isEqualTo(123L);

        // Numeric ID not found, email fallback not found
        User u2 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "tryResolveOperatorUser", "456");
        assertThat(u2).isNull();

        // Non-numeric found by email
        User u3 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "tryResolveOperatorUser", "user789@rng.com");
        assertThat(u3).isNotNull();
        assertThat(u3.getId()).isEqualTo(789L);

        // Non-numeric not found by email
        User u4 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "tryResolveOperatorUser", "notfound@rng.com");
        assertThat(u4).isNull();

        // Null / blank
        User u5 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "tryResolveOperatorUser", (String) null);
        assertThat(u5).isNull();
        User u6 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "tryResolveOperatorUser", "   ");
        assertThat(u6).isNull();

        // Test resolveOperatorUser
        assertThatThrownBy(() -> org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "resolveOperatorUser", (String) null))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "resolveOperatorUser", "   "))
                .isInstanceOf(AccessDeniedException.class);

        User r1 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "resolveOperatorUser", "123");
        assertThat(r1).isEqualTo(numUser);

        User r2 = org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "resolveOperatorUser", "user789@rng.com");
        assertThat(r2).isEqualTo(emailUser);

        assertThatThrownBy(() -> org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "resolveOperatorUser", "456"))
                .isInstanceOf(ResourceNotFoundException.class);

        assertThatThrownBy(() -> org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "resolveOperatorUser", "notfound@rng.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateAction with all null fields skips all setters")
    void updateAction_allNullFieldsSkipsSetters() {
        EmbedAction existing = EmbedAction.builder()
                .actionId("rng_act_null_fields")
                .name("Original")
                .isGlobal(false)
                .serverId("srv1")
                .serverIds(List.of("srv1"))
                .build();
        when(embedActionRepository.findByActionId("rng_act_null_fields")).thenReturn(Optional.of(existing));
        when(embedActionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateActionRequest emptyReq = UpdateActionRequest.builder().build();
        EmbedActionDto res = service.updateAction("rng_act_null_fields", emptyReq, null);
        assertThat(res.getName()).isEqualTo("Original");
    }

    @Test
    @DisplayName("createAction covers roleList High Command, template accessibility matrix, and default values")
    void createAction_comprehensiveBranches() {
        when(embedActionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // 1. Operator with null role string but roleList containing ROLE_CHIEF_HIGH_COMMAND
        User chiefByList = User.builder().id(901L).email("chief_list@rng.com").role(null).roles("ROLE_USER,ROLE_CHIEF_HIGH_COMMAND").build();
        when(userRepository.findByEmail("chief_list@rng.com")).thenReturn(Optional.of(chiefByList));

        // Global creation with operator having chief clearance via roleList
        CreateActionRequest globalReq = CreateActionRequest.builder()
                .name("Global Action")
                .isGlobal(true)
                .serverId(null)
                .serverIds(null)
                .isEphemeral(false)
                .requiredUser(true)
                .requiredRole(true)
                .build();
        EmbedActionDto globalDto = service.createAction(globalReq, "chief_list@rng.com");
        assertThat(globalDto.isGlobal()).isTrue();
        assertThat(globalDto.isEphemeral()).isFalse();
        assertThat(globalDto.isRequiredUser()).isTrue();
        assertThat(globalDto.isRequiredRole()).isTrue();

        // 2. Global creation with blank operator email throws AccessDeniedException
        assertThatThrownBy(() -> service.createAction(globalReq, "   "))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Operator clearance required to create global action templates");

        // 3. Global creation with non-high-command user throws AccessDeniedException
        User regularUser = User.builder().id(902L).email("reg@rng.com").role("ROLE_USER").roles("ROLE_USER").build();
        when(userRepository.findByEmail("reg@rng.com")).thenReturn(Optional.of(regularUser));
        assertThatThrownBy(() -> service.createAction(globalReq, "reg@rng.com"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only High Command can create global action templates");

        // 4. Operator with ROLE_HIGH_COMMAND in roleList
        User hcByList = User.builder().id(903L).email("hc_list@rng.com").role(null).roles("ROLE_HIGH_COMMAND").build();
        when(userRepository.findByEmail("hc_list@rng.com")).thenReturn(Optional.of(hcByList));
        EmbedActionDto hcDto = service.createAction(globalReq, "hc_list@rng.com");
        assertThat(hcDto.isGlobal()).isTrue();

        // 5. Template accessibility in createAction:
        // - Template found via findByTemplateId fallback
        // - Template has serverId null (accessible to all)
        EmbedTemplate tmplNullServer = EmbedTemplate.builder().templateId("t_null_srv").isPublic(false).serverId(null).build();
        when(embedTemplateRepository.findById("t_null_srv")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findByTemplateId("t_null_srv")).thenReturn(Optional.of(tmplNullServer));

        CreateActionRequest reqNullSrvTmpl = CreateActionRequest.builder()
                .name("Tmpl Null Srv")
                .responseEmbedTemplateId("t_null_srv")
                .build();
        EmbedActionDto dtoWithTmpl = service.createAction(reqNullSrvTmpl, "reg@rng.com");
        assertThat(dtoWithTmpl).isNotNull();

        // - Template not found in Mongo (warning log, non-fatal reference)
        when(embedTemplateRepository.findById("t_missing")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findByTemplateId("t_missing")).thenReturn(Optional.empty());
        CreateActionRequest reqMissingTmpl = CreateActionRequest.builder()
                .name("Tmpl Missing")
                .responseEmbedTemplateId("t_missing")
                .build();
        EmbedActionDto dtoMissing = service.createAction(reqMissingTmpl, "reg@rng.com");
        assertThat(dtoMissing).isNotNull();

        // - Template author match by operator ID
        EmbedTemplate tmplAuthorId = EmbedTemplate.builder().templateId("t_auth_id").isPublic(false).serverId("srv_diff").authorId("902").build();
        when(embedTemplateRepository.findById("t_auth_id")).thenReturn(Optional.of(tmplAuthorId));
        CreateActionRequest reqAuthId = CreateActionRequest.builder()
                .name("Author Match ID")
                .responseEmbedTemplateId("t_auth_id")
                .build();
        EmbedActionDto dtoAuthId = service.createAction(reqAuthId, "reg@rng.com");
        assertThat(dtoAuthId).isNotNull();

        // - Template author match by operator email
        EmbedTemplate tmplAuthorEmail = EmbedTemplate.builder().templateId("t_auth_email").isPublic(false).serverId("srv_diff").authorName("reg@rng.com").build();
        when(embedTemplateRepository.findById("t_auth_email")).thenReturn(Optional.of(tmplAuthorEmail));
        CreateActionRequest reqAuthEmail = CreateActionRequest.builder()
                .name("Author Match Email")
                .responseEmbedTemplateId("t_auth_email")
                .build();
        EmbedActionDto dtoAuthEmail = service.createAction(reqAuthEmail, "reg@rng.com");
        assertThat(dtoAuthEmail).isNotNull();

        // - Template serverId matches targetServerIds from serverIds list
        EmbedTemplate tmplServerMatch = EmbedTemplate.builder().templateId("t_srv_match").isPublic(false).serverId("srv_match_1").build();
        when(embedTemplateRepository.findById("t_srv_match")).thenReturn(Optional.of(tmplServerMatch));
        CreateActionRequest reqSrvMatch = CreateActionRequest.builder()
                .name("Server Match")
                .serverIds(List.of("srv_match_1", "srv_match_2"))
                .responseEmbedTemplateId("t_srv_match")
                .build();
        EmbedActionDto dtoSrvMatch = service.createAction(reqSrvMatch, "reg@rng.com");
        assertThat(dtoSrvMatch).isNotNull();

        // - Template serverId matches targetServerIds from single serverId
        CreateActionRequest reqSingleSrvMatch = CreateActionRequest.builder()
                .name("Single Server Match")
                .serverId("srv_match_1")
                .responseEmbedTemplateId("t_srv_match")
                .build();
        EmbedActionDto dtoSingleSrvMatch = service.createAction(reqSingleSrvMatch, "reg@rng.com");
        assertThat(dtoSingleSrvMatch).isNotNull();

        // 6. Defaults check: null name, null channelPrefix, null isEphemeral, null responseType, null compoundOperations
        CreateActionRequest minimalReq = CreateActionRequest.builder()
                .name(null)
                .channelPrefix(null)
                .isEphemeral(null)
                .responseType(null)
                .compoundOperations(null)
                .build();
        EmbedActionDto minDto = service.createAction(minimalReq, null);
        assertThat(minDto.getName()).isEmpty();
        assertThat(minDto.getChannelPrefix()).isEqualTo("ticket-");
        assertThat(minDto.isEphemeral()).isTrue();
        assertThat(minDto.getResponseType()).isEqualTo(com.rednecksgaming.embed.domain.ResponseType.EPHEMERAL_TEXT);
        assertThat(minDto.getCompoundOperations()).isEmpty();
    }

    @Test
    @DisplayName("updateAction covers roleList High Command, global denial, and template accessibility branches")
    void updateAction_comprehensiveBranches() {
        when(embedActionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // 1. Existing action is global: blank operatorEmail throws AccessDeniedException
        EmbedAction globalExisting = EmbedAction.builder()
                .actionId("rng_act_global_existing")
                .name("Global")
                .isGlobal(true)
                .build();
        when(embedActionRepository.findByActionId("rng_act_global_existing")).thenReturn(Optional.of(globalExisting));
        UpdateActionRequest simpleReq = UpdateActionRequest.builder().name("Renamed").build();

        assertThatThrownBy(() -> service.updateAction("rng_act_global_existing", simpleReq, "   "))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Operator clearance required to modify global action templates");

        // 2. Existing action is global: non-high-command operator throws AccessDeniedException
        User regularUser = User.builder().id(902L).email("reg@rng.com").role("ROLE_USER").roles("ROLE_USER").build();
        when(userRepository.findByEmail("reg@rng.com")).thenReturn(Optional.of(regularUser));
        assertThatThrownBy(() -> service.updateAction("rng_act_global_existing", simpleReq, "reg@rng.com"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only High Command can modify global action templates");

        // 3. Existing action is global: High Command via roleList succeeds
        User chiefByList = User.builder().id(901L).email("chief_list@rng.com").role(null).roles("ROLE_CHIEF_HIGH_COMMAND").build();
        when(userRepository.findByEmail("chief_list@rng.com")).thenReturn(Optional.of(chiefByList));
        EmbedActionDto updatedGlobal = service.updateAction("rng_act_global_existing", simpleReq, "chief_list@rng.com");
        assertThat(updatedGlobal.getName()).isEqualTo("Renamed");

        // 4. Update template accessibility:
        // - Template not found in Mongo (warning branch)
        EmbedAction localExisting = EmbedAction.builder()
                .actionId("rng_act_local_existing")
                .name("Local")
                .isGlobal(false)
                .serverId("srv_local")
                .build();
        when(embedActionRepository.findByActionId("rng_act_local_existing")).thenReturn(Optional.of(localExisting));

        when(embedTemplateRepository.findById("t_not_found")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findByTemplateId("t_not_found")).thenReturn(Optional.empty());
        UpdateActionRequest missingTmplReq = UpdateActionRequest.builder().responseEmbedTemplateId("t_not_found").build();
        EmbedActionDto resMissingTmpl = service.updateAction("rng_act_local_existing", missingTmplReq, "reg@rng.com");
        assertThat(resMissingTmpl).isNotNull();

        // - Template found via findByTemplateId fallback
        // - Template has serverId null (accessible)
        EmbedTemplate tmplFallback = EmbedTemplate.builder().templateId("t_fb_update").isPublic(false).serverId(null).build();
        when(embedTemplateRepository.findById("t_fb_update")).thenReturn(Optional.empty());
        when(embedTemplateRepository.findByTemplateId("t_fb_update")).thenReturn(Optional.of(tmplFallback));
        UpdateActionRequest fbTmplReq = UpdateActionRequest.builder().responseEmbedTemplateId("t_fb_update").build();
        EmbedActionDto resFb = service.updateAction("rng_act_local_existing", fbTmplReq, "reg@rng.com");
        assertThat(resFb).isNotNull();

        // - Author match by operator ID in update
        EmbedTemplate tmplAuthorId = EmbedTemplate.builder().templateId("t_auth_id_up").isPublic(false).serverId("other").authorId("902").build();
        when(embedTemplateRepository.findById("t_auth_id_up")).thenReturn(Optional.of(tmplAuthorId));
        UpdateActionRequest authorIdReq = UpdateActionRequest.builder().responseEmbedTemplateId("t_auth_id_up").build();
        EmbedActionDto resAuthId = service.updateAction("rng_act_local_existing", authorIdReq, "reg@rng.com");
        assertThat(resAuthId).isNotNull();

        // - Author match by operator email in update
        EmbedTemplate tmplAuthorEmail = EmbedTemplate.builder().templateId("t_auth_email_up").isPublic(false).serverId("other").authorName("reg@rng.com").build();
        when(embedTemplateRepository.findById("t_auth_email_up")).thenReturn(Optional.of(tmplAuthorEmail));
        UpdateActionRequest authorEmailReq = UpdateActionRequest.builder().responseEmbedTemplateId("t_auth_email_up").build();
        EmbedActionDto resAuthEmail = service.updateAction("rng_act_local_existing", authorEmailReq, "reg@rng.com");
        assertThat(resAuthEmail).isNotNull();

        // - Template serverId match using existing action's serverId when request serverIds is null
        EmbedAction existingWithServer = EmbedAction.builder()
                .actionId("rng_act_existing_srv")
                .serverId("srv_target")
                .serverIds(List.of("srv_target"))
                .build();
        when(embedActionRepository.findByActionId("rng_act_existing_srv")).thenReturn(Optional.of(existingWithServer));

        EmbedTemplate tmplTargetSrv = EmbedTemplate.builder().templateId("t_target_srv").isPublic(false).serverId("srv_target").build();
        when(embedTemplateRepository.findById("t_target_srv")).thenReturn(Optional.of(tmplTargetSrv));
        UpdateActionRequest reqWithExistingSrv = UpdateActionRequest.builder().responseEmbedTemplateId("t_target_srv").build();
        EmbedActionDto resExistingSrv = service.updateAction("rng_act_existing_srv", reqWithExistingSrv, "reg@rng.com");
        assertThat(resExistingSrv).isNotNull();
    }

    @Test
    @DisplayName("resolveAction, cacheAction, evictActionCache, and generateUniqueActionId cover all edge paths")
    void cacheAndHelperBranches() throws Exception {
        // 1. resolveAction null and blank
        assertThat(service.resolveAction(null)).isEmpty();
        assertThat(service.resolveAction("   ")).isEmpty();

        // 2. resolveAction with redis returning null or blank falls through to MongoDB
        when(valueOperations.get(anyString())).thenReturn(null);
        EmbedAction mongoAction = EmbedAction.builder().actionId("act_mongo").name("Mongo").build();
        when(embedActionRepository.findByActionId("act_mongo")).thenReturn(Optional.of(mongoAction));

        Optional<EmbedAction> res1 = service.resolveAction("act_mongo");
        assertThat(res1).contains(mongoAction);

        // Blank cached string
        when(valueOperations.get(anyString())).thenReturn("   ");
        Optional<EmbedAction> res2 = service.resolveAction("act_mongo");
        assertThat(res2).contains(mongoAction);

        // Redis exception falls through to MongoDB
        when(valueOperations.get(anyString())).thenThrow(new RuntimeException("Redis connection refused"));
        Optional<EmbedAction> res3 = service.resolveAction("act_mongo");
        assertThat(res3).contains(mongoAction);

        // MongoDB findById fallback when findByActionId is empty
        when(embedActionRepository.findByActionId("act_by_id")).thenReturn(Optional.empty());
        when(embedActionRepository.findById("act_by_id")).thenReturn(Optional.of(mongoAction));
        doReturn(null).when(valueOperations).get(anyString());
        Optional<EmbedAction> res4 = service.resolveAction("act_by_id");
        assertThat(res4).contains(mongoAction);

        // Both findByActionId and findById empty
        when(embedActionRepository.findByActionId("act_not_found")).thenReturn(Optional.empty());
        when(embedActionRepository.findById("act_not_found")).thenReturn(Optional.empty());
        Optional<EmbedAction> res5 = service.resolveAction("act_not_found");
        assertThat(res5).isEmpty();

        // 3. cacheAction edge cases via reflection
        // action == null -> does nothing
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "cacheAction", (EmbedAction) null);

        // Redis set throws exception -> logs warning
        doThrow(new RuntimeException("Redis set failed")).when(valueOperations).set(anyString(), anyString(), any(java.time.Duration.class));
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "cacheAction", mongoAction);

        // 4. evictActionCache edge cases via reflection
        // actionId == null -> does nothing
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "evictActionCache", (String) null);

        // Redis delete throws exception -> logs warning
        doThrow(new RuntimeException("Redis delete failed")).when(redisTemplate).delete(anyString());
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "evictActionCache", "act_mongo");

        // 5. generateUniqueActionId collision retry
        // First candidate exists, second candidate does not exist
        when(embedActionRepository.existsByActionId(anyString()))
                .thenReturn(true)
                .thenReturn(false);
        String uniqueId = org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "generateUniqueActionId");
        assertThat(uniqueId).startsWith("rng_act_");

        // All 10 candidates exist -> throws InternalServerException
        when(embedActionRepository.existsByActionId(anyString())).thenReturn(true);
        assertThatThrownBy(() -> org.springframework.test.util.ReflectionTestUtils.invokeMethod(service, "generateUniqueActionId"))
                .isInstanceOf(com.rednecksgaming.common.exception.InternalServerException.class)
                .hasMessageContaining("Failed to generate unique action ID after maximum retries");
    }

    @Test
    @DisplayName("Custom ROLE_USER with dynamic rankWeight >= 8 creates and updates global actions")
    void customRoleUserWithDynamicWeight8_createsAndUpdatesGlobalAction() {
        com.rednecksgaming.personnel.perms.service.RolePermissionsService permsService =
                mock(com.rednecksgaming.personnel.perms.service.RolePermissionsService.class);
        EmbedActionServiceImpl dynamicService = new EmbedActionServiceImpl(
                embedActionRepository, interactionLogRepository, embedTemplateRepository,
                userRepository, redisTemplate, objectMapper, permsService
        );

        User customHc = User.builder()
                .id(88L)
                .email("custom.hc@rng.com")
                .role("ROLE_USER")
                .designations("Security Ops")
                .roles("Security Ops:Overlord")
                .build();
        when(userRepository.findByEmail("custom.hc@rng.com")).thenReturn(Optional.of(customHc));
        when(permsService.resolveUserRankWeight(customHc)).thenReturn(8);
        when(embedActionRepository.existsByActionId(anyString())).thenReturn(false);
        when(embedActionRepository.save(any(EmbedAction.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateActionRequest req = CreateActionRequest.builder()
                .name("Global Custom Action")
                .actionType(ActionType.REPLY)
                .replyContent("ok")
                .isGlobal(true)
                .build();

        EmbedActionDto dto = dynamicService.createAction(req, "custom.hc@rng.com");
        assertThat(dto.isGlobal()).isTrue();
    }
}
