package com.rednecksgaming.embed.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rednecksgaming.common.exception.GlobalExceptionHandler;
import com.rednecksgaming.embed.domain.ActionType;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.RoleSubtype;
import com.rednecksgaming.embed.dto.CreateActionRequest;
import com.rednecksgaming.embed.dto.EmbedActionDto;
import com.rednecksgaming.embed.dto.InteractionLogResponse;
import com.rednecksgaming.embed.dto.UpdateActionRequest;
import com.rednecksgaming.embed.service.EmbedActionService;
import com.rednecksgaming.server.domain.Server;
import com.rednecksgaming.server.repository.ServerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EmbedActionControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private EmbedActionService actionService;

    @Mock
    private ServerRepository serverRepository;

    @InjectMocks
    private EmbedActionController controller;

    private EmbedActionDto sampleDto;
    private EmbedAction sampleEntity;
    private Server sampleServer;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleDto = new EmbedActionDto(
                "mongo-id-1",
                "rng_act_0123456789abcdef",
                "104812345678901234",
                false,
                "VIP Role Toggle",
                "Toggles VIP role",
                ActionType.ROLE,
                RoleSubtype.TOGGLE,
                "role-snowflake-1",
                "VIP",
                null,
                null,
                "Role toggled!",
                true,
                null,
                false,
                false,
                null,
                Instant.now(),
                Instant.now()
        );

        sampleEntity = EmbedAction.builder()
                .id("mongo-id-1")
                .actionId("rng_act_0123456789abcdef")
                .serverId("104812345678901234")
                .isGlobal(false)
                .name("VIP Role Toggle")
                .description("Toggles VIP role")
                .actionType(ActionType.ROLE)
                .roleSubtype(RoleSubtype.TOGGLE)
                .roleId("role-snowflake-1")
                .roleName("VIP")
                .replyContent("Role toggled!")
                .isEphemeral(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        sampleServer = Server.builder()
                .id("104812345678901234")
                .slug("alpha-guild")
                .name("Alpha Guild")
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/embeds/actions (no serverId) returns all actions")
    void listActions_whenNoServerId_returnsAllActions() throws Exception {
        when(actionService.getAllActions()).thenReturn(List.of(sampleDto));

        mockMvc.perform(get("/api/v1/embeds/actions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].actionId", is("rng_act_0123456789abcdef")))
                .andExpect(jsonPath("$.data[0].name", is("VIP Role Toggle")));

        verify(actionService).getAllActions();
    }

    @Test
    @DisplayName("GET /api/v1/embeds/actions?serverId=alpha-guild resolves slug and returns server actions")
    void listActions_whenServerIdProvided_resolvesServerAndReturnsServerActions() throws Exception {
        when(serverRepository.findByIdOrSlug("alpha-guild")).thenReturn(Optional.of(sampleServer));
        when(actionService.getActionsForServer("104812345678901234")).thenReturn(List.of(sampleDto));

        mockMvc.perform(get("/api/v1/embeds/actions").param("serverId", "alpha-guild"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].serverId", is("104812345678901234")));

        verify(actionService).getActionsForServer("104812345678901234");
    }

    @Test
    @DisplayName("GET /api/v1/embeds/actions/{actionId} returns action if found")
    void getAction_whenFound_returnsActionDto() throws Exception {
        when(actionService.resolveAction("rng_act_0123456789abcdef")).thenReturn(Optional.of(sampleEntity));

        mockMvc.perform(get("/api/v1/embeds/actions/rng_act_0123456789abcdef"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.actionId", is("rng_act_0123456789abcdef")));

        verify(actionService).resolveAction("rng_act_0123456789abcdef");
    }

    @Test
    @DisplayName("GET /api/v1/embeds/actions/{actionId} returns 404 when not found")
    void getAction_whenNotFound_returns404() throws Exception {
        when(actionService.resolveAction("nonexistent")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/embeds/actions/nonexistent"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/actions creates action successfully")
    void createAction_validRequest_returnsCreated() throws Exception {
        CreateActionRequest request = new CreateActionRequest(
                "104812345678901234",
                false,
                "New Action",
                "New Action Description",
                ActionType.REPLY,
                null,
                null,
                null,
                null,
                null,
                "Instant reply",
                true,
                null,
                false,
                false,
                null
        );

        when(actionService.createAction(any(CreateActionRequest.class))).thenReturn(sampleDto);

        mockMvc.perform(post("/api/v1/embeds/actions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Action template created successfully.")))
                .andExpect(jsonPath("$.data.actionId", is("rng_act_0123456789abcdef")));

        verify(actionService).createAction(any(CreateActionRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/embeds/actions/{actionId} updates action successfully")
    void updateAction_validRequest_returnsUpdated() throws Exception {
        UpdateActionRequest request = new UpdateActionRequest(
                "104812345678901234",
                false,
                "Updated Action",
                "Updated Description",
                ActionType.ROLE,
                RoleSubtype.ADD,
                "role-snowflake-1",
                "VIP",
                null,
                null,
                "Added role!",
                true,
                null,
                false,
                false,
                null
        );

        when(actionService.updateAction(eq("rng_act_0123456789abcdef"), any(UpdateActionRequest.class))).thenReturn(sampleDto);

        mockMvc.perform(put("/api/v1/embeds/actions/rng_act_0123456789abcdef")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Action template updated successfully.")))
                .andExpect(jsonPath("$.data.actionId", is("rng_act_0123456789abcdef")));

        verify(actionService).updateAction(eq("rng_act_0123456789abcdef"), any(UpdateActionRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/embeds/actions/{actionId} deletes action successfully")
    void deleteAction_success_returnsTrue() throws Exception {
        doNothing().when(actionService).deleteAction("rng_act_0123456789abcdef");

        mockMvc.perform(delete("/api/v1/embeds/actions/rng_act_0123456789abcdef"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Action template deleted successfully.")))
                .andExpect(jsonPath("$.data", is(true)));

        verify(actionService).deleteAction("rng_act_0123456789abcdef");
    }

    @Test
    @DisplayName("GET /api/v1/embeds/actions/logs returns paginated logs")
    void getInteractionLogs_returnsPagedLogs() throws Exception {
        InteractionLogResponse logResponse = new InteractionLogResponse(
                "log-id-1",
                "rng_act_0123456789abcdef",
                ActionType.ROLE,
                "104812345678901234",
                "channel-1",
                "message-1",
                "user-1",
                "john_doe",
                "SUCCESS",
                "Role toggled successfully",
                Instant.now()
        );
        Page<InteractionLogResponse> page = new PageImpl<>(List.of(logResponse), PageRequest.of(0, 10), 1);
        when(actionService.getInteractionLogs(eq("104812345678901234"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/embeds/actions/logs")
                        .param("guildId", "104812345678901234")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].username", is("john_doe")));

        verify(actionService).getInteractionLogs(eq("104812345678901234"), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/v1/servers/{idOrSlug}/actions returns server actions")
    void getServerActions_validSlug_returnsServerActions() throws Exception {
        when(serverRepository.findByIdOrSlug("alpha-guild")).thenReturn(Optional.of(sampleServer));
        when(actionService.getActionsForServer("104812345678901234")).thenReturn(List.of(sampleDto));

        mockMvc.perform(get("/api/v1/servers/alpha-guild/actions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].actionId", is("rng_act_0123456789abcdef")));

        verify(actionService).getActionsForServer("104812345678901234");
    }

    @Test
    @DisplayName("GET /api/v1/servers/{idOrSlug}/actions should return paginated server actions when page param is present")
    void should_return_paginated_server_actions() throws Exception {
        when(serverRepository.findByIdOrSlug("guild-1")).thenReturn(Optional.of(sampleServer));
        Page<EmbedActionDto> pagedActions = new PageImpl<>(List.of(sampleDto), PageRequest.of(0, 50), 1);
        when(actionService.getActionsForServer(eq("104812345678901234"), any(Pageable.class))).thenReturn(pagedActions);

        mockMvc.perform(get("/api/v1/servers/guild-1/actions?page=0&size=50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].actionId").value("rng_act_0123456789abcdef"));

        verify(actionService).getActionsForServer(eq("104812345678901234"), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/v1/servers/{idOrSlug}/actions throws 404 when server not found")
    void getServerActions_notFound_returns404() throws Exception {
        when(serverRepository.findByIdOrSlug("nonexistent")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/servers/nonexistent/actions"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/servers/{idOrSlug}/actions binds serverId if missing")
    void createServerAction_withSlug_injectsServerIdIfMissingAndCreates() throws Exception {
        when(serverRepository.findByIdOrSlug("alpha-guild")).thenReturn(Optional.of(sampleServer));
        when(actionService.createAction(any(CreateActionRequest.class))).thenReturn(sampleDto);

        CreateActionRequest requestWithoutServerId = new CreateActionRequest(
                null,
                false,
                "Server Action",
                "Description",
                ActionType.ROLE,
                RoleSubtype.ADD,
                "role-1",
                "Member",
                null,
                null,
                "Welcome",
                true,
                null,
                false,
                false,
                null
        );

        mockMvc.perform(post("/api/v1/servers/alpha-guild/actions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestWithoutServerId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Action template created successfully.")));

        verify(actionService).createAction(argThat(req -> "104812345678901234".equals(req.serverId())));
    }

    @Test
    @DisplayName("PUT /api/v1/servers/{idOrSlug}/actions/{actionId} updates server action")
    void updateServerAction_valid_returnsUpdated() throws Exception {
        when(serverRepository.findByIdOrSlug("alpha-guild")).thenReturn(Optional.of(sampleServer));
        when(actionService.updateAction(eq("rng_act_0123456789abcdef"), any(UpdateActionRequest.class))).thenReturn(sampleDto);

        UpdateActionRequest request = new UpdateActionRequest(
                "104812345678901234",
                false,
                "Updated",
                "Desc",
                ActionType.REPLY,
                null,
                null,
                null,
                null,
                null,
                "Hi",
                true,
                null,
                false,
                false,
                null
        );

        mockMvc.perform(put("/api/v1/servers/alpha-guild/actions/rng_act_0123456789abcdef")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.actionId", is("rng_act_0123456789abcdef")));

        verify(actionService).updateAction(eq("rng_act_0123456789abcdef"), any(UpdateActionRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/servers/{idOrSlug}/actions/{actionId} deletes action")
    void deleteServerAction_valid_returnsSuccess() throws Exception {
        when(serverRepository.findByIdOrSlug("alpha-guild")).thenReturn(Optional.of(sampleServer));
        doNothing().when(actionService).deleteAction("rng_act_0123456789abcdef");

        mockMvc.perform(delete("/api/v1/servers/alpha-guild/actions/rng_act_0123456789abcdef"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(true)));

        verify(actionService).deleteAction("rng_act_0123456789abcdef");
    }

    @Test
    @DisplayName("GET /api/v1/servers/{idOrSlug}/interactions/logs returns server interaction logs")
    void getServerInteractionLogs_validSlug_returnsPagedLogs() throws Exception {
        when(serverRepository.findByIdOrSlug("alpha-guild")).thenReturn(Optional.of(sampleServer));
        Page<InteractionLogResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 15), 0);
        when(actionService.getInteractionLogs(eq("104812345678901234"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/servers/alpha-guild/interactions/logs")
                        .param("page", "0")
                        .param("size", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(actionService).getInteractionLogs(eq("104812345678901234"), any(Pageable.class));
    }
}
