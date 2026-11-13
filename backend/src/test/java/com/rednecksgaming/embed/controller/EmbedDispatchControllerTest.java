// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rednecksgaming.common.exception.GlobalExceptionHandler;
import com.rednecksgaming.common.exception.ResourceNotFoundException;
import com.rednecksgaming.embed.domain.DispatchStatus;
import com.rednecksgaming.embed.domain.DispatchType;
import com.rednecksgaming.embed.dto.*;
import com.rednecksgaming.embed.service.EmbedDispatchService;
import com.rednecksgaming.server.dto.ChannelDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EmbedDispatchControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private EmbedDispatchService dispatchService;

    @InjectMocks
    private EmbedDispatchController controller;

    @Captor
    private ArgumentCaptor<Pageable> pageableCaptor;

    private DispatchResponse sampleDispatchResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleDispatchResponse = DispatchResponse.builder()
                .dispatchId("dsp-123456789")
                .discordMessageId("msg-987654321")
                .status(DispatchStatus.SUCCESS)
                .timestamp(Instant.now())
                .latencyMs(120L)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/embeds/dispatch dispatches JSON embed immediately")
    void dispatchJson_validRequest_success() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "104812345678901234",
                "204812345678901234",
                DispatchType.IMMEDIATE,
                null,
                Map.of("content", "Announcement message"),
                null
        );

        when(dispatchService.dispatchImmediate(eq(42L), any(DispatchEmbedRequest.class), isNull()))
                .thenReturn(sampleDispatchResponse);

        mockMvc.perform(post("/api/v1/embeds/dispatch")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Message dispatched successfully.")))
                .andExpect(jsonPath("$.data.dispatchId", is("dsp-123456789")))
                .andExpect(jsonPath("$.data.discordMessageId", is("msg-987654321")));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/dispatch returns 400 when mandatory fields are missing")
    void dispatchJson_invalidRequest_returns400() throws Exception {
        DispatchEmbedRequest invalidRequest = new DispatchEmbedRequest(
                "",
                "",
                null,
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/embeds/dispatch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.data.serverId", notNullValue()))
                .andExpect(jsonPath("$.data.channelId", notNullValue()))
                .andExpect(jsonPath("$.data.dispatchType", notNullValue()))
                .andExpect(jsonPath("$.data.payload", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/dispatch/multipart dispatches embed with file attachments")
    void dispatchMultipart_withFiles_success() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "104812345678901234",
                "204812345678901234",
                DispatchType.IMMEDIATE,
                null,
                Map.of("content", "File attached"),
                List.of(new DispatchEmbedRequest.AttachmentMetadata(0, "banner.png", "Server banner"))
        );

        MockMultipartFile requestPart = new MockMultipartFile(
                "request",
                "",
                "application/json",
                objectMapper.writeValueAsString(request).getBytes(StandardCharsets.UTF_8)
        );

        MockMultipartFile filePart = new MockMultipartFile(
                "files",
                "banner.png",
                "image/png",
                "dummy image content".getBytes(StandardCharsets.UTF_8)
        );

        when(dispatchService.dispatchImmediate(eq(42L), any(DispatchEmbedRequest.class), any()))
                .thenReturn(sampleDispatchResponse);

        mockMvc.perform(multipart("/api/v1/embeds/dispatch/multipart")
                        .file(requestPart)
                        .file(filePart)
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Message dispatched successfully with file attachments.")))
                .andExpect(jsonPath("$.data.dispatchId", is("dsp-123456789")));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/dispatch/schedule schedules message for deferred delivery")
    void scheduleDispatch_validRequest_success() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("42", null);
        Instant futureTime = Instant.now().plusSeconds(3600);
        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "104812345678901234",
                "204812345678901234",
                DispatchType.SCHEDULED,
                futureTime,
                Map.of("content", "Scheduled alert"),
                null
        );

        DispatchResponse scheduledResponse = DispatchResponse.builder()
                .dispatchId("dsp-scheduled-999")
                .status(DispatchStatus.QUEUED)
                .scheduledFor(futureTime)
                .timestamp(Instant.now())
                .build();

        when(dispatchService.scheduleDispatch(eq(42L), any(DispatchEmbedRequest.class))).thenReturn(scheduledResponse);

        mockMvc.perform(post("/api/v1/embeds/dispatch/schedule")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Message dispatch scheduled successfully.")))
                .andExpect(jsonPath("$.data.dispatchId", is("dsp-scheduled-999")))
                .andExpect(jsonPath("$.data.status", is("QUEUED")));
    }

    @Test
    @DisplayName("DELETE /api/v1/embeds/dispatch/schedule/{dispatchId} cancels scheduled dispatch")
    void cancelScheduledDispatch_whenFound_returnsTrue() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        when(dispatchService.cancelScheduledDispatch(42L, "dsp-scheduled-999")).thenReturn(true);

        mockMvc.perform(delete("/api/v1/embeds/dispatch/schedule/dsp-scheduled-999").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(true)))
                .andExpect(jsonPath("$.message", is("Scheduled dispatch cancelled successfully.")));
    }

    @Test
    @DisplayName("DELETE /api/v1/embeds/dispatch/schedule/{dispatchId} returns 404 when not found")
    void cancelScheduledDispatch_whenNotFound_returns404() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        when(dispatchService.cancelScheduledDispatch(42L, "dsp-nonexistent"))
                .thenThrow(new ResourceNotFoundException("Scheduled task not found: dsp-nonexistent"));

        mockMvc.perform(delete("/api/v1/embeds/dispatch/schedule/dsp-nonexistent").principal(auth))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Scheduled task not found: dsp-nonexistent")));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/dispatch/test validates pre-flight message structure")
    void validateDryRun_validRequest_returnsValidationReport() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("invalid-number-name", null);
        DryRunValidationRequest request = new DryRunValidationRequest(
                "104812345678901234",
                "204812345678901234",
                Map.of("content", "Dry run check"),
                null
        );

        DryRunValidationResponse validationResponse = DryRunValidationResponse.builder()
                .isValid(true)
                .errors(List.of())
                .warnings(List.of())
                .containerCount(1)
                .totalComponentCount(4)
                .totalActionRows(1)
                .cumulativeCharCount(240L)
                .estimatedBytes(1024L)
                .permissions(DryRunValidationResponse.BotPermissionCheck.builder()
                        .hasViewChannel(true)
                        .hasSendMessages(true)
                        .hasEmbedLinks(true)
                        .build())
                .build();

        when(dispatchService.testDryRun(eq(1L), any(DryRunValidationRequest.class))).thenReturn(validationResponse);

        mockMvc.perform(post("/api/v1/embeds/dispatch/test")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Pre-flight validation completed.")))
                .andExpect(jsonPath("$.data.isValid", is(true)))
                .andExpect(jsonPath("$.data.containerCount", is(1)))
                .andExpect(jsonPath("$.data.permissions.hasSendMessages", is(true)));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/dispatch/test returns validation report when invalid with component stats")
    void validateDryRun_whenValidationReportsInvalid_returnsReportWithErrorsAndWarnings() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(42L, null);
        DryRunValidationRequest request = new DryRunValidationRequest(
                "104812345678901234",
                "204812345678901234",
                Map.of("content", "Invalid dry run check"),
                null
        );

        DryRunValidationResponse invalidResponse = DryRunValidationResponse.builder()
                .isValid(false)
                .errors(List.of("Cumulative character budget exceeds 4000 characters"))
                .warnings(List.of("Container count reaches maximum threshold"))
                .containerCount(10)
                .totalComponentCount(45)
                .totalActionRows(5)
                .cumulativeCharCount(4500L)
                .estimatedBytes(4096L)
                .permissions(DryRunValidationResponse.BotPermissionCheck.builder()
                        .hasViewChannel(true)
                        .hasSendMessages(false)
                        .hasEmbedLinks(true)
                        .build())
                .build();

        when(dispatchService.testDryRun(eq(42L), any(DryRunValidationRequest.class))).thenReturn(invalidResponse);

        mockMvc.perform(post("/api/v1/embeds/dispatch/test")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isValid", is(false)))
                .andExpect(jsonPath("$.data.errors", hasSize(1)))
                .andExpect(jsonPath("$.data.errors[0]", is("Cumulative character budget exceeds 4000 characters")))
                .andExpect(jsonPath("$.data.warnings", hasSize(1)))
                .andExpect(jsonPath("$.data.containerCount", is(10)))
                .andExpect(jsonPath("$.data.totalComponentCount", is(45)))
                .andExpect(jsonPath("$.data.permissions.hasSendMessages", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/dispatch/test returns 400 when request body fails validation")
    void validateDryRun_invalidRequest_returns400() throws Exception {
        DryRunValidationRequest invalidRequest = new DryRunValidationRequest(
                "",
                "",
                null,
                null
        );

        mockMvc.perform(post("/api/v1/embeds/dispatch/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.data.serverId", notNullValue()))
                .andExpect(jsonPath("$.data.channelId", notNullValue()))
                .andExpect(jsonPath("$.data.payload", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/v1/embeds/logs returns paginated telemetry logs with filters and clamping")
    void getDispatchLogs_withFiltersAndClampedBounds() throws Exception {
        DispatchLogResponse logEntry = DispatchLogResponse.builder()
                .id("mongo-log-1")
                .dispatchId("dsp-123")
                .userId("42")
                .serverId("104812345678901234")
                .channelId("204812345678901234")
                .dispatchType(DispatchType.IMMEDIATE)
                .status(DispatchStatus.SUCCESS)
                .discordMessageId("msg-123")
                .timestamp(Instant.now())
                .build();

        Page<DispatchLogResponse> page = new PageImpl<>(List.of(logEntry), PageRequest.of(0, 100), 1);
        when(dispatchService.getDispatchLogs(eq("104812345678901234"), eq(DispatchStatus.SUCCESS), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/embeds/logs")
                        .param("serverId", "104812345678901234")
                        .param("status", "SUCCESS")
                        .param("page", "-10")
                        .param("size", "500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].dispatchId", is("dsp-123")));

        verify(dispatchService).getDispatchLogs(eq("104812345678901234"), eq(DispatchStatus.SUCCESS), pageableCaptor.capture());
        Pageable captured = pageableCaptor.getValue();
        org.assertj.core.api.Assertions.assertThat(captured.getPageNumber()).isEqualTo(0);
        org.assertj.core.api.Assertions.assertThat(captured.getPageSize()).isEqualTo(100);
        org.assertj.core.api.Assertions.assertThat(captured.getSort().getOrderFor("timestamp").getDirection())
                .isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("GET /api/v1/embeds/channels returns list of dispatchable channels")
    void getDispatchableChannels_returnsChannels() throws Exception {
        ChannelDto channel = ChannelDto.builder()
                .id("chan-1")
                .name("announcements")
                .type(0)
                .position(1)
                .build();

        when(dispatchService.getDispatchableChannels("104812345678901234")).thenReturn(List.of(channel));

        mockMvc.perform(get("/api/v1/embeds/channels").param("serverId", "104812345678901234"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is("chan-1")))
                .andExpect(jsonPath("$.data[0].name", is("announcements")));
    }

    @Test
    @DisplayName("GET /api/v1/embeds/logs without serverId and status passes nulls to service")
    void getDispatchLogs_withoutFilters_usesDefaults() throws Exception {
        Page<DispatchLogResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(dispatchService.getDispatchLogs(isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/embeds/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(0)));

        verify(dispatchService).getDispatchLogs(isNull(), isNull(), any(Pageable.class));
    }

    @Test
    @DisplayName("POST /api/v1/embeds/dispatch/multipart without files passes null file list to service")
    void dispatchMultipart_withoutFiles_success() throws Exception {
        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "104812345678901234",
                "204812345678901234",
                DispatchType.IMMEDIATE,
                null,
                Map.of("content", "No files attached"),
                null
        );

        MockMultipartFile requestPart = new MockMultipartFile(
                "request",
                "",
                "application/json",
                objectMapper.writeValueAsString(request).getBytes(StandardCharsets.UTF_8)
        );

        when(dispatchService.dispatchImmediate(eq(1L), any(DispatchEmbedRequest.class), isNull()))
                .thenReturn(sampleDispatchResponse);

        mockMvc.perform(multipart("/api/v1/embeds/dispatch/multipart")
                        .file(requestPart))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Message dispatched successfully with file attachments.")));

        verify(dispatchService).dispatchImmediate(eq(1L), any(DispatchEmbedRequest.class), isNull());
    }

    @Test
    @DisplayName("POST /api/v1/embeds/dispatch with null authentication falls back to userId 1L")
    void dispatchJson_withNullAuth_fallsBackTo1() throws Exception {
        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "104812345678901234",
                "204812345678901234",
                DispatchType.IMMEDIATE,
                null,
                Map.of("content", "Anonymous message"),
                null
        );

        when(dispatchService.dispatchImmediate(eq(1L), any(DispatchEmbedRequest.class), isNull()))
                .thenReturn(sampleDispatchResponse);

        mockMvc.perform(post("/api/v1/embeds/dispatch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(dispatchService).dispatchImmediate(eq(1L), any(DispatchEmbedRequest.class), isNull());
    }

    @Test
    @DisplayName("POST /api/v1/embeds/dispatch with auth whose getName is null falls back to userId 1L")
    void dispatchJson_withNullPrincipalName_fallsBackTo1() throws Exception {
        Authentication mockAuth = mock(Authentication.class);
        when(mockAuth.getPrincipal()).thenReturn("not-a-long");
        when(mockAuth.getName()).thenReturn(null);

        DispatchEmbedRequest request = new DispatchEmbedRequest(
                "104812345678901234",
                "204812345678901234",
                DispatchType.IMMEDIATE,
                null,
                Map.of("content", "Null name test"),
                null
        );

        when(dispatchService.dispatchImmediate(eq(1L), any(DispatchEmbedRequest.class), isNull()))
                .thenReturn(sampleDispatchResponse);

        mockMvc.perform(post("/api/v1/embeds/dispatch")
                        .principal(mockAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        verify(dispatchService).dispatchImmediate(eq(1L), any(DispatchEmbedRequest.class), isNull());
    }
}
